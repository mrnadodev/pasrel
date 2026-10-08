"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/data";
import { DEMO_PERSONAS } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { storefrontBaseUrl } from "@/lib/order";
import { lienJeton } from "@/lib/auth-lien";
import { envoyerCourriel } from "@/lib/mail";
import { courrielModpas } from "@/lib/i18n/mail";
import { logAdminAction } from "@/lib/audit-logger";
import type { Language } from "@/lib/i18n/translations";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// Ces cookies ne portent que de l'affichage (nom, libellé de rôle). Ils ne
// donnent aucun accès : le middleware et les Server Actions vérifient la
// session Supabase. httpOnly pour éviter qu'un script tiers ne les lise.
function setDisplayCookies(role: string, fullName?: string | null) {
  const c = cookies();
  const opts = {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  c.set("pasrel_role", role, opts);
  if (fullName) c.set("pasrel_user_name", fullName, opts);
}

function clearSupabaseCookies() {
  const c = cookies();
  c.getAll().forEach((cookie) => {
    if (cookie.name.startsWith("sb-")) c.delete(cookie.name);
  });
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  clearSupabaseCookies();

  // Mode démo (aucun Supabase configuré) : les personas servent à parcourir
  // l'app sans base. Ce raccourci est volontairement inaccessible dès qu'une
  // vraie base existe, sinon n'importe quelle adresse contenant « marie »
  // ouvrirait un compte agent sans mot de passe.
  if (!hasSupabase()) {
    const personaKey = Object.keys(DEMO_PERSONAS).find((k) => email.toLowerCase().includes(k));
    if (personaKey) {
      setDisplayCookies(personaKey, DEMO_PERSONAS[personaKey].full_name);
      redirect("/");
    }
    setDisplayCookies("owner");
    redirect("/");
  }

  const sb = createClient();
  const { data: authData, error } = await sb.auth.signInWithPassword({ email, password });

  if (error || !authData?.user) {
    redirect("/login?error=" + encodeURIComponent(error?.message ?? "Koneksyon an echwe"));
  }

  const userEmail = authData.user.email ?? email;

  // Le statut super-admin vient exclusivement de la liste ADMIN_EMAILS, après
  // authentification réussie. Aucun motif dans l'adresse ne l'accorde.
  if (isAdminEmail(userEmail)) {
    setDisplayCookies("admin", userEmail);
    redirect("/admin");
  }

  const { data: member } = await sb
    .from("members")
    .select("full_name, role, agent_profile")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  // Pour un agent, le cookie porte son profil métier : c'est lui qui adapte
  // l'interface (colonnes du pipeline, onglets visibles). Les écritures, elles,
  // relisent ce profil en base à chaque appel.
  const displayRole =
    member?.role === "agent" ? member.agent_profile || "agent" : member?.role ?? "owner";

  setDisplayCookies(displayRole, member?.full_name ?? null);
  redirect("/");
}

/** Un même compte ne peut pas redemander un lien plus d'une fois par minute. */
const DELAI_DEMANDE_MS = 60_000;

/**
 * Envoie le lien de réinitialisation de mot de passe.
 *
 * ── Pourquoi ce n'est plus Supabase qui écrit ce courriel ────────────────────
 *
 * `resetPasswordForEmail` fait envoyer par Supabase un message dont le lien
 * pointe sur `/auth/v1/verify`. Cette adresse dépense le jeton au premier GET,
 * et le premier GET vient d'une machine bien plus souvent que d'une personne :
 * robot d'aperçu de WhatsApp, passerelle antivirus, client mail qui précharge.
 * Le marchand cliquait sur un lien reçu depuis deux minutes et lisait « lien
 * expiré ». Ce n'était pas une expiration, c'était une consommation.
 *
 * On fabrique donc le lien nous-mêmes avec `generateLink`, qui rend le jeton
 * haché sans rien envoyer, et on le fait pointer sur /nouvo-modpas. La page
 * n'échange le jeton qu'en JavaScript : un robot repart avec du HTML et sans
 * avoir touché à rien (voir lib/auth-lien.ts).
 *
 * Au passage le courriel devient le nôtre — trois langues, notre marque, et
 * les deux phrases qui manquaient : il ne sert qu'une fois, ne le faites pas
 * suivre.
 *
 * ── Ce qui est préservé ─────────────────────────────────────────────────────
 *
 * On répond toujours « ok ». Dire qu'une adresse est inconnue permettrait de
 * découvrir quels comptes existent chez nous ; le résultat est donc le même
 * que l'adresse ait un compte ou non.
 *
 * Quitter le mailer de Supabase, c'est aussi quitter sa limite de débit : sans
 * rien, ce formulaire deviendrait une machine à inonder la boîte de n'importe
 * qui. La demande est donc journalisée et refusée si la précédente a moins
 * d'une minute. Le journal a une seconde utilité : savoir qui a demandé la
 * réinitialisation d'un compte, et quand.
 *
 * Si quoi que ce soit échoue de notre côté, on retombe sur le mailer de
 * Supabase : un courriel au lien fragile vaut mieux que pas de courriel.
 */
export async function requestPasswordReset(
  email: string,
  langue: Language = "fr",
): Promise<{ ok: boolean; error?: string }> {
  const clean = email.trim();
  if (!clean || !clean.includes("@")) return { ok: false, error: "Adrès imèl la pa valab" };
  if (!hasSupabase()) return { ok: true };

  const base = storefrontBaseUrl();
  const admin = createAdminClient();

  if (admin) {
    // La fenêtre est calculée avec l'horloge de l'application, et la ligne est
    // horodatée avec la même — `logAdminAction` écrit `created_at` lui-même.
    // Ce détail porte tout le verrou : laisser la base poser l'horodatage
    // ferait comparer deux horloges différentes, et il suffit de quelques
    // secondes d'écart pour que la fenêtre ne trouve jamais rien. Mesuré sur
    // cette machine, où l'écart est de trois minutes.
    const depuis = new Date(Date.now() - DELAI_DEMANDE_MS).toISOString();
    const { data: recentes } = await admin
      .from("security_audit_logs")
      .select("created_at")
      .eq("action", "PASSWORD_RESET_REQUEST")
      .eq("admin_email", clean)
      .gte("created_at", depuis)
      .limit(1);

    // Trop tôt : le lien précédent est encore valable, et l'annoncer
    // apprendrait au demandeur que l'adresse a un compte.
    if (recentes && recentes.length > 0) return { ok: true };

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: clean,
      options: { redirectTo: `${base}/nouvo-modpas` },
    });

    const hashed = data?.properties?.hashed_token;
    if (!error && hashed) {
      const rendu = courrielModpas(langue, {
        lien: lienJeton(base, "/nouvo-modpas", hashed, "recovery"),
        baseUrl: base,
      });
      const envoi = await envoyerCourriel({
        to: clean,
        subject: rendu.subject,
        text: rendu.text,
        html: rendu.html,
      });

      await logAdminAction({
        adminEmail: clean,
        action: "PASSWORD_RESET_REQUEST",
        details: { envoi: envoi.etat, source: "pasrel" },
      });

      if (envoi.etat === "envoye") return { ok: true };
      // « saute » (pas de clé Resend, domaine réservé) ou « echec » : le repli
      // ci-dessous reste la seule chance de recevoir quelque chose.
    } else if (error) {
      // Adresse sans compte, le plus souvent. Rien à journaliser d'utile, et
      // rien à dire au demandeur.
      console.error("requestPasswordReset/generateLink:", error.message);
    }
  }

  const sb = createClient();
  const { error: err } = await sb.auth.resetPasswordForEmail(clean, {
    redirectTo: `${base}/nouvo-modpas`,
  });

  if (err) console.error("requestPasswordReset:", err.message);
  return { ok: true };
}

export async function signOut() {
  const c = cookies();
  c.delete("pasrel_role");
  c.delete("pasrel_user_name");
  clearSupabaseCookies();
  if (hasSupabase()) {
    const sb = createClient();
    await sb.auth.signOut();
  }
  redirect("/login");
}

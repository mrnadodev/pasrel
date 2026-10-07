"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SECTOR_THEME } from "@/lib/themes";
import { hasSupabase, setBusinessOverride, resetDataForNewBusiness } from "@/lib/data";
import { storefrontBaseUrl } from "@/lib/order";
import { envoyerCourriel } from "@/lib/mail";
import { courrielBienvenue } from "@/lib/i18n/mail";
import { logAppError } from "@/lib/app-errors";
import type { Language } from "@/lib/i18n/translations";

export interface RegisterInput {
  businessName: string;
  businessType: string;
  employeesCount: string;
  phone: string;
  fullName: string;
  email: string;
  password: string;
  /** Langue affichée au moment de l'inscription : celle du courriel de bienvenue. */
  language?: Language;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "boutik"
  );
}

/**
 * Brouillon d'inscription.
 *
 * Depuis que la confirmation d'adresse est exigée, `signUp` ne rend plus de
 * session : le compte existe, mais la boutique ne peut pas encore être créée.
 * La marchande partait alors confirmer son e-mail, revenait se connecter, et
 * retombait sur un formulaire vide — tout à retaper, sur un téléphone, au pire
 * moment possible.
 *
 * On garde donc ce qu'elle a saisi, le temps du détour par sa boîte mail.
 *
 * Ni l'adresse ni le mot de passe n'y figurent : à son retour elle est
 * connectée, l'application n'en a plus besoin, et un identifiant n'a rien à
 * faire dans un cookie de confort. Durée deux heures : au-delà, le détour a
 * échoué et mieux vaut repartir d'une page propre.
 */
const BROUILLON = "pasrel_enskri";

export interface BrouillonInscription {
  businessName: string;
  businessType: string;
  employeesCount: string;
  phone: string;
  fullName: string;
}

function garderBrouillon(input: RegisterInput) {
  const brouillon: BrouillonInscription = {
    businessName: input.businessName,
    businessType: input.businessType,
    employeesCount: input.employeesCount,
    phone: input.phone,
    fullName: input.fullName,
  };
  try {
    cookies().set(BROUILLON, JSON.stringify(brouillon), {
      path: "/",
      maxAge: 60 * 60 * 2,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } catch {
    // hors contexte de requête
  }
}

function oublierBrouillon() {
  try {
    cookies().delete(BROUILLON);
  } catch {
    // hors contexte de requête
  }
}

function setDisplayCookies(ownerName: string) {
  const opts = {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  try {
    cookies().set("pasrel_role", "owner", opts);
    cookies().set("pasrel_user_name", ownerName, opts);
  } catch {
    // hors contexte de requête
  }
}

export async function registerMerchant(
  input: RegisterInput,
): Promise<{ ok: boolean; slug?: string; needsConfirm?: boolean; error?: string }> {
  if (!input.businessName.trim()) return { ok: false, error: "Non biznis obligatwa" };

  const ownerName = input.fullName.trim() || input.email.split("@")[0] || "Propriétaire";
  const baseSlug = slugify(input.businessName);
  const employeesCount = input.employeesCount ? parseInt(input.employeesCount, 10) || null : null;

  // Mode démo : on bascule la boutique fictive sur le nom saisi, sans compte.
  if (!hasSupabase()) {
    setBusinessOverride({
      name: input.businessName.trim(),
      slug: baseSlug,
      business_type: input.businessType,
      employees_count: employeesCount ?? 3,
      phone_e164: input.phone.trim() || null,
    });
    resetDataForNewBusiness(input.businessName.trim(), ownerName, input.businessType);
    setDisplayCookies(ownerName);
    return { ok: true, slug: baseSlug };
  }

  const sb = createClient();

  // Deux entrées mènent ici. Soit un visiteur qui crée son compte, soit un
  // marchand déjà connecté dont la boutique n'a jamais été créée — cas qui
  // laissait le compte dans une impasse, avec un tableau de bord vide et aucun
  // moyen de repartir.
  const {
    data: { user: existingUser },
  } = await sb.auth.getUser();

  let userId: string;

  if (existingUser) {
    const { data: alreadyMember } = await sb
      .from("members")
      .select("business_id")
      .eq("user_id", existingUser.id)
      .maybeSingle();
    if (alreadyMember?.business_id) {
      return { ok: false, error: "Ou gen yon biznis deja." };
    }
    userId = existingUser.id;
  } else {
    if (!input.email.trim()) return { ok: false, error: "Imèl obligatwa" };
    if (input.password.length < 6) return { ok: false, error: "Modpas la twò kout (6+)" };

    // Sans `emailRedirectTo`, Supabase renvoie sur sa Site URL — la page
    // d'accueil publique. Le marchand cliquait « confirmer » et retombait sur
    // la vitrine sans savoir si ça avait marché. /konfime pose la session puis
    // le ramène là où son inscription s'est arrêtée.
    const { data: auth, error: aerr } = await sb.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: { emailRedirectTo: `${storefrontBaseUrl()}/konfime` },
    });
    if (aerr) return { ok: false, error: aerr.message };
    if (!auth.user) return { ok: false, error: "Erè pandan kreyasyon kont lan" };
    // Sans session (confirmation e-mail activée), la boutique ne peut pas être
    // créée maintenant : rien ne doit exister publiquement au nom d'une adresse
    // que personne n'a encore prouvé posséder. On garde la saisie, et la
    // boutique se créera au retour, en un clic.
    if (!auth.session) {
      garderBrouillon(input);
      return { ok: false, needsConfirm: true, error: "Tcheke imèl ou pou konfime kont lan, apre konekte." };
    }
    userId = auth.user.id;
  }

  // L'écriture passe par la clé service role. Juste après `signUp`, le client
  // serveur ne porte pas encore le jeton de la session qui vient d'être créée,
  // et la politique RLS `biz_create` refuse l'insertion : c'est ce qui laissait
  // des comptes sans boutique. Ici on connaît l'utilisateur et ce qu'on écrit.
  const writer = createAdminClient() ?? sb;

  // Le slug est unique en base : on suffixe jusqu'à trouver une place libre,
  // sinon deux « Ti Boutik » se disputeraient la même vitrine publique.
  let slug = baseSlug;
  let bizId: string | null = null;
  let lastError = "";
  for (let attempt = 0; attempt < 5 && !bizId; attempt++) {
    const { data: biz, error } = await writer
      .from("businesses")
      .insert({
        name: input.businessName.trim(),
        slug,
        business_type: input.businessType,
        employees_count: employeesCount,
        phone_e164: input.phone.trim() || null,
        theme: SECTOR_THEME,
      })
      .select("id")
      .single();
    if (biz) {
      bizId = biz.id;
      break;
    }
    lastError = error?.message ?? "";
    if (error?.code !== "23505") break;
    slug = `${baseSlug}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  if (!bizId) return { ok: false, error: lastError || "Enposib pou kreye biznis lan" };

  const { error: merr } = await writer.from("members").insert({
    business_id: bizId,
    user_id: userId,
    full_name: ownerName,
    role: "owner",
  });
  // Une boutique sans propriétaire est inaccessible : on la retire plutôt que
  // de laisser une ligne orpheline et un slug pris pour rien.
  if (merr) {
    await writer.from("businesses").delete().eq("id", bizId);
    return { ok: false, error: merr.message };
  }

  oublierBrouillon();
  setDisplayCookies(ownerName);

  // Mot de bienvenue : l'adresse de la vitrine, les premiers gestes, et le lien
  // des conditions. C'est aussi le premier message que la boîte du marchand voit
  // venir de ce domaine — un domaine qui n'envoie jamais rien puis envoie un
  // lien de mot de passe ressemble à un hameçonnage, et finit en indésirables.
  //
  // L'envoi vient APRÈS la création et ne peut pas l'annuler : une boutique qui
  // existe reste créée même si le courriel se perd.
  const destinataire = (existingUser?.email ?? input.email).trim();
  const rendu = courrielBienvenue(input.language ?? "fr", {
    ownerName,
    businessName: input.businessName.trim(),
    slug,
    baseUrl: storefrontBaseUrl(),
  });
  const envoi = await envoyerCourriel({
    to: destinataire,
    subject: rendu.subject,
    text: rendu.text,
    html: rendu.html,
  });
  if (envoi.etat === "echec") {
    await logAppError({
      scope: "mail.bienvenue",
      message: envoi.raison,
      businessId: bizId,
      userId,
      details: { slug },
    });
  }

  return { ok: true, slug };
}

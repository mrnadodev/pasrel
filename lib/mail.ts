import "server-only";

/**
 * Envoi de courrier applicatif.
 *
 * L'application n'envoyait aucun courriel : tout passait par Supabase Auth,
 * qui ne sait parler que de mots de passe. Un marchand ouvrait sa boutique et
 * repartait sans rien, et son abonnement s'activait sans qu'il en soit averti.
 *
 * Deux règles tiennent ce fichier :
 *
 * 1. **Un envoi raté n'annule jamais ce qui l'a déclenché.** Une boutique
 *    créée reste créée, un abonnement activé reste activé. Le courriel est un
 *    accusé, pas une condition. Toute erreur est donc avalée et journalisée.
 *
 * 2. **Sans clé, on ne crie pas.** En préproduction et en local, RESEND_API_KEY
 *    est absente : l'envoi est simplement sauté. Ce silence est voulu, sinon
 *    chaque inscription de test remplirait le journal d'erreurs.
 *
 * La clé est propre à l'application, distincte de celle que Supabase utilise
 * pour les courriels d'authentification : l'une peut être révoquée sans
 * fermer l'autre porte.
 */

const RESEND = "https://api.resend.com/emails";

/** Expéditeur par défaut — le domaine vérifié chez Resend. */
const EXPEDITEUR_PAR_DEFAUT = "PASRÈL <contact@pasrel.app>";

export type ResultatEnvoi =
  | { etat: "envoye"; id: string | null }
  | { etat: "saute"; raison: string }
  | { etat: "echec"; raison: string };

export interface Courriel {
  to: string;
  subject: string;
  /** Corps en texte : seule version obligatoire, et la seule qui passe partout. */
  text: string;
  html?: string;
}

function expediteur(): string {
  const brut = (process.env.MAIL_FROM ?? "").trim();
  // Une adresse mal saisie ne doit pas faire échouer tous les envois : on
  // exige au moins une arobase, sinon on reprend l'expéditeur connu.
  return brut.includes("@") ? brut : EXPEDITEUR_PAR_DEFAUT;
}

export async function envoyerCourriel(courriel: Courriel): Promise<ResultatEnvoi> {
  const cle = (process.env.RESEND_API_KEY ?? "").trim();
  if (!cle) return { etat: "saute", raison: "RESEND_API_KEY absente" };
  if (!courriel.to.includes("@")) return { etat: "saute", raison: "destinataire sans adresse" };

  try {
    const r = await fetch(RESEND, {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: expediteur(),
        to: [courriel.to],
        subject: courriel.subject,
        text: courriel.text,
        ...(courriel.html ? { html: courriel.html } : {}),
      }),
    });

    if (!r.ok) {
      // Le corps de la réponse dit pourquoi — domaine non vérifié, clé en
      // lecture seule, plafond atteint. On le garde court et sans la clé.
      const detail = (await r.text()).slice(0, 300);
      return { etat: "echec", raison: `${r.status} ${detail}` };
    }

    const corps = (await r.json().catch(() => ({}))) as { id?: string };
    return { etat: "envoye", id: corps.id ?? null };
  } catch (e) {
    return { etat: "echec", raison: e instanceof Error ? e.message : "erreur réseau" };
  }
}

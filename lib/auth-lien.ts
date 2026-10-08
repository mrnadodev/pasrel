/**
 * Les liens d'authentification envoyés par courriel.
 *
 * ── Pourquoi ce fichier existe ──────────────────────────────────────────────
 *
 * Un lien Supabase par défaut pointe sur `/auth/v1/verify?token=…`. Cette
 * adresse **consomme le jeton au premier GET**, quel qu'il soit. Or un lien qui
 * voyage ne reçoit presque jamais son premier GET d'un être humain :
 *
 *   · WhatsApp, Messenger, Slack, iMessage récupèrent la page pour en afficher
 *     un aperçu dès que le message est envoyé ;
 *   · certains antivirus et passerelles de messagerie la visitent pour la
 *     « vérifier » avant de livrer le courriel ;
 *   · un client mail qui précharge les liens fait la même chose.
 *
 * À chaque fois le jeton est dépensé par une machine, et la personne qui clique
 * ensuite lit « le lien a expiré » sur un lien reçu il y a trente secondes.
 * C'est exactement ce qu'un marchand nous a rapporté.
 *
 * ── La correction ───────────────────────────────────────────────────────────
 *
 * Le lien ne pointe plus sur Supabase mais sur **notre page**, et porte le
 * jeton haché dans la requête. Rien n'est consommé au chargement : c'est le
 * JavaScript de la page qui appelle `verifyOtp`. Un robot d'aperçu récupère du
 * HTML, n'exécute pas de script, et repart sans avoir touché au jeton.
 *
 * Ce module ne contient que la partie pure — fabriquer le lien, relire le
 * jeton — pour qu'elle soit vérifiable sans navigateur et sans réseau.
 */

/** Les seuls types de jeton que nos pages acceptent. */
export const TYPES_JETON = ["recovery", "signup", "invite", "magiclink", "email", "email_change"] as const;

export type TypeJeton = (typeof TYPES_JETON)[number];

export interface Jeton {
  token_hash: string;
  type: TypeJeton;
}

/**
 * Construit le lien à mettre dans un courriel.
 *
 * `hashed_token` vient de `admin.generateLink()` : c'est le jeton déjà haché,
 * le seul qu'on puisse faire voyager.
 */
export function lienJeton(baseUrl: string, chemin: string, hashedToken: string, type: TypeJeton): string {
  const base = baseUrl.replace(/\/+$/, "");
  const c = chemin.startsWith("/") ? chemin : `/${chemin}`;
  const q = new URLSearchParams({ token_hash: hashedToken, type });
  return `${base}${c}?${q.toString()}`;
}

/**
 * Relit le jeton depuis la chaîne de requête, ou rend `null`.
 *
 * Le type est filtré sur une liste fermée : sans ça, n'importe quelle valeur
 * partirait vers l'API d'authentification telle quelle.
 *
 * `defaut` sert aux liens anciens ou fabriqués à la main qui portent le jeton
 * sans dire de quel type il est — sur /nouvo-modpas il ne peut s'agir que
 * d'une récupération.
 */
export function lireJeton(search: string, defaut?: TypeJeton): Jeton | null {
  const p = new URLSearchParams(search.replace(/^\?/, ""));
  const token_hash = (p.get("token_hash") ?? "").trim();
  if (!token_hash) return null;

  const brut = (p.get("type") ?? "").trim();
  const type = (TYPES_JETON as readonly string[]).includes(brut) ? (brut as TypeJeton) : defaut;
  if (!type) return null;

  return { token_hash, type };
}

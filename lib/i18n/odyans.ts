import type { Language } from "@/lib/i18n/translations";
import type { Grain } from "@/lib/audience";

/**
 * La page d'audience de la vitrine.
 *
 * Chaque phrase dit ce que le logiciel mesure vraiment, et surtout ce qu'il
 * ne mesure pas. Un chiffre d'audience qu'on ne sait pas lire vaut moins que
 * pas de chiffre : le marchand prendrait des décisions dessus.
 */
export interface OdyansCopy {
  titre: string;
  sous: string;
  retour: string;
  grains: Record<Grain, string>;
  /** Le libellé du seau en cours, selon le pas choisi. */
  enCours: Record<Grain, string>;
  marketplace: string;
  lien: string;
  ouvertures: (n: number) => string;
  hausse: (p: number) => string;
  baisse: (p: number) => string;
  stable: string;
  videTitre: string;
  videCorps: string;
  pasPretTitre: string;
  pasPretCorps: string;
  partager: string;
  commentTitre: string;
  comment: string[];
}

const fr: OdyansCopy = {
  titre: "Audience de la vitrine",
  sous: "Combien de fois votre vitrine a été ouverte, et par quelle porte.",
  retour: "Retour",
  grains: { jour: "Par jour", semaine: "Par semaine", mois: "Par mois" },
  enCours: { jour: "Aujourd'hui", semaine: "Cette semaine", mois: "Ce mois" },
  marketplace: "Depuis le Marketplace",
  lien: "Depuis votre lien partagé",
  ouvertures: (n) => (n === 1 ? "1 ouverture" : `${n} ouvertures`),
  hausse: (p) => `+${p} % par rapport à la période précédente`,
  baisse: (p) => `${p} % par rapport à la période précédente`,
  stable: "Même chiffre que la période précédente",
  videTitre: "Personne n'a encore ouvert votre vitrine",
  videCorps:
    "Partagez votre lien dans votre statut WhatsApp, votre bio TikTok, vos publications. Les ouvertures apparaîtront ici dès la première.",
  pasPretTitre: "Le compteur n'a pas encore commencé",
  pasPretCorps:
    "La mesure vient d'être installée et doit être activée sur la base. Prévenez le support : aucune donnée n'est perdue, le comptage démarrera simplement à ce moment-là.",
  partager: "Voir ma vitrine",
  commentTitre: "Ce qui est compté",
  comment: [
    "Une ouverture par personne et par onglet : six rechargements ne font pas six visites.",
    "Les robots d'aperçu — celui qui fabrique la vignette quand vous collez votre lien dans WhatsApp — ne sont pas comptés. Vos ouvertures sont des gens.",
    "Vos propres visites ne comptent pas tant que vous êtes connecté.",
    "Aucune adresse IP, aucun identifiant de visiteur, aucun cookie. Nous comptons des ouvertures, rien d'autre.",
  ],
};

const ht: OdyansCopy = {
  titre: "Odyans vitrin ou",
  sous: "Konbyen fwa yo ouvri vitrin ou, epi pa ki pòt.",
  retour: "Tounen",
  grains: { jour: "Pa jou", semaine: "Pa semèn", mois: "Pa mwa" },
  enCours: { jour: "Jodi a", semaine: "Semèn sa a", mois: "Mwa sa a" },
  marketplace: "Depi Marketplace la",
  lien: "Depi lyen ou pataje a",
  ouvertures: (n) => (n === 1 ? "1 ouvèti" : `${n} ouvèti`),
  hausse: (p) => `+${p} % konpare ak peryòd anvan an`,
  baisse: (p) => `${p} % konpare ak peryòd anvan an`,
  stable: "Menm chif ak peryòd anvan an",
  videTitre: "Pèsòn poko ouvri vitrin ou",
  videCorps:
    "Pataje lyen ou nan estati WhatsApp ou, nan bio TikTok ou, nan piblikasyon ou yo. Ouvèti yo ap parèt isit la depi premye a.",
  pasPretTitre: "Kontè a poko kòmanse",
  pasPretCorps:
    "Nou fèk enstale mezi a, epi li bezwen aktive sou baz la. Avèti sipò a : okenn done pa pèdi, konte a ap jis kòmanse lè sa a.",
  partager: "Gade vitrin mwen",
  commentTitre: "Sa k ap konte",
  comment: [
    "Yon ouvèti pa moun epi pa onglè : sis rechajman pa fè sis vizit.",
    "Robo apèsi yo — sa ki fè vinyèt la lè w kole lyen ou nan WhatsApp — pa konte. Ouvèti ou yo se moun.",
    "Pwòp vizit ou yo pa konte toutotan ou konekte.",
    "Okenn adrès IP, okenn idantifyan vizitè, okenn cookie. Nou konte ouvèti, se tout.",
  ],
};

const en: OdyansCopy = {
  titre: "Storefront audience",
  sous: "How many times your storefront was opened, and through which door.",
  retour: "Back",
  grains: { jour: "By day", semaine: "By week", mois: "By month" },
  enCours: { jour: "Today", semaine: "This week", mois: "This month" },
  marketplace: "From the Marketplace",
  lien: "From your shared link",
  ouvertures: (n) => (n === 1 ? "1 opening" : `${n} openings`),
  hausse: (p) => `+${p}% compared with the previous period`,
  baisse: (p) => `${p}% compared with the previous period`,
  stable: "Same figure as the previous period",
  videTitre: "Nobody has opened your storefront yet",
  videCorps:
    "Share your link in your WhatsApp status, your TikTok bio, your posts. Openings will appear here from the very first one.",
  pasPretTitre: "The counter has not started yet",
  pasPretCorps:
    "The measurement has just been installed and needs to be switched on in the database. Tell support: no data is lost, counting will simply begin then.",
  partager: "View my storefront",
  commentTitre: "What is counted",
  comment: [
    "One opening per person per tab: six reloads are not six visits.",
    "Preview bots — the one that builds the thumbnail when you paste your link into WhatsApp — are not counted. Your openings are people.",
    "Your own visits do not count while you are signed in.",
    "No IP address, no visitor identifier, no cookie. We count openings, nothing else.",
  ],
};

export const ODYANS_COPY: Record<Language, OdyansCopy> = { fr, ht, en };

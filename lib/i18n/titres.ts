import type { Language } from "@/lib/i18n/translations";

/**
 * Les titres d'onglet des pages publiques, dans les trois langues.
 *
 * Les métadonnées de Next sont calculées par le serveur, qui ne sait pas en
 * quelle langue on va lire la page : la langue vit dans le navigateur. Le
 * titre servi reste donc en français — c'est lui que voient les robots
 * d'indexation et les aperçus de lien, et c'est très bien ainsi.
 *
 * `<DocTitle>` le corrige côté lecteur dès que la page s'affiche. Deux titres
 * donc, pour deux publics : la machine lit le premier, la personne voit le
 * second.
 */
export type Titre = Record<Language, string>;

export const TITRES: Record<"apropo" | "conditions" | "confidentialite" | "marketplace" | "suivi", Titre> = {
  apropo: {
    fr: "L'histoire · PASRÈL",
    ht: "Istwa a · PASRÈL",
    en: "The story · PASRÈL",
  },
  conditions: {
    fr: "Conditions d'utilisation · PASRÈL",
    ht: "Kondisyon itilizasyon · PASRÈL",
    en: "Terms of use · PASRÈL",
  },
  confidentialite: {
    fr: "Politique de confidentialité · PASRÈL",
    ht: "Politik konfidansyalite · PASRÈL",
    en: "Privacy policy · PASRÈL",
  },
  marketplace: {
    fr: "Marketplace — PASRÈL",
    ht: "Marketplace — PASRÈL",
    en: "Marketplace — PASRÈL",
  },
  suivi: {
    fr: "Suivi de commande · PASRÈL",
    ht: "Swiv kòmand lan · PASRÈL",
    en: "Order tracking · PASRÈL",
  },
};

/**
 * Le titre d'une vitrine. Le nom du commerce ne se traduit pas ; seule la
 * promesse qui le suit change de langue.
 */
export function titreVitrine(nom: string): Titre {
  return {
    fr: `${nom} · Commander sur WhatsApp`,
    ht: `${nom} · Kòmande sou WhatsApp`,
    en: `${nom} · Order on WhatsApp`,
  };
}

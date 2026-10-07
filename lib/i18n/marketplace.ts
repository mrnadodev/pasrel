import type { Language } from "@/lib/i18n/translations";

/**
 * Les textes du Marketplace public.
 *
 * Aucun ne dit « boutique ». Onze secteurs sont sur la plateforme : celui qui
 * vend peut être un restaurant, un atelier, une coiffeuse ou un indépendant, et
 * chacun doit se reconnaître dans la page qui le présente. On parle donc de
 * « vendeurs », et de « produit ou service » pour ce qu'on reçoit.
 *
 * Les comptes sont des fonctions parce que le pluriel ne se fabrique pas en
 * recollant un « s » : le créole n'en met pas, l'anglais et le français n'ont
 * pas les mêmes règles, et une page qui affiche « 1 vendeurs » perd la
 * confiance qu'elle vient de gagner.
 */
export interface MarketplaceCopy {
  titre: string;
  sousTitre: string;
  placeholder: string;
  rechercheLabel: string;
  chercher: string;
  pasPrete: string;
  rienTrouve: (q: string) => string;
  essayez: string;
  voirTout: string;
  resultats: (produits: number, vendeurs: number) => string;
  voirVitrine: string;
  personne: string;
  compteVendeurs: (n: number) => string;
  typeDefaut: string;
  compteProduits: (n: number) => string;
  hautDePage: string;
}

const FR: MarketplaceCopy = {
  titre: "Le marketplace haïtien",
  sousTitre:
    "Tapez ce que vous cherchez. Nous vous disons qui le vend, et vous lui écrivez sur WhatsApp.",
  placeholder: "Chaussures, riz, téléphone…",
  rechercheLabel: "Chercher un produit ou un service",
  chercher: "Chercher",
  pasPrete: "Le Marketplace n'est pas encore ouvert. Revenez bientôt.",
  rienTrouve: (q) => `Rien ne correspond à « ${q} ».`,
  essayez: "Essayez un mot plus court, ou le nom d'une catégorie.",
  voirTout: "Voir tout le Marketplace",
  resultats: (p, v) =>
    `${p} résultat${p > 1 ? "s" : ""} chez ${v} vendeur${v > 1 ? "s" : ""}`,
  voirVitrine: "Voir la vitrine",
  personne: "Personne n'est encore inscrit.",
  compteVendeurs: (n) => `${n} vendeur${n > 1 ? "s" : ""} sur PASRÈL`,
  typeDefaut: "Sur PASRÈL",
  compteProduits: (n) => `${n} produit${n > 1 ? "s" : ""}`,
  hautDePage: "Haut de page",
};

const HT: MarketplaceCopy = {
  titre: "Marketplace ayisyen an",
  sousTitre:
    "Tape sa w ap chèche. N ap di w kiyès ki vann li, epi w ekri l dirèkteman sou WhatsApp.",
  placeholder: "Soulye, diri, telefòn…",
  rechercheLabel: "Chèche yon pwodwi oswa yon sèvis",
  chercher: "Chèche",
  pasPrete: "Marketplace la poko louvri. Tounen talè.",
  rienTrouve: (q) => `Anyen pa koresponn ak « ${q} ».`,
  essayez: "Eseye yon mo pi kout, oswa non yon kategori.",
  voirTout: "Gade tout Marketplace la",
  resultats: (p, v) => `${p} rezilta kay ${v} vandè`,
  voirVitrine: "Gade vitrin nan",
  personne: "Pèsonn poko enskri.",
  compteVendeurs: (n) => `${n} vandè sou PASRÈL`,
  typeDefaut: "Sou PASRÈL",
  compteProduits: (n) => `${n} pwodwi`,
  hautDePage: "Anlè paj la",
};

const EN: MarketplaceCopy = {
  titre: "The Haitian marketplace",
  sousTitre:
    "Type what you are looking for. We tell you who sells it, and you write to them on WhatsApp.",
  placeholder: "Shoes, rice, phone…",
  rechercheLabel: "Search for a product or a service",
  chercher: "Search",
  pasPrete: "The Marketplace is not open yet. Come back soon.",
  rienTrouve: (q) => `Nothing matches “${q}”.`,
  essayez: "Try a shorter word, or the name of a category.",
  voirTout: "See the whole Marketplace",
  resultats: (p, v) =>
    `${p} result${p > 1 ? "s" : ""} from ${v} seller${v > 1 ? "s" : ""}`,
  voirVitrine: "See the storefront",
  personne: "Nobody has signed up yet.",
  compteVendeurs: (n) => `${n} seller${n > 1 ? "s" : ""} on PASRÈL`,
  typeDefaut: "On PASRÈL",
  compteProduits: (n) => `${n} product${n > 1 ? "s" : ""}`,
  hautDePage: "Back to top",
};

const PAR_LANGUE: Record<Language, MarketplaceCopy> = { fr: FR, ht: HT, en: EN };

export function marketplaceCopy(langue: Language): MarketplaceCopy {
  return PAR_LANGUE[langue] ?? FR;
}

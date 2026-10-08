import type { Language } from "@/lib/i18n/translations";

/**
 * La page « À propos » — l'histoire de PASRÈL.
 *
 * Le code annonçait cette page depuis le changement de nom : la signature
 * `philosophie` de lib/i18n/landing.ts est décrite comme destinée à la « page
 * d'histoire », et elle n'était utilisée nulle part. La voici.
 *
 * Le texte français est celui du propriétaire, repris tel quel. Le créole et
 * l'anglais le suivent phrase pour phrase — une page d'histoire ne se résume
 * pas d'une langue à l'autre, sinon le lecteur créolophone reçoit une version
 * abrégée de ce que le lecteur francophone reçoit en entier.
 *
 * Les trois demandes de clients ne se traduisent dans aucune version. Ce sont
 * de vraies phrases, telles qu'elles arrivent dans WhatsApp à Port-au-Prince :
 * les traduire reviendrait à les inventer.
 */

export interface BlocApropo {
  titre: string;
  corps: string[];
  /** Les trois demandes réelles, rendues en bulles de conversation. */
  bulles?: boolean;
  /** L'inventaire de l'autre rive, posé ligne à ligne. */
  liste?: string[];
  /** La ligne de l'inventaire qui pèse plus que les autres. */
  fort?: string;
}

export interface AproposCopy {
  retour: string;
  titre: string;
  /** La version courte : elle tient seule, en haut de la page. */
  court: string;
  blocs: BlocApropo[];
  nomTitre: string;
  nomCorps: string;
  ctaTitre: string;
  ctaBouton: string;
  ctaSecondaire: string;
}

/** Les trois demandes, identiques dans les trois langues. */
export const DEMANDES = ["Ou gen li an 40 ?", "Konbyen pou sa ?", "M ap pase demen."] as const;

const fr: AproposCopy = {
  retour: "Retour",
  titre: "L'histoire",
  court:
    "En Haïti, une passerelle n'est pas un monument. C'est quelques planches jetées sur un ravin, souvent posées par ceux qui doivent le traverser. Elle ne fait qu'une chose, et elle la fait tous les jours : elle permet d'arriver de l'autre côté.",
  blocs: [
    {
      titre: "D'un côté, les clients",
      corps: [
        "Un commerçant haïtien a ses clients d'un côté — dans WhatsApp.",
        "Des dizaines de conversations par jour, de vraies demandes, de vrais acheteurs.",
      ],
      bulles: true,
    },
    {
      titre: "De l'autre, le commerce",
      corps: ["Et de l'autre côté, il y a son commerce."],
      liste: ["les commandes à suivre", "le stock à compter", "les chiffres qu'il faudrait pouvoir regarder"],
      fort: "les 18 000 gourdes qu'un client n'a jamais payées",
    },
    {
      titre: "Entre les deux, rien",
      corps: [
        "La conversation a lieu, puis elle s'évapore. Pas de fiche client, pas de trace de la dette, pas de commande enregistrée.",
        "Le travail est fait, mais il ne laisse rien derrière lui.",
      ],
    },
    {
      titre: "PASRÈL est la traversée",
      corps: ["Tout ce qui se dit d'un côté arrive de l'autre."],
      liste: [
        "une commande qui avance",
        "une cliente qui existe dans un fichier",
        "une dette qu'on peut réclamer",
        "un stock qui diminue",
        "un chiffre qu'on peut imprimer",
      ],
    },
    {
      titre: "On n'a pas inventé le commerce",
      corps: ["Il était déjà là, dans les conversations. On a juste construit le passage."],
    },
  ],
  nomTitre: "Pourquoi ce nom",
  nomCorps:
    "Parce qu'en Haïti, quand le marché est de l'autre côté du ravin, ce n'est pas une route qu'il faut. C'est une passerelle.",
  ctaTitre: "Votre commerce est déjà dans vos conversations.",
  ctaBouton: "Créer ma vitrine gratuitement",
  ctaSecondaire: "Voir le Marketplace",
};

const ht: AproposCopy = {
  retour: "Tounen",
  titre: "Istwa a",
  court:
    "An Ayiti, yon pasrèl se pa yon moniman. Se kèk planch yo jete sou yon ravin, e souvan se moun ki gen pou travèse a ki poze yo. Li fè yon sèl bagay, epi li fè l chak jou : li kite w rive lòt bò a.",
  blocs: [
    {
      titre: "Yon bò, kliyan yo",
      corps: [
        "Yon komèsan ayisyen gen kliyan l yo yon bò — nan WhatsApp.",
        "Douzèn konvèsasyon chak jou, vrè demann, vrè achtè.",
      ],
      bulles: true,
    },
    {
      titre: "Lòt bò a, biznis la",
      corps: ["Epi lòt bò a, gen biznis li."],
      liste: ["kòmand yo pou swiv", "stòk la pou konte", "chif li ta renmen ka gade"],
      fort: "18 000 goud yon kliyan pa janm peye",
    },
    {
      titre: "Nan mitan, anyen",
      corps: [
        "Konvèsasyon an fèt, epi li disparèt. Pa gen fich kliyan, pa gen tras dèt la, pa gen kòmand ki anrejistre.",
        "Travay la fèt, men li pa kite anyen dèyè l.",
      ],
    },
    {
      titre: "PASRÈL se travèse a",
      corps: ["Tout sa ki di yon bò rive lòt bò a."],
      liste: [
        "yon kòmand k ap avanse",
        "yon kliyan ki egziste nan yon fichye",
        "yon dèt ou ka reklame",
        "yon stòk k ap desann",
        "yon chif ou ka enprime",
      ],
    },
    {
      titre: "Nou pa envante komès la",
      corps: ["Li te deja la, nan konvèsasyon yo. Nou jis bati pasaj la."],
    },
  ],
  nomTitre: "Poukisa non sa a",
  nomCorps:
    "Paske an Ayiti, lè mache a lòt bò ravin nan, se pa yon wout ou bezwen. Se yon pasrèl.",
  ctaTitre: "Biznis ou deja nan konvèsasyon ou yo.",
  ctaBouton: "Kreye vitrin mwen gratis",
  ctaSecondaire: "Gade Marketplace la",
};

const en: AproposCopy = {
  retour: "Back",
  titre: "The story",
  court:
    "In Haiti, a footbridge is not a monument. It is a few planks thrown across a ravine, usually laid by the people who have to cross it. It does one thing, and it does it every day: it gets you to the other side.",
  blocs: [
    {
      titre: "On one side, the customers",
      corps: [
        "A Haitian merchant has their customers on one side — inside WhatsApp.",
        "Dozens of conversations a day, real requests, real buyers.",
      ],
      bulles: true,
    },
    {
      titre: "On the other, the business",
      corps: ["And on the other side, there is the business."],
      liste: ["orders to follow", "stock to count", "figures someone ought to be able to look at"],
      fort: "the 18,000 gourdes a customer never paid",
    },
    {
      titre: "In between, nothing",
      corps: [
        "The conversation happens, then it evaporates. No customer record, no trace of the debt, no order saved.",
        "The work is done, but it leaves nothing behind.",
      ],
    },
    {
      titre: "PASRÈL is the crossing",
      corps: ["Everything said on one side arrives on the other."],
      liste: [
        "an order moving forward",
        "a customer who exists in a file",
        "a debt you can claim",
        "stock going down",
        "a figure you can print",
      ],
    },
    {
      titre: "We did not invent the commerce",
      corps: ["It was already there, in the conversations. We just built the crossing."],
    },
  ],
  nomTitre: "Why this name",
  nomCorps:
    "Because in Haiti, when the market is on the other side of the ravine, you do not need a road. You need a footbridge.",
  ctaTitre: "Your business is already in your conversations.",
  ctaBouton: "Create my storefront free",
  ctaSecondaire: "See the Marketplace",
};

export const APROPO_COPY: Record<Language, AproposCopy> = { fr, ht, en };

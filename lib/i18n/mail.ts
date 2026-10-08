import type { Language } from "@/lib/i18n/translations";

/**
 * Les deux courriels que l'application envoie d'elle-même.
 *
 * Ils sont écrits ici, en entier, dans les trois langues du produit, et rendus
 * par des fonctions pures : un gabarit se relit, se corrige et se teste sans
 * rien envoyer à personne.
 *
 * Chaque chiffre annoncé vient du code qui l'applique — trois jours de
 * tolérance, retour au plan Gratis, renouvellement anticipé qui s'ajoute au
 * temps restant (lib/plans.ts). Un courriel qui promet autre chose que ce que
 * le logiciel fait est pire que pas de courriel du tout.
 */

export interface Rendu {
  subject: string;
  text: string;
  html: string;
}

export interface DonneesBienvenue {
  ownerName: string;
  businessName: string;
  slug: string;
  baseUrl: string;
}

export interface DonneesAbonnement {
  ownerName: string;
  businessName: string;
  planName: string;
  amountHtg: number;
  method: string;
  reference: string | null;
  start: Date;
  end: Date;
  baseUrl: string;
}

const LOCALE: Record<Language, string> = { fr: "fr-HT", ht: "fr-HT", en: "en-US" };

function date(d: Date, langue: Language): string {
  return new Intl.DateTimeFormat(LOCALE[langue], { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

function montant(htg: number, langue: Language): string {
  return `${new Intl.NumberFormat(LOCALE[langue]).format(htg)} HTG`;
}

/**
 * Enveloppe HTML volontairement pauvre : aucune image, aucune feuille de style
 * distante, aucun tableau de mise en page. Un courriel chargé part en
 * indésirable, et la moitié des marchandes le liront sur un téléphone d'entrée
 * de gamme. Le texte brut reste la version de référence.
 */
function enveloppe(corps: string, signature: string): string {
  return [
    '<div style="margin:0;padding:24px;background:#F2F6F4;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">',
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">',
    '<div style="font-size:22px;font-weight:800;letter-spacing:-.5px;color:#06231C;margin-bottom:24px">PASR<span style="color:#008069">È</span>L</div>',
    corps,
    '<div style="margin-top:32px;padding-top:20px;border-top:1px solid #E6ECEA;font-size:13px;line-height:1.5;color:#5E7E75">',
    signature,
    "</div></div></div>",
  ].join("");
}

function p(texte: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#06231C">${texte}</p>`;
}

function encadre(lignes: string[]): string {
  return [
    '<div style="background:#F7FAF9;border-radius:12px;padding:16px 18px;margin:0 0 16px">',
    lignes
      .map(
        (l) =>
          `<div style="font-size:14px;line-height:1.7;color:#06231C">${l}</div>`,
      )
      .join(""),
    "</div>",
  ].join("");
}

function bouton(url: string, libelle: string): string {
  return `<p style="margin:0 0 20px"><a href="${url}" style="display:inline-block;background:#008069;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 24px;border-radius:10px">${libelle}</a></p>`;
}

/* ─────────────────────────── Bienvenue ─────────────────────────── */

const BIENVENUE: Record<Language, (d: DonneesBienvenue, lien: string) => Rendu> = {
  fr: (d, lien) => ({
    subject: `Bienvenue sur PASRÈL — ${d.businessName} est en ligne`,
    text: [
      `Bonjour ${d.ownerName},`,
      "",
      `${d.businessName} est en ligne. Voici votre adresse, à partager partout :`,
      lien,
      "",
      "Mettez-la dans votre statut WhatsApp, votre bio TikTok, vos publications. Vos clients n'installent rien et ne créent aucun compte.",
      "",
      "Pour commencer :",
      "1. Ajoutez vos premiers produits, avec photo et prix",
      "2. Indiquez vos zones de livraison et leurs frais",
      "3. Partagez le lien",
      "",
      "Vous êtes sur la formule Gratis. Rien ne sera débité, aucune carte n'est demandée.",
      "",
      `Conditions d'utilisation : ${d.baseUrl}/kondisyon`,
      `Confidentialité : ${d.baseUrl}/konfidansyalite`,
      "",
      "Une question ? Répondez simplement à ce message.",
      "",
      "— PASRÈL",
      "Là où les conversations deviennent des clients.",
    ].join("\n"),
    html: enveloppe(
      [
        p(`Bonjour <strong>${d.ownerName}</strong>,`),
        p(`<strong>${d.businessName}</strong> est en ligne. Voici votre adresse, à partager partout :`),
        encadre([`<strong style="font-size:16px">${lien}</strong>`]),
        p("Mettez-la dans votre statut WhatsApp, votre bio TikTok, vos publications. Vos clients n'installent rien et ne créent aucun compte."),
        p("<strong>Pour commencer</strong><br>1. Ajoutez vos premiers produits, avec photo et prix<br>2. Indiquez vos zones de livraison et leurs frais<br>3. Partagez le lien"),
        bouton(`${d.baseUrl}/katalog`, "Ajouter mes produits"),
        p("Vous êtes sur la formule <strong>Gratis</strong>. Rien ne sera débité, aucune carte n'est demandée."),
      ].join(""),
      `<a href="${d.baseUrl}/kondisyon" style="color:#008069">Conditions d'utilisation</a> · <a href="${d.baseUrl}/konfidansyalite" style="color:#008069">Confidentialité</a><br>Une question ? Répondez simplement à ce message.<br><br>PASRÈL — Là où les conversations deviennent des clients.`,
    ),
  }),

  ht: (d, lien) => ({
    subject: `Byenveni sou PASRÈL — ${d.businessName} an liy`,
    text: [
      `Bonjou ${d.ownerName},`,
      "",
      `${d.businessName} an liy. Men adrès ou, pou w pataje tout kote :`,
      lien,
      "",
      "Mete l nan estati WhatsApp ou, nan bio TikTok ou, nan piblikasyon ou yo. Kliyan ou yo pa enstale anyen e yo pa kreye okenn kont.",
      "",
      "Pou kòmanse :",
      "1. Ajoute premye pwodwi ou yo, ak foto ak pri",
      "2. Mete zòn livrezon ou yo ak frè yo",
      "3. Pataje lyen an",
      "",
      "Ou sou fòmil Gratis la. Anyen p ap debite, nou pa mande okenn kat.",
      "",
      `Kondisyon itilizasyon : ${d.baseUrl}/kondisyon`,
      `Konfidansyalite : ${d.baseUrl}/konfidansyalite`,
      "",
      "Yon kesyon ? Reponn mesaj sa a dirèkteman.",
      "",
      "— PASRÈL",
      "Kote konvèsasyon tounen kliyan.",
    ].join("\n"),
    html: enveloppe(
      [
        p(`Bonjou <strong>${d.ownerName}</strong>,`),
        p(`<strong>${d.businessName}</strong> an liy. Men adrès ou, pou w pataje tout kote :`),
        encadre([`<strong style="font-size:16px">${lien}</strong>`]),
        p("Mete l nan estati WhatsApp ou, nan bio TikTok ou, nan piblikasyon ou yo. Kliyan ou yo pa enstale anyen e yo pa kreye okenn kont."),
        p("<strong>Pou kòmanse</strong><br>1. Ajoute premye pwodwi ou yo, ak foto ak pri<br>2. Mete zòn livrezon ou yo ak frè yo<br>3. Pataje lyen an"),
        bouton(`${d.baseUrl}/katalog`, "Ajoute pwodwi mwen yo"),
        p("Ou sou fòmil <strong>Gratis</strong> la. Anyen p ap debite, nou pa mande okenn kat."),
      ].join(""),
      `<a href="${d.baseUrl}/kondisyon" style="color:#008069">Kondisyon itilizasyon</a> · <a href="${d.baseUrl}/konfidansyalite" style="color:#008069">Konfidansyalite</a><br>Yon kesyon ? Reponn mesaj sa a dirèkteman.<br><br>PASRÈL — Kote konvèsasyon tounen kliyan.`,
    ),
  }),

  en: (d, lien) => ({
    subject: `Welcome to PASRÈL — ${d.businessName} is online`,
    text: [
      `Hello ${d.ownerName},`,
      "",
      `${d.businessName} is online. Here is your address, to share everywhere:`,
      lien,
      "",
      "Put it in your WhatsApp status, your TikTok bio, your posts. Your customers install nothing and create no account.",
      "",
      "To get started:",
      "1. Add your first products, with photos and prices",
      "2. Set your delivery zones and their fees",
      "3. Share the link",
      "",
      "You are on the Free plan. Nothing will be charged, no card is required.",
      "",
      `Terms of use: ${d.baseUrl}/kondisyon`,
      `Privacy: ${d.baseUrl}/konfidansyalite`,
      "",
      "A question? Just reply to this message.",
      "",
      "— PASRÈL",
      "Where conversations become customers.",
    ].join("\n"),
    html: enveloppe(
      [
        p(`Hello <strong>${d.ownerName}</strong>,`),
        p(`<strong>${d.businessName}</strong> is online. Here is your address, to share everywhere:`),
        encadre([`<strong style="font-size:16px">${lien}</strong>`]),
        p("Put it in your WhatsApp status, your TikTok bio, your posts. Your customers install nothing and create no account."),
        p("<strong>To get started</strong><br>1. Add your first products, with photos and prices<br>2. Set your delivery zones and their fees<br>3. Share the link"),
        bouton(`${d.baseUrl}/katalog`, "Add my products"),
        p("You are on the <strong>Free</strong> plan. Nothing will be charged, no card is required."),
      ].join(""),
      `<a href="${d.baseUrl}/kondisyon" style="color:#008069">Terms of use</a> · <a href="${d.baseUrl}/konfidansyalite" style="color:#008069">Privacy</a><br>A question? Just reply to this message.<br><br>PASRÈL — Where conversations become customers.`,
    ),
  }),
};

export function courrielBienvenue(langue: Language, d: DonneesBienvenue): Rendu {
  const lien = `${d.baseUrl}/b/${d.slug}`;
  return (BIENVENUE[langue] ?? BIENVENUE.fr)(d, lien);
}

/* ────────────────────────── Abonnement ────────────────────────── */

const ABONNEMENT: Record<Language, (d: DonneesAbonnement) => Rendu> = {
  fr: (d) => {
    const ref = d.reference ? `, référence ${d.reference}` : "";
    return {
      subject: `Abonnement PASRÈL activé — ${d.planName}, jusqu'au ${date(d.end, "fr")}`,
      text: [
        `Bonjour ${d.ownerName},`,
        "",
        "Votre paiement a été vérifié et votre abonnement est actif.",
        "",
        `Commerce : ${d.businessName}`,
        `Formule : ${d.planName}`,
        `Montant reçu : ${montant(d.amountHtg, "fr")}`,
        `Moyen de paiement : ${d.method}${ref}`,
        `Activé le : ${date(d.start, "fr")}`,
        `Actif jusqu'au : ${date(d.end, "fr")}`,
        "",
        "Ce qu'il faut retenir",
        "",
        "Il n'y a aucun prélèvement automatique : nous ne conservons aucune carte et rien ne sera débité. Votre abonnement s'arrête de lui-même à la date ci-dessus.",
        "",
        "Pour continuer, renouvelez depuis la page Abonnement. Si vous renouvelez avant l'échéance, les jours restants s'ajoutent — vous ne perdez rien en payant en avance.",
        "",
        "Après l'échéance, vous disposez de trois jours de tolérance. Passé ce délai, le compte revient à la formule Gratis : les fonctions payantes se referment, mais vos produits, vos commandes et vos clients restent intacts. Un renouvellement les rouvre.",
        "",
        "Un mois commencé n'est pas remboursé, sauf si l'interruption vient de nous.",
        "",
        `Conditions complètes : ${d.baseUrl}/kondisyon`,
        "",
        "Une question ? Répondez simplement à ce message.",
        "",
        "— PASRÈL",
      ].join("\n"),
      html: enveloppe(
        [
          p(`Bonjour <strong>${d.ownerName}</strong>,`),
          p("Votre paiement a été vérifié et votre abonnement est actif."),
          encadre([
            `Commerce — <strong>${d.businessName}</strong>`,
            `Formule — <strong>${d.planName}</strong>`,
            `Montant reçu — <strong>${montant(d.amountHtg, "fr")}</strong>`,
            `Moyen de paiement — ${d.method}${ref}`,
            `Activé le — ${date(d.start, "fr")}`,
            `Actif jusqu'au — <strong>${date(d.end, "fr")}</strong>`,
          ]),
          p("<strong>Aucun prélèvement automatique.</strong> Nous ne conservons aucune carte et rien ne sera débité. Votre abonnement s'arrête de lui-même à la date ci-dessus."),
          p("Pour continuer, renouvelez depuis la page Abonnement. <strong>Si vous renouvelez avant l'échéance, les jours restants s'ajoutent</strong> — vous ne perdez rien en payant en avance."),
          p("Après l'échéance, vous disposez de <strong>trois jours de tolérance</strong>. Passé ce délai, le compte revient à la formule Gratis : les fonctions payantes se referment, mais vos produits, vos commandes et vos clients restent intacts. Un renouvellement les rouvre."),
          p("Un mois commencé n'est pas remboursé, sauf si l'interruption vient de nous."),
          bouton(`${d.baseUrl}/abonman`, "Voir mon abonnement"),
        ].join(""),
        `<a href="${d.baseUrl}/kondisyon" style="color:#008069">Conditions complètes</a><br>Une question ? Répondez simplement à ce message.<br><br>PASRÈL — Là où les conversations deviennent des clients.`,
      ),
    };
  },

  ht: (d) => {
    const ref = d.reference ? `, referans ${d.reference}` : "";
    return {
      subject: `Abònman PASRÈL aktive — ${d.planName}, jiska ${date(d.end, "ht")}`,
      text: [
        `Bonjou ${d.ownerName},`,
        "",
        "Nou verifye peman w lan, abònman w lan aktif.",
        "",
        `Biznis : ${d.businessName}`,
        `Fòmil : ${d.planName}`,
        `Montan nou resevwa : ${montant(d.amountHtg, "ht")}`,
        `Mwayen peman : ${d.method}${ref}`,
        `Aktive : ${date(d.start, "ht")}`,
        `Aktif jiska : ${date(d.end, "ht")}`,
        "",
        "Sa pou w sonje",
        "",
        "Pa gen okenn prelèvman otomatik : nou pa kenbe okenn kat e anyen p ap debite. Abònman an kanpe pou kont li nan dat ki anwo a.",
        "",
        "Pou kontinye, renouvle depi paj Abònman an. Si w renouvle anvan dat la, jou ki rete yo ajoute — ou pa pèdi anyen lè w peye davans.",
        "",
        "Apre dat la, ou gen twa jou tolerans. Apre sa, kont lan tounen sou fòmil Gratis la : fonksyon peyan yo fèmen, men pwodwi w yo, kòmand yo ak kliyan w yo rete tout. Yon renouvèlman rouvri yo.",
        "",
        "Yon mwa ki kòmanse pa ranbouse, sof si se nou ki koupe sèvis la.",
        "",
        `Kondisyon konplè : ${d.baseUrl}/kondisyon`,
        "",
        "Yon kesyon ? Reponn mesaj sa a dirèkteman.",
        "",
        "— PASRÈL",
      ].join("\n"),
      html: enveloppe(
        [
          p(`Bonjou <strong>${d.ownerName}</strong>,`),
          p("Nou verifye peman w lan, abònman w lan aktif."),
          encadre([
            `Biznis — <strong>${d.businessName}</strong>`,
            `Fòmil — <strong>${d.planName}</strong>`,
            `Montan nou resevwa — <strong>${montant(d.amountHtg, "ht")}</strong>`,
            `Mwayen peman — ${d.method}${ref}`,
            `Aktive — ${date(d.start, "ht")}`,
            `Aktif jiska — <strong>${date(d.end, "ht")}</strong>`,
          ]),
          p("<strong>Pa gen okenn prelèvman otomatik.</strong> Nou pa kenbe okenn kat e anyen p ap debite. Abònman an kanpe pou kont li nan dat ki anwo a."),
          p("Pou kontinye, renouvle depi paj Abònman an. <strong>Si w renouvle anvan dat la, jou ki rete yo ajoute</strong> — ou pa pèdi anyen lè w peye davans."),
          p("Apre dat la, ou gen <strong>twa jou tolerans</strong>. Apre sa, kont lan tounen sou fòmil Gratis la : fonksyon peyan yo fèmen, men pwodwi w yo, kòmand yo ak kliyan w yo rete tout. Yon renouvèlman rouvri yo."),
          p("Yon mwa ki kòmanse pa ranbouse, sof si se nou ki koupe sèvis la."),
          bouton(`${d.baseUrl}/abonman`, "Gade abònman mwen"),
        ].join(""),
        `<a href="${d.baseUrl}/kondisyon" style="color:#008069">Kondisyon konplè</a><br>Yon kesyon ? Reponn mesaj sa a dirèkteman.<br><br>PASRÈL — Kote konvèsasyon tounen kliyan.`,
      ),
    };
  },

  en: (d) => {
    const ref = d.reference ? `, reference ${d.reference}` : "";
    return {
      subject: `PASRÈL subscription active — ${d.planName}, until ${date(d.end, "en")}`,
      text: [
        `Hello ${d.ownerName},`,
        "",
        "Your payment has been verified and your subscription is active.",
        "",
        `Business: ${d.businessName}`,
        `Plan: ${d.planName}`,
        `Amount received: ${montant(d.amountHtg, "en")}`,
        `Payment method: ${d.method}${ref}`,
        `Activated on: ${date(d.start, "en")}`,
        `Active until: ${date(d.end, "en")}`,
        "",
        "What to remember",
        "",
        "There is no automatic charge: we keep no card and nothing will be debited. Your subscription stops by itself on the date above.",
        "",
        "To continue, renew from the Subscription page. If you renew before the end date, the remaining days are added — you lose nothing by paying early.",
        "",
        "After the end date you have three days of grace. Past that, the account returns to the Free plan: paid features close, but your products, your orders and your customers stay intact. A renewal reopens them.",
        "",
        "A started month is not refunded, unless the interruption comes from us.",
        "",
        `Full terms: ${d.baseUrl}/kondisyon`,
        "",
        "A question? Just reply to this message.",
        "",
        "— PASRÈL",
      ].join("\n"),
      html: enveloppe(
        [
          p(`Hello <strong>${d.ownerName}</strong>,`),
          p("Your payment has been verified and your subscription is active."),
          encadre([
            `Business — <strong>${d.businessName}</strong>`,
            `Plan — <strong>${d.planName}</strong>`,
            `Amount received — <strong>${montant(d.amountHtg, "en")}</strong>`,
            `Payment method — ${d.method}${ref}`,
            `Activated on — ${date(d.start, "en")}`,
            `Active until — <strong>${date(d.end, "en")}</strong>`,
          ]),
          p("<strong>No automatic charge.</strong> We keep no card and nothing will be debited. Your subscription stops by itself on the date above."),
          p("To continue, renew from the Subscription page. <strong>If you renew before the end date, the remaining days are added</strong> — you lose nothing by paying early."),
          p("After the end date you have <strong>three days of grace</strong>. Past that, the account returns to the Free plan: paid features close, but your products, your orders and your customers stay intact. A renewal reopens them."),
          p("A started month is not refunded, unless the interruption comes from us."),
          bouton(`${d.baseUrl}/abonman`, "View my subscription"),
        ].join(""),
        `<a href="${d.baseUrl}/kondisyon" style="color:#008069">Full terms</a><br>A question? Just reply to this message.<br><br>PASRÈL — Where conversations become customers.`,
      ),
    };
  },
};

export function courrielAbonnement(langue: Language, d: DonneesAbonnement): Rendu {
  return (ABONNEMENT[langue] ?? ABONNEMENT.fr)(d);
}

/* ──────────────────────── Mot de passe oublié ──────────────────────── */

export interface DonneesModpas {
  /** Lien vers /nouvo-modpas, portant le jeton haché. */
  lien: string;
  baseUrl: string;
}

/**
 * Le courriel de réinitialisation, écrit par nous.
 *
 * Il l'était par Supabase, en anglais, sans marque, avec un lien qui pointait
 * sur l'API d'authentification — donc un lien que le premier robot d'aperçu
 * venu dépensait avant son destinataire (voir lib/auth-lien.ts).
 *
 * Deux phrases comptent plus que tout le reste et figurent dans les trois
 * langues : **il ne sert qu'une fois**, et **il ne se transfère pas**. Un lien
 * de récupération fait passer pour son propriétaire quiconque l'ouvre ; le
 * faire suivre par WhatsApp, c'est donner son compte.
 */
const MODPAS: Record<Language, (d: DonneesModpas) => Rendu> = {
  fr: (d) => ({
    subject: "Réinitialiser votre mot de passe PASRÈL",
    text: [
      "Bonjour,",
      "",
      "Vous avez demandé à changer votre mot de passe. Ouvrez ce lien :",
      d.lien,
      "",
      "Il est valable une heure et ne sert qu'une fois.",
      "",
      "Ne le faites suivre à personne, même pas à quelqu'un qui vous aide : ce lien ouvre votre compte sans mot de passe. Si une autre personne doit s'en servir, elle doit demander le sien depuis la page de connexion.",
      "",
      "Vous n'avez rien demandé ? Ignorez ce message. Votre mot de passe actuel reste valable et personne n'a eu accès à votre compte.",
      "",
      "— PASRÈL",
    ].join("\n"),
    html: enveloppe(
      [
        p("Bonjour,"),
        p("Vous avez demandé à changer votre mot de passe."),
        bouton(d.lien, "Choisir un nouveau mot de passe"),
        p('Le bouton ne marche pas ? Copiez cette adresse dans votre navigateur :'),
        encadre([`<span style="word-break:break-all;font-size:13px">${d.lien}</span>`]),
        p("Il est valable <strong>une heure</strong> et ne sert <strong>qu'une fois</strong>."),
        p("<strong>Ne le faites suivre à personne</strong>, même pas à quelqu'un qui vous aide : ce lien ouvre votre compte sans mot de passe. Si une autre personne doit s'en servir, elle doit demander le sien depuis la page de connexion."),
        p("Vous n'avez rien demandé ? Ignorez ce message. Votre mot de passe actuel reste valable et personne n'a eu accès à votre compte."),
      ].join(""),
      `<a href="${d.baseUrl}/login" style="color:#008069">Page de connexion</a><br>Une question ? Répondez simplement à ce message.<br><br>PASRÈL — Là où les conversations deviennent des clients.`,
    ),
  }),

  ht: (d) => ({
    subject: "Chanje modpas PASRÈL ou",
    text: [
      "Bonjou,",
      "",
      "Ou mande pou chanje modpas ou. Ouvri lyen sa a :",
      d.lien,
      "",
      "Li valab pou yon èdtan epi li sèvi yon sèl fwa.",
      "",
      "Pa voye l bay pèsòn, menm moun k ap ede w : lyen sa a ouvri kont ou san modpas. Si yon lòt moun bezwen sèvi avè l, se pou li mande pa l depi nan paj koneksyon an.",
      "",
      "Se pa ou ki mande l ? Pa okipe mesaj sa a. Modpas ou kounye a rete bon e pèsòn pa antre nan kont ou.",
      "",
      "— PASRÈL",
    ].join("\n"),
    html: enveloppe(
      [
        p("Bonjou,"),
        p("Ou mande pou chanje modpas ou."),
        bouton(d.lien, "Chwazi yon nouvo modpas"),
        p("Bouton an pa mache ? Kopye adrès sa a nan navigatè w :"),
        encadre([`<span style="word-break:break-all;font-size:13px">${d.lien}</span>`]),
        p("Li valab pou <strong>yon èdtan</strong> epi li sèvi <strong>yon sèl fwa</strong>."),
        p("<strong>Pa voye l bay pèsòn</strong>, menm moun k ap ede w : lyen sa a ouvri kont ou san modpas. Si yon lòt moun bezwen sèvi avè l, se pou li mande pa l depi nan paj koneksyon an."),
        p("Se pa ou ki mande l ? Pa okipe mesaj sa a. Modpas ou kounye a rete bon e pèsòn pa antre nan kont ou."),
      ].join(""),
      `<a href="${d.baseUrl}/login" style="color:#008069">Paj koneksyon</a><br>Yon kesyon ? Reponn mesaj sa a dirèkteman.<br><br>PASRÈL — Kote konvèsasyon tounen kliyan.`,
    ),
  }),

  en: (d) => ({
    subject: "Reset your PASRÈL password",
    text: [
      "Hello,",
      "",
      "You asked to change your password. Open this link:",
      d.lien,
      "",
      "It is valid for one hour and works only once.",
      "",
      "Do not forward it to anyone, not even someone helping you: this link opens your account without a password. If someone else needs one, they must request their own from the sign-in page.",
      "",
      "Did not ask for this? Ignore this message. Your current password still works and nobody has had access to your account.",
      "",
      "— PASRÈL",
    ].join("\n"),
    html: enveloppe(
      [
        p("Hello,"),
        p("You asked to change your password."),
        bouton(d.lien, "Choose a new password"),
        p("Button not working? Copy this address into your browser:"),
        encadre([`<span style="word-break:break-all;font-size:13px">${d.lien}</span>`]),
        p("It is valid for <strong>one hour</strong> and works <strong>only once</strong>."),
        p("<strong>Do not forward it to anyone</strong>, not even someone helping you: this link opens your account without a password. If someone else needs one, they must request their own from the sign-in page."),
        p("Did not ask for this? Ignore this message. Your current password still works and nobody has had access to your account."),
      ].join(""),
      `<a href="${d.baseUrl}/login" style="color:#008069">Sign-in page</a><br>A question? Just reply to this message.<br><br>PASRÈL — Where conversations become customers.`,
    ),
  }),
};

export function courrielModpas(langue: Language, d: DonneesModpas): Rendu {
  return (MODPAS[langue] ?? MODPAS.fr)(d);
}

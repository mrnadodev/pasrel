/**
 * L'audience d'une vitrine : combien de fois elle a été ouverte, par où, et
 * quand.
 *
 * Tout ce fichier est pur — on lui donne des ouvertures, il rend des séries.
 * Aucune base, aucune date « maintenant » implicite. C'est ce qui permet de
 * le vérifier sans rien brancher, et c'est nécessaire : une page d'audience
 * qui se trompe de jour est pire qu'une page absente, parce qu'on la croit.
 *
 * ── Le fuseau ───────────────────────────────────────────────────────────────
 *
 * Les évènements sont horodatés en UTC. Le marchand, lui, vit à
 * Port-au-Prince : pour lui, « aujourd'hui » commence à minuit chez lui, pas
 * à minuit à Londres. Une ouverture à 20 h le lundi à Port-au-Prince est déjà
 * mardi en UTC — comptée en UTC, elle tomberait dans le mauvais jour, et le
 * marchand qui partage son lien le soir verrait ses chiffres glisser d'une
 * case. Tout le regroupement passe donc par le fuseau d'Haïti, qui observe
 * l'heure d'été : `Intl` s'en charge, une table d'offsets écrite à la main
 * non.
 */

export const FUSEAU = "America/Port-au-Prince";

/** Par où la personne est arrivée sur la vitrine. */
export type Source = "marketplace" | "lien";

/** Le pas de la série : un point par jour, par semaine ou par mois. */
export type Grain = "jour" | "semaine" | "mois";

export interface Ouverture {
  /** Horodatage ISO rendu par la base. */
  created_at: string;
  source: Source | null;
}

export interface Point {
  /** Clé stable du seau — « 2026-10-08 », « 2026-W41 », « 2026-10 ». */
  cle: string;
  /** Premier instant du seau, dans le fuseau du marchand. */
  debut: Date;
  marketplace: number;
  lien: number;
  total: number;
}

const DECOUPE = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSEAU,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** La date locale d'un instant, en « AAAA-MM-JJ ». */
export function jourLocal(instant: Date | string, fuseau = FUSEAU): string {
  const d = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(d.getTime())) return "";
  const f = fuseau === FUSEAU ? DECOUPE : new Intl.DateTimeFormat("en-CA", { timeZone: fuseau, year: "numeric", month: "2-digit", day: "2-digit" });
  return f.format(d);
}

/** Minuit, heure locale, du jour qui contient cet instant — exprimé en UTC. */
function minuitLocal(instant: Date, fuseau = FUSEAU): Date {
  const [a, m, j] = jourLocal(instant, fuseau).split("-").map(Number);
  // On part de minuit UTC du même quantième, puis on corrige de l'écart réel
  // entre le fuseau et UTC ce jour-là. Deux passes suffisent : la seconde
  // rattrape les jours de changement d'heure.
  let t = Date.UTC(a, m - 1, j);
  for (let i = 0; i < 2; i++) {
    const vu = jourLocal(new Date(t), fuseau);
    if (vu === `${a}-${String(m).padStart(2, "0")}-${String(j).padStart(2, "0")}`) {
      // On est dans le bon jour local ; reste à reculer jusqu'à son début.
      const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: fuseau, hour: "2-digit", hour12: false }).format(new Date(t)));
      const mi = Number(new Intl.DateTimeFormat("en-GB", { timeZone: fuseau, minute: "2-digit" }).format(new Date(t)));
      t -= (h * 60 + mi) * 60_000;
      break;
    }
    t += (vu < `${a}-${String(m).padStart(2, "0")}-${String(j).padStart(2, "0")}` ? 1 : -1) * 12 * 3_600_000;
  }
  return new Date(t);
}

/** Le lundi de la semaine locale qui contient cet instant. */
function lundiLocal(instant: Date, fuseau = FUSEAU): Date {
  const minuit = minuitLocal(instant, fuseau);
  const nom = new Intl.DateTimeFormat("en-GB", { timeZone: fuseau, weekday: "short" }).format(minuit);
  const rang = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(nom);
  return minuitLocal(new Date(minuit.getTime() - Math.max(0, rang) * 86_400_000 - 3_600_000), fuseau);
}

/** Le premier jour du mois local qui contient cet instant. */
function moisLocal(instant: Date, fuseau = FUSEAU): Date {
  const [a, m] = jourLocal(instant, fuseau).split("-").map(Number);
  return minuitLocal(new Date(Date.UTC(a, m - 1, 1, 12)), fuseau);
}

/** Le numéro de semaine ISO, pour fabriquer une clé lisible. */
function semaineIso(lundi: Date, fuseau = FUSEAU): string {
  const [a, m, j] = jourLocal(lundi, fuseau).split("-").map(Number);
  const jeudi = new Date(Date.UTC(a, m - 1, j + 3));
  const premier = new Date(Date.UTC(jeudi.getUTCFullYear(), 0, 1));
  const n = Math.ceil(((jeudi.getTime() - premier.getTime()) / 86_400_000 + 1) / 7);
  return `${jeudi.getUTCFullYear()}-W${String(n).padStart(2, "0")}`;
}

const DEBUT: Record<Grain, (d: Date, f?: string) => Date> = {
  jour: minuitLocal,
  semaine: lundiLocal,
  mois: moisLocal,
};

function cleDe(grain: Grain, debut: Date, fuseau: string): string {
  if (grain === "jour") return jourLocal(debut, fuseau);
  if (grain === "mois") return jourLocal(debut, fuseau).slice(0, 7);
  return semaineIso(debut, fuseau);
}

/** Le seau précédent, du même pas. */
function reculer(grain: Grain, debut: Date, fuseau: string): Date {
  if (grain === "jour") return minuitLocal(new Date(debut.getTime() - 12 * 3_600_000), fuseau);
  if (grain === "semaine") return lundiLocal(new Date(debut.getTime() - 3 * 86_400_000), fuseau);
  return moisLocal(new Date(debut.getTime() - 15 * 86_400_000), fuseau);
}

/**
 * La série affichée : `combien` seaux consécutifs, du plus ancien au plus
 * récent, le dernier étant celui qui contient `maintenant`.
 *
 * Les seaux vides sont rendus à zéro et non sautés. Une vitrine sans visite
 * mardi doit montrer un creux mardi : sauter le jour donnerait une courbe qui
 * ment en se resserrant.
 */
export function serie(
  ouvertures: readonly Ouverture[],
  grain: Grain,
  combien: number,
  maintenant: Date = new Date(),
  fuseau: string = FUSEAU,
): Point[] {
  const seaux: Point[] = [];
  let debut = DEBUT[grain](maintenant, fuseau);
  for (let i = 0; i < combien; i++) {
    seaux.unshift({ cle: cleDe(grain, debut, fuseau), debut, marketplace: 0, lien: 0, total: 0 });
    debut = reculer(grain, debut, fuseau);
  }

  const parCle = new Map(seaux.map((p) => [p.cle, p]));
  for (const o of ouvertures) {
    const d = new Date(o.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const p = parCle.get(cleDe(grain, DEBUT[grain](d, fuseau), fuseau));
    if (!p) continue;                       // hors de la fenêtre affichée
    if (o.source === "marketplace") p.marketplace++;
    else p.lien++;                          // « lien », et aussi source absente
    p.total++;
  }
  return seaux;
}

export interface Total {
  marketplace: number;
  lien: number;
  total: number;
}

/** Le dernier seau d'une série — « aujourd'hui », « cette semaine », « ce mois ». */
export function enCours(points: readonly Point[]): Total {
  const p = points[points.length - 1];
  if (!p) return { marketplace: 0, lien: 0, total: 0 };
  return { marketplace: p.marketplace, lien: p.lien, total: p.total };
}

/**
 * La variation par rapport au seau précédent, en pourcentage entier.
 *
 * Rend `null` quand il n'y a pas de quoi comparer — zéro la semaine dernière
 * et cinq cette semaine, ce n'est pas « +500 % », c'est un début. Afficher un
 * pourcentage là serait une bravade.
 */
export function variation(points: readonly Point[]): number | null {
  if (points.length < 2) return null;
  const avant = points[points.length - 2].total;
  const apres = points[points.length - 1].total;
  if (avant === 0) return null;
  return Math.round(((apres - avant) / avant) * 100);
}

/** Le plus haut total de la série, pour mettre les barres à l'échelle. */
export function sommet(points: readonly Point[]): number {
  return points.reduce((m, p) => Math.max(m, p.total), 0);
}

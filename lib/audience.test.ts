import { describe, expect, it } from "vitest";
import { enCours, FUSEAU, jourLocal, serie, sommet, variation, type Ouverture } from "@/lib/audience";

// Une page d'audience qui se trompe de jour est pire qu'une page absente : le
// marchand la croit. Ces tests portent surtout sur le fuseau, parce que c'est
// là que ça se casse en silence.

const vue = (iso: string, source: Ouverture["source"] = "lien"): Ouverture => ({ created_at: iso, source });

describe("le jour local du marchand", () => {
  it("compte le soir dans la bonne journée", () => {
    // 20 h à Port-au-Prince le 8 octobre, c'est déjà le 9 en UTC. Compté en
    // UTC, le marchand qui partage son lien le soir verrait ses chiffres
    // glisser d'une case.
    expect(jourLocal("2026-10-09T00:30:00Z")).toBe("2026-10-08");
    expect(jourLocal("2026-10-08T16:00:00Z")).toBe("2026-10-08");
  });

  it("bascule au bon moment", () => {
    // Minuit heure d'Haïti en octobre (UTC−4) = 04:00 UTC.
    expect(jourLocal("2026-10-08T03:59:00Z")).toBe("2026-10-07");
    expect(jourLocal("2026-10-08T04:01:00Z")).toBe("2026-10-08");
  });

  it("ne rend rien pour une date abîmée", () => {
    expect(jourLocal("pas une date")).toBe("");
  });
});

describe("la série par jour", () => {
  const maintenant = new Date("2026-10-08T18:00:00Z"); // 14 h à Port-au-Prince

  it("rend autant de seaux que demandé, du plus ancien au plus récent", () => {
    const s = serie([], "jour", 7, maintenant);
    expect(s).toHaveLength(7);
    expect(s[0].cle).toBe("2026-10-02");
    expect(s[6].cle).toBe("2026-10-08");
    expect(s[0].debut.getTime()).toBeLessThan(s[6].debut.getTime());
  });

  // Sauter un jour vide donnerait une courbe qui ment en se resserrant.
  it("garde les jours vides à zéro au lieu de les sauter", () => {
    const s = serie([vue("2026-10-08T15:00:00Z")], "jour", 3, maintenant);
    expect(s.map((p) => p.total)).toEqual([0, 0, 1]);
  });

  it("sépare les deux portes d'entrée", () => {
    const s = serie(
      [
        vue("2026-10-08T15:00:00Z", "marketplace"),
        vue("2026-10-08T16:00:00Z", "marketplace"),
        vue("2026-10-08T17:00:00Z", "lien"),
      ],
      "jour",
      1,
      maintenant,
    );
    expect(s[0]).toMatchObject({ marketplace: 2, lien: 1, total: 3 });
  });

  // Les évènements d'avant la migration n'ont pas de source. Les perdre
  // ferait disparaître de l'audience réelle ; les compter comme « lien » est
  // la lecture honnête : ils ne venaient pas d'un clic du Marketplace, qui
  // était déjà tracé à part.
  it("range une ouverture sans source du côté du lien partagé", () => {
    const s = serie([vue("2026-10-08T15:00:00Z", null)], "jour", 1, maintenant);
    expect(s[0]).toMatchObject({ marketplace: 0, lien: 1, total: 1 });
  });

  it("écarte ce qui tombe hors de la fenêtre", () => {
    const s = serie([vue("2026-09-01T15:00:00Z")], "jour", 7, maintenant);
    expect(s.reduce((n, p) => n + p.total, 0)).toBe(0);
  });

  it("ignore une date illisible au lieu de tout casser", () => {
    const s = serie([vue("nawak"), vue("2026-10-08T15:00:00Z")], "jour", 1, maintenant);
    expect(s[0].total).toBe(1);
  });
});

describe("la série par semaine et par mois", () => {
  const maintenant = new Date("2026-10-08T18:00:00Z"); // un jeudi

  it("regroupe la semaine à partir du lundi", () => {
    const s = serie(
      [
        vue("2026-10-05T14:00:00Z"), // lundi
        vue("2026-10-08T14:00:00Z"), // jeudi
        vue("2026-10-04T14:00:00Z"), // dimanche d'avant
      ],
      "semaine",
      2,
      maintenant,
    );
    expect(s[1].total, "lundi et jeudi dans la semaine en cours").toBe(2);
    expect(s[0].total, "le dimanche appartient à la semaine précédente").toBe(1);
  });

  it("regroupe le mois sur le quantième 1", () => {
    const s = serie([vue("2026-10-01T14:00:00Z"), vue("2026-09-30T14:00:00Z")], "mois", 2, maintenant);
    expect(s[1].cle).toBe("2026-10");
    expect(s[1].total).toBe(1);
    expect(s[0].total).toBe(1);
  });
});

describe("les chiffres de tête", () => {
  const maintenant = new Date("2026-10-08T18:00:00Z");

  it("donne le seau en cours", () => {
    const s = serie([vue("2026-10-08T15:00:00Z", "marketplace")], "jour", 3, maintenant);
    expect(enCours(s)).toEqual({ marketplace: 1, lien: 0, total: 1 });
  });

  it("rend zéro sur une série vide plutôt que de planter", () => {
    expect(enCours([])).toEqual({ marketplace: 0, lien: 0, total: 0 });
  });

  it("compare au seau précédent", () => {
    const s = serie(
      [vue("2026-10-07T15:00:00Z"), vue("2026-10-07T16:00:00Z"), vue("2026-10-08T15:00:00Z"), vue("2026-10-08T16:00:00Z"), vue("2026-10-08T17:00:00Z")],
      "jour",
      2,
      maintenant,
    );
    expect(variation(s), "de 2 à 3").toBe(50);
  });

  // Zéro la semaine dernière et cinq cette semaine, ce n'est pas « +500 % ».
  it("ne fabrique pas un pourcentage à partir de rien", () => {
    const s = serie([vue("2026-10-08T15:00:00Z")], "jour", 2, maintenant);
    expect(variation(s)).toBeNull();
    expect(variation([])).toBeNull();
  });

  it("donne le sommet pour l'échelle des barres", () => {
    const s = serie([vue("2026-10-07T15:00:00Z"), vue("2026-10-08T15:00:00Z"), vue("2026-10-08T16:00:00Z")], "jour", 2, maintenant);
    expect(sommet(s)).toBe(2);
    expect(sommet([])).toBe(0);
  });
});

describe("le fuseau est celui d'Haïti", () => {
  it("et il est nommé, pas deviné", () => {
    expect(FUSEAU).toBe("America/Port-au-Prince");
  });
});

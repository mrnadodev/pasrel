import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APROPO_COPY, DEMANDES } from "@/lib/i18n/apropo";
import { landingCopy } from "@/lib/i18n/landing";
import { TITRES } from "@/lib/i18n/titres";

const LANGUES = ["fr", "ht", "en"] as const;

describe("la page d'histoire", () => {
  it("dit la même chose dans les trois langues", () => {
    // Une page d'histoire ne se résume pas d'une langue à l'autre : le lecteur
    // créolophone doit recevoir le texte entier, pas une version abrégée.
    const attendu = APROPO_COPY.fr.blocs.length;
    for (const l of LANGUES) {
      const t = APROPO_COPY[l];
      expect(t.blocs.length, l).toBe(attendu);
      for (let i = 0; i < attendu; i++) {
        expect(t.blocs[i].corps.length, `${l} / bloc ${i}`).toBe(APROPO_COPY.fr.blocs[i].corps.length);
        expect(t.blocs[i].liste?.length ?? 0, `${l} / liste ${i}`).toBe(APROPO_COPY.fr.blocs[i].liste?.length ?? 0);
        expect(Boolean(t.blocs[i].fort), `${l} / fort ${i}`).toBe(Boolean(APROPO_COPY.fr.blocs[i].fort));
        expect(Boolean(t.blocs[i].bulles), `${l} / bulles ${i}`).toBe(Boolean(APROPO_COPY.fr.blocs[i].bulles));
      }
    }
  });

  it("ne laisse aucun texte vide", () => {
    for (const l of LANGUES) {
      const t = APROPO_COPY[l];
      for (const [champ, valeur] of Object.entries(t)) {
        if (typeof valeur === "string") expect(valeur.trim(), `${l}.${champ}`).not.toBe("");
      }
      for (const b of t.blocs) {
        expect(b.titre.trim(), l).not.toBe("");
        for (const p of b.corps) expect(p.trim(), l).not.toBe("");
        for (const e of b.liste ?? []) expect(e.trim(), l).not.toBe("");
      }
    }
  });

  // Ce sont de vraies phrases, telles qu'elles arrivent dans WhatsApp. Les
  // traduire reviendrait à les inventer : elles restent en créole partout.
  it("garde les demandes de clients en créole dans les trois versions", () => {
    expect(DEMANDES).toHaveLength(3);
    expect(DEMANDES[0]).toContain("Ou gen li an 40");
    const source = readFileSync(join(process.cwd(), "lib/i18n/apropo.ts"), "utf8");
    // Elles ne doivent exister qu'une fois dans le fichier : une seconde
    // occurrence voudrait dire qu'une langue en a reçu sa propre version.
    for (const d of DEMANDES) {
      expect(source.split(d).length - 1, d).toBe(1);
    }
  });

  it("porte la phrase qui donne son nom à la plateforme", () => {
    expect(APROPO_COPY.fr.nomCorps).toContain("passerelle");
    expect(APROPO_COPY.ht.nomCorps).toContain("pasrèl");
    expect(APROPO_COPY.en.nomCorps).toContain("footbridge");
  });

  it("a son titre d'onglet dans les trois langues", () => {
    for (const l of LANGUES) expect(TITRES.apropo[l], l).toContain("PASRÈL");
  });
});

describe("le chemin vers la page d'histoire", () => {
  const landing = readFileSync(join(process.cwd(), "components/LandingPage.tsx"), "utf8");
  const middleware = readFileSync(join(process.cwd(), "lib/supabase/middleware.ts"), "utf8");

  // Sans cette ligne, le middleware renverrait un visiteur vers /login : la
  // page s'adresse précisément à qui n'a pas encore de compte.
  it("est publique", () => {
    expect(middleware).toContain('path === "/apropo"');
  });

  // Les liens du pied de page sont reliés par leur rang, pas par leur nom. En
  // insérer un décale tous les suivants, et « L'histoire » se mettrait à
  // pointer vers les conditions sans que rien ne casse. D'où ce test.
  it("est au bon rang dans le pied de page, dans les trois langues", () => {
    const hrefs = landing.match(/hrefs=\{\{([^}]*)\}\}/)?.[1] ?? "";
    expect(hrefs, "la carte des liens du pied de page").toContain('1: "/apropo"');
    expect(hrefs).toContain('2: "/kondisyon"');
    expect(hrefs).toContain('3: "/konfidansyalite"');

    const attendu = { fr: "L'histoire", ht: "Istwa a", en: "The story" } as const;
    for (const l of LANGUES) {
      const liens = landingCopy(l).footer.companyLinks;
      expect(liens[1], `${l} / rang 1`).toBe(attendu[l]);
      expect(liens.length, `${l} / nombre de liens`).toBe(4);
    }
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/components/LanguageContext";
import { ChampModpas, TEXTE_MODPAS } from "@/components/ChampModpas";

// L'œil se tape sur un téléphone, au moment où l'on invente un mot de passe
// qu'on ne verra plus. Trois choses peuvent le trahir, et chacune enferme
// quelqu'un dehors : qu'il parte à la soumission du formulaire, qu'il cache le
// texte sous son icône, ou qu'il reste muet pour un lecteur d'écran.

const rendu = () =>
  renderToStaticMarkup(
    <LanguageProvider>
      <ChampModpas id="x" value="" onChange={() => {}} />
    </LanguageProvider>,
  );

describe("champ de mot de passe avec œil", () => {
  it("part masqué", () => {
    expect(rendu()).toContain('type="password"');
    expect(rendu()).not.toContain('type="text"');
  });

  // Le piège : sans type="button", un bouton dans un formulaire le SOUMET.
  // Regarder son mot de passe enverrait la page.
  it("le bouton ne soumet pas le formulaire", () => {
    const html = rendu();
    const boutons = [...html.matchAll(/<button[^>]*>/g)].map((m) => m[0]);
    expect(boutons.length, "un seul bouton, celui de l'œil").toBe(1);
    expect(boutons[0]).toContain('type="button"');
  });

  it("laisse la place à l'icône pour que le texte ne passe pas dessous", () => {
    expect(rendu()).toContain("pr-11");
  });

  it("s'annonce aux lecteurs d'écran, et dit l'action", () => {
    const html = rendu();
    expect(html).toContain(`aria-label="${TEXTE_MODPAS.fr.show}"`);
    // L'icône elle-même n'a rien à annoncer : le libellé du bouton suffit.
    expect(html).toContain('aria-hidden="true"');
  });

  it("existe dans les trois langues", () => {
    for (const langue of ["fr", "ht", "en"] as const) {
      expect(TEXTE_MODPAS[langue].show.trim(), langue).not.toBe("");
      expect(TEXTE_MODPAS[langue].hide.trim(), langue).not.toBe("");
      expect(TEXTE_MODPAS[langue].show, langue).not.toBe(TEXTE_MODPAS[langue].hide);
    }
  });

  // Montrer un champ ne doit pas montrer l'autre : sur l'écran de
  // réinitialisation, la confirmation recopiée sans qu'on la lise annulerait
  // tout l'intérêt de la confirmation.
  it("chaque champ garde son propre état", () => {
    const source = readFileSync(join(process.cwd(), "components/ChampModpas.tsx"), "utf8");
    expect(source, "l'état vit dans le composant, pas chez l'appelant").toContain("useState(false)");
    expect(source, "aucune visibilité imposée de l'extérieur").not.toMatch(/visible\??\s*:\s*boolean/);
  });
});

describe("les ecrans de mot de passe passent tous par ce champ", () => {
  // Il existait a la main sur la page de connexion, et nulle part ailleurs.
  // Un <input type="password"> ecrit en dur quelque part, c'est un ecran de
  // plus ou l'on tape a l'aveugle.
  const ecrans = ["components/NewPasswordForm.tsx", "components/LoginForm.tsx", "components/RegisterForm.tsx"];

  it.each(ecrans)("%s n'ecrit plus de champ mot de passe a la main", (fichier) => {
    const source = readFileSync(join(process.cwd(), fichier), "utf8");
    expect(source).toContain("ChampModpas");
    expect(source).not.toContain('type="password"');
  });
});

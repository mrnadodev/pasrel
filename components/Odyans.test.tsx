import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/components/LanguageContext";
import { Odyans } from "@/components/Odyans";
import type { Ouverture } from "@/lib/audience";

// La page ne peut pas être regardée remplie tant que la migration 17 n'est pas
// passée sur une base. On la rend donc ici, avec de vraies ouvertures, et on
// vérifie ce qu'un marchand doit y lire.

const rendu = (ouvertures: Ouverture[], disponible = true, slug: string | null = "ti-kok") =>
  renderToStaticMarkup(
    <LanguageProvider>
      <Odyans ouvertures={ouvertures} disponible={disponible} slug={slug} />
    </LanguageProvider>,
  );

/** Des ouvertures d'aujourd'hui, pour que le seau en cours les contienne. */
function aujourdhui(n: number, source: Ouverture["source"]): Ouverture[] {
  const base = Date.now() - 3 * 3_600_000; // trois heures, on reste dans la journée locale
  return Array.from({ length: n }, (_, i) => ({ created_at: new Date(base + i * 60_000).toISOString(), source }));
}

describe("la page d'audience", () => {
  it("annonce que le compteur n'a pas commencé plutôt que d'afficher zéro", () => {
    // Zéro et « pas encore mesuré » ne disent pas la même chose. Le marchand
    // doit savoir qu'il regarde un compteur à l'arrêt.
    const html = rendu([], false);
    expect(html).toContain("Le compteur n&#x27;a pas encore commencé");
    expect(html).not.toContain("Aujourd&#x27;hui");
  });

  it("dit qu'il n'y a pas encore de visite, et quoi faire", () => {
    const html = rendu([], true);
    expect(html).toContain("Personne n&#x27;a encore ouvert votre vitrine");
    expect(html).toContain("statut WhatsApp");
  });

  it("montre le total du jour et le sépare par porte d'entrée", () => {
    const html = rendu([...aujourdhui(3, "marketplace"), ...aujourdhui(7, "lien")]);
    expect(html).toContain("Aujourd&#x27;hui");
    expect(html, "le total").toContain(">10<");
    expect(html).toContain("Depuis le Marketplace");
    expect(html).toContain("Depuis votre lien partagé");
    // Un total seul ne dit pas quoi faire ; la part de chaque porte, si.
    expect(html, "30 % venus du Marketplace").toContain("30 %");
    expect(html, "70 % venus du lien").toContain("70 %");
  });

  it("propose les trois pas de lecture", () => {
    const html = rendu(aujourdhui(1, "lien"));
    for (const l of ["Par jour", "Par semaine", "Par mois"]) expect(html).toContain(l);
  });

  // La promesse qui engage le produit : elle doit être à l'écran, pas
  // seulement dans la politique de confidentialité.
  it("dit toujours ce qui est compté, même sans donnée", () => {
    for (const html of [rendu([]), rendu([], false), rendu(aujourdhui(2, "lien"))]) {
      expect(html).toContain("Ce qui est compté");
      expect(html).toContain("robots d&#x27;aperçu");
      expect(html).toContain("aucun cookie");
    }
  });

  it("renvoie vers la vitrine quand on connaît son adresse, et se tait sinon", () => {
    expect(rendu([], true, "ti-kok")).toContain('href="/b/ti-kok"');
    expect(rendu([], true, null)).not.toContain('href="/b/');
  });
});

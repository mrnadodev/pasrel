import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { landingCopy } from "@/lib/i18n/landing";

/**
 * L'accès au Marketplace depuis la page d'accueil.
 *
 * La barre de navigation est masquée sous 1024 px (`hidden … lg:flex`). Les
 * autres liens n'y perdent rien : ce sont des ancres vers des sections de la
 * même page. Le Marketplace, lui, est une AUTRE page — et c'est la porte des
 * acheteurs. Pendant un temps, personne arrivé sur un téléphone ne pouvait y
 * entrer depuis le haut du site, sur un produit dont c'est l'idée centrale.
 *
 * Il n'a pas pu rentrer dans la barre : mesuré à 375 px, il n'y restait que
 * 52 pixels libres, et le mot en demandait quatre-vingt-dix. D'où une ligne à
 * part, sous l'en-tête, visible uniquement sur les petits écrans.
 */
const SOURCE = readFileSync(join(process.cwd(), "components/LandingPage.tsx"), "utf8");

describe("l'accès au Marketplace depuis l'accueil", () => {
  it("existe sur téléphone, hors de la barre masquée", () => {
    // Deux liens vers /boutik : celui de la barre (grands écrans) et celui de
    // la ligne dédiée (petits écrans). S'il n'en reste qu'un, le téléphone a
    // perdu sa porte.
    const liens = SOURCE.split('href="/boutik"').length - 1;
    expect(liens, "un lien pour la barre, un pour les petits écrans").toBe(2);
    expect(SOURCE, "la ligne dédiée disparaît sur grand écran").toContain("lg:hidden");
  });

  it("garde la barre de navigation réservée aux grands écrans", () => {
    expect(SOURCE).toContain('<nav className="hidden items-center gap-7 lg:flex">');
  });

  it("dessine son icône, et la déclare", () => {
    // Le bogue vécu : le JSX référençait l'icône avant qu'elle existe, et la
    // page entière tombait sur une ReferenceError.
    expect(SOURCE).toContain("<MarketplaceIcon />");
    expect(SOURCE).toContain("function MarketplaceIcon()");
  });

  it("porte le mot « Marketplace » dans les trois langues", () => {
    for (const l of ["fr", "ht", "en"] as const) {
      expect(landingCopy(l).nav.directory, l).toBe("Marketplace");
    }
  });
});

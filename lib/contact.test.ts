import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { COURRIEL, COURRIEL_LIEN, WHATSAPP_AFFICHE, WHATSAPP_LIEN } from "./contact";

// Le bouton « Parler à quelqu'un » a pointé sur wa.me/50937124488 — le numéro
// d'exemple des champs de formulaire, recopié par inadvertance. Le bouton le
// plus visible du bas de page envoyait les marchandes chez un inconnu.
//
// Ces numéros d'exemple restent légitimes dans les placeholders et les données
// de démonstration. Ce qui ne doit plus arriver, c'est qu'ils deviennent des
// liens cliquables.

const NUMERO_EXEMPLE = "50937124488";

describe("coordonnées de PASRÈL", () => {
  it("le lien WhatsApp porte bien le numéro affiché", () => {
    const chiffres = WHATSAPP_AFFICHE.replace(/\D/g, "");
    expect(WHATSAPP_LIEN).toBe(`https://wa.me/${chiffres}`);
  });

  it("le lien de courriel porte bien l'adresse affichée", () => {
    expect(COURRIEL_LIEN).toBe(`mailto:${COURRIEL}`);
  });

  it("n'emploie pas le numéro d'exemple des formulaires", () => {
    expect(WHATSAPP_LIEN).not.toContain(NUMERO_EXEMPLE);
    expect(WHATSAPP_AFFICHE.replace(/\D/g, "")).not.toBe(NUMERO_EXEMPLE);
  });
});

describe("la page d'accueil", () => {
  const source = readFileSync("components/LandingPage.tsx", "utf8");

  it("ne contient aucun lien wa.me écrit en dur", () => {
    // Tout lien WhatsApp doit passer par lib/contact.ts, sinon deux endroits
    // finissent par dire deux numéros différents.
    const enDur = source.match(/href="https:\/\/wa\.me\/[^"]*"/g) ?? [];
    expect(enDur).toEqual([]);
  });

  it("ne mène jamais vers le numéro d'exemple", () => {
    expect(source).not.toContain(NUMERO_EXEMPLE);
  });
});

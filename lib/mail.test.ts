import { describe, expect, it } from "vitest";
import { courrielAbonnement, courrielBienvenue, courrielModpas } from "./i18n/mail";
import { lienJeton } from "./auth-lien";
import { adresseLivrable } from "./mail-adresse";

// Un gabarit de courriel se teste comme du code : il porte des promesses
// contractuelles — trois jours de tolérance, aucun prélèvement automatique — et
// une promesse fausse coûte plus cher qu'un bogue d'affichage.

const BASE = "https://pasrel.app";

describe("courriel de bienvenue", () => {
  const donnees = {
    ownerName: "Nadège Pierre",
    businessName: "Ti Kòk Boutik",
    slug: "ti-kok-boutik",
    baseUrl: BASE,
  };

  it("donne l'adresse de la vitrine, en toutes lettres", () => {
    for (const langue of ["fr", "ht", "en"] as const) {
      const r = courrielBienvenue(langue, donnees);
      expect(r.text, langue).toContain("https://pasrel.app/b/ti-kok-boutik");
      expect(r.html, langue).toContain("https://pasrel.app/b/ti-kok-boutik");
    }
  });

  it("renvoie aux conditions et à la confidentialité", () => {
    for (const langue of ["fr", "ht", "en"] as const) {
      const r = courrielBienvenue(langue, donnees);
      expect(r.text, langue).toContain(`${BASE}/kondisyon`);
      expect(r.text, langue).toContain(`${BASE}/konfidansyalite`);
      expect(r.html, langue).toContain(`${BASE}/kondisyon`);
    }
  });

  it("nomme la boutique dans l'objet", () => {
    expect(courrielBienvenue("fr", donnees).subject).toContain("Ti Kòk Boutik");
    expect(courrielBienvenue("ht", donnees).subject).toContain("Ti Kòk Boutik");
  });

  it("dit qu'aucune carte n'est demandée", () => {
    expect(courrielBienvenue("fr", donnees).text).toMatch(/aucune carte/i);
    expect(courrielBienvenue("ht", donnees).text).toMatch(/okenn kat/i);
    expect(courrielBienvenue("en", donnees).text).toMatch(/no card/i);
  });
});

describe("courriel d'abonnement", () => {
  const donnees = {
    ownerName: "Nadège Pierre",
    businessName: "Ti Kòk Boutik",
    planName: "Pro",
    amountHtg: 1500,
    method: "MonCash",
    reference: "MC-88421",
    start: new Date("2026-10-05T12:00:00Z"),
    end: new Date("2026-11-05T12:00:00Z"),
    baseUrl: BASE,
  };

  it("porte le montant, le moyen de paiement et la référence", () => {
    const r = courrielAbonnement("fr", donnees);
    // Le séparateur de milliers posé par Intl est une espace insécable, pas une
    // espace ordinaire : on vérifie le nombre, pas le caractère invisible.
    expect(r.text).toMatch(/1\s500\sHTG/);
    expect(r.text).toContain("MonCash");
    expect(r.text).toContain("MC-88421");
  });

  it("omet la référence quand le marchand n'en a pas donné", () => {
    const r = courrielAbonnement("fr", { ...donnees, reference: null });
    expect(r.text).toContain("MonCash");
    expect(r.text).not.toContain("référence");
  });

  it("annonce la date de fin dans l'objet", () => {
    for (const langue of ["fr", "ht", "en"] as const) {
      const r = courrielAbonnement(langue, donnees);
      expect(r.subject, langue).toMatch(/2026/);
    }
  });

  // Les trois règles que lib/plans.ts applique réellement. Si l'une d'elles
  // change dans le code, ce test doit tomber : le courriel ment sinon.
  it("répète les trois jours de tolérance", () => {
    expect(courrielAbonnement("fr", donnees).text).toMatch(/trois jours/i);
    expect(courrielAbonnement("ht", donnees).text).toMatch(/twa jou/i);
    expect(courrielAbonnement("en", donnees).text).toMatch(/three days/i);
  });

  it("promet que rien n'est prélevé automatiquement", () => {
    expect(courrielAbonnement("fr", donnees).text).toMatch(/aucun prélèvement automatique/i);
    expect(courrielAbonnement("ht", donnees).text).toMatch(/okenn prelèvman otomatik/i);
    expect(courrielAbonnement("en", donnees).text).toMatch(/no automatic charge/i);
  });

  it("dit que rien n'est perdu au retour sur Gratis", () => {
    expect(courrielAbonnement("fr", donnees).text).toMatch(/restent intacts/i);
    expect(courrielAbonnement("ht", donnees).text).toMatch(/rete tout/i);
    expect(courrielAbonnement("en", donnees).text).toMatch(/stay intact/i);
  });

  it("dit que le renouvellement anticipé ne fait rien perdre", () => {
    expect(courrielAbonnement("fr", donnees).text).toMatch(/jours restants s'ajoutent/i);
    expect(courrielAbonnement("ht", donnees).text).toMatch(/jou ki rete yo ajoute/i);
    expect(courrielAbonnement("en", donnees).text).toMatch(/remaining days are added/i);
  });
});

// Supabase a averti la préproduction après quelques inscriptions d'essai
// envoyées à des adresses inventées : trop de rebonds et le droit d'envoyer
// est suspendu, ce qui couperait aussi les vrais courriels de mot de passe.
describe("adresses qui ne peuvent rien recevoir", () => {
  it("refuse les domaines réservés aux exemples et aux essais", () => {
    for (const a of [
      "andro@example.test",
      "qa@pasrel.invalid",
      "quelqun@example.com",
      "moi@machine.localhost",
      "agent@boutique.local",
    ]) {
      expect(adresseLivrable(a), a).toBe(false);
    }
  });

  it("laisse passer les vraies adresses", () => {
    for (const a of [
      "contact@pasrel.app",
      "mrnado.dev@gmail.com",
      "boutique@exemple-reel.ht",
      "vendeur+qa@gmail.com",
    ]) {
      expect(adresseLivrable(a), a).toBe(true);
    }
  });

  it("ne se laisse pas tromper par un domaine qui contient seulement le mot", () => {
    // « test » au milieu du nom n'en fait pas un domaine réservé : seule la
    // terminaison compte.
    expect(adresseLivrable("a@testament.ht")).toBe(true);
    expect(adresseLivrable("a@example.test")).toBe(false);
  });
});

describe("courriel de mot de passe oublié", () => {
  const lien = lienJeton(BASE, "/nouvo-modpas", "pcekBh7", "recovery");
  const donnees = { lien, baseUrl: BASE };

  it("porte le lien, en bouton et en texte copiable", () => {
    for (const langue of ["fr", "ht", "en"] as const) {
      const r = courrielModpas(langue, donnees);
      expect(r.text, langue).toContain(lien);
      expect(r.html, langue).toContain(`href="${lien}"`);
      // Le bouton ne survit pas à tous les clients mail : l'adresse doit aussi
      // se lire et se copier.
      expect(r.html.split(lien).length, langue).toBeGreaterThan(2);
    }
  });

  // La cause de la panne : un lien qui pointe sur l'API d'authentification est
  // dépensé par le premier robot d'aperçu qui le visite.
  it("ne pointe jamais sur /auth/v1/verify", () => {
    for (const langue of ["fr", "ht", "en"] as const) {
      const r = courrielModpas(langue, donnees);
      expect(r.text, langue).not.toContain("/auth/v1/");
      expect(r.html, langue).not.toContain("/auth/v1/");
      expect(r.text, langue).toContain("/nouvo-modpas?token_hash=");
    }
  });

  it("dit dans les trois langues qu'il ne sert qu'une fois et ne se transfère pas", () => {
    const attendu = {
      fr: ["une fois", "suivre"],
      ht: ["yon sèl fwa", "Pa voye l"],
      en: ["only once", "forward"],
    } as const;
    for (const langue of ["fr", "ht", "en"] as const) {
      const r = courrielModpas(langue, donnees);
      for (const mot of attendu[langue]) {
        expect(r.text, `${langue} / ${mot}`).toContain(mot);
        expect(r.html, `${langue} / ${mot}`).toContain(mot);
      }
    }
  });

  it("rassure celui qui n'a rien demandé", () => {
    expect(courrielModpas("fr", donnees).text).toContain("Ignorez ce message");
    expect(courrielModpas("ht", donnees).text).toContain("Pa okipe mesaj");
    expect(courrielModpas("en", donnees).text).toContain("Ignore this message");
  });
});

describe("langue inconnue", () => {
  it("retombe sur le français plutôt que de ne rien envoyer", () => {
    // @ts-expect-error — on force une langue hors du type, comme le ferait une
    // donnée abîmée venue de la base.
    const r = courrielBienvenue("pt", { ownerName: "A", businessName: "B", slug: "b", baseUrl: BASE });
    expect(r.subject).toContain("Bienvenue");
  });
});

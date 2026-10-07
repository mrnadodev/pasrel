import { afterEach, describe, expect, it } from "vitest";
import { storefrontBaseUrl } from "./order";

// L'adresse publique part dans les liens de vitrine, les messages WhatsApp, les
// courriels et les retours de connexion. Elle a porté l'adresse du déploiement
// Vercel pendant des jours : Supabase refusait alors l'adresse de retour et
// renvoyait les marchands sur la page d'accueil, sans un mot. Ces cas-là
// doivent échouer bruyamment plutôt que de repartir en production.

const DOMAINE = "https://pasrel.app";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe("adresse publique de la plateforme", () => {
  it("retombe sur le domaine quand rien n'est configuré", () => {
    expect(storefrontBaseUrl()).toBe(DOMAINE);
  });

  it("n'emprunte jamais l'adresse du déploiement", () => {
    // Vercel expose NEXT_PUBLIC_VERCEL_URL d'office ; elle change à chaque
    // mise en ligne et ne doit influencer rien de ce qui est destiné à durer.
    process.env.NEXT_PUBLIC_VERCEL_URL = "pasrel-o1l5amsdw-mrnadodevs-projects.vercel.app";
    expect(storefrontBaseUrl()).toBe(DOMAINE);
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
  });

  it("respecte un domaine explicitement configuré", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://autre-domaine.ht";
    expect(storefrontBaseUrl()).toBe("https://autre-domaine.ht");
  });

  it("nettoie la barre finale et les guillemets d'une saisie maladroite", () => {
    process.env.NEXT_PUBLIC_SITE_URL = '"https://autre-domaine.ht/"';
    expect(storefrontBaseUrl()).toBe("https://autre-domaine.ht");
  });

  it("retombe sur le domaine plutôt que de propager une adresse invalide", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "pas une adresse";
    expect(storefrontBaseUrl()).toBe(DOMAINE);
  });
});

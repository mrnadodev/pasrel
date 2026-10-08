import { describe, expect, it } from "vitest";
import { lienJeton, lireJeton } from "@/lib/auth-lien";

describe("lienJeton", () => {
  it("pointe sur notre domaine, jamais sur /auth/v1/verify", () => {
    const l = lienJeton("https://pasrel.app", "/nouvo-modpas", "abc123", "recovery");
    expect(l).toBe("https://pasrel.app/nouvo-modpas?token_hash=abc123&type=recovery");
    expect(l).not.toContain("/auth/v1/verify");
  });

  it("ne double pas la barre oblique", () => {
    expect(lienJeton("https://pasrel.app/", "nouvo-modpas", "t", "recovery")).toBe(
      "https://pasrel.app/nouvo-modpas?token_hash=t&type=recovery",
    );
  });

  it("échappe un jeton contenant des caractères d'URL", () => {
    const l = lienJeton("https://pasrel.app", "/konfime", "a+b/c=d", "signup");
    expect(l).toContain("token_hash=a%2Bb%2Fc%3Dd");
    expect(lireJeton(l.slice(l.indexOf("?")))).toEqual({ token_hash: "a+b/c=d", type: "signup" });
  });
});

describe("lireJeton", () => {
  it("relit le jeton et son type", () => {
    expect(lireJeton("?token_hash=xyz&type=recovery")).toEqual({ token_hash: "xyz", type: "recovery" });
  });

  it("accepte une chaîne sans point d'interrogation", () => {
    expect(lireJeton("token_hash=xyz&type=signup")).toEqual({ token_hash: "xyz", type: "signup" });
  });

  it("rend null sans jeton", () => {
    expect(lireJeton("?type=recovery")).toBeNull();
    expect(lireJeton("")).toBeNull();
    expect(lireJeton("?token_hash=%20%20&type=recovery")).toBeNull();
  });

  // Le type part vers l'API d'authentification : il ne doit jamais venir
  // tel quel de la barre d'adresse.
  it("refuse un type inconnu plutôt que de le transmettre", () => {
    expect(lireJeton("?token_hash=x&type=bidon")).toBeNull();
    expect(lireJeton("?token_hash=x&type=bidon", "recovery")).toEqual({ token_hash: "x", type: "recovery" });
  });

  it("applique le type par défaut quand le lien n'en porte pas", () => {
    expect(lireJeton("?token_hash=x", "recovery")).toEqual({ token_hash: "x", type: "recovery" });
    expect(lireJeton("?token_hash=x")).toBeNull();
  });
});

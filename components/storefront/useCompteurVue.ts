"use client";

import { useEffect } from "react";

/**
 * Compte une ouverture de vitrine, une fois par onglet.
 *
 * ── Pourquoi depuis le navigateur ───────────────────────────────────────────
 *
 * On pourrait écrire l'évènement sur le serveur, au rendu de la page. Ce
 * serait faux. Une adresse de vitrine partagée sur WhatsApp est chargée par
 * le robot d'aperçu de WhatsApp dès l'envoi du message, puis par les
 * passerelles antivirus, puis par les clients mail qui préchargent. Comptés,
 * ces chargements donneraient au marchand un chiffre qui ne correspond à
 * personne — et il le croirait.
 *
 * Un robot d'aperçu n'exécute pas de JavaScript. Mesurer ici, c'est ne compter
 * que des gens. C'est le même raisonnement que pour les liens de connexion,
 * et pour la même raison.
 *
 * ── Ce qui n'est pas collecté ───────────────────────────────────────────────
 *
 * Aucune adresse IP, aucun identifiant de visiteur, aucun cookie. On envoie
 * trois choses : la vitrine ouverte, l'instant, et la porte d'entrée. La
 * politique de confidentialité le dit dans les mêmes termes.
 *
 * ── Le dédoublonnage ────────────────────────────────────────────────────────
 *
 * `sessionStorage` retient la vitrine déjà comptée dans cet onglet : six
 * rechargements ne font pas six visites. Il s'efface à la fermeture de
 * l'onglet, et un nouvel onglet recompte — ce qui est honnête, c'est bien une
 * nouvelle venue. Rien n'est écrit si le navigateur refuse le stockage.
 */
export function useCompteurVue({
  businessId,
  slug,
  mesurer,
}: {
  businessId: string;
  /** Vrai seulement pour une vraie visite : ni aperçu, ni marchand connecté. */
  mesurer: boolean;
  slug: string;
}) {
  useEffect(() => {
    if (!mesurer || !businessId) return;

    const cle = `pasrel_vu_${businessId}`;
    try {
      if (sessionStorage.getItem(cle)) return;
      sessionStorage.setItem(cle, "1");
    } catch {
      // Stockage refusé (navigation privée, réglages) : on compte quand même,
      // quitte à compter deux fois. Un chiffre un peu haut vaut mieux qu'un
      // marchand convaincu que personne n'ouvre sa vitrine.
    }

    const charge = JSON.stringify({
      kind: "shop_view",
      path: `/b/${slug}`,
      businessId,
      source: porteDEntree(),
    });

    try {
      const blob = new Blob([charge], { type: "application/json" });
      if (navigator.sendBeacon?.("/api/evt", blob)) return;
    } catch {
      // Beacon indisponible : le repli ci-dessous.
    }
    void fetch("/api/evt", { method: "POST", body: charge, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }, [businessId, slug, mesurer]);
}

/**
 * D'où vient la personne : de notre propre Marketplace, ou d'ailleurs.
 *
 * « Ailleurs », c'est presque toujours un lien partagé — un statut WhatsApp,
 * une bio, une adresse tapée à la main. On ne cherche pas à distinguer ces
 * cas : le référent est souvent absent sur mobile, et deviner reviendrait à
 * inventer. Deux portes, c'est ce que le marchand peut agir.
 */
function porteDEntree(): "marketplace" | "lien" {
  try {
    if (!document.referrer) return "lien";
    const r = new URL(document.referrer);
    if (r.origin !== window.location.origin) return "lien";
    return r.pathname.startsWith("/boutik") ? "marketplace" : "lien";
  } catch {
    return "lien";
  }
}

/**
 * Les coordonnées de PASRÈL, écrites une seule fois.
 *
 * Le bouton « Parler à quelqu'un » de la page d'accueil pointait sur
 * `wa.me/50937124488` — le numéro d'exemple des champs de formulaire, recopié
 * là par inadvertance. Le bouton le plus visible du bas de page envoyait donc
 * les marchandes chez un inconnu, et rien dans le code ne disait que ce numéro
 * n'était pas le nôtre.
 *
 * Un numéro de contact recopié à plusieurs endroits finit toujours par diverger.
 * Celui-ci vit ici, et nulle part ailleurs.
 *
 * Les numéros d'exemple des formulaires (`+509 3712 4488`) restent ce qu'ils
 * sont : des exemples. Ils ne doivent jamais devenir des liens.
 */

/** Le numéro WhatsApp professionnel, tel qu'on l'écrit à l'écran. */
export const WHATSAPP_AFFICHE = "+509 5817 8844";

/** Le même, prêt à ouvrir une conversation. */
export const WHATSAPP_LIEN = "https://wa.me/50958178844";

/** L'adresse redirigée vers la boîte de l'équipe. */
export const COURRIEL = "contact@pasrel.app";
export const COURRIEL_LIEN = "mailto:contact@pasrel.app";

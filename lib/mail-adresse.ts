/**
 * Une adresse peut-elle recevoir quelque chose ?
 *
 * Séparé de `lib/mail.ts`, qui est marqué `server-only` et ne peut donc pas
 * être chargé par les tests. Ce fichier-ci est une fonction pure : il se
 * vérifie sans réseau et sans serveur.
 *
 * La RFC 2606 réserve ces domaines aux exemples et aux essais : rien n'existe
 * derrière, et chaque envoi revient en rebond. Supabase a averti la
 * préproduction après une poignée d'inscriptions de test envoyées à des
 * adresses inventées — trop de rebonds et le droit d'envoyer est suspendu,
 * ce qui couperait aussi les vrais courriels de mot de passe.
 *
 * Les jeux de démonstration en portent : `andro@example.test` est propriétaire
 * d'une boutique en production. Confirmer son abonnement enverrait un reçu
 * dans le vide. Mieux vaut ne pas envoyer que rebondir.
 */
const DOMAINES_MORTS = /\.(test|example|invalid|localhost|local)$|^example\.(com|net|org)$/i;

export function adresseLivrable(adresse: string): boolean {
  const domaine = adresse.split("@")[1]?.trim().toLowerCase();
  return Boolean(domaine) && !DOMAINES_MORTS.test(domaine);
}

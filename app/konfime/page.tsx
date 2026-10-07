import { ConfirmEmail } from "@/components/ConfirmEmail";

// Cible du lien de confirmation d'adresse envoyé à l'inscription.
// Le jeton arrive dans le fragment de l'URL : seule une page cliente peut le
// lire, et c'est tout ce que fait celle-ci avant de renvoyer à la racine.
export default function KonfimePage() {
  return <ConfirmEmail />;
}

import { redirect } from "next/navigation";
import { Odyans } from "@/components/Odyans";
import { audienceVitrine } from "@/lib/audience-data";
import { getDashboard } from "@/lib/data";

// L'audience de la vitrine du marchand connecté.
//
// La page lit `site_events` par la clé service role — la table porte
// l'audience de tous les marchands — après avoir résolu le commerce depuis la
// session. Le filtre ne vient jamais de l'URL : il n'y a d'ailleurs pas de
// paramètre à passer, et c'est voulu.
export default async function OdyansPage() {
  const audience = await audienceVitrine();
  if (!audience) redirect("/login");

  const { business } = await getDashboard();

  return <Odyans ouvertures={audience.ouvertures} disponible={audience.disponible} slug={business?.slug ?? null} />;
}

// Les chiffres doivent être ceux de maintenant, pas ceux du dernier build.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Audience de la vitrine · PASRÈL",
  description: "Combien de fois votre vitrine a été ouverte, et par quelle porte.",
};

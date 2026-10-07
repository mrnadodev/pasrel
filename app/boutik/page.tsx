import type { Metadata } from "next";
import { listDirectoryShops, searchDirectory } from "@/lib/data";
import { Audience } from "@/components/Audience";
import { Marketplace, type MarketplaceHit, type MarketplaceShop } from "@/components/Marketplace";

// Le Marketplace public de PASRÈL.
//
// PASRÈL donnait à chaque marchand un lien à partager, mais ne l'exposait
// nulle part : celui qui n'est pas sur Facebook n'était découvert par personne.
// Cette page répond à la seule question qui compte pour un acheteur — « qui
// vend ça ? » — et renvoie vers la vitrine du vendeur.
//
// Elle est rendue à chaque requête : la recherche vient de l'URL, et un
// catalogue qui change doit se voir tout de suite.
//
// Elle ne fait plus que chercher les données. Tout ce qui porte du texte vit
// dans components/Marketplace.tsx, parce que la langue vit dans le navigateur
// et qu'un composant serveur ne sait pas en quelle langue on le lit.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace — PASRÈL",
  description:
    "Le marketplace haïtien : cherchez un produit ou un service, découvrez qui le propose, et écrivez-lui sur WhatsApp.",
};

export default async function MarketplacePage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = (searchParams?.q ?? "").trim();
  const [recherche, annuaire] = await Promise.all([
    searchDirectory(q),
    q ? Promise.resolve(null) : listDirectoryShops(),
  ]);

  // Les vues arrivent avec la migration 11. Tant qu'elle n'est pas passée, on
  // le dit franchement plutôt que d'afficher une page vide qui ressemble à une
  // panne — ou pire, à un Marketplace où personne ne vend.
  const prete = recherche.available && (annuaire?.available ?? true);

  return (
    <>
      <Marketplace
        q={q}
        prete={prete}
        hits={recherche.hits as unknown as MarketplaceHit[]}
        shops={(annuaire?.shops ?? []) as unknown as MarketplaceShop[]}
      />

      {/* Une visite, ou une recherche quand un terme est tapé. C'est ce qui
          permet de savoir si le Marketplace est trouvé, et ce que les gens y
          cherchent sans le trouver. */}
      <Audience kind={q ? "search" : "visit"} path="/boutik" term={q || undefined} />
    </>
  );
}

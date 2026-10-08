import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Storefront } from "@/components/Storefront";
import { getStorefront } from "@/lib/data";
import { loadPlatformSettings } from "@/lib/platform-store";
import { isLayoutKey, resolveLayout } from "@/lib/storefront-layouts";
import { DocTitle } from "@/components/DocTitle";
import { titreVitrine } from "@/lib/i18n/titres";

// Vitrine publique partageable : pasrel.ht/b/<slug>
// Page d'atterrissage des pubs TikTok / Instagram / Facebook.
export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { apercu?: string };
}) {
  const data = await getStorefront(params.slug);
  if (!data) notFound();

  // `?apercu=design2` montre une disposition sans l'enregistrer : le marchand
  // compare avant de choisir, le super-admin voit chaque disposition sur de
  // vrais produits. Rien n'est écrit, la vitrine publique reste inchangée.
  const preview = isLayoutKey(searchParams.apercu) ? searchParams.apercu : null;
  const { designs } = await loadPlatformSettings();
  const layout = preview ?? resolveLayout(data.business.layout, data.business.plan, designs);

  return (
    <>
      {/* Le nom du commerce ne se traduit pas ; la promesse qui le suit, si. */}
      <DocTitle titres={titreVitrine(data.business.name)} />
      {/* `mesurer` dit si l'ouverture compte dans l'audience du marchand.
          Le cookie de rôle n'est pas une preuve d'identité — il ne sert à
          rien d'autre ici qu'à ne pas compter quelqu'un de connecté, et
          c'est exactement ce qu'on veut : un marchand qui regarde sa propre
          vitrine ne doit pas être le premier visiteur qu'il voit. */}
      <Storefront
        business={data.business}
        products={data.products}
        layout={layout}
        preview={!!preview}
        mesurer={!cookies().get("pasrel_role")}
      />
    </>
  );
}

// SEO / partage social (Open Graph) — pour que le lien soit joli dans les pubs.
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const data = await getStorefront(params.slug);
  if (!data) return { title: "Boutique introuvable · PASRÈL" };
  const { business } = data;
  // Le titre et la description apparaissent dans l'aperçu du lien partagé sur
  // WhatsApp : on n'y met que des informations réelles du marchand.
  const where = [business.category, business.address].filter(Boolean).join(" · ");
  const description = where
    ? `${where}. Commandez sur WhatsApp · Kòmande sou WhatsApp.`
    : "Commandez sur WhatsApp · Kòmande sou WhatsApp.";
  return {
    title: `${business.name} · Commander sur WhatsApp`,
    description,
    openGraph: {
      title: business.name,
      description,
      type: "website",
    },
  };
}

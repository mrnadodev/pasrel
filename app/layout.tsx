import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";
import { AuthNotice } from "@/components/AuthNotice";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageContext";

/**
 * L'adresse publique du site.
 *
 * Le repli doit être une adresse que nous possédons : elle part dans les
 * liens de vitrine que les marchands envoient à leurs clients.
 *
 * La valeur est nettoyée et vérifiée avant d'être rendue. Elle était reprise
 * telle quelle, et `new URL()` plus bas levait sur une saisie malformée : une
 * variable d'environnement avec un guillemet de trop a suffi à faire échouer
 * la construction entière du site, sur une page sans rapport. Une adresse mal
 * saisie fait désormais retomber sur le repli, ce qui est visible et
 * réparable, au lieu d'arrêter tout.
 */
function adressePublique(): string {
  const REPLI = "https://pasrel.app";
  const brut = (process.env.NEXT_PUBLIC_SITE_URL ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
  if (!brut) return REPLI;
  try {
    new URL(brut);
    return brut;
  } catch {
    return REPLI;
  }
}

const siteUrl = adressePublique();

export const metadata: Metadata = {
  // Les vignettes de lien sont des URL absolues : sans cette base, elles
  // pointeraient sur localhost une fois déployées.
  metadataBase: new URL(siteUrl),
  title: "PASRÈL — Gestion des Ventes & Clients WhatsApp",
  description:
    "Plateforme de gestion de ventes WhatsApp. Gérez vos clients, commandes et catalogue en un seul endroit.",
  manifest: "/manifest.webmanifest",
  applicationName: "PASRÈL",
  // Le titre et la description qui accompagnent l'image d'aperçu. L'image
  // elle-même vient de app/opengraph-image.tsx, que Next déclare tout seul.
  openGraph: {
    type: "website",
    siteName: "PASRÈL",
    locale: "fr_HT",
    title: "PASRÈL — Vendez sur WhatsApp, sans perdre une seule commande",
    description:
      "Une vitrine en ligne que vous partagez d'un lien, et chaque commande suivie du premier message jusqu'au paiement encaissé.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "PASRÈL — Vendez sur WhatsApp, sans perdre une seule commande",
    description:
      "Une vitrine en ligne que vous partagez d'un lien, et chaque commande suivie du premier message jusqu'au paiement encaissé.",
  },
  icons: {
    icon: [{ url: "/pasrel-icon-192.png", sizes: "192x192" }],
    apple: [{ url: "/pasrel-apple.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PASRÈL",
  },
};

export const viewport: Viewport = {
  themeColor: "#008069",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // gère l'encoche iPhone (safe-area)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans text-ink">
        <LanguageProvider>
          <ThemeProvider>
            <div className="app-shell">{children}</div>
            <AuthNotice />
            <PWARegister />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

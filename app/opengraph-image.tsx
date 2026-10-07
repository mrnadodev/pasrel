import { ImageResponse } from "next/og";
import { LOGO_BLANC_DATA_URI } from "./logo-og";

/**
 * L'image que WhatsApp, Facebook, Messenger et les SMS d'iPhone affichent
 * quand quelqu'un colle un lien vers PASRÈL.
 *
 * Le site n'en déclarait aucune : le lien apparaissait nu, une ligne de texte
 * bleue sans titre ni image. Or coller le lien dans une conversation est le
 * geste sur lequel repose toute la diffusion du produit — un lien nu se clique
 * beaucoup moins qu'un lien illustré.
 *
 * Elle est rendue à la demande plutôt que stockée en image : un fichier dans
 * `public/` se désynchronise du jour où l'accroche change, et plus personne ne
 * s'en souvient. Ici le texte vit dans le code, à côté du reste.
 *
 * Dessinée pour être vue PETITE — une vignette de quelques centimètres sous un
 * message. D'où trois éléments seulement, en très gros. Tout ce qui est fin
 * disparaîtrait.
 */
/**
 * Rendue à la demande, jamais pré-générée.
 *
 * `@vercel/og` résout ses polices et son moteur par un chemin de fichier, et
 * cette résolution échoue sous Windows : `next build` s'arrêtait sur
 * « Invalid URL » en essayant de pré-générer l'image. La production tourne sous
 * Linux et n'a pas ce défaut, mais une construction locale cassée est un
 * problème pour qui développe ici.
 *
 * L'image n'est demandée que par les robots d'aperçu, quelques fois par lien
 * partagé, et Vercel met le résultat en cache. La rendre à la demande ne coûte
 * donc rien et rend sa construction possible partout.
 */
export const dynamic = "force-dynamic";

export const alt = "PASRÈL — Vendez sur WhatsApp, sans perdre une seule commande.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          padding: 56,
          backgroundImage: "linear-gradient(140deg, #04392F 0%, #086647 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_BLANC_DATA_URI} alt="" width={128} height={128} style={{ objectFit: "contain" }} />
          <div style={{ display: "flex", fontSize: 104, fontWeight: 800, letterSpacing: -4, color: "#FFFFFF" }}>
            <span>PASR</span>
            <span style={{ color: "#25D366" }}>È</span>
            <span>L</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: 960,
            textAlign: "center",
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#FFFFFF",
          }}
        >
          <span>Vendez sur WhatsApp, sans perdre&nbsp;</span>
          <span style={{ color: "#25D366" }}>une seule commande.</span>
        </div>

        <div style={{ display: "flex", fontSize: 30, color: "#CFF5E7" }}>
          Gratuit pour commencer · En ligne en 5 minutes
        </div>
      </div>
    ),
    size,
  );
}

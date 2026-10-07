"use client";

import { useLanguage } from "@/components/LanguageContext";

/**
 * Avertissement d'achat, à l'entrée du Marketplace.
 *
 * Il est ici et nulle part ailleurs — surtout pas sur la vitrine d'un
 * marchand, où « méfiez-vous » se lirait comme un soupçon jeté sur lui. Sur le
 * Marketplace, terrain neutre où l'on découvre quelqu'un qu'on ne connaît pas,
 * c'est un conseil.
 *
 * Le texte ne dit jamais « boutique ». Onze secteurs sont sur la plateforme :
 * celui qui vend peut être un restaurant, un atelier, une coiffeuse ou un
 * indépendant, et chacun doit se reconnaître dans la phrase. « Quelqu'un »
 * couvre tout le monde, et « la marchandise ou le service » couvre ce qu'on
 * reçoit en échange.
 *
 * Composant client, parce que la langue vit dans le navigateur : la page du
 * Marketplace est rendue par le serveur et ne sait pas, elle, en quelle langue
 * on la lit.
 */
const TEXTE = {
  fr: {
    titre: "Première commande chez quelqu'un que vous ne connaissez pas ?",
    corps:
      "Payez à la livraison, quand la marchandise ou le service est entre vos mains. N'envoyez pas d'argent d'avance à quelqu'un avec qui vous n'avez jamais traité.",
  },
  ht: {
    titre: "Premye fwa w ap achte kay yon moun ou pa konnen ?",
    corps:
      "Peye lè machandiz la oswa sèvis la rive nan men w. Pa voye lajan davans bay yon moun ou poko janm fè biznis avè l.",
  },
  en: {
    titre: "First order from someone you don't know?",
    corps:
      "Pay on delivery, once the goods or the service are in your hands. Do not send money in advance to someone you have never dealt with.",
  },
} as const;

export function MarketplaceNotice() {
  const { language } = useLanguage();
  const t = TEXTE[language] ?? TEXTE.fr;

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 pt-6">
      <div className="flex items-start gap-3 rounded-2xl bg-[#FFF6EC] px-4 py-3.5">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8A4607"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        >
          <path d="M12 3.5 2.5 20h19L12 3.5z" />
          <path d="M12 10v4" />
          <path d="M12 17.2v.3" />
        </svg>
        <p className="text-[13px] leading-relaxed text-[#6B4420]">
          <strong className="font-extrabold text-[#8A4607]">{t.titre}</strong> {t.corps}
        </p>
      </div>
    </div>
  );
}

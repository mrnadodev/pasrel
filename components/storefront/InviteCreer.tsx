"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

/**
 * L'invitation posée au bas de chaque vitrine.
 *
 * Une vitrine est vue par des dizaines de personnes qui vendent elles-mêmes
 * quelque chose — c'est Haïti, presque tout le monde vend. Chacune de ces
 * pages est donc une porte d'entrée, et jusqu'ici elle ne s'ouvrait pas.
 *
 * Deux précautions. Elle est tout en bas, après les produits : la page
 * appartient au marchand, et on ne lui prend pas l'attention qu'il a gagnée.
 * Et elle ne dit pas « boutique » — celui qui la lit peut tenir un restaurant,
 * un atelier ou vendre son temps.
 */
export const TEXTE_INVITE = {
  fr: {
    question: "Vous vendez aussi ?",
    corps: "Créez votre vitrine sur PASRÈL et recevez vos commandes sur WhatsApp, sans en perdre une seule.",
    bouton: "Créer ma vitrine gratuitement",
  },
  ht: {
    question: "Ou menm tou w ap vann ?",
    corps: "Kreye vitrin pa w sou PASRÈL epi resevwa kòmand ou yo sou WhatsApp, san ou pa pèdi yon sèl.",
    bouton: "Kreye vitrin mwen gratis",
  },
  en: {
    question: "Do you sell too?",
    corps: "Create your own storefront on PASRÈL and take your orders on WhatsApp, without losing a single one.",
    bouton: "Create my storefront free",
  },
} as const;

export function InviteCreer({ dark }: { dark?: boolean }) {
  const { language } = useLanguage();
  const t = TEXTE_INVITE[language] ?? TEXTE_INVITE.fr;

  return (
    <div className="px-4 pb-10 pt-2">
      <div
        className="mx-auto flex max-w-[520px] flex-col items-center gap-3 rounded-2xl border px-5 py-6 text-center"
        style={
          dark
            ? { background: "#0F2A22", borderColor: "#1C4E3F" }
            : { background: "#F2F6F4", borderColor: "#E6ECEA" }
        }
      >
        <span className={`text-[15px] font-extrabold ${dark ? "text-white" : "text-ink"}`}>{t.question}</span>
        <span className={`text-[13px] leading-relaxed ${dark ? "text-[#A9C4BC]" : "text-ink-muted"}`}>{t.corps}</span>
        <Link
          href="/"
          className="mt-1 flex h-11 items-center justify-center rounded-xl bg-brand-green px-5 text-[13.5px] font-extrabold text-white active:scale-95"
        >
          {t.bouton}
        </Link>
      </div>
    </div>
  );
}

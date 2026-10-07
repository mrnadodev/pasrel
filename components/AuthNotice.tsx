"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

const TEXTE = {
  fr: {
    expire: "Ce lien n'est plus valable : il a déjà servi, ou il a dépassé l'heure. Demandez-en un nouveau.",
    autre: "Ce lien n'a pas pu être utilisé. Demandez-en un nouveau depuis la page de connexion.",
    bouton: "Demander un nouveau lien",
    fermer: "Fermer",
  },
  ht: {
    expire: "Lyen sa a pa valab ankò : li deja sèvi, oswa li depase inè a. Mande yon lòt.",
    autre: "Nou pa t ka itilize lyen sa a. Mande yon lòt sou paj koneksyon an.",
    bouton: "Mande yon nouvo lyen",
    fermer: "Fèmen",
  },
  en: {
    expire: "This link is no longer valid: it has already been used, or it is more than an hour old. Request a new one.",
    autre: "This link could not be used. Request a new one from the sign-in page.",
    bouton: "Request a new link",
    fermer: "Close",
  },
} as const;

/**
 * Dit à voix haute ce qu'un lien d'authentification raté laissait silencieux.
 *
 * Quand un lien de réinitialisation a déjà servi ou dépassé son heure, Supabase
 * ne renvoie pas sur la page visée : il retombe sur l'adresse du site, avec la
 * raison dans le fragment de l'URL. Le marchand atterrissait donc sur la page
 * d'accueil publique, sans un mot, en se demandant si son compte existait
 * encore. Un lien expiré n'est pas une panne — c'est normal, ils durent une
 * heure — mais le silence, lui, en est une.
 *
 * Monté dans la disposition racine, donc partout. Les deux pages qui lisent
 * elles-mêmes le fragment disent déjà ce qu'il faut : on les laisse parler.
 */
export function AuthNotice() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const t = TEXTE[language] ?? TEXTE.fr;
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/nouvo-modpas" || pathname === "/konfime") return;

    const brut = window.location.hash.replace(/^#/, "");
    if (!brut.includes("error")) return;

    const p = new URLSearchParams(brut);
    const code = p.get("error_code") ?? "";
    setMessage(/expired|otp/i.test(code) ? t.expire : t.autre);

    // Le fragment est consommé : un rechargement ne doit pas rejouer le message.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [pathname, t]);

  if (!message) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-4">
      <div className="flex w-full max-w-[520px] flex-col gap-3 rounded-2xl bg-[#FCE4E4] px-5 py-4 shadow-lg">
        <p className="text-[13.5px] font-medium leading-relaxed text-[#C0392B]">{message}</p>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="flex h-10 items-center justify-center rounded-xl bg-[#C0392B] px-4 text-[13px] font-bold text-white"
          >
            {t.bouton}
          </Link>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="h-10 px-3 text-[13px] font-semibold text-[#8A2A20]"
          >
            {t.fermer}
          </button>
        </div>
      </div>
    </div>
  );
}

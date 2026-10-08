"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";

/**
 * Un champ de mot de passe avec l'œil qui montre ce qu'on tape.
 *
 * Il existait déjà sur la page de connexion, écrit à la main, et nulle part
 * ailleurs. C'est précisément là qu'il manquait le plus : à la connexion on
 * retape un mot de passe qu'on connaît, tandis qu'en réinitialisation et à
 * l'inscription on en invente un, à l'aveugle, sur un clavier de téléphone qui
 * corrige tout seul — puis on le confirme, toujours à l'aveugle. Une faute de
 * frappe silencieuse, et le compte se referme sur son propriétaire. C'est la
 * panne contre laquelle nous nous battons depuis ce matin, par une autre porte.
 *
 * Deux précautions tiennent ce composant :
 *
 * · le bouton est `type="button"`. Sans cela il soumettrait le formulaire,
 *   et regarder son mot de passe l'enverrait ;
 * · il est caché aux lecteurs d'écran (`aria-hidden`) sauf par son libellé,
 *   et ce libellé dit l'action, pas l'état.
 *
 * L'état n'est jamais partagé entre deux champs : montrer le mot de passe ne
 * doit pas révéler sa confirmation, sinon l'un recopie l'autre sans qu'on s'en
 * aperçoive.
 */
export const TEXTE_MODPAS = {
  fr: { show: "Afficher le mot de passe", hide: "Masquer le mot de passe" },
  ht: { show: "Montre modpas la", hide: "Maske modpas la" },
  en: { show: "Show password", hide: "Hide password" },
} as const;

export interface ChampModpasProps {
  value?: string;
  onChange?: (v: string) => void;
  /** Pour les formulaires qui passent par FormData plutôt que par l'état. */
  name?: string;
  required?: boolean;
  autoComplete?: "current-password" | "new-password";
  placeholder?: string;
  className?: string;
  id?: string;
}

export function ChampModpas({
  value,
  onChange,
  name,
  required,
  autoComplete = "new-password",
  placeholder = "••••••••",
  className = "h-12 w-full rounded-xl border border-line bg-[#F7F8F9] pl-4 pr-11 text-[15px] outline-none focus:border-brand focus:bg-white",
  id,
}: ChampModpasProps) {
  const { language } = useLanguage();
  const t = TEXTE_MODPAS[language] ?? TEXTE_MODPAS.fr;
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative flex items-center">
      <input
        id={id}
        type={visible ? "text" : "password"}
        name={name}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={className}
        {...(onChange ? { value: value ?? "", onChange: (e) => onChange(e.target.value) } : {})}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 cursor-pointer p-1 text-ink-muted hover:text-ink"
        aria-label={visible ? t.hide : t.show}
        title={visible ? t.hide : t.show}
      >
        {visible ? <OeilBarre /> : <Oeil />}
      </button>
    </div>
  );
}

function Oeil() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function OeilBarre() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

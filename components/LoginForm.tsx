"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { landingCopy } from "@/lib/i18n/landing";
import { requestPasswordReset } from "@/app/login/actions";
import { ChampModpas } from "@/components/ChampModpas";

const RESET_TEXT = {
  fr: {
    title: "Mot de passe oublié",
    intro: "Entrez votre adresse e-mail. Si un compte existe, vous recevrez un lien pour choisir un nouveau mot de passe.",
    sentTitle: "Lien envoyé",
    sentBody: "Si un compte est associé à cette adresse, le lien vient d'y être envoyé. Pensez à regarder dans les indésirables.",
    cancel: "Annuler",
    send: "Envoyer le lien",
    sending: "Envoi…",
    close: "Fermer",
  },
  ht: {
    title: "Modpas bliye",
    intro: "Antre adrès imèl ou. Si yon kont egziste, w ap resevwa yon lyen pou chwazi yon nouvo modpas.",
    sentTitle: "Lyen voye",
    sentBody: "Si yon kont mare ak adrès sa a, lyen an fèk pati. Tcheke nan spam ou tou.",
    cancel: "Anile",
    send: "Voye lyen an",
    sending: "N ap voye…",
    close: "Fèmen",
  },
  en: {
    title: "Forgot password",
    intro: "Enter your email address. If an account exists, you will receive a link to choose a new password.",
    sentTitle: "Link sent",
    sentBody: "If an account matches this address, the link has just been sent. Remember to check your spam folder.",
    cancel: "Cancel",
    send: "Send the link",
    sending: "Sending…",
    close: "Close",
  },
} as const;

export function LoginForm({
  signInAction,
  error,
}: {
  signInAction: (formData: FormData) => Promise<void>;
  error?: string;
}) {
  const { language } = useLanguage();
  const a = landingCopy(language).auth;
  const r = RESET_TEXT[language] ?? RESET_TEXT.fr;

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function sendReset() {
    setResetError(null);
    start(async () => {
      const res = await requestPasswordReset(resetEmail, language);
      if (res.ok) setResetSent(true);
      else setResetError(res.error ?? null);
    });
  }

  function closeModal() {
    setShowForgotModal(false);
    setResetSent(false);
    setResetError(null);
  }

  return (
    <>
      <h1 className="text-xl font-extrabold">{a.signInTitle}</h1>
      <p className="mt-1 text-sm text-ink-muted">{a.signInSubtitle}</p>

      {error && (
        <div className="mt-4 rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] font-medium text-[#C0392B]">{error}</div>
      )}

      <form action={signInAction} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-soft">{a.email}</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="vous@exemple.com"
            className="h-12 rounded-xl border border-line bg-[#F7F8F9] px-4 text-[15px] outline-none focus:border-brand focus:bg-white"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="modpas-connexion" className="text-[13px] font-semibold text-ink-soft">{a.password}</label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="cursor-pointer text-xs font-semibold text-brand hover:underline"
            >
              {a.forgot}
            </button>
          </div>
          <ChampModpas id="modpas-connexion" name="password" required autoComplete="current-password" />
        </div>

        <button
          type="submit"
          className="mt-2 flex h-[52px] cursor-pointer items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99]"
        >
          {a.signInCta}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        {a.noAccount} <a href="/enskri" className="font-bold text-brand">{a.createOne}</a>
      </p>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-base font-extrabold text-ink">{r.title}</span>
              <button onClick={closeModal} className="cursor-pointer font-bold text-gray-400 hover:text-gray-600" aria-label={r.close}>✕</button>
            </div>

            {resetSent ? (
              <div className="flex flex-col gap-3 py-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl font-black text-emerald-600">✓</div>
                <span className="text-sm font-extrabold text-emerald-950">{r.sentTitle}</span>
                <p className="text-xs leading-relaxed text-ink-muted">{r.sentBody}</p>
                <button onClick={closeModal} className="mt-2 h-10 cursor-pointer rounded-xl bg-brand text-xs font-black text-white">
                  {r.close}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs leading-relaxed text-ink-muted">{r.intro}</p>
                {resetError && <div className="rounded-xl bg-[#FCE4E4] px-3 py-2 text-xs text-[#C0392B]">{resetError}</div>}
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  className="h-11 rounded-xl border border-line bg-[#F7F8F9] px-3.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="h-10 flex-1 cursor-pointer rounded-xl border border-line text-xs font-bold text-ink-muted">
                    {r.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={sendReset}
                    disabled={pending || !resetEmail}
                    className="h-10 flex-1 cursor-pointer rounded-xl bg-brand-green text-xs font-black text-white shadow-2xs disabled:opacity-60"
                  >
                    {pending ? r.sending : r.send}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

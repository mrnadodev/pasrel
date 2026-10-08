"use client";

import Link from "next/link";
import Image from "next/image";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { APROPO_COPY, DEMANDES } from "@/lib/i18n/apropo";
import { landingCopy } from "@/lib/i18n/landing";

/**
 * La page d'histoire.
 *
 * Elle n'est pas faite comme les conditions d'utilisation. Celles-ci se
 * consultent ; celle-ci se lit d'un bout à l'autre, une fois. D'où un texte
 * large, peu de paragraphes par écran, et une seule image tenue du début à la
 * fin : les deux rives et ce qu'il y a entre elles.
 *
 * Deux choix méritent d'être dits :
 *
 * · Les trois demandes de clients sont rendues en vraies bulles de
 *   conversation, aux couleurs du produit (`chat-out`). Les écrire en prose
 *   aurait été plus simple, et aurait perdu ce qu'elles sont : des messages.
 *
 * · « Entre les deux, rien » est suivi de vide. Le blanc y est le propos,
 *   pas un oubli de mise en page.
 */
export function Apropo() {
  const t = useDict(APROPO_COPY);
  const { language } = useLanguage();
  const a = landingCopy(language);

  return (
    <main className="min-h-[100dvh] bg-white pb-20">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="app-page flex items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="text-[15px] font-extrabold text-ink">
            PASRÈL
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[12.5px] font-bold text-ink-muted underline-offset-2 hover:underline">
              {t.retour}
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* L'ouverture : l'arche, et la version courte. C'est tout ce que
          beaucoup liront, et cela doit suffire. */}
      <section className="bg-[#06231C] px-5 py-14 text-center sm:py-20">
        <div className="app-page flex flex-col items-center gap-7">
          <Image
            src="/pasrel-white-cadree.png"
            alt="PASRÈL"
            width={279}
            height={119}
            className="h-auto w-[172px] sm:w-[210px]"
            priority
          />
          <h1 className="text-[13px] font-bold uppercase tracking-[0.3em] text-[#25D366]">{t.titre}</h1>
          <p className="max-w-[34ch] text-[19px] font-semibold leading-[1.5] text-white sm:text-[23px] sm:leading-[1.46]">
            {t.court}
          </p>
        </div>
      </section>

      <article className="app-page px-5">
        {t.blocs.map((bloc, i) => (
          <section key={bloc.titre} className={i === 0 ? "pt-12" : "pt-14"}>
            <h2 className="text-[20px] font-extrabold leading-snug text-ink sm:text-[23px]">{bloc.titre}</h2>

            <div className="mt-3 flex max-w-[58ch] flex-col gap-3">
              {bloc.corps.map((p, k) => (
                <p key={k} className="text-[15.5px] leading-[1.75] text-ink-soft">
                  {p}
                </p>
              ))}
            </div>

            {/* Les demandes réelles. Elles ne se traduisent dans aucune
                version : les traduire reviendrait à les inventer. */}
            {bloc.bulles && (
              <div className="mt-5 flex max-w-[30rem] flex-col gap-2">
                {DEMANDES.map((d) => (
                  <span
                    key={d}
                    className="w-fit max-w-[88%] rounded-2xl rounded-bl-md bg-chat-out px-4 py-2.5 text-[14.5px] font-semibold text-ink shadow-[0_1px_2px_rgba(17,27,33,0.08)]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}

            {bloc.liste && (
              <ul className="mt-4 flex max-w-[58ch] flex-col gap-2.5">
                {bloc.liste.map((l) => (
                  <li key={l} className="flex items-baseline gap-3 text-[15.5px] leading-[1.6] text-ink-soft">
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {l}
                  </li>
                ))}
                {bloc.fort && (
                  <li className="flex items-baseline gap-3 text-[15.5px] font-bold leading-[1.6] text-ink">
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#B25E09]" />
                    {bloc.fort}
                  </li>
                )}
              </ul>
            )}

            {/* Après « entre les deux, rien », le vide est le propos. */}
            {!bloc.bulles && !bloc.liste && i === 2 && <div className="h-16 sm:h-24" aria-hidden="true" />}
          </section>
        ))}

        {/* Le nom, en dernier, parce que c'est la réponse et non la question. */}
        <section className="mt-16 rounded-3xl bg-[#F2F6F4] px-6 py-9 sm:px-9 sm:py-11">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.22em] text-brand">{t.nomTitre}</h2>
          <p className="mt-4 max-w-[46ch] text-[18px] font-semibold leading-[1.55] text-ink sm:text-[21px]">
            {t.nomCorps}
          </p>
        </section>

        <section className="mt-12 flex flex-col items-start gap-5">
          <p className="max-w-[34ch] text-[19px] font-extrabold leading-snug text-ink sm:text-[22px]">{t.ctaTitre}</p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/enskri"
              className="flex h-[52px] items-center justify-center rounded-2xl bg-brand-green px-7 text-[15px] font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.35)] active:scale-[0.99]"
            >
              {t.ctaBouton}
            </Link>
            <Link
              href="/boutik"
              className="flex h-[52px] items-center justify-center rounded-2xl border border-line px-7 text-[15px] font-bold text-ink"
            >
              {t.ctaSecondaire}
            </Link>
          </div>
          <p className="text-[13px] text-ink-muted">{a.footer.slogan}</p>
        </section>
      </article>
    </main>
  );
}

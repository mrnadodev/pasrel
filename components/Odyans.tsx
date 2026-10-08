"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { ODYANS_COPY } from "@/lib/i18n/odyans";
import { enCours, serie, sommet, variation, type Grain, type Ouverture, type Point } from "@/lib/audience";

/** Combien de points on montre, selon le pas. */
const COMBIEN: Record<Grain, number> = { jour: 14, semaine: 12, mois: 12 };

/**
 * L'audience de la vitrine, vue par le marchand.
 *
 * Deux décisions tiennent cet écran :
 *
 * · Les deux portes sont toujours séparées — Marketplace et lien partagé. Un
 *   total seul ne dit pas quoi faire ; savoir que le lien partagé fait
 *   quatre-vingts pour cent des ouvertures dit où mettre son énergie.
 *
 * · Rien n'est inventé quand il n'y a rien. Pas de courbe de démonstration,
 *   pas de pourcentage tiré d'un zéro. Une vitrine sans visite affiche
 *   qu'elle n'en a pas, et dit quoi faire ensuite.
 */
export function Odyans({
  ouvertures,
  disponible,
  slug,
}: {
  ouvertures: Ouverture[];
  disponible: boolean;
  slug: string | null;
}) {
  const t = useDict(ODYANS_COPY);
  const { language } = useLanguage();
  const [grain, setGrain] = useState<Grain>("jour");

  const points = useMemo(() => serie(ouvertures, grain, COMBIEN[grain]), [ouvertures, grain]);
  const tete = enCours(points);
  const vari = variation(points);
  const haut = sommet(points);
  const vide = ouvertures.length === 0;

  return (
    <main className="min-h-[100dvh] bg-[#F7F8F9] pb-20">
      <header className="border-b border-line bg-white">
        <div className="app-page flex items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="text-[13px] font-bold text-ink-muted underline-offset-2 hover:underline">
            ← {t.retour}
          </Link>
          {slug && (
            <Link
              href={`/b/${slug}`}
              className="text-[12.5px] font-bold text-brand underline-offset-2 hover:underline"
            >
              {t.partager}
            </Link>
          )}
        </div>
      </header>

      <div className="app-page px-5 pt-7">
        <h1 className="text-[24px] font-extrabold leading-tight text-ink">{t.titre}</h1>
        <p className="mt-1.5 max-w-[52ch] text-[14px] leading-relaxed text-ink-muted">{t.sous}</p>

        {!disponible ? (
          <Avis titre={t.pasPretTitre} corps={t.pasPretCorps} />
        ) : vide ? (
          <Avis titre={t.videTitre} corps={t.videCorps} />
        ) : (
          <>
            {/* Le pas de la série. */}
            <div className="mt-6 flex gap-2" role="group" aria-label={t.titre}>
              {(["jour", "semaine", "mois"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrain(g)}
                  aria-pressed={grain === g}
                  className={`h-9 cursor-pointer rounded-full px-4 text-[13px] font-bold transition-colors ${
                    grain === g ? "bg-brand text-white" : "border border-line bg-white text-ink-soft hover:border-brand"
                  }`}
                >
                  {t.grains[g]}
                </button>
              ))}
            </div>

            {/* Le chiffre de tête, et d'où il vient. */}
            <section className="mt-5 rounded-2xl border border-line bg-white p-5">
              <span className="text-[12.5px] font-bold uppercase tracking-wide text-ink-faint">{t.enCours[grain]}</span>
              <div className="mt-1.5 flex items-baseline gap-3">
                <span className="text-[38px] font-extrabold leading-none tracking-tight text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {tete.total}
                </span>
                <span className="text-[13.5px] text-ink-muted">{t.ouvertures(tete.total)}</span>
              </div>
              {vari !== null && (
                <p className={`mt-2 text-[13px] font-semibold ${vari > 0 ? "text-brand" : vari < 0 ? "text-[#B25E09]" : "text-ink-muted"}`}>
                  {vari > 0 ? t.hausse(vari) : vari < 0 ? t.baisse(vari) : t.stable}
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Porte libelle={t.marketplace} n={tete.marketplace} total={tete.total} couleur="#008069" />
                <Porte libelle={t.lien} n={tete.lien} total={tete.total} couleur="#25D366" />
              </div>
            </section>

            <Barres points={points} haut={haut} grain={grain} langue={language} />
          </>
        )}

        {/* Ce qui est compté, et ce qui ne l'est pas. Toujours affiché : un
            chiffre qu'on ne sait pas lire vaut moins que pas de chiffre. */}
        <section className="mt-7 rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[14px] font-extrabold text-ink">{t.commentTitre}</h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {t.comment.map((l) => (
              <li key={l} className="flex items-baseline gap-2.5 text-[13.5px] leading-[1.6] text-ink-soft">
                <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {l}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Avis({ titre, corps }: { titre: string; corps: string }) {
  return (
    <section className="mt-6 rounded-2xl border border-line bg-white p-6">
      <h2 className="text-[16px] font-extrabold text-ink">{titre}</h2>
      <p className="mt-2 max-w-[54ch] text-[14px] leading-relaxed text-ink-soft">{corps}</p>
    </section>
  );
}

function Porte({ libelle, n, total, couleur }: { libelle: string; n: number; total: number; couleur: string }) {
  const part = total > 0 ? Math.round((n / total) * 100) : 0;
  return (
    <div className="rounded-xl bg-[#F7F8F9] p-3.5">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: couleur }} />
        <span className="text-[12px] font-semibold leading-tight text-ink-muted">{libelle}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[22px] font-extrabold text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>{n}</span>
        {total > 0 && <span className="text-[12.5px] text-ink-faint">{part} %</span>}
      </div>
    </div>
  );
}

/**
 * Les barres. Empilées, parce que les deux portes forment un total qui a du
 * sens — ce que ne feraient pas deux séries côte à côte.
 */
function Barres({ points, haut, grain, langue }: { points: Point[]; haut: number; grain: Grain; langue: string }) {
  const fmt = new Intl.DateTimeFormat(langue === "en" ? "en-US" : "fr-HT",
    grain === "mois" ? { month: "short" } : { day: "2-digit", month: "2-digit" });

  return (
    <section className="mt-4 rounded-2xl border border-line bg-white p-5">
      <div className="flex h-[160px] items-end gap-1.5">
        {points.map((p) => {
          // Une ouverture doit se voir : on lui garde deux pixels même quand
          // le sommet de la série est très haut.
          const h = haut > 0 ? Math.max(p.total > 0 ? 3 : 0, Math.round((p.total / haut) * 100)) : 0;
          const partM = p.total > 0 ? (p.marketplace / p.total) * 100 : 0;
          return (
            <div key={p.cle} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full overflow-hidden rounded-t-[4px] bg-[#25D366]"
                  style={{ height: `${h}%` }}
                  title={`${p.cle} · ${p.total}`}
                >
                  <div style={{ height: `${partM}%`, background: "#008069" }} />
                </div>
              </div>
              <span className="w-full truncate text-center text-[9.5px] leading-none text-ink-faint">
                {fmt.format(p.debut)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

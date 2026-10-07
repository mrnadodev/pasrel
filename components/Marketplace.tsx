"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { BackToTop } from "@/components/BackToTop";
import { ShopLink } from "@/components/ShopLink";
import { MarketplaceNotice } from "@/components/MarketplaceNotice";
import { useLanguage } from "@/components/LanguageContext";
import { marketplaceCopy, type MarketplaceCopy } from "@/lib/i18n/marketplace";

/**
 * Le rendu du Marketplace.
 *
 * La page qui l'enveloppe reste un composant serveur : c'est elle qui va
 * chercher les données, et c'est bien. Mais la langue vit dans le navigateur —
 * le serveur ne sait pas en quelle langue on le lit. Tout ce qui porte du
 * texte descend donc ici, où la langue est connue.
 *
 * Aucun texte ne dit « boutique ». Celui qui vend peut être un restaurant, un
 * atelier ou un indépendant : la page qui les présente ne doit en exclure
 * aucun.
 */

export interface MarketplaceHit {
  productId: string;
  productName: string;
  category: string | null;
  priceCents: number;
  photoUrl: string | null;
  businessId: string;
  businessName: string;
  businessSlug: string;
  businessAddress: string | null;
}

export interface MarketplaceShop {
  id: string;
  name: string;
  slug: string;
  businessType: string | null;
  address: string | null;
  logoUrl: string | null;
  productCount: number;
}

export function Marketplace({
  q,
  prete,
  hits,
  shops,
}: {
  q: string;
  /** Faux tant que la migration 11 n'a pas créé les vues publiques. */
  prete: boolean;
  hits: MarketplaceHit[];
  shops: MarketplaceShop[];
}) {
  const { language } = useLanguage();
  const c = marketplaceCopy(language);

  return (
    <main className="min-h-[100dvh] bg-[#F0F2F3]">
      <header className="bg-brand px-5 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-[900px]">
          <Link href="/" className="text-[12.5px] font-bold text-[#B9F5E4] hover:text-white">
            PASRÈL
          </Link>
          <h1 className="pt-2 text-[26px] font-extrabold leading-tight tracking-tight text-white sm:text-[32px]">
            {c.titre}
          </h1>
          <p className="max-w-[520px] pt-2 text-[14px] leading-relaxed text-[#C4E8DD]">{c.sousTitre}</p>

          {/* Un formulaire GET, et non un champ piloté par du script : la
              recherche vit dans l'URL, donc elle se partage et se recharge. */}
          <form action="/boutik" method="get" className="flex gap-2 pt-5">
            <input
              name="q"
              defaultValue={q}
              placeholder={c.placeholder}
              aria-label={c.rechercheLabel}
              className="h-12 flex-1 rounded-xl border-0 px-4 text-[14px] text-ink outline-none"
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-white px-5 text-[14px] font-extrabold text-brand-dark active:scale-95"
            >
              {c.chercher}
            </button>
          </form>
        </div>
      </header>

      <MarketplaceNotice />

      <div className="mx-auto w-full max-w-[900px] px-5 py-6">
        {!prete ? (
          <p className="rounded-2xl border border-line bg-white p-6 text-center text-[13px] text-ink-muted">
            {c.pasPrete}
          </p>
        ) : q ? (
          <Resultats q={q} hits={hits} c={c} />
        ) : (
          <Vendeurs shops={shops} c={c} />
        )}
      </div>

      <BackToTop label={c.hautDePage} />
    </main>
  );
}

function Resultats({ q, hits, c }: { q: string; hits: MarketplaceHit[]; c: MarketplaceCopy }) {
  if (hits.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-[14px] font-bold text-ink">{c.rienTrouve(q)}</p>
        <p className="pt-1 text-[12.5px] text-ink-muted">{c.essayez}</p>
        <Link
          href="/boutik"
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-[13px] font-bold text-white"
        >
          {c.voirTout}
        </Link>
      </div>
    );
  }

  // Groupé par vendeur : un acheteur veut savoir chez qui aller, pas parcourir
  // une liste de produits dont il faudrait deviner l'origine.
  const parVendeur = new Map<string, MarketplaceHit[]>();
  for (const h of hits) {
    const liste = parVendeur.get(h.businessSlug) ?? [];
    liste.push(h);
    parVendeur.set(h.businessSlug, liste);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-[12.5px] font-semibold text-ink-muted">
        {c.resultats(hits.length, parVendeur.size)}
      </p>

      {[...parVendeur.entries()].map(([slug, produits]) => (
        <section key={slug} className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[14.5px] font-extrabold text-ink">{produits[0].businessName}</span>
              {produits[0].businessAddress && (
                <span className="truncate text-[11.5px] text-ink-muted">{produits[0].businessAddress}</span>
              )}
            </div>
            <ShopLink
              slug={slug}
              businessId={produits[0].businessId}
              className="h-9 shrink-0 rounded-xl bg-brand-green px-3.5 text-[12.5px] font-extrabold leading-9 text-white active:scale-95"
            >
              {c.voirVitrine}
            </ShopLink>
          </div>

          <ul className="divide-y divide-line/60">
            {produits.map((p) => (
              <li key={p.productId} className="flex items-center gap-3 px-4 py-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-slate-50">
                  {p.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13.5px] font-bold text-ink">{p.productName}</span>
                  {p.category && <span className="truncate text-[11.5px] text-ink-muted">{p.category}</span>}
                </span>
                <span className="shrink-0 text-[13.5px] font-extrabold text-brand">{formatMoney(p.priceCents)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Vendeurs({ shops, c }: { shops: MarketplaceShop[]; c: MarketplaceCopy }) {
  if (shops.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-white p-8 text-center text-[13px] text-ink-muted">
        {c.personne}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-[12.5px] font-semibold text-ink-muted">{c.compteVendeurs(shops.length)}</p>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {shops.map((b) => (
          <li key={b.id}>
            <ShopLink
              slug={b.slug}
              businessId={b.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 hover:border-ink-faint"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#E7F7F1] text-[15px] font-extrabold text-brand">
                {b.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  b.name.slice(0, 2).toUpperCase()
                )}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-extrabold text-ink">{b.name}</span>
                <span className="truncate text-[11.5px] text-ink-muted">
                  {[b.businessType, b.address].filter(Boolean).join(" · ") || c.typeDefaut}
                </span>
                <span className="text-[11px] font-semibold text-brand">{c.compteProduits(b.productCount)}</span>
              </span>
            </ShopLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

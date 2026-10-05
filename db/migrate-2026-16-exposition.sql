-- ============================================================
-- Migration 16 — réduire ce qu'un visiteur anonyme peut lire
--
-- À exécuter dans l'éditeur SQL Supabase, après migrate-2026-15-promo.sql.
-- À passer APRÈS le déploiement du code correspondant : l'application sait
-- déjà vivre sans ces colonnes, l'inverse n'est pas vrai.
--
-- Deux fuites mesurées sur la production avec la clé publique — celle que
-- n'importe quel visiteur lit dans le code source de la page :
--
--   1. `products.stock_qty` était lisible par tout le monde. La vitrine
--      n'affiche qu'un état (« disponible », « fini »), mais la quantité
--      exacte partait dans la réponse. Un concurrent pouvait relever le stock
--      chaque matin et en déduire le rythme de vente d'une boutique. Ce n'est
--      pas une donnée personnelle, c'est un secret commercial.
--
--   2. `public_businesses.previous_phone_e164` exposait l'ANCIEN numéro
--      personnel d'un marchand qui en a changé. L'application le masquait à
--      l'affichage — ce qui ne masque rien : le numéro entier était quand
--      même livré au navigateur et se lisait dans la réponse de l'API.
--      La vue ne rend plus que les quatre derniers chiffres, et le masquage
--      se fait donc là où il compte, avant de sortir de la base.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Stock : la quantité redevient une affaire interne
--
-- On ne peut pas retirer une colonne d'un droit posé sur la table entière :
-- il faut reprendre le droit, puis le redonner colonne par colonne.
-- `stock_threshold` part avec elle — c'est un réglage du marchand, pas une
-- information de vitrine.
--
-- `authenticated` n'est pas touché : le marchand, lui, doit voir son stock.
-- ------------------------------------------------------------
revoke select on products from anon;
grant select (
  id, business_id, name, category, price_cents, currency, unit,
  stock_state, photo_url, is_active, created_at, sold_count, photos,
  in_showcase, size, promo_price_cents, promo_ends_at
) on products to anon;

-- ------------------------------------------------------------
-- 2. Ancien numéro : masqué dans la vue, pas à l'écran
--
-- PostgreSQL refuse de remplacer une vue dont les colonnes changent : on la
-- supprime d'abord. Les droits sont réattribués juste en dessous — sans quoi
-- la vitrine ne lirait plus rien.
--
-- Pas de `cascade` : les vues de l'annuaire sont bâties sur `businesses` et
-- non sur celle-ci, donc rien ne doit tomber avec. Si quelque chose en
-- dépendait malgré tout, mieux vaut que la migration s'arrête en le nommant
-- que d'emporter en silence un objet qu'on ne saurait pas remonter.
--
-- Le masque reproduit lib/phone.ts : indicatif, puis les quatre derniers
-- chiffres. C'est ce que la bannière affiche au client, et il n'a jamais eu
-- besoin de davantage.
-- ------------------------------------------------------------
drop view if exists public_businesses;
create view public_businesses as
select
  id, name, slug, category, address, phone_e164, logo_url, cover_url, hours,
  business_type, theme, layout,
  case
    when coalesce(plan, 'gratis') <> 'gratis'
         and plan_until is not null
         and plan_until + interval '3 days' < now()
    then 'gratis'
    else coalesce(plan, 'gratis')
  end as plan,
  social_instagram, social_facebook,
  social_tiktok, delivery_zones, default_currency, slogan, promo_text, created_at,
  case
    when previous_phone_e164 is null then null
    when length(regexp_replace(previous_phone_e164, '\D', '', 'g')) < 4 then '•••'
    when regexp_replace(previous_phone_e164, '\D', '', 'g') like '509%'
         and length(regexp_replace(previous_phone_e164, '\D', '', 'g')) > 8
      then '+509 ••• ' || right(regexp_replace(previous_phone_e164, '\D', '', 'g'), 4)
    else '••• ' || right(regexp_replace(previous_phone_e164, '\D', '', 'g'), 4)
  end as previous_phone_masked,
  phone_changed_at, phone_notice_until,
  showcase_opt_out,
  opens_at, closes_at, open_days
from businesses
where suspended_at is null;
grant select on public_businesses to anon, authenticated;

-- Repère de version lu par la console.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 16))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(16, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.

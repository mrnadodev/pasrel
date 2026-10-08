-- ============================================================
-- Migration 17 — le marchand voit enfin l'audience de sa vitrine
--
-- À exécuter dans l'éditeur SQL Supabase, après migrate-2026-16-exposition.sql.
-- À passer APRÈS le déploiement du code correspondant : l'application sait
-- vivre sans ces colonnes — elle avale en silence une écriture refusée — et
-- l'inverse n'est pas vrai.
--
-- Ce qui manquait.
--
-- `site_events` comptait déjà les clics venus du Marketplace (`shop_click`,
-- posé au moment du clic, avant la navigation). Mais une vitrine ouverte
-- depuis un lien partagé sur WhatsApp ne laissait AUCUNE trace : le marchand
-- qui collait son lien dans son statut n'avait pas le moindre moyen de savoir
-- si quelqu'un l'avait ouvert. C'est pourtant le geste central du produit.
--
-- Deux ajouts, et rien de plus :
--
--   1. un type d'évènement `shop_view` — une vitrine ouverte, quelle que soit
--      la porte d'entrée. Il ne remplace pas `shop_click` : celui-ci mesure
--      l'intention depuis l'annuaire, et son historique reste intact.
--
--   2. une colonne `source` — par où la personne est arrivée. Elle vaut
--      « marketplace » quand le référent est notre propre annuaire, « lien »
--      dans tous les autres cas : WhatsApp, un statut, une bio, une adresse
--      tapée à la main.
--
-- Ce qui n'est PAS collecté, et ne le sera pas : aucune adresse IP, aucun
-- identifiant de visiteur, aucun cookie. On compte des ouvertures, et c'est
-- tout. La politique de confidentialité le dit dans les mêmes termes.
-- ============================================================

-- 1. Le nouveau type d'évènement.
--    La contrainte est posée sur la colonne à la création de la table, donc
--    Postgres l'a nommée `site_events_kind_check`. On la remplace.
alter table site_events drop constraint if exists site_events_kind_check;
alter table site_events add constraint site_events_kind_check
  check (kind in ('visit', 'search', 'shop_click', 'shop_view'));

-- 2. La porte d'entrée.
alter table site_events add column if not exists source text;
alter table site_events drop constraint if exists site_events_source_check;
alter table site_events add constraint site_events_source_check
  check (source is null or source in ('marketplace', 'lien'));

-- 3. La lecture du marchand : « mes ouvertures, les plus récentes d'abord ».
--    Sans cet index, chaque ouverture de la page d'audience balaie toute la
--    table — qui ne fait que grossir.
create index if not exists site_events_business_idx
  on site_events (business_id, created_at desc)
  where business_id is not null;

-- La table reste fermée à anon et authenticated : la page d'audience lit par
-- la clé service role, après avoir vérifié que le commerce est bien celui du
-- membre connecté. Un marchand ne doit pas pouvoir lire l'audience d'un autre.
revoke all on site_events from anon, authenticated;

-- Repère de version lu par la console.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 17))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(17, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.

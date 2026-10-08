import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/data";
import type { Ouverture } from "@/lib/audience";

/**
 * Les ouvertures de SA vitrine, et d'aucune autre.
 *
 * Deux clés sont en jeu, et l'ordre compte. On demande d'abord au client de
 * session à quel commerce appartient la personne connectée — c'est la seule
 * source d'autorité. On lit ensuite par la clé service role, parce que
 * `site_events` est fermée à `anon` et `authenticated` : la table contient
 * l'audience de tous les marchands, et aucun d'eux ne doit pouvoir la
 * parcourir. Le filtre sur `business_id` vient de la première étape, jamais
 * d'un paramètre d'URL.
 */

/** Un peu plus d'un an : la série la plus longue affichée est de douze mois. */
const JOURS = 400;

/**
 * Plafond de lecture. Au-delà, on tronque — les points les plus récents sont
 * servis en premier, donc ce sont les plus anciens qui tombent, et seulement
 * pour une vitrine qui dépasse vingt mille ouvertures sur treize mois. Le
 * jour où cela arrive, c'est un agrégat SQL qu'il faudra écrire, pas un
 * plafond plus haut.
 */
const PLAFOND = 20000;

export interface Audience {
  ouvertures: Ouverture[];
  /** Faux quand la migration 17 n'est pas encore passée sur cette base. */
  disponible: boolean;
}

export async function audienceVitrine(): Promise<Audience | null> {
  if (!hasSupabase()) return { ouvertures: [], disponible: true };

  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data: membre } = await sb
    .from("members")
    .select("business_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const bizId = membre?.business_id;
  if (!bizId) return null;

  const admin = createAdminClient();
  if (!admin) return { ouvertures: [], disponible: false };

  const depuis = new Date(Date.now() - JOURS * 86_400_000).toISOString();
  const { data, error } = await admin
    .from("site_events")
    .select("created_at, source")
    .eq("business_id", bizId)
    .eq("kind", "shop_view")
    .gte("created_at", depuis)
    .order("created_at", { ascending: false })
    .limit(PLAFOND);

  // Colonne ou valeur absente : la migration 17 n'est pas passée. On ne crie
  // pas, on le dit à l'écran — le marchand doit comprendre que le compteur
  // n'a pas encore commencé, pas croire que personne n'ouvre sa vitrine.
  if (error) return { ouvertures: [], disponible: false };

  return {
    ouvertures: (data ?? []) as Ouverture[],
    disponible: true,
  };
}

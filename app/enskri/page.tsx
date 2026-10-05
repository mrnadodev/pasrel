import { cookies } from "next/headers";
import { RegisterForm } from "@/components/RegisterForm";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import type { BrouillonInscription } from "@/app/enskri/actions";

/** Ce que la marchande avait saisi avant d'aller confirmer son adresse. */
function lireBrouillon(): BrouillonInscription | null {
  const brut = cookies().get("pasrel_enskri")?.value;
  if (!brut) return null;
  try {
    const o = JSON.parse(brut) as Partial<BrouillonInscription>;
    // Un cookie se bricole à la main : on ne garde que des chaînes, et on ne
    // laisse rien d'autre arriver jusqu'au formulaire.
    const txt = (v: unknown) => (typeof v === "string" ? v.slice(0, 120) : "");
    return {
      businessName: txt(o.businessName),
      businessType: txt(o.businessType),
      employeesCount: txt(o.employeesCount),
      phone: txt(o.phone),
      fullName: txt(o.fullName),
    };
  } catch {
    return null;
  }
}

// Inscription marchand self-service.
//
// La page sert aussi de rattrapage : un compte authentifié sans boutique
// arrive ici pour la créer, sans avoir à se réinscrire avec une adresse déjà
// prise.
export default async function EnskriPage() {
  let finishing = false;
  let defaultName = "";

  if (hasSupabase()) {
    const sb = createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) {
      const { data: member } = await sb
        .from("members")
        .select("business_id")
        .eq("user_id", user.id)
        .maybeSingle();
      finishing = !member?.business_id;
      defaultName = (user.user_metadata?.full_name as string) ?? user.email?.split("@")[0] ?? "";
    }
  }

  const brouillon = lireBrouillon();
  return (
    <RegisterForm
      finishing={finishing}
      defaultName={brouillon?.fullName || defaultName}
      brouillon={brouillon}
    />
  );
}

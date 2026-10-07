"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CvzMark } from "@/components/CvzMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageContext";

type Etat = "verification" | "echec";

const TEXTE = {
  fr: {
    titre: "Confirmation de votre adresse",
    attente: "Un instant, nous vérifions le lien…",
    echec: "Ce lien de confirmation n'est plus valable. Demandez-en un nouveau en recommençant l'inscription, ou connectez-vous si votre compte est déjà confirmé.",
    connexion: "Aller à la connexion",
  },
  ht: {
    titre: "Konfimasyon adrès ou",
    attente: "Yon ti moman, n ap verifye lyen an…",
    echec: "Lyen konfimasyon sa a pa valab ankò. Mande yon lòt lè w rekòmanse enskripsyon an, oswa konekte si kont ou deja konfime.",
    connexion: "Ale nan koneksyon",
  },
  en: {
    titre: "Confirming your address",
    attente: "One moment, we are checking the link…",
    echec: "This confirmation link is no longer valid. Request a new one by starting the sign-up again, or sign in if your account is already confirmed.",
    connexion: "Go to sign in",
  },
} as const;

/**
 * Cible du lien de confirmation d'adresse.
 *
 * Sans cette page, Supabase renvoyait sur la Site URL — la page d'accueil. Le
 * marchand cliquait « confirmer », retombait sur la vitrine publique, et rien
 * ne lui disait que ça avait marché : le jeton voyage dans le fragment de
 * l'URL, que seule une page cliente peut lire. Il repartait donc en se
 * demandant s'il devait recommencer.
 *
 * Ici on pose la session, puis on renvoie à la racine, qui sait déjà où
 * l'envoyer : un compte sans boutique part vers l'inscription, où son brouillon
 * l'attend.
 */
export function ConfirmEmail() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = TEXTE[language] ?? TEXTE.fr;
  const [etat, setEtat] = useState<Etat>("verification");

  useEffect(() => {
    let annule = false;
    const sb = createClient();

    async function poser() {
      const brut = window.location.hash.replace(/^#/, "");
      const p = new URLSearchParams(brut);
      const access_token = p.get("access_token");
      const refresh_token = p.get("refresh_token");

      if (access_token && refresh_token) {
        const { data } = await sb.auth.setSession({ access_token, refresh_token });
        // Le jeton ne reste pas dans la barre d'adresse : il se copie et il
        // ouvre le compte.
        window.history.replaceState(null, "", window.location.pathname);
        if (annule) return;
        if (data.session) {
          router.replace("/");
          return;
        }
      }

      // Lien déjà consommé, ou ouvert sur un autre appareil : il reste peut-être
      // une session valide dans ce navigateur.
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (annule) return;
      if (session) router.replace("/");
      else setEtat("echec");
    }

    void poser();
    return () => {
      annule = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-chat-bg md:mx-auto md:my-10 md:min-h-0 md:max-w-[440px] md:overflow-hidden md:rounded-3xl md:shadow-xl">
      <div className="relative flex flex-col items-center gap-3 bg-brand px-6 pb-10 pt-14 text-center">
        <div className="absolute right-4 top-4">
          <LanguageToggle />
        </div>
        <CvzMark size={56} />
        <span className="text-xl font-extrabold tracking-tight text-white">{t.titre}</span>
      </div>

      <div className="-mt-6 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
        {etat === "verification" && <p className="text-[14px] text-ink-muted">{t.attente}</p>}

        {etat === "echec" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] font-medium text-[#C0392B]">{t.echec}</div>
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-2xl bg-brand text-sm font-extrabold text-white"
            >
              {t.connexion}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

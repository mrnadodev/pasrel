"use client";

import { useEffect } from "react";
import { useLanguage } from "@/components/LanguageContext";
import type { Titre } from "@/lib/i18n/titres";

/**
 * Met le titre de l'onglet dans la langue du lecteur.
 *
 * Les métadonnées de Next sont calculées par le serveur, qui ne sait pas en
 * quelle langue on va lire la page — la langue vit dans le navigateur. Le
 * titre servi restait donc en français pour tout le monde : une cliente qui
 * lisait une vitrine en créole gardait « Commander sur WhatsApp » dans son
 * onglet et dans ses favoris.
 *
 * Ce composant ne remplace pas les métadonnées, il les complète. Le titre
 * français reste celui que voient les robots d'indexation et les aperçus de
 * lien, ce qui est le bon défaut ; celui-ci est celui que voit la personne.
 *
 * La vraie solution, le jour où le référencement comptera, est de mettre la
 * langue dans l'adresse — pasrel.app/ht/kondisyon. C'est un chantier entier,
 * et il ne se justifie pas tant qu'on ne nous cherche pas sur Google.
 */
export function DocTitle({ titres }: { titres: Titre }) {
  const { language } = useLanguage();
  const titre = titres[language] ?? titres.fr;

  useEffect(() => {
    document.title = titre;
  }, [titre]);

  return null;
}

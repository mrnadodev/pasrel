"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INDUSTRY_SECTORS, type IndustrySectorKey } from "@/lib/verticals";
import { CvzMark } from "@/components/CvzMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageContext";
import { landingCopy } from "@/lib/i18n/landing";
import {
  registerMerchant,
  renvoyerConfirmation,
  type RegisterInput,
  type BrouillonInscription,
  type ResultatRenvoi,
} from "@/app/enskri/actions";
import { Select } from "@/components/ui/Select";

/**
 * L'écran d'attente, après l'envoi du lien de confirmation.
 *
 * Il mentionne les indésirables en toutes lettres. Ce n'est pas une précaution
 * de style : c'est le premier message qu'un domaine neuf envoie, et les boîtes
 * s'en méfient tant qu'elles ne le connaissent pas. Le dire évite une
 * inscription abandonnée pour un courriel qui est pourtant bien arrivé.
 */
const ATTENTE = {
  fr: {
    titre: "Vérifiez votre boîte mail",
    corps: "Nous venons d'envoyer un lien de confirmation à",
    spam: "Rien reçu ? Regardez dans vos indésirables, et marquez le message comme légitime — les prochains arriveront alors directement.",
    renvoyer: "Renvoyer le lien",
    renvoiEnCours: "Envoi…",
    // Supabase répond pareil que l'adresse existe ou non — c'est voulu, pour
    // qu'on ne puisse pas deviner quels comptes existent. On ne peut donc pas
    // dire laquelle des deux situations c'est : on donne les deux portes.
    renvoye:
      "Si rien n'arrive, c'est probablement que ce compte existe déjà et qu'il est confirmé. Dans ce cas aucun nouveau message n'est envoyé — connectez-vous pour terminer.",
    dejaConfirme:
      "Ce compte est déjà confirmé — c'est pour cela qu'aucun message n'arrive. Connectez-vous pour terminer la création de votre commerce.",
    tropSouvent: "Trop de demandes d'affilée. Réessayez dans quelques minutes.",
    bouton: "Aller à la connexion",
  },
  ht: {
    titre: "Tcheke bwat imèl ou",
    corps: "Nou fèk voye yon lyen konfimasyon nan",
    spam: "Ou pa resevwa anyen ? Gade nan spam ou, epi make mesaj la kòm bon — konsa lòt yo ap rive dirèkteman.",
    renvoyer: "Voye lyen an ankò",
    renvoiEnCours: "N ap voye…",
    renvoye:
      "Si anyen pa rive, se pwobableman paske kont sa a deja egziste e li deja konfime. Nan ka sa a pa gen okenn nouvo mesaj k ap voye — konekte pou w fini.",
    dejaConfirme:
      "Kont sa a deja konfime — se poutèt sa okenn mesaj pa rive. Konekte pou w fini kreye biznis ou.",
    tropSouvent: "Twòp demann youn dèyè lòt. Eseye ankò nan kèk minit.",
    bouton: "Ale nan koneksyon",
  },
  en: {
    titre: "Check your inbox",
    corps: "We have just sent a confirmation link to",
    spam: "Nothing received? Look in your spam folder and mark the message as legitimate — the next ones will then arrive directly.",
    renvoyer: "Send the link again",
    renvoiEnCours: "Sending…",
    renvoye:
      "If nothing arrives, it is most likely that this account already exists and is confirmed. In that case no new message is sent — sign in to finish.",
    dejaConfirme:
      "This account is already confirmed — that is why no message arrives. Sign in to finish creating your business.",
    tropSouvent: "Too many requests in a row. Try again in a few minutes.",
    bouton: "Go to sign in",
  },
} as const;

/** À quel secteur appartient ce métier ? Sert à rouvrir les deux listes au bon
 *  endroit quand on restaure une saisie. */
function secteurDe(sousType: string): IndustrySectorKey | null {
  for (const [cle, secteur] of Object.entries(INDUSTRY_SECTORS)) {
    if (secteur.subTypes.includes(sousType)) return cle as IndustrySectorKey;
  }
  return null;
}

export function RegisterForm({
  finishing = false,
  defaultName = "",
  brouillon = null,
}: {
  /** Compte déjà authentifié à qui il ne manque que la boutique. */
  finishing?: boolean;
  defaultName?: string;
  /** Saisie conservée pendant le détour par la confirmation d'e-mail. */
  brouillon?: BrouillonInscription | null;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const a = landingCopy(language).auth;

  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  /** Adresse à confirmer : tant qu'elle est posée, l'écran d'attente remplace le formulaire. */
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  /** Ce que le renvoi du lien a donné, le cas échéant. */
  const [renvoi, setRenvoi] = useState<ResultatRenvoi | null>(null);
  const [renvoiEnCours, demarrerRenvoi] = useTransition();
  // Le métier conservé décide des deux listes : sans ça elles rouvriraient sur
  // « commerce » et la marchande croirait sa saisie perdue.
  const secteurRepris = brouillon?.businessType ? secteurDe(brouillon.businessType) : null;
  const [selectedSectorKey, setSelectedSectorKey] = useState<IndustrySectorKey>(
    secteurRepris ?? "commerce_vente",
  );
  const currentSector = INDUSTRY_SECTORS[selectedSectorKey];
  const [selectedSubType, setSelectedSubType] = useState<string>(
    secteurRepris ? brouillon!.businessType : currentSector.subTypes[0],
  );

  const [f, setF] = useState<RegisterInput>({
    businessName: brouillon?.businessName ?? "",
    businessType: secteurRepris ? brouillon!.businessType : currentSector.subTypes[0],
    employeesCount: brouillon?.employeesCount ?? "",
    phone: brouillon?.phone ?? "",
    fullName: brouillon?.fullName || defaultName,
    email: "",
    password: "",
  });
  const set = (p: Partial<RegisterInput>) => setF((s) => ({ ...s, ...p }));

  function handleSectorChange(sectorKey: IndustrySectorKey) {
    setSelectedSectorKey(sectorKey);
    const sub = INDUSTRY_SECTORS[sectorKey].subTypes[0];
    setSelectedSubType(sub);
    set({ businessType: sub });
  }

  function handleSubTypeChange(sub: string) {
    setSelectedSubType(sub);
    set({ businessType: sub });
  }

  function submit() {
    setError(null);
    start(async () => {
      // La langue part avec le formulaire : c'est celle du courriel de
      // bienvenue. On la lit à l'envoi, pas au montage — elle a pu changer
      // entre-temps avec le sélecteur en haut de page.
      const res = await registerMerchant({ ...f, language });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else if (res.needsConfirm) {
        // Panneau plein écran, et non un bandeau en haut de la carte : le
        // bouton est au bas d'un long formulaire, et le message s'affichait
        // hors de l'écran. On cliquait, rien ne semblait se passer, et on
        // repartait en croyant que l'inscription avait échoué.
        setAConfirmer(f.email.trim());
      } else {
        setError(res.error ?? "Erreur");
      }
    });
  }

  if (aConfirmer) {
    const c = ATTENTE[language] ?? ATTENTE.fr;
    return (
      <div className="flex min-h-[100dvh] flex-col bg-chat-bg md:mx-auto md:my-10 md:min-h-0 md:max-w-[480px] md:overflow-hidden md:rounded-3xl md:shadow-xl">
        <div className="relative flex flex-col items-center gap-3 bg-brand px-6 pb-10 pt-14 text-center">
          <div className="absolute right-4 top-4">
            <LanguageToggle />
          </div>
          <CvzMark size={60} />
          <span className="text-xl font-extrabold tracking-tight text-white">{c.titre}</span>
        </div>

        <div className="-mt-6 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
          <div className="flex flex-col gap-5">
            <p className="text-[15px] leading-relaxed text-ink">
              {c.corps} <span className="font-bold text-ink">{aConfirmer}</span>
            </p>
            <div className="rounded-xl bg-[#FFF6EC] px-4 py-3 text-[13px] leading-relaxed text-[#8A4607]">
              {c.spam}
            </div>

            {/* La sortie de secours. Un compte déjà confirmé ne reçoit plus
                rien : sans ce bouton, on attend un message qui ne viendra
                jamais, et on finit par abandonner. */}
            {renvoi?.etat === "deja_confirme" && (
              <div className="rounded-xl bg-[#E7F1FB] px-4 py-3 text-[13px] leading-relaxed font-medium text-[#1A6BB8]">
                {c.dejaConfirme}
              </div>
            )}
            {renvoi?.etat === "envoye" && (
              <div className="rounded-xl bg-[#E7F7F1] px-4 py-3 text-[13px] leading-relaxed font-medium text-[#0B6B57]">
                {c.renvoye}
              </div>
            )}
            {renvoi?.etat === "trop_souvent" && (
              <div className="rounded-xl bg-[#FFF6EC] px-4 py-3 text-[13px] leading-relaxed font-medium text-[#8A4607]">
                {c.tropSouvent}
              </div>
            )}
            {renvoi?.etat === "echec" && (
              <div className="rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] leading-relaxed font-medium text-[#C0392B]">
                {renvoi.message}
              </div>
            )}

            <button
              type="button"
              onClick={() => demarrerRenvoi(async () => setRenvoi(await renvoyerConfirmation(aConfirmer)))}
              disabled={renvoiEnCours || renvoi?.etat === "deja_confirme"}
              className="h-12 cursor-pointer rounded-2xl border border-line text-sm font-bold text-ink-soft disabled:opacity-60"
            >
              {renvoiEnCours ? c.renvoiEnCours : c.renvoyer}
            </button>

            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-2xl bg-brand-green text-sm font-extrabold text-white"
            >
              {c.bouton}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-chat-bg md:mx-auto md:my-10 md:min-h-0 md:max-w-[480px] md:overflow-hidden md:rounded-3xl md:shadow-xl">
      <div className="relative flex flex-col items-center gap-3 bg-brand px-6 pb-10 pt-14 text-center">
        <div className="absolute right-4 top-4">
          <LanguageToggle />
        </div>
        <CvzMark size={60} />
        <span className="text-xl font-extrabold tracking-tight text-white">
          {finishing ? a.finishTitle : a.registerTitle}
        </span>
        <span className="text-[13px] text-[#B9F5E4]">
          {finishing ? a.finishSubtitle : a.registerSubtitle}
        </span>
      </div>

      <div className="-mt-6 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
        {error && <div className="mb-4 rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] font-medium text-[#C0392B]">{error}</div>}

        <div className="flex flex-col gap-4">
          <Field label={a.businessName}>
            <input value={f.businessName} onChange={(e) => set({ businessName: e.target.value })} className={cls} placeholder="Ti Kòk Boutik" />
          </Field>

          <Field label={a.sector}>
            <Select value={selectedSectorKey} onChange={(e) => handleSectorChange(e.target.value as IndustrySectorKey)} triggerClassName={cls}>
              {Object.values(INDUSTRY_SECTORS).map((sec) => (
                <option key={sec.id} value={sec.id}>{sec.label}</option>
              ))}
            </Select>
          </Field>

          <Field label={a.specialty}>
            <Select value={selectedSubType} onChange={(e) => handleSubTypeChange(e.target.value)} triggerClassName={cls}>
              {currentSector.subTypes.map((sub, idx) => (
                <option key={idx} value={sub}>{sub}</option>
              ))}
            </Select>
          </Field>

          <Field label={a.employees}>
            <input value={f.employeesCount} onChange={(e) => set({ employeesCount: e.target.value })} inputMode="numeric" className={cls} placeholder="3" />
          </Field>

          <Field label={a.whatsapp}>
            <input value={f.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" className={cls} placeholder="+509 3712 4488" />
          </Field>

          <Field label={a.yourName}>
            <input value={f.fullName} onChange={(e) => set({ fullName: e.target.value })} className={cls} placeholder="Nadège Pierre" />
          </Field>

          {/* Identifiants uniquement pour une nouvelle inscription : un compte
              déjà connecté n'a pas à ressaisir son e-mail. */}
          {!finishing && (
            <>
              <div className="h-px bg-line" />
              <Field label={a.email}>
                <input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} className={cls} placeholder="vous@exemple.com" autoComplete="email" />
              </Field>
              <Field label={a.password}>
                <input type="password" value={f.password} onChange={(e) => set({ password: e.target.value })} className={cls} placeholder="••••••••" autoComplete="new-password" />
              </Field>
            </>
          )}

          <button
            onClick={submit}
            disabled={pending}
            className="mt-2 flex h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? a.registerPending : finishing ? a.finishCta : a.registerCta}
          </button>

          {!finishing && (
            <p className="mt-2 text-center text-[13px] text-ink-muted">
              {a.haveAccount}{" "}
              <Link href="/login" className="font-bold text-brand">{a.signInLink}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const cls = "h-12 w-full rounded-xl border border-line bg-[#F7F8F9] px-4 text-[15px] outline-none focus:border-brand focus:bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

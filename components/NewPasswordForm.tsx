"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordReset } from "@/app/login/actions";
import { lireJeton } from "@/lib/auth-lien";
import { ChampModpas } from "@/components/ChampModpas";
import { CvzMark } from "@/components/CvzMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageContext";
import { landingCopy } from "@/lib/i18n/landing";

type State = "checking" | "ready" | "invalid" | "saving" | "done";

const TEXT = {
  fr: {
    title: "Nouveau mot de passe",
    subtitle: "Choisissez un mot de passe d'au moins 6 caractères.",
    checking: "Vérification du lien…",
    invalid: "Ce lien n'est plus valable : il a déjà servi, ou il a plus d'une heure.",
    demandeTitre: "Recevez-en un nouveau tout de suite",
    demandeAide: "Entrez votre adresse. Le lien part directement dans votre boîte — ne le faites pas suivre à quelqu'un d'autre, il ne fonctionne qu'une fois.",
    demandeBouton: "M'envoyer un lien",
    demandeEnCours: "Envoi…",
    demandeOk: "Si un compte existe à cette adresse, le lien vient d'y être envoyé. Pensez à regarder dans les indésirables.",
    password: "Nouveau mot de passe",
    confirm: "Confirmez le mot de passe",
    save: "Enregistrer",
    saving: "Enregistrement…",
    done: "Mot de passe modifié. Vous pouvez vous connecter.",
    backToLogin: "Aller à la connexion",
    tooShort: "Le mot de passe doit faire au moins 6 caractères.",
    mismatch: "Les deux mots de passe ne correspondent pas.",
  },
  ht: {
    title: "Nouvo modpas",
    subtitle: "Chwazi yon modpas ki gen omwen 6 karaktè.",
    checking: "N ap verifye lyen an…",
    invalid: "Lyen sa a pa valab ankò : li deja sèvi, oswa li gen plis pase yon èdtan.",
    demandeTitre: "Mande yon lòt kounye a",
    demandeAide: "Antre adrès ou. Lyen an ap rive dirèkteman nan bwat ou — pa voye l bay yon lòt moun, li sèvi yon sèl fwa.",
    demandeBouton: "Voye yon lyen ban mwen",
    demandeEnCours: "N ap voye…",
    demandeOk: "Si yon kont egziste ak adrès sa a, lyen an fèk pati. Tcheke nan spam ou tou.",
    password: "Nouvo modpas",
    confirm: "Konfime modpas la",
    save: "Anrejistre",
    saving: "N ap anrejistre…",
    done: "Modpas la chanje. Ou ka konekte kounye a.",
    backToLogin: "Ale nan koneksyon",
    tooShort: "Modpas la dwe gen omwen 6 karaktè.",
    mismatch: "De modpas yo pa menm.",
  },
  en: {
    title: "New password",
    subtitle: "Choose a password of at least 6 characters.",
    checking: "Checking the link…",
    invalid: "This link is no longer valid: it has already been used, or it is more than an hour old.",
    demandeTitre: "Get a new one right now",
    demandeAide: "Enter your address. The link goes straight to your inbox — do not forward it to anyone, it only works once.",
    demandeBouton: "Send me a link",
    demandeEnCours: "Sending…",
    demandeOk: "If an account exists at this address, the link has just been sent. Remember to check your spam folder.",
    password: "New password",
    confirm: "Confirm password",
    save: "Save",
    saving: "Saving…",
    done: "Password changed. You can sign in now.",
    backToLogin: "Go to sign in",
    tooShort: "The password must be at least 6 characters.",
    mismatch: "The two passwords do not match.",
  },
} as const;

export function NewPasswordForm() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = TEXT[language] ?? TEXT.fr;
  const a = landingCopy(language).auth;

  const [state, setState] = useState<State>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Demander un nouveau lien sans quitter la page. Un lien de récupération ne
  // dure qu'une heure et ne sert qu'une fois ; renvoyer la personne vers la
  // page de connexion pour qu'elle retrouve « Mot de passe oublié » et retape
  // son adresse, c'est trois occasions d'abandonner.
  const [demandeMail, setDemandeMail] = useState("");
  const [demandeEnvoi, setDemandeEnvoi] = useState(false);
  const [demandeFaite, setDemandeFaite] = useState(false);

  // Le jeton de récupération arrive dans l'URL. Il peut s'y trouver sous trois
  // formes, et il faut savoir lire les trois :
  //
  //   · `?token_hash=…&type=recovery` — le jeton haché, c'est ce que nos
  //     propres courriels envoient désormais. Rien n'est consommé avant
  //     l'appel ci-dessous, donc aucun robot d'aperçu ne peut le dépenser
  //     (lib/auth-lien.ts explique pourquoi ça change tout) ;
  //   · un code dans la requête (`?code=`), le flux PKCE, que le client
  //     Supabase échange tout seul au chargement ;
  //   · les jetons dans le fragment (`#access_token=…`), le flux implicite —
  //     c'est ce que renvoie l'endpoint /verify, donc tout ancien lien encore
  //     en circulation.
  //
  // Le client navigateur de @supabase/ssr est configuré en PKCE, et dans ce
  // cas `auth-js` REFUSE un fragment implicite au lieu de le lire : il lève
  // « Not a valid PKCE flow url ». La page concluait « lien plus valable » sur
  // un lien parfaitement bon, et personne ne pouvait plus réinitialiser son
  // mot de passe. On pose donc la session à la main quand les jetons sont là.
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const sb = createClient();

    // Vrai si la requête portait un jeton haché, qu'il ait marché ou non.
    async function depuisLeJeton(): Promise<boolean> {
      const j = lireJeton(window.location.search, "recovery");
      if (!j) return false;

      const { data } = await sb.auth.verifyOtp({ token_hash: j.token_hash, type: j.type });
      // Le jeton ne doit pas rester dans la barre d'adresse : il se copie, il
      // se partage, et il ouvre le compte.
      window.history.replaceState(null, "", window.location.pathname);
      if (cancelled) return true;
      setState(data.session ? "ready" : "invalid");
      return true;
    }

    // Vrai si le fragment portait une session utilisable.
    async function depuisLeFragment(): Promise<boolean> {
      const brut = window.location.hash.replace(/^#/, "");
      if (!brut) return false;
      const p = new URLSearchParams(brut);
      const access_token = p.get("access_token");
      const refresh_token = p.get("refresh_token");
      if (!access_token || !refresh_token) return false;

      const { data } = await sb.auth.setSession({ access_token, refresh_token });
      // Le jeton ne doit pas rester dans la barre d'adresse : il se copie, il
      // se partage, et il ouvre le compte.
      window.history.replaceState(null, "", window.location.pathname);
      if (cancelled) return true;
      setState(data.session ? "ready" : "invalid");
      return true;
    }

    const check = async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (cancelled) return;
      setState(session ? "ready" : "invalid");
    };

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session) setState((s) => (s === "checking" || s === "invalid" ? "ready" : s));
    });

    // Le jeton haché d'abord, puis le fragment ; sans l'un ni l'autre, on
    // laisse au client le temps d'échanger un code PKCE, ce qui se fait juste
    // après le montage.
    void (async () => {
      if (await depuisLeJeton()) return;
      if (await depuisLeFragment()) return;
      if (!cancelled) timer = window.setTimeout(check, 700);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function save() {
    setError(null);
    if (password.length < 6) return setError(t.tooShort);
    if (password !== confirm) return setError(t.mismatch);

    setState("saving");
    const sb = createClient();
    const { error: err } = await sb.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setState("ready");
      return;
    }
    setState("done");
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-chat-bg md:mx-auto md:my-10 md:min-h-0 md:max-w-[440px] md:overflow-hidden md:rounded-3xl md:shadow-xl">
      <div className="relative flex flex-col items-center gap-3 bg-brand px-6 pb-10 pt-14 text-center">
        <div className="absolute right-4 top-4"><LanguageToggle /></div>
        <CvzMark size={56} />
        <span className="text-xl font-extrabold tracking-tight text-white">{t.title}</span>
        <span className="text-[13px] text-[#B9F5E4]">{t.subtitle}</span>
      </div>

      <div className="-mt-6 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
        {state === "checking" && <p className="text-[14px] text-ink-muted">{t.checking}</p>}

        {state === "invalid" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] font-medium text-[#C0392B]">{t.invalid}</div>

            {demandeFaite ? (
              <div className="rounded-xl bg-[#E7F7F1] px-4 py-3 text-[13px] font-medium leading-relaxed text-[#0B6B57]">
                {t.demandeOk}
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-line p-4">
                <span className="text-[14px] font-extrabold text-ink">{t.demandeTitre}</span>
                <p className="text-[12.5px] leading-relaxed text-ink-muted">{t.demandeAide}</p>
                <input
                  type="email"
                  value={demandeMail}
                  onChange={(e) => setDemandeMail(e.target.value)}
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  aria-label={t.demandeBouton}
                  className="h-11 rounded-xl border border-line bg-[#F7F8F9] px-3.5 text-sm outline-none focus:border-brand focus:bg-white"
                />
                <button
                  type="button"
                  disabled={demandeEnvoi || !demandeMail.includes("@")}
                  onClick={async () => {
                    setDemandeEnvoi(true);
                    await requestPasswordReset(demandeMail, language);
                    setDemandeEnvoi(false);
                    setDemandeFaite(true);
                  }}
                  className="h-11 cursor-pointer rounded-xl bg-brand-green text-[13.5px] font-extrabold text-white disabled:opacity-60"
                >
                  {demandeEnvoi ? t.demandeEnCours : t.demandeBouton}
                </button>
              </div>
            )}

            <Link href="/login" className="flex h-12 items-center justify-center rounded-2xl bg-brand text-sm font-extrabold text-white">
              {t.backToLogin}
            </Link>
          </div>
        )}

        {state === "done" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-[#E7F7F1] px-4 py-3 text-[13px] font-medium text-[#0B6B57]">{t.done}</div>
            <Link href="/login" className="flex h-12 items-center justify-center rounded-2xl bg-brand text-sm font-extrabold text-white">
              {t.backToLogin}
            </Link>
          </div>
        )}

        {(state === "ready" || state === "saving") && (
          <div className="flex flex-col gap-4">
            {error && <div className="rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] font-medium text-[#C0392B]">{error}</div>}
            {/* Un <div> et non un <label> : l'œil est un bouton, et un bouton
                dans un <label> hérite de son comportement de clic. Le libellé
                garde son lien par `htmlFor`. */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modpas" className="text-[13px] font-semibold text-ink-soft">{t.password}</label>
              <ChampModpas id="modpas" value={password} onChange={setPassword} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modpas-confirme" className="text-[13px] font-semibold text-ink-soft">{t.confirm}</label>
              <ChampModpas id="modpas-confirme" value={confirm} onChange={setConfirm} />
            </div>
            <button
              onClick={save}
              disabled={state === "saving"}
              className="mt-2 flex h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] disabled:opacity-60"
            >
              {state === "saving" ? t.saving : t.save}
            </button>
            <p className="text-center text-[13px] text-ink-muted">
              <Link href="/login" className="font-bold text-brand">{a.signInLink}</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

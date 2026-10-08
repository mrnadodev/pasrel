# Le gabarit de confirmation d'inscription, à coller dans Supabase

## Le problème, en une phrase

Un lien Supabase par défaut pointe sur `/auth/v1/verify?token=…`, et **cette
adresse dépense le jeton au premier chargement, même si ce chargement vient
d'une machine**.

Or le premier chargement vient presque toujours d'une machine :

- WhatsApp, Messenger, Slack et iMessage récupèrent la page pour fabriquer
  l'aperçu, dès que le message est envoyé ;
- certaines passerelles de messagerie et antivirus la visitent pour la
  « vérifier » avant de livrer le courriel ;
- des clients mail préchargent les liens.

Le marchand clique ensuite sur un lien reçu depuis deux minutes et lit **« le
lien a expiré »**. Ce n'était pas une expiration, c'était une consommation.

C'est exactement ce qui est arrivé : le lien de confirmation a été transmis par
WhatsApp, l'aperçu WhatsApp l'a dépensé, le marchand a trouvé la porte fermée.

## La correction

Le lien ne doit plus pointer sur Supabase, mais sur **notre page**, et porter le
jeton **haché** dans la requête. La page n'échange le jeton qu'en JavaScript :
un robot d'aperçu récupère du HTML, n'exécute pas de script, et repart sans
avoir touché à rien.

### Ce qui est déjà fait, dans le code

| Flux | État |
|---|---|
| Mot de passe oublié | **Réglé, rien à faire.** L'application n'utilise plus le mailer de Supabase : elle fabrique le lien avec `generateLink`, écrit son propre courriel en trois langues et l'envoie par Resend (`app/login/actions.ts`). |
| Pages `/nouvo-modpas` et `/konfime` | **Réglé.** Elles lisent `?token_hash=…&type=…` et appellent `verifyOtp` (`lib/auth-lien.ts`). Les anciens liens — fragment implicite, code PKCE — continuent de fonctionner. |
| Confirmation d'inscription | **Il reste un collage à faire dans le tableau de bord**, ci-dessous. Ce courriel est envoyé par Supabase au moment du `signUp`, donc c'est son gabarit qui décide de la forme du lien. |

## Le collage

Supabase → **Authentication** → **Emails** → onglet **Confirm signup** →
*Message body*. Remplacer tout le contenu par ceci :

```html
<div style="margin:0;padding:24px;background:#F2F6F4;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
    <div style="font-size:22px;font-weight:800;letter-spacing:-.5px;color:#06231C;margin-bottom:24px">PASR<span style="color:#008069">È</span>L</div>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#06231C">Bonjou, / Bonjour,</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#06231C">Konfime adrès ou pou w ka fini kreye biznis ou sou PASRÈL.<br><em style="color:#5E7E75">Confirmez votre adresse pour terminer la création de votre commerce.</em></p>

    <p style="margin:0 0 20px">
      <a href="https://pasrel.app/konfime?token_hash={{ .TokenHash }}&type=signup"
         style="display:inline-block;background:#008069;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 24px;border-radius:10px">
        Konfime adrès mwen
      </a>
    </p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#06231C">Bouton an pa mache ? Kopye adrès sa a :</p>
    <div style="background:#F7FAF9;border-radius:12px;padding:16px 18px;margin:0 0 16px">
      <span style="word-break:break-all;font-size:13px;color:#06231C">https://pasrel.app/konfime?token_hash={{ .TokenHash }}&amp;type=signup</span>
    </div>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#06231C">Li sèvi <strong>yon sèl fwa</strong>. <strong>Pa voye l bay pèsòn</strong> — lyen an ouvri kont ou.<br><em style="color:#5E7E75">Il ne sert qu'une fois. Ne le faites suivre à personne : ce lien ouvre votre compte.</em></p>

    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E6ECEA;font-size:13px;line-height:1.5;color:#5E7E75">
      <a href="https://pasrel.app/kondisyon" style="color:#008069">Kondisyon itilizasyon</a> ·
      <a href="https://pasrel.app/konfidansyalite" style="color:#008069">Konfidansyalite</a><br>
      PASRÈL — Kote konvèsasyon tounen kliyan.
    </div>
  </div>
</div>
```

Le *Subject heading* : `Konfime adrès ou — PASRÈL`.

### Les deux détails qui comptent

1. **`{{ .TokenHash }}`, pas `{{ .ConfirmationURL }}`.** C'est tout le sujet de
   ce document. `{{ .ConfirmationURL }}` est l'adresse qui se consomme.
2. **Le même gabarit sert aussi à « Magic Link » et « Invite »** si ces flux
   sont activés un jour. Pour eux, remplacer `type=signup` par `type=magiclink`
   ou `type=invite`.

## Ce qu'il ne faut PAS faire

**Ne pas rallonger l'expiration** (Authentication → Sign In / Providers → *Email
OTP Expiration*). Une heure est le bon réglage : maintenant que les robots ne
dépensent plus les jetons, une heure suffit largement, et une fenêtre courte est
une protection réelle — un lien de récupération fait passer pour le
propriétaire du compte quiconque l'ouvre.

**Ne jamais transmettre un lien d'authentification à quelqu'un d'autre.** Ni par
WhatsApp, ni autrement, même pour aider. Deux raisons :

- chaque nouveau lien annule le précédent, donc à deux on se coupe l'herbe sous
  le pied ;
- un lien de récupération ouvre le compte **sans mot de passe**. Le faire
  suivre, c'est donner le compte.

La personne doit demander le sien. Pour cela, `/nouvo-modpas` affiche désormais
un champ « recevez-en un nouveau tout de suite » quand le lien ne marche plus :
elle entre son adresse sur place, sans naviguer nulle part.

## Vérifier

```bash
node scripts/verifier-lien-auth.mjs .env.production <adresse-reelle>
```

Le script fabrique un lien comme l'application le fait, le charge **deux fois**
et montre que le premier chargement ne l'a pas dépensé — c'est la preuve que le
robot d'aperçu ne casse plus rien. Il n'envoie aucun courriel.

> **Ne jamais passer une adresse inventée** : Supabase compte les rebonds et
> peut brider le projet.

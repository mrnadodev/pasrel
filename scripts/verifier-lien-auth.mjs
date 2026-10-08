// Prouve qu'un lien d'authentification ne se laisse plus dépenser par un robot.
//
// On a cru longtemps à une expiration : « le lien est expiré », disait le
// marchand, sur un lien reçu depuis deux minutes. Ce n'était pas une
// expiration. Le lien Supabase par défaut pointe sur /auth/v1/verify, et cette
// adresse consomme le jeton au premier GET — y compris le GET que WhatsApp fait
// tout seul pour fabriquer l'aperçu du message. La machine ouvrait la porte, la
// personne la trouvait fermée.
//
// Désormais le lien pointe sur /nouvo-modpas et porte le jeton HACHÉ. Le GET ne
// fait rien : c'est le JavaScript de la page qui échange le jeton. Ce script le
// mesure, en trois temps :
//
//   1. il fabrique un lien comme l'application le fait (generateLink, qui
//      n'envoie AUCUN courriel) ;
//   2. il charge l'adresse deux fois en simulant l'aperçu WhatsApp ;
//   3. il échange ENSUITE le jeton, puis réessaie.
//
// Ce qu'on veut lire : l'échange marche après les visites du robot, et échoue
// la seconde fois. La première ligne est la correction, la seconde est la
// sécurité — un lien ne sert qu'une fois.
//
//   node scripts/verifier-lien-auth.mjs .env.local <adresse-reelle>
//
// L'adresse doit être une VRAIE adresse ayant un compte. Supabase compte les
// rebonds et peut brider le projet sur des adresses inventées.

import { readFileSync } from "node:fs";

function lireEnv(chemin) {
  const env = {};
  for (const ligne of readFileSync(chemin, "utf8").split(/\r?\n/)) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const [, , cheminEnv, adresse] = process.argv;
if (!cheminEnv || !adresse) {
  console.error("usage : node scripts/verifier-lien-auth.mjs <fichier .env> <adresse-reelle>");
  process.exit(2);
}

const env = lireEnv(cheminEnv);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = env.SUPABASE_SERVICE_ROLE_KEY;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const base = (env.NEXT_PUBLIC_SITE_URL || "https://pasrel.app").replace(/\/+$/, "");

if (!url || !service || !anon) {
  console.error("Il manque NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(2);
}

// ── 1. Fabriquer le lien ────────────────────────────────────────────────────
// generateLink rend le jeton et ne poste rien : aucune boîte ne reçoit rien.

const g = await fetch(`${url}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
  body: JSON.stringify({ type: "recovery", email: adresse, redirect_to: `${base}/nouvo-modpas` }),
});

const lien = await g.json();
if (!g.ok || !lien.hashed_token) {
  console.error(`✗ generate_link a répondu ${g.status} :`, JSON.stringify(lien).slice(0, 300));
  process.exit(1);
}

const hache = lien.hashed_token;
const notre = `${base}/nouvo-modpas?token_hash=${encodeURIComponent(hache)}&type=recovery`;

console.log("Adresse      :", adresse);
console.log("Lien ancien  :", String(lien.action_link).replace(hache, "…").slice(0, 110));
console.log("Lien nouveau :", notre.replace(hache, "…"));
console.log("");

// ── 2. Le robot d'aperçu passe deux fois ────────────────────────────────────

const ROBOT = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

for (const essai of [1, 2]) {
  const r = await fetch(notre, { headers: { "User-Agent": ROBOT }, redirect: "manual" });
  const corps = await r.text();
  console.log(`aperçu ${essai} : ${r.status}  ${corps.length} octets de HTML`);
}
console.log("");

// ── 3. Échanger le jeton, deux fois ─────────────────────────────────────────

async function echanger() {
  const r = await fetch(`${url}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "recovery", token_hash: hache }),
  });
  const c = await r.json().catch(() => ({}));
  return { statut: r.status, session: Boolean(c.access_token), message: c.error_description || c.msg || "" };
}

const premier = await echanger();
const second = await echanger();

console.log("échange 1 :", premier.statut, premier.session ? "session obtenue" : premier.message);
console.log("échange 2 :", second.statut, second.session ? "session obtenue" : second.message);
console.log("");

const aRobot = premier.session;
const unSeulUsage = !second.session;

console.log(aRobot ? "✓ le robot d'aperçu n'a PAS dépensé le jeton" : "✗ le jeton était déjà consommé après les aperçus");
console.log(unSeulUsage ? "✓ le lien ne sert qu'une fois" : "✗ le lien a resservi — ce serait une faille");

process.exit(aRobot && unSeulUsage ? 0 : 1);

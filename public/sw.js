// Service worker : rend l'application installable et sert les ressources
// statiques hors connexion.
//
// Il mettait en cache TOUTE réponse GET, y compris les pages d'un marchand
// connecté — tableau de bord, commandes, clients. Sur un téléphone partagé,
// ce qui est courant, la personne suivante pouvait retrouver hors connexion
// l'écran du précédent. Un cache de navigateur ne connaît pas les sessions :
// il rend ce qu'il a gardé, à qui le demande.
//
// Désormais seules les ressources statiques sont copiées : le code, les
// styles, les polices, les images. Elles sont identiques pour tout le monde
// et ne disent rien de personne. Les pages, elles, passent au réseau sans
// laisser de trace. On perd le repli hors connexion sur les pages — c'est un
// échange assumé, et le bon sens : mieux vaut une page qui manque qu'une page
// qui appartient à quelqu'un d'autre.
const CACHE = "pasrel-v2";

/** Ce qu'on accepte de garder : rien qui dépende de qui regarde. */
function estStatique(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(css|js|mjs|woff2?|ttf|png|jpg|jpeg|gif|svg|webp|avif|ico)$/i.test(url.pathname)
  );
}

self.addEventListener("install", () => self.skipWaiting());

// Les anciens caches contiennent peut-être des pages authentifiées, gardées
// par la version précédente. On ne se contente pas de changer de nom : on les
// efface, sinon ils resteraient lisibles sur l'appareil.
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  ),
);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Une requête de navigation ou d'API ne passe pas par nous : pas de copie,
  // pas de repli, le réseau et rien d'autre.
  if (!estStatique(url)) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Une réponse partielle ou en erreur n'a pas à devenir la référence.
        if (res.ok && res.status === 200) {
          const copie = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copie)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req)),
  );
});

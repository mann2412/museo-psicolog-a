const VERSION = "museo-v5";
const IMG = "museo-img-v1";
const SHELL = [
  "./", "./index.html", "./styles.css", "./app.js", "./data.js", "./extra.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== IMG).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Fotos de Wikimedia: cache primero, se actualiza en segundo plano
  if (url.hostname === "upload.wikimedia.org") {
    e.respondWith(
      caches.open(IMG).then(async (cache) => {
        const hit = await cache.match(req);
        const net = fetch(req).then((res) => { cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Archivos de la app: red primero (siempre la versión más reciente) y caché como respaldo sin conexión
  e.respondWith(
    fetch(req, { cache: "no-cache" }).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

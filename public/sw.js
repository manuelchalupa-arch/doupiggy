// sw.js — Service worker de DouPiggy (instalable + offline básico).
// Estrategia: network-first. En línea se usa siempre la red (así Firebase,
// los assets hasheados nuevos y la navegación funcionan normal); si no hay
// conexión se sirve lo último que quedó cacheado y, para navegación, la
// portada. No intercepta pedidos cross-origin (Google auth, API de Firebase).

const CACHE = "doupiggy-v4";
const NUCLEO = [
  "/",
  "/index.html",
  "/manifest.json",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll fallaría entero si un solo archivo falla; por eso cacheamos
      // de a uno y toleramos errores (en dev el SW igual se instala).
      await Promise.all(NUCLEO.map((ruta) => cache.add(ruta).catch(() => {})));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const claves = await caches.keys();
      await Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if ((req.method || "GET") !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // nada cross-origin (Google/Firebase)

  // Navegación: red primero; sin conexión, caigo a la portada cacheada.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/index.html")));
    return;
  }

  // Resto: red primero y guardo en caché lo que sirva (assets hasheados y amigables).
  e.respondWith(
    caches.match(req).then((enCache) =>
      fetch(req)
        .then((res) => {
          if (res.ok && (url.pathname.startsWith("/assets/") || url.pathname === "/manifest.json" || url.pathname.startsWith("/icons/") || url.pathname === "/apple-touch-icon.png")) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => enCache)
    )
  );
});
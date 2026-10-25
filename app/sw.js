// Word and Faith Network — service worker
// Caches the app shell for installability, and the full KJV Bible for offline reading.

const CACHE_VERSION = "wfn-app-v19";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const BIBLE_CACHE = `${CACHE_VERSION}-bible`;

const SHELL_ASSETS = [
  "/app/",
  "/app/index.html",
  "/app/manifest.webmanifest",
  "/app/css/app.css",
  "/app/js/app.js",
  "/app/js/bible.js",
  "/app/js/store.js",
  "/app/js/wfn-tts.js",
  "/app/icons/icon-192.png",
  "/app/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      await shell.addAll(SHELL_ASSETS);

      // Pull the whole KJV text into its own cache so the Bible works fully offline
      // once the app has been opened one time on a connection.
      try {
        const bible = await caches.open(BIBLE_CACHE);
        const idxRes = await fetch("/app/data/bible/index.json");
        const books = await idxRes.json();
        const urls = ["/app/data/bible/index.json", ...books.map((b) => `/app/data/bible/${b.slug}.json`)];
        await bible.addAll(urls);
      } catch (e) {
        // Offline on first install, or slow network — the app still works online,
        // and books get cached individually as they're opened (see fetch handler).
      }

      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("wfn-app-") && k !== SHELL_CACHE && k !== BIBLE_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Bible data: cache-first, so a book read once is available offline forever.
  if (url.pathname.startsWith("/app/data/bible/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(BIBLE_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh.ok) cache.put(req, fresh.clone());
          return fresh;
        } catch (e) {
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // App shell + everything else under /app/: network-first, falling back to cache offline.
  if (url.pathname.startsWith("/app/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          const fresh = await fetch(req);
          if (fresh.ok) cache.put(req, fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await cache.match(req);
          return cached || cache.match("/app/index.html");
        }
      })()
    );
  }
});

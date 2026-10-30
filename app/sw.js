// Word and Faith Network — service worker
// Caches the app shell for installability, and the full KJV Bible for offline reading.

// Merge in OneSignal's push worker so it runs under this SAME registration
// (scope /app/) instead of registering a second, separate service worker —
// see "Existing Service Worker Setup" in OneSignal's docs. app/index.html's
// OneSignal.init() points serviceWorkerPath at this file for the same reason.
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_VERSION = "wfn-app-v64";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const BIBLE_CACHE = `${CACHE_VERSION}-bible`;

const SHELL_ASSETS = [
  "/app/",
  "/app/index.html",
  "/app/manifest.webmanifest",
  "/app/css/app.css",
  "/app/css/wordclimb.css",
  "/app/js/app.js",
  "/app/js/bible.js",
  "/app/js/store.js",
  "/app/js/wfn-tts.js",
  "/app/js/wordclimb.js",
  "/app/js/season-fx.js",
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

  // Today's content snapshot (verse/sermon/declaration): network-first,
  // so the website never shows yesterday's cached content — falls back to
  // cache only when offline.
  if (url.pathname === "/app/data/today.json") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(BIBLE_CACHE);
        try {
          const fresh = await fetch(req);
          if (fresh.ok) cache.put(req, fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await cache.match(req);
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Bible data, chapter summaries, and the names/terms dictionary:
  // cache-first, so anything read once is available offline forever.
  if (url.pathname.startsWith("/app/data/")) {
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

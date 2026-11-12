// Word and Faith Network — service worker
// Caches the app shell for installability, and the full KJV Bible for offline reading.

// Merge in OneSignal's push worker so it runs under this SAME registration
// (scope /app/) instead of registering a second, separate service worker —
// see "Existing Service Worker Setup" in OneSignal's docs. app/index.html's
// OneSignal.init() points serviceWorkerPath at this file for the same reason.
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_VERSION = "wfn-app-v84";
// Listen recordings (human voice) live in their own cache, outside the
// versioned app caches, so an app update never deletes them.
const LISTEN_CACHE = "wfn-listen";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const BIBLE_CACHE = `${CACHE_VERSION}-bible`;

const SHELL_ASSETS = [
  "/app/",
  "/app/index.html",
  "/app/classic.html",
  "/app/manifest.webmanifest",
  "/app/css/app2.css",
  "/app/css/wordclimb.css",
  "/app/js2/core.js",
  "/app/js2/today.js",
  "/app/js2/bible.js",
  "/app/js2/pages.js",
  "/app/js2/you.js",
  "/app/js2/extras.js",
  "/app/js2/climb-refs.js",
  "/app/js2/climb.js",
  "/app/js2/voice.js",
  "/app/js/bible.js",
  "/app/js2/content.js",
  "/app/vendor/qrcode.js",
  "/app/js/store.js",
  "/app/js/wfn-tts.js",
  "/app/js/wfn-lookup.js",
  "/app/js/wordclimb.js",
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

// Fetch past the browser's HTTP cache (GitHub Pages serves max-age=600), so
// a fresh deploy of the daily verse/sermon/declaration shows up immediately
// instead of up to 10 minutes later. "no-cache" still revalidates with the
// ETag, so unchanged files cost almost nothing.
function freshFetch(req) {
  if (req.mode === "navigate") return fetch(req.url, { cache: "no-cache", credentials: "same-origin" });
  return fetch(new Request(req, { cache: "no-cache" }));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Listen recordings: played from this phone once saved (works offline),
  // otherwise streamed from the site while a full copy is saved for next time.
  if (url.pathname.startsWith("/audio/listen/") && url.pathname.endsWith(".mp3")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(LISTEN_CACHE);
        const cached = await cache.match(url.pathname);
        if (cached) return rangeFrom(req, cached);
        event.waitUntil(
          fetch(url.pathname).then(async (res) => {
            if (!res.ok || res.status !== 200) return;
            await cache.put(url.pathname, res);
            const keys = await cache.keys();
            for (const k of keys.slice(0, Math.max(0, keys.length - 12))) await cache.delete(k);
          }).catch(() => {})
        );
        return fetch(req);
      })()
    );
    return;
  }

  // Today's content snapshot (verse/sermon/declaration): network-first,
  // so the website never shows yesterday's cached content — falls back to
  // cache only when offline.
  if (url.pathname === "/app/data/today.json" || url.pathname === "/app/data/dream-archive.json") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(BIBLE_CACHE);
        try {
          const fresh = await freshFetch(req);
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
          const fresh = await freshFetch(req);
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

// Serve a byte range from a saved recording (audio players ask for ranges).
async function rangeFrom(req, res) {
  const range = req.headers.get("range");
  if (!range) return res;
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  let start = 0, end = size - 1;
  if (m) {
    if (m[1] === "" && m[2] !== "") { start = Math.max(0, size - +m[2]); }
    else { start = +m[1] || 0; if (m[2] !== "") end = Math.min(+m[2], size - 1); }
  }
  if (start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: { "Content-Type": "audio/mpeg", "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" },
  });
}

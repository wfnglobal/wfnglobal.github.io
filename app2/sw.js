// WFN App 2.0 service worker: offline shell, offline Bible, fresh daily content.
const V = "wfn2-v1";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./css/app.css",
  "./js/core.js", "./js/today.js", "./js/bible.js", "./js/pages.js", "./js/you.js", "./js/extras.js", "./js/content.js",
  "./vendor/qrcode.js", "/app/js/store.js", "/app/js/wordclimb.js", "/app/css/wordclimb.css",
  "/app/icons/icon-192.png", "/app/icons/icon-512.png",
];
self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(V + "-shell");
    await c.addAll(SHELL);
    try {
      const b = await caches.open(V + "-bible");
      const idx = await (await fetch("/app/data/bible/index.json")).json();
      await b.addAll(["/app/data/bible/index.json", ...idx.map((x) => "/app/data/bible/" + x.slug + ".json")]);
    } catch (err) {}
    self.skipWaiting();
  })());
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("wfn2-") && !k.startsWith(V)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
const FRESH = /\/app\/data\/(today|dream-archive)\.json$|\/articles\/|\/js\/content\.js$/;
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (FRESH.test(url.pathname) || req.mode === "navigate") {
    e.respondWith(fetch(req, { cache: "no-cache" }).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(V + "-data").then((c) => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok && /\/app\/data\/|\/assets\/|\/app2\/|\/app\/(js|css|icons)\//.test(url.pathname)) { const copy = r.clone(); caches.open(V + (url.pathname.includes("/bible/") ? "-bible" : "-data")).then((c) => c.put(req, copy)); }
    return r;
  })));
});

// WFN App 2.0 — core: helpers, icons, settings, data loading, router.
(function () {
  "use strict";
  const C = window.WFN_CONTENT || {};
  const S = window.WFNStore;
  const BASE = window.WFN_BASE || "/";
  const DATA = BASE + "app/data/";

  // ---------- helpers ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function read(k, f) { try { const v = localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function asset(p) { return p && p.charAt(0) === "/" ? BASE + p.slice(1) : p; }
  function plain(html) { return String(html || "").replace(/<[^>]*>/g, ""); }
  function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  // ---------- icons (24px line icons) ----------
  const P = {
    today: "M3 18h18M7 18a5 5 0 0 1 10 0M12 4v3M4.9 9.9l2.1 2.1M19.1 9.9L17 12",
    bible: "M2 5.5c3-1.5 6.5-1.5 10 1 3.5-2.5 7-2.5 10-1V19c-3-1.5-6.5-1.5-10 1-3.5-2.5-7-2.5-10-1zM12 6.5V20",
    prayer: "M12 3c-3 2.5-5 5.5-5 9v8M12 3c3 2.5 5 5.5 5 9v8M12 3v17M4 20h16",
    library: "M4 4h4v16H4zM10 4h4v16h-4zM16.5 4.5l3.5 1-4 15-3.5-1",
    you: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
    back: "M15 18l-6-6 6-6",
    chev: "M9 6l6 6-6 6",
    down: "M6 9l6 6 6-6",
    close: "M6 6l12 12M18 6L6 18",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
    bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
    share: "M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5",
    copy: "M9 9h11v11H9zM5 15H4V4h11v1",
    link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
    save: "M6 3h12v18l-6-4-6 4z",
    listen: "M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13",
    stop: "M7 7h10v10H7z",
    pause: "M8 5v14M16 5v14",
    play: "M8 5.5v13l10.5-6.5z",
    plus: "M12 5v14M5 12h14",
    check: "M5 12.5l4.5 4.5L19 7",
    pen: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
    hl: "M4 20h16M7 16l9.5-9.5a2.1 2.1 0 0 1 3 3L10 19H7z",
    moon: "M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z",
    sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
    mute: "M11 5L6 9H3v6h3l5 4zM16 9l6 6M22 9l-6 6",
    timer: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2M9 2h6",
    people: "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a6 6 0 0 1 12 0M13 20a5 5 0 0 1 9 0",
    half: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18M12 8h7M12 13h9M12 18h6",
    expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
    flame: "M12 22c4 0 7-2.7 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1.5-1-2-2.5-2-4-3 2.5-5 5.5-5 8 0 4.3 3 7 7 7z",
    gate: "M5 21V10a7 7 0 0 1 14 0v11M3 21h18M9 21v-6a3 3 0 0 1 6 0v6",
    mount: "M3 20l6-10 4 6 2-3 6 7zM14 6h.01M16 4l2 2",
    hand: "M12 10.6c-1.2-2.4-5-2.2-5 .6 0 2 2.6 3.6 5 5.4 2.4-1.8 5-3.4 5-5.4 0-2.8-3.8-3-5-.6zM2 15h3l3 3h7a2 2 0 0 0 0-4M2 21h13l6.5-4.5a1.8 1.8 0 0 0-2.3-2.7L15 16.5",
    qr: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3M21 14v.01M17 21h4v-4M14 18v3",
    camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    torch: "M7 2h10v5l-3 4v11h-4V11L7 7zM7 7h10",
    lock: "M4 10h16v11H4zM8 10V7a4 4 0 0 1 8 0v3",
    shield: "M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6zM9 12l2 2 4-4",
    history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2",
    gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
    aa: "M3 18L8 6l5 12M5 14h6M15 18v-1.5M15 12.5a3 3 0 0 1 6 0V18M21 15h-4a2 2 0 0 0 0 4h1a3 3 0 0 0 3-3",
    trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
    sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
    film: "M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4",
    image: "M4 18l5-6 4 4 3-3 4 5M4 5h16v14H4zM9 9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z",
    pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    download: "M12 4v12M7 11l5 5 5-5M5 20h14",
    home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
    info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.01",
    summary: "M4 6h16M4 11h16M4 16h10",
    note: "M5 4h14v12l-4 4H5zM15 20v-4h4",
    cross: "M12 3v18M7 8h10",
    sermons: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM19 11a7 7 0 0 1-14 0M12 19v3",
    mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM19 11a7 7 0 0 1-14 0M12 19v3",
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
    wave: "M6 10v4M10 6v12M14 9v6M18 7v10",
    layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
    jump: "M4 6h16M4 12h10M4 18h7",
    related: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
    send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  };
  function icon(name, cls) {
    return `<svg class="i ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[name] || ""}"/></svg>`;
  }
  function emblem(size, ground) {
    const g = ground || "#1F1D1B";
    const leaf = "M24 7 C 31 14, 33 21, 24 25 C 15 21, 17 14, 24 7 Z";
    return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" role="img" aria-label="Word and Faith Network"><circle cx="24" cy="24" r="23" fill="${g}"/><path d="${leaf}" fill="#E2A85A"/><path transform="rotate(120 24 25)" d="${leaf}" fill="#7CC4C0"/><path transform="rotate(240 24 25)" d="${leaf}" fill="#9DB3D9"/><circle cx="24" cy="25" r="4.5" fill="${g}"/><circle cx="24" cy="25" r="2.1" fill="#fff"/></svg>`;
  }

  // ---------- settings ----------
  const SET_KEY = "wfn2-settings";
  const DEFAULTS = { theme: "auto", read: "light", size: 19, font: "literata", nums: true, red: false, focus: false, lookup: true, give: { currency: "CAD", amount: 50, fund: "most", method: "applepay", monthly: false } };
  const FONTS = [
    { id: "literata", name: "Literata", hint: "Default · made for long reading on screens", stack: '"Literata", Georgia, serif' },
    { id: "source", name: "Source Serif", hint: "Classic and crisp, like a well-printed Bible", stack: '"Source Serif 4", Georgia, serif' },
    { id: "spectral", name: "Spectral", hint: "Elegant and light, for quiet reading", stack: "Spectral, Georgia, serif" },
    { id: "instrument", name: "Instrument Sans", hint: "Clean and modern, no serifs", stack: '"Instrument Sans", system-ui, sans-serif' },
    { id: "atkinson", name: "Atkinson Hyperlegible", hint: "Designed for low vision and easy reading", stack: '"Atkinson Hyperlegible", system-ui, sans-serif' },
  ];
  const READ_THEMES = [
    { id: "light", name: "Light", bg: "#FFFFFF", ink: "#1F1D1B" },
    { id: "linen", name: "Linen", bg: "#F0ECE4", ink: "#2A2622" },
    { id: "mint", name: "Mint", bg: "#EAF1EC", ink: "#1A2022" },
    { id: "dark", name: "Dark", bg: "#141312", ink: "#EFEBE4" },
  ];
  let settings = Object.assign({}, DEFAULTS, read(SET_KEY, {}));
  settings.give = Object.assign({}, DEFAULTS.give, settings.give || {});
  function setSetting(k, v) { settings[k] = v; write(SET_KEY, settings); applySettings(); }
  function applySettings() {
    const root = document.documentElement;
    root.classList.toggle("reduce-motion", !!settings.reduceMotion);
    const dark = settings.theme === "dark" || (settings.theme === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    root.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem("wfn2-theme", settings.theme); } catch (e) {}
    const f = FONTS.find((x) => x.id === settings.font) || FONTS[0];
    root.style.setProperty("--read-font", f.stack);
    root.style.setProperty("--read-size", settings.size + "px");
  }
  if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applySettings);
  applySettings();

  // ---------- profile (extends the old app's profile record) ----------
  const PHOTO_KEY = "wfn2-photo";
  function profile() {
    const p = S.getProfile() || {};
    return { name: p.name || "", initial: p.initial || (p.name ? p.name.charAt(0).toUpperCase() : "W"), photo: read(PHOTO_KEY, null), since: read("wfn2-since", null) };
  }
  if (!read("wfn2-since", null)) write("wfn2-since", Date.now());
  function avatar(cls) {
    const p = profile();
    if (p.photo) return `<img class="avatar ${cls || ""}" src="${p.photo}" alt="">`;
    return `<span class="avatar ${cls || ""}" aria-hidden="true">${esc(p.initial)}</span>`;
  }

  // ---------- data ----------
  const cache = {};
  function getJSON(path, opts) {
    if (!opts && cache[path]) return cache[path];
    const p = fetch(DATA + path, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    cache[path] = p.catch((e) => { delete cache[path]; throw e; });
    return cache[path];
  }
  // Today's content: today.json (written by the nightly tasks) with the
  // bundled content as a fallback when offline or not yet fetched.
  function today() {
    return getJSON("today.json").catch(() => ({})).then((t) => {
      const study0 = (C.BIBLE_STUDY || [])[0] || {};
      const sermon0 = (C.SERMONS || [])[0] || {};
      const v0 = (C.VERSES || [])[0] || {};
      const verse = t.verse && t.verse.text ? t.verse : v0;
      const sermon = Object.assign({}, sermon0, t.sermon && t.sermon.slug === sermon0.slug ? t.sermon : (t.sermon || {}));
      const study = Object.assign({}, study0, t.bibleStudy && t.bibleStudy.slug === study0.slug ? t.bibleStudy : {});
      if (t.bibleStudy && t.bibleStudy.slug && t.bibleStudy.slug !== study0.slug) Object.assign(study, t.bibleStudy);
      const declaration = t.declaration && t.declaration.lines ? t.declaration : C.DECLARATION;
      const dreamFire = t.dreamFire && t.dreamFire.points ? Object.assign({}, C.DREAM_FIRE_PRAYER, t.dreamFire) : C.DREAM_FIRE_PRAYER;
      return { verse, sermon, study, declaration, dreamFire, night: C.NIGHT_PRAYER };
    });
  }
  function sermonPoster(slug) { return BASE + "assets/posters/sermons/" + slug + ".jpg"; }
  function bookIndex() { return getJSON("bible/index.json"); }
  function book(slug) { return getJSON("bible/" + slug + ".json"); }

  // ---------- intro cards (the classic app's welcome pages, kept short) ----------
  function intro(key, o) {
    if (read("wfn2-intro-" + key, false)) return "";
    return `<section class="intro-card" id="intro-${key}" aria-label="${esc(o.title)}">
      <span class="eyebrow ${o.tone || "amber"}">${esc(o.eyebrow)}</span>
      <h2>${esc(o.title)}</h2>
      ${(o.body || []).map((p) => `<p>${esc(p)}</p>`).join("")}
      ${o.list ? `<ol class="intro-list">${o.list.map(([a, b]) => `<li><b>${esc(a)}</b> ${esc(b)}</li>`).join("")}</ol>` : ""}
      ${o.verse ? `<p class="intro-verse">“${esc(o.verse)}” <span>${esc(o.ref)}</span></p>` : ""}
      <button class="btn sm soft" type="button" data-intro-hide="${key}">Got it, don’t show again</button>
    </section>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-intro-hide]");
    if (!b) return;
    write("wfn2-intro-" + b.dataset.introHide, true);
    const card = document.getElementById("intro-" + b.dataset.introHide);
    if (card) card.remove();
  });

  // ---------- ui bits ----------
  let toastTimer;
  function toast(msg) {
    let t = $(".toast");
    if (t) t.remove();
    t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 2400);
  }
  function sheet(html, onMount) {
    closeSheet();
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    const el = document.createElement("section");
    el.className = "sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    el.innerHTML = '<span class="grab" aria-hidden="true"></span>' + html;
    scrim.addEventListener("click", closeSheet);
    document.body.append(scrim, el);
    document.body.style.overflow = "hidden";
    const first = el.querySelector("button, a, input, textarea");
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 50);
    el.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(); });
    if (onMount) onMount(el);
    return el;
  }
  function closeSheet() {
    $$(".scrim, .sheet").forEach((n) => n.remove());
    document.body.style.overflow = "";
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
  // In-app confirmation (browser confirm() is blocked in some app views).
  function ask(msg, okLabel, onOk) {
    sheet(`<div class="sheet-head"><h2>${esc(msg)}</h2></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn lg soft" data-close>Cancel</button><button class="btn lg dark" id="askOk">${esc(okLabel || "Yes")}</button></div>`, (el) => {
      $("#askOk", el).onclick = () => { closeSheet(); onOk(); };
    });
  }
  async function shareOrCopy(data) {
    if (navigator.share) { try { await navigator.share(data); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    copyText([data.text, data.url].filter(Boolean).join("\n"));
  }
  function copyText(text) {
    const done = () => toast("Copied");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { toast("Could not copy"); }
    ta.remove();
  }

  // ---------- Read aloud ----------
  // Uses the shared WFN voice engine (app/js/wfn-tts.js): the voice and
  // speed chosen in Listen apply everywhere. A listen button shows Stop
  // while it reads, and a second tap stops it.
  const TTS = () => window.WFNTTS && window.WFNTTS.supported ? window.WFNTTS : null;
  let activeBtn = null;
  function setBtn(btn, on) {
    if (!btn) return;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Stop reading" : (btn.dataset.label || "Listen"));
    const svg = btn.querySelector("svg.i");
    if (svg) svg.querySelector("path").setAttribute("d", P[on ? "stop" : "listen"]);
    const txt = btn.querySelector("[data-ltxt]");
    if (txt) txt.textContent = on ? "Stop" : "Listen";
  }
  function sentences(text) {
    return String(text).replace(/\s+/g, " ").match(/[^.!?;:]+[.!?;:]*["”’)]?\s*/g) || [text];
  }
  // A listen button is identified by its key (id), not the element, so a
  // re-rendered screen still knows that this button's reading is playing.
  let activeKey = null;
  function keyOf(btn) { return btn ? (btn.id || btn.dataset.say || "btn") + "@" + location.hash : null; }
  function speak(text, btn) {
    const t = TTS();
    if (!t) { toast("Read aloud isn't supported on this browser"); return; }
    const key = keyOf(btn);
    if (t.getState() !== "idle") {
      const was = activeKey;
      stopSpeaking();
      if (was && was === key) return; // second tap on the same button = Stop
    }
    const items = Array.isArray(text) ? text : sentences(text).map((x) => x.trim()).filter(Boolean);
    activeBtn = btn || null; activeKey = key;
    if (btn) { if (!btn.dataset.label) btn.dataset.label = btn.getAttribute("aria-label") || "Listen"; setBtn(btn, true); }
    t.speak(items);
  }
  // Stop hard: some phones (iOS Safari especially) keep talking after a
  // single cancel(), so cancel again a moment later.
  function stopSpeaking() {
    const t = TTS();
    if (t) t.stop();
    if ("speechSynthesis" in window) {
      // iOS ignores cancel() while paused or mid-utterance unless paused first.
      try { speechSynthesis.pause(); } catch (e) {}
      try { speechSynthesis.cancel(); } catch (e) {}
      setTimeout(() => { try { if (!t || t.getState() === "idle") speechSynthesis.cancel(); } catch (e) {} }, 80);
      setTimeout(() => { try { if (!t || t.getState() === "idle") speechSynthesis.cancel(); } catch (e) {} }, 400);
    }
    if (activeBtn) setBtn(activeBtn, false);
    $$("[aria-pressed='true'][data-label]").forEach((b) => setBtn(b, false));
    activeBtn = null; activeKey = null;
  }
  function wireTTSState() {
    const t = TTS();
    if (!t) return setTimeout(wireTTSState, 300);
    t.onState((st) => {
      if (st === "idle") { if (activeBtn) setBtn(activeBtn, false); activeBtn = null; activeKey = null; }
      else if (activeKey) { const b = $$("button").find((x) => keyOf(x) === activeKey); if (b && b !== activeBtn) { activeBtn = b; setBtn(b, true); } }
      nowPlaying(st);
    });
  }
  // A small "now reading" bar with Pause and Stop, shown whenever anything
  // is being read aloud, so Stop is always one tap away.
  function nowPlaying(st) {
    let bar = $("#nowPlaying");
    if (st === "idle") { if (bar) bar.remove(); return; }
    if (!bar) {
      bar = document.createElement("div"); bar.id = "nowPlaying"; bar.className = "now-playing"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Reading aloud");
      bar.innerHTML = `<span class="np-wave" aria-hidden="true"><i></i><i></i><i></i></span><span class="np-t" id="npT">Reading aloud</span><button class="np-b" id="npP" type="button"></button><button class="np-b np-stop" id="npS" type="button">${icon("stop", "sm")}Stop</button>`;
      document.body.appendChild(bar);
      $("#npS").onclick = () => stopSpeaking();
      $("#npP").onclick = () => { const t = TTS(); if (!t) return; if (t.getState() === "playing") t.pause(); else t.resume(); };
    }
    $("#npP").innerHTML = st === "paused" ? icon("play", "sm") + "Resume" : icon("pause", "sm") + "Pause";
    $("#npT").textContent = st === "paused" ? "Paused" : "Reading aloud";
    bar.classList.toggle("paused", st === "paused");
  }
  setTimeout(wireTTSState, 0);

  // What "Listen" reads on the current screen. Views may register a
  // function returning a list of sentences; otherwise the screen's own
  // headings and paragraphs are read.
  let readable = null;
  function setReadable(fn) { readable = fn || null; }
  function getReadable() {
    if (readable) { try { const r = readable(); if (r && r.length) return r; } catch (e) {} }
    const out = [], seen = new Set();
    $$("#main h1, #main h2, #main h3, #main p, #main li, #main blockquote p, #main .serif").forEach((el) => {
      if (el.closest("button, .nav, .sheet, [data-noread]")) return;
      const t = el.textContent.replace(/\s+/g, " ").trim();
      if (t.length > 1 && !seen.has(t)) { seen.add(t); out.push(t); }
    });
    return out;
  }

  // ---------- nav + router ----------
  const TABS = [["today", "Today", ""], ["bible", "Bible", "bible"], ["sermons", "Sermons", "sermons"], ["prayer", "Prayer", "prayer"], ["library", "Library", "library"], ["you", "You", "you"]];
  const TAB_OF = { "": "today", home: "today", bible: "bible", search: "bible", prayer: "prayer", dreams: "prayer", library: "library", sermons: "sermons", sermon: "sermons", studies: "bible", study: "bible", plan: "library", book: "library", you: "you", kept: "you", journal: "you", note: "you", invite: "you", scan: "you", give: "you", settings: "you", jesus: "today", climb: "today" };
  const NO_NAV = { scan: 1, invite: 1, climb: 1 };
  function renderNav(active) {
    $("#nav").innerHTML = TABS.map(([k, label, h]) =>
      `<a href="#/${h}" ${k === active ? 'aria-current="page"' : ""}><span class="pill">${icon(k === "today" ? "today" : k)}</span>${label}</a>`).join("");
  }
  const views = {};
  function view(name, fn) { views[name] = fn; }
  let lastHash = "";
  const scrollMem = {};
  function route() {
    closeSheet(); stopSpeaking(); readable = null; try { if (window.WFNGlass && document.querySelector("#wfnGlass.open")) window.WFNGlass.close(); } catch (e) {} $$(".selbar").forEach((n) => n.remove());
    if (window.WFNGame && !/^#\/climb/.test(location.hash)) { try { window.WFNGame.unmount(); } catch (e) {} }
    const hash = location.hash.replace(/^#\/?/, "");
    scrollMem[lastHash] = window.scrollY;
    lastHash = hash;
    const parts = hash.split("/").filter(Boolean).map(decodeURIComponent);
    const key = parts[0] || "";
    const fn = views[key] || views[""];
    const tab = TAB_OF[key] || "today";
    renderNav(tab);
    const hide = NO_NAV[key] || (key === "bible" && parts.length >= 3);
    $("#nav").hidden = !!hide;
    $("#app").classList.toggle("no-nav", !!hide); document.body.classList.toggle("no-nav", !!hide);
    const main = $("#main");
    main.className = "view";
    main.innerHTML = "";
    void main.offsetWidth;
    Promise.resolve(fn(main, parts.slice(1))).then(() => {
      window.scrollTo(0, scrollMem[hash] && navType === "back" ? scrollMem[hash] : 0);
      navType = "push";
    }).catch((e) => { console.error(e); main.innerHTML = `<div class="page"><div class="empty">Something didn't load. Check your connection and try again.</div></div>`; });
    try { S.recordActivityToday(); } catch (e) {}
  }
  let navType = "push";
  window.addEventListener("popstate", () => { navType = "back"; });
  function go(h) { location.hash = h; }
  function back(fallback) {
    if (history.length > 1 && document.referrer !== undefined && sessionStorage.getItem("wfn2-nav")) history.back();
    else go(fallback || "#/");
  }
  window.addEventListener("hashchange", () => { try { sessionStorage.setItem("wfn2-nav", "1"); } catch (e) {} route(); });
  function topbar(title, opts) {
    opts = opts || {};
    const backHref = opts.back || "#/";
    return `<header class="topbar ${opts.cls || ""}">
      <a class="icon-btn ${opts.hero ? "on-hero" : ""}" href="${backHref}" data-back aria-label="Back">${icon("back")}</a>
      <h1>${esc(title)}</h1>
      ${opts.right || '<span class="spacer44"></span>'}
    </header>`;
  }
  // Back buttons use real history when we came from inside the app.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-back]");
    if (!b) return;
    try { if (sessionStorage.getItem("wfn2-nav") && history.length > 1) { e.preventDefault(); history.back(); } } catch (err) {}
  });

  // ---------- scroll: tab bar and chapter arrows slide away while reading ----------
  // Scrolling down hides the tab bar, the reader's tool row and the chapter
  // arrows; scrolling up, or reaching the top or the end, brings them back.
  // The arrows also drift down the screen as you read through a chapter.
  function setupScroll() {
    let lastY = window.scrollY, idle = null;
    const show = () => document.body.classList.remove("chrome-hidden");
    const hide = () => document.body.classList.add("chrome-hidden");
    window.addEventListener("scroll", () => {
      const y = window.scrollY, d = y - lastY;
      if (y < 40) show(); else if (d > 6) hide(); else if (d < -6) show();
      lastY = y;
      clearTimeout(idle); idle = setTimeout(() => { if (window.scrollY + innerHeight >= document.documentElement.scrollHeight - 4) show(); }, 400);
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const top = (46 + Math.min(1, Math.max(0, y / max)) * 16).toFixed(1) + "%";
      $$(".ch-fab").forEach((f) => { f.style.top = top; });
      const tt = $("#toTop"); if (tt) tt.classList.toggle("show", y > 900);
    }, { passive: true });
    const tt = document.createElement("button");
    tt.id = "toTop"; tt.className = "to-top"; tt.type = "button"; tt.setAttribute("aria-label", "Back to top");
    tt.innerHTML = '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
    tt.onclick = () => window.scrollTo({ top: 0, behavior: settings.reduceMotion ? "auto" : "smooth" });
    document.body.appendChild(tt);
  }

  function start() {
    setupScroll();
    route();
    if ("serviceWorker" in navigator && location.pathname.indexOf("/app/") === 0) {
      navigator.serviceWorker.register("/app/sw.js", { scope: "/app/" }).then((reg) => {
        // Check for a new version whenever the app comes back to the front.
        document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update().catch(() => {}); });
      }).catch(() => {});
      // When a new version takes over, reload once so the phone shows it
      // straight away instead of on the next launch.
      let reloaded = false;
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloaded || !hadController) return;
        if (document.querySelector(".sheet, .selbar, #nowPlaying")) return; // don't interrupt someone mid-task
        reloaded = true; location.reload();
      });
    }
    refreshContent();
  }

  // The nightly tasks write sermons, studies and prayers into app/js/app.js.
  // content.js is a snapshot of those arrays for an instant first paint;
  // here we read the live file and, if anything moved on, swap it in.
  const NAMES = ["VERSES", "DECLARATION", "NIGHT_PRAYER", "DREAM_FIRE_PRAYER", "SERMONS", "BIBLE_STUDY", "PRAYER_POINTS", "LIBRARY_BOOKS", "READING_PLANS"];
  function grab(src, name) {
    const m = new RegExp("(?:const|var|let)\\s+" + name + "\\s*=\\s*").exec(src);
    if (!m) return null;
    let i = m.index + m[0].length, depth = 0, str = null, escd = false;
    const start = i;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (str) { if (escd) escd = false; else if (ch === "\\") escd = true; else if (ch === str) str = null; continue; }
      if (ch === '"' || ch === "'" || ch === "`") { str = ch; continue; }
      if (ch === "/" && src[i + 1] === "/") { i = src.indexOf("\n", i); if (i < 0) break; continue; }
      if (ch === "[" || ch === "{") depth++;
      if (ch === "]" || ch === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
    }
    return null;
  }
  function sig(c) { try { return [c.VERSES[0].ref, c.SERMONS[0].slug, c.BIBLE_STUDY[0].slug, c.DREAM_FIRE_PRAYER.title, (c.DECLARATION.lines || [])[0], c.SERMONS.length, c.BIBLE_STUDY.length].join("|"); } catch (e) { return ""; } }
  function refreshContent() {
    fetch(BASE + "app/js/app.js", { cache: "no-cache" }).then((r) => (r.ok ? r.text() : "")).then((src) => {
      if (!src) return;
      const fresh = {};
      for (const n of NAMES) {
        const lit = grab(src, n);
        if (!lit) return;
        try { fresh[n] = Function('"use strict";return (' + lit + ")")(); } catch (e) { return; }
      }
      if (sig(fresh) === sig(C)) return;
      Object.assign(C, fresh);
      const k = location.hash.replace(/^#\/?/, "").split("/")[0];
      if (["", "home", "library", "prayer", "sermons", "studies", "study", "dreams"].includes(k) && !document.querySelector(".sheet")) route();
    }).catch(() => {});
  }

  window.WFN2 = { C, S, BASE, DATA, $, $$, esc, read, write, asset, plain, slugify, icon, emblem, settings: () => settings, setSetting, FONTS, READ_THEMES,
    profile, avatar, PHOTO_KEY, getJSON, today, sermonPoster, bookIndex, book, toast, sheet, closeSheet, ask, intro, shareOrCopy, copyText, speak, stopSpeaking, setReadable, getReadable, sentences,
    view, go, back, topbar, start, route };
})();

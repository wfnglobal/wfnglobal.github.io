(function () {
  "use strict";

  const viewEl = document.getElementById("view");
  const titleEl = document.getElementById("headerTitle");
  const backEl = document.getElementById("appBack");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const sheetEl = document.getElementById("sheet");
  const sheetScrimEl = document.getElementById("sheetScrim");
  const sheetBodyEl = document.getElementById("sheetBody");

  // ---------------------------------------------------------------------
  // Bottom sheet: generic modal used for verse actions, notes, profile edit
  // ---------------------------------------------------------------------

  function openSheet(html) {
    sheetBodyEl.innerHTML = html;
    sheetEl.hidden = false;
    sheetScrimEl.hidden = false;
    requestAnimationFrame(() => {
      sheetEl.classList.add("show");
      sheetScrimEl.classList.add("show");
    });
  }
  function closeSheet() {
    sheetEl.classList.remove("show");
    sheetScrimEl.classList.remove("show");
    setTimeout(() => {
      sheetEl.hidden = true;
      sheetScrimEl.hidden = true;
      sheetBodyEl.innerHTML = "";
    }, 200);
  }
  sheetScrimEl.addEventListener("click", closeSheet);

  // ---------------------------------------------------------------------
  // Content that mirrors wfnglobal.org (kept as small static lists here so
  // the app works fully offline; update alongside the website).
  // ---------------------------------------------------------------------

  const VERSES = [
    { text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary.", ref: "Isaiah 40:31" },
    { text: "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.", ref: "Psalm 23:1-2" },
    { text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", ref: "Jeremiah 29:11" },
    { text: "Pray without ceasing. Continue earnestly in prayer, being vigilant in it with thanksgiving.", ref: "1 Thessalonians 5:17; Colossians 4:2" },
    { text: "Blessed be the Lord, who daily loadeth us with benefits, even the God of our salvation.", ref: "Psalm 68:19" },
    { text: "For the word of God is living and powerful, and sharper than any two-edged sword, piercing even to the division of soul and spirit, and of joints and marrow, and is a discerner of the thoughts and intents of the heart.", ref: "Hebrews 4:12" },
    { text: "For God is not unrighteous to forget your work and labour of love, which ye have shewed toward his name, in that ye have ministered to the saints, and do minister.", ref: "Hebrews 6:10" },
    { text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.", ref: "James 1:5" },
    { text: "For the Son of man is not come to destroy men's lives, but to save them.", ref: "Luke 9:56" },
    { text: "Commit thy works unto the LORD, and thy thoughts shall be established.", ref: "Proverbs 16:3" }
  ];

  const SERMONS = [
    { slug: "his-mercies-are-new-every-morning", title: "His Mercies Are New Every Morning", ref: "Lamentations 2 & 3", date: "October 23, 2026", excerpt: "The same prophet who wept over the ruins of Zion also wrote, \"Great is thy faithfulness\" — a study on how hope survives the worst chapter." },
    { slug: "when-you-pray-why-worry", title: "When You Pray, Why Do You Still Worry?", ref: "Philippians 4", date: "October 22, 2026", excerpt: "Prayer and anxiety can't occupy the same heart for long — one of them has to go." },
    { slug: "show-up-for-your-people", title: "Show Up for Your People", ref: "Ruth 1", date: "October 22, 2026", excerpt: "Ruth didn't just say the words. She stayed — a study on what it means to actually show up." },
    { slug: "ye-ask-amiss", title: "Ye Ask, and Receive Not", ref: "James 4", date: "October 21, 2026", excerpt: "Not every unanswered prayer is a closed door. Some are a mirror — a study on asking amiss." },
    { slug: "the-word-is-living-and-powerful", title: "The Word Is Living and Powerful", ref: "Hebrews 4", date: "October 20, 2026", excerpt: "Sharper than any two-edged sword — it does not just inform you. It divides, exposes, and discerns." },
    { slug: "come-boldly-to-the-throne-of-grace", title: "Come Boldly to the Throne of Grace", ref: "Hebrews 4", date: "October 19, 2026", excerpt: "You were never meant to approach God with fear. A study on mercy, grace, and the boldness we have in Christ." },
    { slug: "remember-the-sabbath", title: "Remember the Sabbath Day, to Keep It Holy", ref: "Exodus 20", date: "October 18, 2026", excerpt: "Six days you labor and do all your work, but the seventh belongs to the Lord." },
    { slug: "what-shall-we-say-then", title: "What Shall We Say Then?", ref: "Romans 6", date: "October 17, 2026", excerpt: "Shall we continue in sin, that grace may abound? God forbid." },
    { slug: "the-word-faith-and-prayer", title: "The Word, Faith, and Prayer", ref: "Foundational", date: "October 16, 2026", excerpt: "Our founding teaching — why Word and Faith Network exists." }
  ];

  const PRAYER_POINTS = [
    "Thank God for His faithfulness over your life, your family, and this new day.",
    "Declare Romans 10:17 over your faith — that it is rising as you hear the Word.",
    "Bring the specific need weighing on you right now to God in prayer, by name.",
    "Pray for someone else today — a family member, a friend, a need you know of.",
    "Ask for wisdom for every decision in front of you this week (James 1:5).",
    "Thank God in advance for the answer, believing it is already done (Mark 11:24)."
  ];

  function dayIndex(len) {
    const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return doy % len;
  }

  // ---------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------

  function esc(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function setHeader(title, showBack) {
    titleEl.textContent = title;
    backEl.hidden = !showBack;
    document.getElementById("headerLogo").style.display = showBack ? "none" : "";
  }

  function setActiveTab(name) {
    tabBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  }

  function lastBiblePosition() {
    try {
      const raw = localStorage.getItem("wfn-app-bible-last");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function saveBiblePosition(slug, name, chapter) {
    try {
      localStorage.setItem("wfn-app-bible-last", JSON.stringify({ slug, name, chapter, at: Date.now() }));
    } catch (e) {}
  }

  // Reading text size for the Bible — a few steps, remembered on this device,
  // so anyone who needs larger type (or just prefers it) only has to set it once.
  const READER_SIZES = [19, 21, 24, 27, 31, 35];
  function getReaderSizeIndex() {
    try {
      const raw = parseInt(localStorage.getItem("wfn-app-reader-size-idx"), 10);
      return isNaN(raw) ? 1 : Math.min(Math.max(raw, 0), READER_SIZES.length - 1);
    } catch (e) {
      return 1;
    }
  }
  function applyReaderSize(idx) {
    document.documentElement.style.setProperty("--verse-font-size", READER_SIZES[idx] + "px");
    try { localStorage.setItem("wfn-app-reader-size-idx", String(idx)); } catch (e) {}
  }

  // Reading font — a short, deliberate list including an accessibility-first face.
  const READER_FONTS = [
    { key: "sans", label: "Sans", stack: "'Inter', -apple-system, system-ui, sans-serif" },
    { key: "serif", label: "Serif", stack: "'Fraunces', Georgia, serif" },
    { key: "accessible", label: "Accessible", stack: "'Atkinson Hyperlegible', Arial, sans-serif" }
  ];
  function getReaderFont() {
    try { return localStorage.getItem("wfn-app-reader-font") || "serif"; } catch (e) { return "serif"; }
  }
  function applyReaderFont(key) {
    const f = READER_FONTS.find((x) => x.key === key) || READER_FONTS[0];
    document.documentElement.style.setProperty("--verse-font-family", f.stack);
    try { localStorage.setItem("wfn-app-reader-font", f.key); } catch (e) {}
  }

  // Reading background — photos behind the verse text, with a soft wash over them
  // so the text stays readable regardless of the image. All ten are free-license
  // (Unsplash License) photos; "Default" leaves the plain reading surface.
  const READER_BACKGROUNDS = [
    { key: "none", label: "Default" },
    { key: "sea", label: "Golden Hour Sea", url: "https://images.unsplash.com/photo-1567875278694-887f235162eb" },
    { key: "candle", label: "Candlelight", url: "https://images.unsplash.com/photo-1660985759158-76fc3fbc296f" },
    { key: "scripture", label: "Open Scripture", url: "https://images.unsplash.com/photo-1710921156556-9e2ae23f0164" },
    { key: "harvest", label: "Harvest Field", url: "https://images.unsplash.com/photo-1758573728869-d25eb4bafb67" },
    { key: "bokeh", label: "Warm Bokeh", url: "https://images.unsplash.com/photo-1749631931307-eb896adfa1e2" },
    { key: "glory", label: "Rays of Glory", url: "https://images.unsplash.com/photo-1780047053902-9bcf0f8af9fb" },
    { key: "dawn", label: "Misty Dawn", url: "https://images.unsplash.com/photo-1768069853451-4f6ad57d6917" },
    { key: "stars", label: "Starlit Sky", url: "https://images.unsplash.com/photo-1762474610289-baef9ce2f68e" },
    { key: "sky", label: "Open Sky", url: "https://images.unsplash.com/photo-1768667521251-e1ac74d831cd" },
    { key: "meadow", label: "Sunlit Meadow", url: "https://images.unsplash.com/photo-1480289873380-1797d1670768" }
  ];
  function getReaderBg() {
    try { return localStorage.getItem("wfn-app-reader-bg") || "none"; } catch (e) { return "none"; }
  }
  function applyReaderBg(key) {
    const b = READER_BACKGROUNDS.find((x) => x.key === key) || READER_BACKGROUNDS[0];
    try { localStorage.setItem("wfn-app-reader-bg", b.key); } catch (e) {}
    const el = document.getElementById("readerSurface");
    if (!el) return;
    if (!b.url) {
      el.style.background = "";
      el.removeAttribute("data-bg");
      return;
    }
    el.style.background =
      "linear-gradient(rgba(251,248,241,0.88), rgba(251,248,241,0.88)), url('" + b.url + "?w=1200&q=70&fm=jpg&auto=format&fit=crop') center/cover no-repeat";
    el.setAttribute("data-bg", b.key);
  }

  applyReaderSize(getReaderSizeIndex()); // apply immediately on app load, before any chapter renders
  applyReaderFont(getReaderFont());

  // ---- Appearance: Light / Dark / Auto theme, rotating card backgrounds,
  // and a Reduce Motion switch — all on-device, remembered per device. ----
  const THEME_KEY = "wfn-app-theme";
  const ROTATE_KEY = "wfn-app-rotate-bg";
  const MOTION_KEY = "wfn-app-reduce-motion";

  function getThemePref() {
    try { return localStorage.getItem(THEME_KEY) || "light"; } catch (e) { return "light"; }
  }
  function resolveTheme(pref) {
    if (pref === "auto") {
      try { return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; } catch (e) { return "light"; }
    }
    return pref === "dark" ? "dark" : "light";
  }
  function applyTheme(pref) {
    try { localStorage.setItem(THEME_KEY, pref); } catch (e) {}
    const resolved = resolveTheme(pref);
    document.documentElement.setAttribute("data-theme", resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#15120C" : "#1D1810");
  }
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (getThemePref() === "auto") applyTheme("auto");
    });
  } catch (e) {}

  function getRotatePref() {
    try { return localStorage.getItem(ROTATE_KEY) !== "0"; } catch (e) { return true; }
  }
  function setRotatePref(on) {
    try { localStorage.setItem(ROTATE_KEY, on ? "1" : "0"); } catch (e) {}
    document.documentElement.setAttribute("data-rotate", on ? "on" : "off");
  }
  function getMotionPref() {
    try { return localStorage.getItem(MOTION_KEY) === "1"; } catch (e) { return false; }
  }
  function setMotionPref(reduced) {
    try { localStorage.setItem(MOTION_KEY, reduced ? "1" : "0"); } catch (e) {}
    document.documentElement.setAttribute("data-motion", reduced ? "reduced" : "normal");
  }

  applyTheme(getThemePref());
  document.documentElement.setAttribute("data-rotate", getRotatePref() ? "on" : "off");
  document.documentElement.setAttribute("data-motion", getMotionPref() ? "reduced" : "normal");

  // Vibrant gradient "scenes" used behind the Verse of the Day and Today's
  // Declaration cards — cross-fading in pure CSS (see .bg-scene), so there's
  // nothing to tear down between views and nothing to fetch.
  const BG_SCENES = [
    "linear-gradient(155deg,#FDEBD3 0%,#FFB199 45%,#FF7E67 75%,#4A6FA5 100%)",
    "linear-gradient(155deg,#BDEFFF 0%,#4FC3C9 45%,#1F7A8C 75%,#0B4F6C 100%)",
    "linear-gradient(155deg,#FFF6B7 0%,#C9E265 45%,#6FAE4A 75%,#2E6E3E 100%)",
    "linear-gradient(155deg,#FFE9B3 0%,#FFB84D 45%,#E8792B 75%,#7A3E1D 100%)",
    "linear-gradient(155deg,#E6F4FF 0%,#9FD3FF 45%,#4FA3E3 75%,#1F5C99 100%)",
    "linear-gradient(155deg,#FFE2F0 0%,#FFB3D9 45%,#B98BFF 75%,#5B4B9E 100%)"
  ];
  function bgScenesHtml() {
    const step = 24 / BG_SCENES.length;
    return BG_SCENES.map((bg, i) => `<div class="bg-scene" style="background:${bg}; animation-delay:${(i * step).toFixed(2)}s;"></div>`).join("");
  }

  // Other Bible versions and translation are fetched live (all public-domain
  // versions, free APIs) — the bundled KJV above is what keeps the app's core
  // reading experience working fully offline.
  const BIBLE_API = "https://bible-api.com/";
  const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/";
  const TRANSLATE_API = "https://api.mymemory.translated.net/get";

  const BIBLE_VERSIONS = [
    { code: "kjv", name: "King James Version (offline)" },
    { code: "web", name: "World English Bible" },
    { code: "asv", name: "American Standard Version" },
    { code: "bbe", name: "Bible in Basic English" },
    { code: "darby", name: "Darby Translation" },
    { code: "ylt", name: "Young's Literal Translation" },
    { code: "dra", name: "Douay-Rheims" },
    { code: "webbe", name: "World English Bible, British Edition" },
    { code: "oeb-us", name: "Open English Bible, US" },
    { code: "clementine", name: "Clementine Vulgate (Latin)" }
  ];

  const TRANSLATE_LANGS = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "pt", name: "Português" },
    { code: "yo", name: "Yorùbá" },
    { code: "ig", name: "Igbo" },
    { code: "ha", name: "Hausa" },
    { code: "sw", name: "Kiswahili" },
    { code: "de", name: "Deutsch" },
    { code: "zh", name: "中文" },
    { code: "ar", name: "العربية" }
  ];

  // Small fallback glossary for common KJV archaic forms a general dictionary
  // won't have (checked before the live dictionary lookup).
  const ARCHAIC_WORDS = {
    thee: "you (object form, archaic)", thou: "you (subject form, archaic)",
    thy: "your (archaic)", thine: "yours / your (archaic)", ye: "you (plural, archaic)",
    hath: "has", doth: "does", shalt: "shall (archaic second person)",
    wilt: "will (archaic second person)", art: "are (archaic second person singular)",
    unto: "to", whosoever: "whoever", whomsoever: "whomever",
    verily: "truly, certainly", behold: "look; pay attention",
    saith: "says", cometh: "comes", goeth: "goes", knowest: "know (archaic second person)",
    wherefore: "for what reason; so, therefore", giveth: "gives", maketh: "makes",
    leadeth: "leads", restoreth: "restores", walketh: "walks", abideth: "remains, stays",
    suffereth: "allows, endures", worketh: "works", loveth: "loves", liveth: "lives",
    bringeth: "brings", seeketh: "seeks", findeth: "finds", asketh: "asks",
    nigh: "near", betwixt: "between", peradventure: "perhaps", howbeit: "nevertheless",
    forasmuch: "seeing that, since", henceforth: "from now on"
  };

  // Walks the rendered verse paragraphs and wraps each word in a tappable
  // button (for the definition popover), leaving existing markup — red-letter
  // spans, italics, verse numbers — untouched.
  function wrapWordsForDefine(root) {
    function walk(node) {
      if (node.nodeType === 3) {
        const text = node.nodeValue;
        if (!/[A-Za-z]/.test(text)) return;
        const frag = document.createDocumentFragment();
        const re = /[A-Za-z']+/g;
        let last = 0, m;
        while ((m = re.exec(text))) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "w";
          btn.textContent = m[0];
          frag.appendChild(btn);
          last = re.lastIndex;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        if (node.classList && (node.classList.contains("vnum") || node.classList.contains("saved-dot") || node.classList.contains("w"))) return;
        Array.from(node.childNodes).forEach(walk);
      }
    }
    Array.from(root.querySelectorAll(".v")).forEach((p) => {
      Array.from(p.childNodes).forEach(walk);
    });
  }

  function showWordPopover(btn) {
    const word = btn.textContent;
    const clean = word.replace(/[^A-Za-z']/g, "");
    const key = clean.toLowerCase();
    let pop = document.getElementById("wordPop");
    if (!pop) {
      pop = document.createElement("div");
      pop.id = "wordPop";
      pop.className = "word-pop";
      pop.setAttribute("role", "status");
      document.body.appendChild(pop);
    }
    function place() {
      const r = btn.getBoundingClientRect();
      pop.style.left = Math.max(12, Math.min(window.innerWidth - 272, r.left)) + "px";
      pop.style.top = r.bottom + 10 + "px";
    }
    const archaic = ARCHAIC_WORDS[key];
    pop.innerHTML = `<b>${esc(clean)}</b>${archaic ? esc(archaic) : "Looking up…"}`;
    place();
    pop.classList.add("show");
    if (archaic) return;
    fetch(DICTIONARY_API + encodeURIComponent(key))
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        const meaning = json[0] && json[0].meanings && json[0].meanings[0];
        const def = meaning && meaning.definitions && meaning.definitions[0] && meaning.definitions[0].definition;
        pop.innerHTML = `<b>${esc(clean)}</b>${def ? esc(def) : "No definition found for this word."}`;
        place();
      })
      .catch(() => {
        pop.innerHTML = `<b>${esc(clean)}</b>No definition found for this word.`;
        place();
      });
  }

  document.addEventListener("click", (e) => {
    const wbtn = e.target.closest(".w");
    if (wbtn) { showWordPopover(wbtn); return; }
    const pop = document.getElementById("wordPop");
    if (pop && !e.target.closest("#wordPop")) pop.classList.remove("show");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const pop = document.getElementById("wordPop");
      if (pop) pop.classList.remove("show");
    }
  });

  function openReaderSettingsSheet() {
    const curFont = getReaderFont();
    const curBg = getReaderBg();
    const fontPills = READER_FONTS.map(
      (f) => `<button class="font-pill" data-font="${f.key}" data-active="${f.key === curFont ? 1 : 0}" type="button">${esc(f.label)}</button>`
    ).join("");
    const bgSwatches = READER_BACKGROUNDS.map((b) => {
      const style = b.url ? `background-image:url('${b.url}?w=200&q=40&fm=jpg&auto=format&fit=crop')` : "background:var(--surface-2)";
      return `<div><button class="bg-swatch" data-bg="${b.key}" data-active="${b.key === curBg ? 1 : 0}" type="button" style="${style}" aria-label="${esc(b.label)}"></button><span class="bg-swatch-label">${esc(b.label)}</span></div>`;
    }).join("");

    openSheet(`
      <h3>Reading Settings</h3>
      <div class="settings-group" style="margin-top:18px;">
        <div class="settings-label">Text Size</div>
        <div class="settings-size-row">
          <button class="text-size-btn" id="stSizeDown" aria-label="Smaller text">A</button>
          <span class="settings-size-val" id="stSizeVal">${READER_SIZES[getReaderSizeIndex()]}px</span>
          <button class="text-size-btn" id="stSizeUp" aria-label="Larger text">A</button>
        </div>
      </div>
      <div class="settings-group">
        <div class="settings-label">Font</div>
        <div class="font-pills" id="stFontPills">${fontPills}</div>
      </div>
      <div class="settings-group">
        <div class="settings-label">Background</div>
        <div class="bg-swatch-grid" id="stBgGrid">${bgSwatches}</div>
      </div>
    `);

    const sizeVal = document.getElementById("stSizeVal");
    const refreshSize = () => { sizeVal.textContent = READER_SIZES[getReaderSizeIndex()] + "px"; };
    document.getElementById("stSizeDown").addEventListener("click", () => { applyReaderSize(Math.max(0, getReaderSizeIndex() - 1)); refreshSize(); });
    document.getElementById("stSizeUp").addEventListener("click", () => { applyReaderSize(Math.min(READER_SIZES.length - 1, getReaderSizeIndex() + 1)); refreshSize(); });

    document.getElementById("stFontPills").addEventListener("click", (e) => {
      const btn = e.target.closest(".font-pill");
      if (!btn) return;
      applyReaderFont(btn.dataset.font);
      sheetBodyEl.querySelectorAll(".font-pill").forEach((p) => (p.dataset.active = p === btn ? 1 : 0));
    });
    document.getElementById("stBgGrid").addEventListener("click", (e) => {
      const btn = e.target.closest(".bg-swatch");
      if (!btn) return;
      applyReaderBg(btn.dataset.bg);
      sheetBodyEl.querySelectorAll(".bg-swatch").forEach((s) => (s.dataset.active = s === btn ? 1 : 0));
    });
  }

  function openJumpToVerseSheet(bookName, chapter, verseCount, onPick) {
    const nums = Array.from({ length: verseCount }, (_, i) => i + 1)
      .map((n) => `<button class="jump-num" data-verse="${n}" type="button">${n}</button>`)
      .join("");
    openSheet(`
      <h3>Jump to a Verse</h3>
      <div class="sheet-ref">${esc(bookName)} ${chapter} &middot; ${verseCount} verses</div>
      <div class="jump-grid">${nums}</div>
    `);
    sheetBodyEl.querySelector(".jump-grid").addEventListener("click", (e) => {
      const btn = e.target.closest(".jump-num");
      if (!btn) return;
      const vi = parseInt(btn.dataset.verse, 10);
      closeSheet();
      setTimeout(() => onPick(vi), 210); // let the sheet finish closing before scrolling
    });
  }

  // ---------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------

  function viewHome() {
    setHeader("Word & Faith Network", false);
    setActiveTab("home");
    const verse = VERSES[dayIndex(VERSES.length)];
    const sermon = SERMONS[0];
    const last = lastBiblePosition();
    const bibleRowBody = last
      ? `<p>Continue in ${esc(last.name)} ${last.chapter}</p>`
      : `<p>Start with Genesis, or any book you choose</p>`;
    const bibleRowHref = last ? `#/bible/${last.slug}/${last.chapter}` : `#/bible`;

    viewEl.innerHTML = `
      <div class="hello">
        <h1>Welcome</h1>
        <p>Your daily Word, sermon, and prayer — all in one place.</p>
      </div>

      <div class="verse-of-day">
        ${bgScenesHtml()}
        <div class="verse-of-day-overlay"></div>
        <div class="verse-of-day-content">
          <div class="verse-of-day-label">Verse of the Day</div>
          <div class="verse-of-day-text">&ldquo;${esc(verse.text)}&rdquo;</div>
          <div class="verse-of-day-ref">${esc(verse.ref)} KJV</div>
        </div>
      </div>

      <div class="stack">
        <a class="home-row" href="#/sermons/${sermon.slug}">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h11a1 1 0 0 1 1 1v13l-4-2-4 2-4-2V5a1 1 0 0 1 1-1z"/></svg></div>
          <div class="body"><h3>Today's Sermon</h3><p>${esc(sermon.title)}</p></div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
        <a class="home-row" href="${bibleRowHref}">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6a5 5 0 0 0-5-3H3v15h4a5 5 0 0 1 5 3"/><path d="M12 6a5 5 0 0 1 5-3h4v15h-4a5 5 0 0 0-5 3"/></svg></div>
          <div class="body"><h3>Read the Bible</h3>${bibleRowBody}</div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
        <a class="home-row" href="#/prayer">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9z"/></svg></div>
          <div class="body"><h3>Today's Declaration</h3><p>Pray with us</p></div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
        <a class="home-row" href="#/library">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 3v18M8 8h8M8 12h8"/></svg></div>
          <div class="body"><h3>The Library</h3><p>Ask Boldly — Book One</p></div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
      </div>

      <div id="installHint" style="margin-top:18px;"></div>
    `;
    renderInstallHint(document.getElementById("installHint"));
  }

  function renderInstallHint(el) {
    if (!el) return;
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      return; // already installed
    }
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const msg = isIOS
      ? "<strong>Add to Home Screen:</strong> tap the Share icon in Safari, then “Add to Home Screen,” to install WFN as an app on your iPhone or iPad."
      : "<strong>Install this app:</strong> tap your browser menu and choose “Add to Home screen” or “Install app” to use WFN like a native app — with the full Bible available offline.";
    el.innerHTML = `<div class="install-hint">${msg}</div>`;
  }

  // ---------------------------------------------------------------------
  // Section gates: a closed cover that flips, unrolls, swings, or slides
  // open — one per section (Bible, Sermons, Prayer, Library) — to make the
  // same point in a different motion each time: reading, listening, and
  // praying through a screen carries the same weight it always has.
  // ---------------------------------------------------------------------

  function gateSkipped(key) {
    try { return localStorage.getItem("wfn-app-gate-skip-" + key) === "1"; } catch (e) { return false; }
  }
  function setGateSkip(key, on) {
    try { localStorage.setItem("wfn-app-gate-skip-" + key, on ? "1" : "0"); } catch (e) {}
  }
  function wireGate(skipKey) {
    const stage = viewEl.querySelector(".gate-stage");
    if (!stage) return;
    function open() {
      stage.classList.add("is-open");
      stage.querySelectorAll("[data-gate-trigger]").forEach((el) => el.setAttribute("aria-expanded", "true"));
    }
    function close() {
      stage.classList.remove("is-open");
      stage.querySelectorAll("[data-gate-trigger]").forEach((el) => el.setAttribute("aria-expanded", "false"));
    }
    stage.querySelectorAll("[data-gate-trigger]").forEach((el) => {
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
    const closeBtn = viewEl.querySelector("[data-gate-close]");
    if (closeBtn) closeBtn.addEventListener("click", close);
    const skipChk = viewEl.querySelector("[data-gate-skip]");
    if (skipChk) {
      skipChk.checked = gateSkipped(skipKey);
      skipChk.addEventListener("change", (e) => setGateSkip(skipKey, e.target.checked));
    }
  }
  function gateEmblemRing(inner) {
    return `<svg class="gate-front-emblem" viewBox="0 0 120 120" width="78" height="78" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="none" stroke="#F3EADA" stroke-width="1.3" opacity="0.8"/>
      <circle cx="60" cy="60" r="44" fill="none" stroke="#F3EADA" stroke-width="1" opacity="0.5"/>
      ${inner}
    </svg>`;
  }

  function viewBibleIntro() {
    setHeader("The Bible", true);
    setActiveTab("bible");
    const skip = gateSkipped("bible");
    viewEl.innerHTML = `
      <div class="gate-stage">
        <div class="gate-inner">
          <div class="gate-back">
            <div class="gate-back-top">
              <button class="gate-back-close" data-gate-close type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
                Close
              </button>
            </div>
            <div class="gate-back-body">
              <div class="gate-kicker" style="color:var(--gold);">You Are On Holy Ground</div>
              <h2 class="gate-back-headline">The screen changes. His Word does not.</h2>
              <p class="gate-back-text">Reading Scripture here is still reading Scripture — only the method has changed, not the weight it carries. Come with the same reverence, the same quiet heart, and the same prayer you'd bring to a printed page.</p>
            </div>
            <div class="gate-preview-card" style="background:linear-gradient(165deg,#FBF3DF 0%,#F3E3BC 100%); border:1px solid rgba(156,122,52,0.26);">
              <svg class="gate-preview-watermark" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="75" fill="none" stroke="#9C7A34" stroke-width="1.4"/><circle cx="80" cy="80" r="50" fill="none" stroke="#9C7A34" stroke-width="1.4"/></svg>
              <span class="gate-preview-badge" style="color:#7A5E24;">Today</span>
              <h3 class="gate-preview-title">Genesis 1</h3>
              <p class="gate-preview-text" style="color:#4C3F26; font-style:italic;">&ldquo;In the beginning God created the heaven and the earth.&rdquo;</p>
              <a class="gate-preview-cta" style="background:#9C7A34;" href="#/bible/books">Continue Reading <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
            </div>
            <p class="gate-footnote">&ldquo;My doctrine shall drop as the rain.&rdquo; &mdash; Deuteronomy 32:2</p>
          </div>

          <div class="gate-front gate-front--flip" data-gate-trigger role="button" tabindex="0" aria-expanded="false" aria-label="Tap to open the Word" style="background:linear-gradient(155deg,#B88B3C 0%,#9C7A34 46%,#7A5E24 100%);">
            <div class="gate-spine-l"></div><div class="gate-spine-r"></div>
            ${gateEmblemRing(`
              <path d="M34 78 V40 a4 4 0 0 1 4 -4 h18 a4 4 0 0 1 4 4 v38" fill="none" stroke="#FDFBF5" stroke-width="2.2" stroke-linejoin="round"/>
              <path d="M86 78 V40 a4 4 0 0 0 -4 -4 H64 a4 4 0 0 0 -4 4 v38" fill="none" stroke="#FDFBF5" stroke-width="2.2" stroke-linejoin="round"/>
              <line x1="60" y1="36" x2="60" y2="78" stroke="#FDFBF5" stroke-width="2"/>
            `)}
            <div class="gate-front-eyebrow">Holy Scripture — Electronic Edition</div>
            <h1 class="gate-front-title">The Word</h1>
            <div class="gate-front-rule"></div>
            <p class="gate-front-text">A screen is simply a different way of meeting the same Word that has always been on paper. Approach it with the same caution and respect — a quiet heart, a praying spirit, and attention undivided.</p>
            <p class="gate-front-text italic">Read with the Holy Spirit as your guide, not your own understanding alone.</p>
            <p class="gate-front-verse">&ldquo;All scripture is given by inspiration of God, and is profitable for doctrine.&rdquo; &mdash; 2 Timothy 3:16</p>
            <div class="gate-front-cta">
              <span>Tap to Open the Word</span>
              <svg class="gate-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M12 19l-6-6M12 19l6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="bible-intro-callout">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6l-5 3.6 1.9-5.8L4 8.8h6.1z"/></svg></div>
        <div>
          <h3>An Electronic Bible Is Still the Bible</h3>
          <p>A phone, tablet, or app is only the vessel — glass and light instead of leather and paper. What's carried in it is exactly the same: the living, inspired Word of God. It deserves the same reverence, the same attention, and the same freedom from distraction you'd give an open Bible on your lap.</p>
          <p>Don't let the convenience of a screen make the reading casual. Approach it the way you would walk into a sanctuary — aware of Whose presence you're stepping into.</p>
        </div>
      </div>

      <div class="bible-intro-rules">
        <h3>How to Read It Well</h3>
        <ol>
          <li><span class="num">1</span><span class="txt"><strong>Pray before you tap.</strong> Ask the Holy Spirit to open your understanding before you open a chapter — Scripture is discerned by the Spirit, not decoded like a search result (1 Corinthians 2:10–14).</span></li>
          <li><span class="num">2</span><span class="txt"><strong>Let it interrupt you.</strong> If a verse stops you, stay there. Don't scroll past conviction the way you'd scroll past an ad.</span></li>
          <li><span class="num">3</span><span class="txt"><strong>Use the tools to understand, not to argue.</strong> Word meanings, other versions, and translations are here to deepen your grasp of the text — not to win a debate or justify a conclusion you already wanted.</span></li>
          <li><span class="num">4</span><span class="txt"><strong>Return daily, not just in emergencies.</strong> The Word is bread for every day, not a reference book you reach for only in a crisis.</span></li>
          <li><span class="num">5</span><span class="txt"><strong>Guard the moment.</strong> Silence notifications where you can. Give this the same quiet you'd give a closed room with an open Bible on the table.</span></li>
        </ol>
      </div>

      <div class="bible-intro-verse">
        <p>&ldquo;For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit... and is a discerner of the thoughts and intents of the heart.&rdquo;</p>
        <span>Hebrews 4:12, KJV</span>
      </div>

      <a class="btn btn-block" id="bibleIntroEnter" href="#/bible/books">Enter the Word</a>
      <label class="gate-skip">
        <input type="checkbox" data-gate-skip ${skip ? "checked" : ""}>
        Don't show this page again
      </label>
    `;
    wireGate("bible");
  }

  async function viewBibleBooks() {
    setHeader("The Bible", true);
    setActiveTab("bible");
    viewEl.innerHTML = `
      <div class="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input id="bibleSearchInput" type="search" placeholder="Search the whole Bible…" autocomplete="off">
      </div>
      <div id="bibleBooksList"><div class="search-status">Loading books…</div></div>
    `;
    document.getElementById("bibleSearchInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim().length >= 3) {
        location.hash = "#/bible/search/" + encodeURIComponent(e.target.value.trim());
      }
    });
    const books = await WFNBible.getIndex();
    const old = books.filter((b) => b.testament === "old");
    const neu = books.filter((b) => b.testament === "new");
    const grid = (list) =>
      `<div class="book-grid">${list.map((b) => `<a class="book-btn" href="#/bible/${b.slug}">${esc(b.name)}</a>`).join("")}</div>`;
    document.getElementById("bibleBooksList").innerHTML = `
      <div class="testament-label">Old Testament</div>${grid(old)}
      <div class="testament-label">New Testament</div>${grid(neu)}
    `;
  }

  async function viewBibleChapters(slug) {
    setHeader("The Bible", true);
    setActiveTab("bible");
    viewEl.innerHTML = `<div class="search-status">Loading…</div>`;
    const data = await WFNBible.getBook(slug);
    setHeader(data.name, true);
    const n = data.chapters.length;
    let html = `<div class="chapter-grid">`;
    for (let i = 1; i <= n; i++) {
      html += `<a class="chapter-btn" href="#/bible/${slug}/${i}">${i}</a>`;
    }
    html += `</div>`;
    viewEl.innerHTML = html;
  }

  async function viewBibleReader(slug, chapter) {
    chapter = parseInt(chapter, 10);
    viewEl.innerHTML = `<div class="search-status">Loading…</div>`;
    const data = await WFNBible.getBook(slug);
    setHeader(data.name, true);
    setActiveTab("bible");
    if (chapter < 1 || chapter > data.chapters.length) chapter = 1;
    saveBiblePosition(slug, data.name, chapter);

    const kjvVerses = data.chapters[chapter - 1];
    let activePlainTexts = kjvVerses.map((v) => WFNBible.plain(v));
    let activeVersionCode = "kjv";

    const prevDisabled = chapter <= 1 ? "disabled" : "";
    const nextDisabled = chapter >= data.chapters.length ? "disabled" : "";
    const prevHref = chapter > 1 ? `#/bible/${slug}/${chapter - 1}` : "#";
    const nextHref = chapter < data.chapters.length ? `#/bible/${slug}/${chapter + 1}` : "#";

    const versionOptions = BIBLE_VERSIONS.map((v) => `<option value="${v.code}">${esc(v.name)}</option>`).join("");
    const langOptions = `<option value="">Translate…</option>` + TRANSLATE_LANGS.map((l) => `<option value="${l.code}">${esc(l.name)}</option>`).join("");

    viewEl.innerHTML = `
      <div class="reader-nav">
        <button class="reader-nav-btn" id="prevCh" ${prevDisabled} data-href="${prevHref}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg> Prev
        </button>
        <a class="reader-title" href="#/bible/${slug}">${esc(data.name)} ${chapter}</a>
        <button class="reader-nav-btn" id="nextCh" ${nextDisabled} data-href="${nextHref}">
          Next <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>
      <div class="reader-toolbar">
        <select class="reader-select" id="versionSelect" aria-label="Bible version">${versionOptions}</select>
        <select class="reader-select" id="translateSelect" aria-label="Translate this chapter">${langOptions}</select>
        <button class="reader-jump-btn" id="readerJumpBtn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 6h16M4 12h10M4 18h7"/></svg>
          Jump
        </button>
        <button class="reader-settings-btn" id="readerSettingsBtn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h11M19 7h1M4 17h1M9 17h11M4 12h7M15 12h5"/><circle cx="18" cy="7" r="2.2"/><circle cx="7" cy="17" r="2.2"/><circle cx="11" cy="12" r="2.2"/></svg>
          Settings
        </button>
      </div>
      <p class="hint-row" id="defineHint">Tap any word for its meaning.</p>
      <div class="reader-surface" id="readerSurface">
        <div class="verse-list" id="verseList"></div>
      </div>
      <p class="translate-note" id="translateNote" hidden></p>
    `;
    viewEl.scrollTo(0, 0);
    window.scrollTo(0, 0);
    applyReaderBg(getReaderBg());

    ["prevCh", "nextCh"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn && !btn.disabled) {
        btn.addEventListener("click", () => { location.hash = btn.dataset.href; });
      }
    });

    const verseListEl = document.getElementById("verseList");
    verseListEl.addEventListener("click", (e) => {
      if (e.target.closest(".w")) return; // word tap is handled by the global popover listener
      const p = e.target.closest(".v");
      if (!p) return;
      const vi = parseInt(p.dataset.verse, 10);
      openVerseSheet(slug, data.name, chapter, vi, activePlainTexts[vi - 1] || "");
    });

    function renderKJV() {
      const marks = WFNStore.getMarks();
      const markFor = (vi) => marks.find((m) => m.bookSlug === slug && m.chapter === chapter && m.verse === vi + 1);
      verseListEl.innerHTML = kjvVerses
        .map((v, i) => {
          const m = markFor(i);
          const colorAttr = m && m.color ? ` data-color="${m.color}"` : "";
          const savedDot = m && m.saved ? `<span class="saved-dot"></span>` : "";
          return `<p class="v" data-verse="${i + 1}"${colorAttr}><span class="vnum">${i + 1}</span>${v}${savedDot}</p>`;
        })
        .join("");
      activePlainTexts = kjvVerses.map((v) => WFNBible.plain(v));
      activeVersionCode = "kjv";
      wrapWordsForDefine(verseListEl);
    }

    async function loadVersion(code) {
      if (code === "kjv") { renderKJV(); return; }
      const versionName = (BIBLE_VERSIONS.find((v) => v.code === code) || {}).name || code;
      verseListEl.innerHTML = `<div class="search-status">Loading ${esc(versionName)}…</div>`;
      try {
        const ref = encodeURIComponent(`${data.name} ${chapter}`).replace(/%20/g, "+");
        const res = await fetch(`${BIBLE_API}${ref}?translation=${code}`);
        if (!res.ok) throw new Error("bad response");
        const json = await res.json();
        if (!json.verses || !json.verses.length) throw new Error("no verses");
        verseListEl.innerHTML = json.verses
          .map((v) => `<p class="v" data-verse="${v.verse}"><span class="vnum">${v.verse}</span>${esc(v.text.trim())}</p>`)
          .join("");
        activePlainTexts = json.verses.map((v) => v.text.trim());
        activeVersionCode = code;
        wrapWordsForDefine(verseListEl);
      } catch (err) {
        verseListEl.innerHTML = `<div class="skeleton-note">Couldn't load ${esc(versionName)} right now &mdash; check your connection, or <button class="link-btn" id="backToKjv" type="button">switch back to KJV</button>.</div>`;
        const b = document.getElementById("backToKjv");
        if (b) b.addEventListener("click", () => { document.getElementById("versionSelect").value = "kjv"; renderKJV(); });
      }
    }

    async function translateChapter(langCode) {
      const texts = activePlainTexts.slice();
      const note = document.getElementById("translateNote");
      if (langCode === "en") {
        verseListEl.innerHTML = texts
          .map((t, i) => `<p class="v" data-verse="${i + 1}"><span class="vnum">${i + 1}</span>${esc(t)}</p>`)
          .join("");
        note.hidden = false;
        note.textContent = "Displaying the original English text. Switch Translate back to “Translate…” to use word definitions and highlighting.";
        return;
      }
      verseListEl.innerHTML = texts
        .map((t, i) => `<p class="v" data-verse="${i + 1}"><span class="vnum">${i + 1}</span><span class="tword" data-i="${i}">Translating…</span></p>`)
        .join("");
      note.hidden = false;
      note.textContent = "Machine translation, for a quick read in another language. Switch Translate back to “Translate…” to use word definitions and highlighting on the original text.";
      let idx = 0;
      async function worker() {
        while (idx < texts.length) {
          const i = idx++;
          try {
            const url = `${TRANSLATE_API}?q=${encodeURIComponent(texts[i])}&langpair=en|${langCode}`;
            const res = await fetch(url);
            const json = await res.json();
            const translated = json && json.responseData && json.responseData.translatedText ? json.responseData.translatedText : texts[i];
            const span = verseListEl.querySelector(`.tword[data-i="${i}"]`);
            if (span) span.textContent = translated;
          } catch (err) {
            const span = verseListEl.querySelector(`.tword[data-i="${i}"]`);
            if (span) span.textContent = texts[i];
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(4, texts.length) }, worker));
    }

    document.getElementById("versionSelect").addEventListener("change", (e) => {
      document.getElementById("translateSelect").value = "";
      document.getElementById("translateNote").hidden = true;
      loadVersion(e.target.value);
    });
    document.getElementById("translateSelect").addEventListener("change", (e) => {
      const v = e.target.value;
      if (!v) {
        document.getElementById("translateNote").hidden = true;
        loadVersion(activeVersionCode);
        return;
      }
      translateChapter(v);
    });
    document.getElementById("readerSettingsBtn").addEventListener("click", openReaderSettingsSheet);
    document.getElementById("readerJumpBtn").addEventListener("click", () => {
      openJumpToVerseSheet(data.name, chapter, kjvVerses.length, (vi) => jumpToVerse(vi));
    });

    function jumpToVerse(vi) {
      const target = verseListEl.querySelector(`.v[data-verse="${vi}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.remove("flash");
      // restart the animation even if the same verse is tapped twice in a row
      void target.offsetWidth;
      target.classList.add("flash");
      setTimeout(() => target.classList.remove("flash"), 1700);
    }

    renderKJV();
    showNoteFab(() => openNoteSheet("bible", `bible:${slug}:${chapter}`, `${data.name} ${chapter}`));
  }

  function showNoteFab(onClick) {
    let fab = document.getElementById("noteFab");
    if (fab) fab.remove();
    fab = document.createElement("button");
    fab.id = "noteFab";
    fab.className = "note-fab";
    fab.setAttribute("aria-label", "Add a note");
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`;
    fab.addEventListener("click", onClick);
    document.getElementById("app").appendChild(fab);
  }
  function hideNoteFab() {
    const fab = document.getElementById("noteFab");
    if (fab) fab.remove();
  }

  function openVerseSheet(bookSlug, bookName, chapter, verse, text) {
    const mark = WFNStore.getMark(bookSlug, chapter, verse) || { color: null, saved: false };
    const colors = ["gold", "green", "blue", "pink"];
    const swatches = colors
      .map((c) => `<button class="swatch swatch-${c}" data-color="${c}" data-active="${mark.color === c ? 1 : 0}" aria-label="Highlight ${c}"></button>`)
      .join("");
    openSheet(`
      <div class="sheet-ref">${esc(bookName)} ${chapter}:${verse}</div>
      <div class="sheet-verse-text">&ldquo;${esc(text)}&rdquo;</div>
      <div class="sheet-row">
        <div class="sheet-row-label">Highlight</div>
        <div class="swatches">${swatches}</div>
      </div>
      <div class="sheet-row">
        <div class="sheet-row-label">Save to My Verses</div>
        <button class="sheet-toggle" id="savedToggle" data-on="${mark.saved ? 1 : 0}"></button>
      </div>
      <a class="btn btn-outline btn-block" style="margin-top:10px;" id="addVerseNoteBtn">Add a Note on This Verse</a>
    `);
    sheetBodyEl.querySelectorAll(".swatch").forEach((sw) => {
      sw.addEventListener("click", () => {
        const current = sw.dataset.active === "1";
        const next = current ? null : sw.dataset.color;
        WFNStore.setHighlight(bookSlug, bookName, chapter, verse, text, next);
        sheetBodyEl.querySelectorAll(".swatch").forEach((s) => (s.dataset.active = s === sw && next ? 1 : 0));
        const p = document.querySelector(`#verseList .v[data-verse="${verse}"]`);
        if (p) { if (next) p.dataset.color = next; else delete p.dataset.color; }
      });
    });
    const savedBtn = document.getElementById("savedToggle");
    savedBtn.addEventListener("click", () => {
      const m = WFNStore.toggleSaved(bookSlug, bookName, chapter, verse, text);
      savedBtn.dataset.on = m && m.saved ? 1 : 0;
      const p = document.querySelector(`#verseList .v[data-verse="${verse}"]`);
      if (p) {
        let dot = p.querySelector(".saved-dot");
        if (m && m.saved && !dot) {
          p.insertAdjacentHTML("beforeend", '<span class="saved-dot"></span>');
        } else if ((!m || !m.saved) && dot) {
          dot.remove();
        }
      }
    });
    document.getElementById("addVerseNoteBtn").addEventListener("click", () => {
      openNoteSheet("bible", `bible:${bookSlug}:${chapter}:${verse}`, `${bookName} ${chapter}:${verse}`);
    });
  }

  function openNoteSheet(type, refKey, refLabel, onSaved) {
    openSheet(`
      <h3>Note</h3>
      <div class="sheet-ref">${esc(refLabel)}</div>
      <textarea id="noteText" placeholder="Write what this means to you, what stood out, or a prayer it brings to mind…"></textarea>
      <button class="btn btn-block" id="saveNoteBtn">Save Note</button>
    `);
    const ta = document.getElementById("noteText");
    ta.focus();
    document.getElementById("saveNoteBtn").addEventListener("click", () => {
      if (WFNStore.addNote(type, refKey, refLabel, ta.value)) {
        closeSheet();
        if (onSaved) onSaved();
      }
    });
  }

  async function viewBibleSearch(query) {
    setHeader("Search", true);
    setActiveTab("bible");
    query = decodeURIComponent(query || "");
    viewEl.innerHTML = `
      <div class="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input id="bibleSearchInput2" type="search" placeholder="Search the whole Bible…" autocomplete="off" value="${esc(query)}">
      </div>
      <div class="search-status" id="searchStatus">Searching the full King James Bible…</div>
      <div class="search-results" id="searchResults"></div>
    `;
    const input = document.getElementById("bibleSearchInput2");
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim().length >= 3) {
        location.hash = "#/bible/search/" + encodeURIComponent(e.target.value.trim());
      }
    });
    if (query.trim().length < 3) {
      document.getElementById("searchStatus").textContent = "Type at least 3 characters to search.";
      return;
    }
    const results = await WFNBible.search(query, 80);
    const statusEl = document.getElementById("searchStatus");
    const resultsEl = document.getElementById("searchResults");
    if (!results.length) {
      statusEl.textContent = `No verses found for “${query}”.`;
      return;
    }
    statusEl.textContent = `${results.length}${results.length === 80 ? "+" : ""} result${results.length === 1 ? "" : "s"} for “${query}”`;
    const re = new RegExp("(" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    resultsEl.innerHTML = results
      .map((r) => {
        const highlighted = esc(r.text).replace(re, "<mark>$1</mark>");
        return `<a class="result" href="#/bible/${r.slug}/${r.chapter}">
          <div class="result-ref">${esc(r.book)} ${r.chapter}:${r.verse}</div>
          <div class="result-text">${highlighted}</div>
        </a>`;
      })
      .join("");
  }

  function viewSermonsIntro() {
    setHeader("Sermons", true);
    setActiveTab("sermons");
    const skip = gateSkipped("sermons");
    const s = SERMONS[0];
    viewEl.innerHTML = `
      <div class="gate-stage">
        <div class="gate-inner">
          <div class="gate-back">
            <div class="gate-back-top">
              <button class="gate-back-close" data-gate-close type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
                Close
              </button>
            </div>
            <div class="gate-back-body">
              <div class="gate-kicker" style="color:var(--blue);">You're About to Hear the Word Preached</div>
              <h2 class="gate-back-headline">A recording still carries the voice.</h2>
              <p class="gate-back-text">Listen the way you would in the room — attentive, unhurried, testing what you hear against Scripture. Let the Holy Spirit, not the speaker alone, be the One who settles it in your heart.</p>
            </div>
            <div class="gate-preview-card" style="background:linear-gradient(165deg,#E9F0F4 0%,#D3E1E9 100%); border:1px solid rgba(94,124,148,0.28);">
              <svg class="gate-preview-watermark" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="75" fill="none" stroke="#5E7C94" stroke-width="1.4"/><circle cx="80" cy="80" r="50" fill="none" stroke="#5E7C94" stroke-width="1.4"/></svg>
              <span class="gate-preview-badge" style="color:#3E586D;">${esc(s.ref)}</span>
              <h3 class="gate-preview-title">${esc(s.title)}</h3>
              <p class="gate-preview-text" style="color:#3E4A52;">${esc(s.excerpt)}</p>
              <a class="gate-preview-cta" style="background:#5E7C94;" href="/articles/${s.slug}.html">Watch the Message <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
            </div>
            <p class="gate-footnote">&ldquo;Prove all things; hold fast that which is good.&rdquo; &mdash; 1 Thessalonians 5:21</p>
          </div>

          <div class="gate-front gate-front--unroll" data-gate-trigger role="button" tabindex="0" aria-expanded="false" aria-label="Tap to unroll the message" style="background:linear-gradient(155deg,#7E9BB0 0%,#5E7C94 46%,#45617A 100%);">
            <div class="gate-spine-l" style="background:linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0)); left:0; right:0; top:0; bottom:auto; height:30px; width:auto;"></div>
            ${gateEmblemRing(`
              <rect x="51" y="34" width="18" height="30" rx="9" fill="none" stroke="#FDFBF5" stroke-width="2.2"/>
              <path d="M42 58 a18 18 0 0 0 36 0" fill="none" stroke="#FDFBF5" stroke-width="2.2" stroke-linecap="round"/>
              <line x1="60" y1="76" x2="60" y2="86" stroke="#FDFBF5" stroke-width="2.2" stroke-linecap="round"/>
              <line x1="50" y1="86" x2="70" y2="86" stroke="#FDFBF5" stroke-width="2.2" stroke-linecap="round"/>
            `)}
            <div class="gate-front-eyebrow">Recorded Messages</div>
            <h1 class="gate-front-title">Sermons</h1>
            <div class="gate-front-rule"></div>
            <p class="gate-front-text">A sermon on a screen is still a sermon preached. The same discernment, the same open Bible beside you, the same test of Scripture applies here as it would from a pew.</p>
            <p class="gate-front-text italic">Ask the Holy Spirit to confirm every word before you carry it with you.</p>
            <p class="gate-front-verse">&ldquo;Faith cometh by hearing, and hearing by the word of God.&rdquo; &mdash; Romans 10:17</p>
            <div class="gate-front-cta">
              <span>Tap to Unroll the Message</span>
              <svg class="gate-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M12 19l-6-6M12 19l6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="bible-intro-callout">
        <div class="ico" style="background:var(--blue);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6l-5 3.6 1.9-5.8L4 8.8h6.1z"/></svg></div>
        <div>
          <h3>A Recorded Message Is Still a Sermon</h3>
          <p>Hearing a sermon through a speaker doesn't make it less preached. The anointing on a message isn't bound to a stage — it travels with the words, however they reach you.</p>
          <p>Keep an open Bible beside you as you listen, and let what you hear send you back to Scripture rather than replace it.</p>
        </div>
      </div>

      <a class="btn btn-block" id="sermonsIntroEnter" href="#/sermons/list">Listen to Sermons</a>
      <label class="gate-skip">
        <input type="checkbox" data-gate-skip ${skip ? "checked" : ""}>
        Don't show this page again
      </label>
    `;
    wireGate("sermons");
  }

  function viewSermonsList() {
    setHeader("Sermons", true);
    setActiveTab("sermons");
    hideNoteFab();
    const notes = WFNStore.getNotes();
    const noteCount = (slug) => notes.filter((n) => n.refKey === `sermon:${slug}`).length;
    viewEl.innerHTML = SERMONS.map((s) => {
      const nc = noteCount(s.slug);
      return `
      <div class="entry" style="padding-bottom:12px;">
        <a href="/articles/${s.slug}.html" style="display:block;">
          <div class="entry-top">
            <span class="entry-badge">${esc(s.ref)}</span>
            <span class="entry-date">${esc(s.date)}</span>
          </div>
          <h2 class="entry-title">${esc(s.title)}</h2>
          <p class="entry-excerpt">${esc(s.excerpt)}</p>
        </a>
        <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border); display:flex; justify-content:flex-end;">
          <button class="sermon-note-btn" data-slug="${s.slug}" data-title="${esc(s.title)}" style="background:none; border:none; display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:var(--gold); padding:0;">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            ${nc ? `${nc} Note${nc === 1 ? "" : "s"}` : "Add Note"}
          </button>
        </div>
      </div>`;
    }).join("");
    viewEl.querySelectorAll(".sermon-note-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        openNoteSheet("sermon", `sermon:${btn.dataset.slug}`, btn.dataset.title, viewSermonsList);
      });
    });
  }

  function viewPrayerIntro() {
    setHeader("Prayer", true);
    setActiveTab("prayer");
    const skip = gateSkipped("prayer");
    viewEl.innerHTML = `
      <div class="gate-stage">
        <div class="gate-inner">
          <div class="gate-back">
            <div class="gate-door-glow"></div>
            <div class="gate-back-top">
              <button class="gate-back-close" data-gate-close type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
                Close
              </button>
            </div>
            <div class="gate-back-body">
              <div class="gate-kicker" style="color:#AD7A7A;">You Are In the Secret Place</div>
              <h2 class="gate-back-headline">The door is shut. He sees you here.</h2>
              <p class="gate-back-text">Wherever you are, let this be your closet — put away distraction, quiet your heart, and pray in secret to the Father who sees in secret. Let the Spirit pray through you where words run out.</p>
            </div>
            <div class="gate-preview-card" style="background:linear-gradient(165deg,#F3E7E6 0%,#E8D2D0 100%); border:1px solid rgba(173,122,122,0.28);">
              <svg class="gate-preview-watermark" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="75" fill="none" stroke="#AD7A7A" stroke-width="1.4"/><circle cx="80" cy="80" r="50" fill="none" stroke="#AD7A7A" stroke-width="1.4"/></svg>
              <span class="gate-preview-badge" style="color:#7A4F4F;">Today's Declaration</span>
              <p class="gate-preview-text" style="color:#4C3330; font-style:italic;">&ldquo;Father, I enter this day under an open heaven. What You have spoken over my life will not return empty&hellip;&rdquo;</p>
              <a class="gate-preview-cta" style="background:#AD7A7A;" href="#/prayer/list">Continue in Prayer <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
            </div>
            <p class="gate-footnote">&ldquo;When thou prayest, enter into thy closet, and when thou hast shut thy door, pray to thy Father.&rdquo; &mdash; Matthew 6:6</p>
          </div>

          <div class="gate-front gate-front--door" data-gate-trigger role="button" tabindex="0" aria-expanded="false" aria-label="Tap to enter the prayer closet" style="background:linear-gradient(155deg,#C79992 0%,#AD7A7A 46%,#875D5D 100%);">
            <div class="gate-spine-l"></div><div class="gate-spine-r"></div>
            <div class="gate-door-panel"></div>
            <div class="gate-door-handle"></div>
            ${gateEmblemRing(`
              <path d="M60 84s-20-13-27-25a16 16 0 0 1 27-17 16 16 0 0 1 27 17c-7 12-27 25-27 25z" fill="none" stroke="#FDFBF5" stroke-width="2.2" stroke-linejoin="round"/>
            `)}
            <div class="gate-front-eyebrow">Enter the Secret Place</div>
            <h1 class="gate-front-title">Prayer</h1>
            <div class="gate-front-rule"></div>
            <p class="gate-front-text">A prayer prayed through a screen is still a prayer prayed. Shut out the noise around you the way you would behind a closet door, and come with an undivided heart.</p>
            <p class="gate-front-text italic">The Spirit Himself intercedes for us with groanings words cannot utter.</p>
            <p class="gate-front-verse">&ldquo;The effectual fervent prayer of a righteous man availeth much.&rdquo; &mdash; James 5:16</p>
            <div class="gate-front-cta">
              <span>Tap to Enter</span>
              <svg class="gate-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M12 19l-6-6M12 19l6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="bible-intro-callout">
        <div class="ico" style="background:#AD7A7A;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6l-5 3.6 1.9-5.8L4 8.8h6.1z"/></svg></div>
        <div>
          <h3>Shut the Door, Even on a Screen</h3>
          <p>Jesus didn't ask for a building — He asked for a shut door and an undivided heart. Wherever you tap "Enter," let that moment become your closet: phone on silent, heart unguarded before God.</p>
          <p>Prayer here is not less real for being typed, read, or declared alone in a room. Heaven still hears it the same.</p>
        </div>
      </div>

      <a class="btn btn-block" id="prayerIntroEnter" href="#/prayer/list">Enter Prayer</a>
      <label class="gate-skip">
        <input type="checkbox" data-gate-skip ${skip ? "checked" : ""}>
        Don't show this page again
      </label>
    `;
    wireGate("prayer");
  }

  function viewPrayer() {
    setHeader("Prayer", true);
    setActiveTab("prayer");
    const pointsHtml = PRAYER_POINTS.map(
      (p, i) => `<div class="prayer-item"><div class="num">${i + 1}</div><p>${esc(p)}</p></div>`
    ).join("");
    viewEl.innerHTML = `
      <div class="declaration-box">
        ${bgScenesHtml()}
        <div class="declaration-overlay"></div>
        <div class="declaration-content">
          <div class="declaration-label">Today's Declaration</div>
          <div class="declaration-text">&ldquo;Father, I enter this Friday under an open heaven. What You have spoken over my life will not return empty. This day is covered, ordered, and aligned with Your purpose. I declare that Friday is a day of advancement. What was delayed is moving. What was blocked is opening. What was hidden is being revealed. I rise above every limitation assigned to this season. Mercy goes before me, and favor follows me. I speak life over my mind, my body, my household, and every assignment in my hands. Confusion is silenced. Fear has no voice. Delay is broken. The work of my hands is established, and I will not labor in vain. I receive grace for this day. I walk in peace, not pressure. I move with confidence, knowing heaven has already gone ahead of me. Let it be evident by evening that Your hand was upon me. In Jesus' name, amen.&rdquo;</div>
          <div class="declaration-ref">Isaiah 55:11 &middot; Psalm 90:17</div>
        </div>
      </div>

      <div class="section-label">Pray This With Us</div>
      <div class="card" style="margin-bottom:20px;">${pointsHtml}</div>

      <div class="section-label">Prayer &amp; Bible Study</div>
      <div class="card stack" style="margin-bottom:20px;">
        <p style="font-size:13.5px; color:var(--ink-2); line-height:1.6;">Join a daily WhatsApp group for prayer requests, Bible study, and encouragement with the WFN family.</p>
        <a class="btn btn-block" href="https://chat.whatsapp.com/J0JkLpylQiVKTHKcJkaKEs?s=cl&amp;p=i&amp;mlu=4&amp;ilr=4&amp;iam=0" target="_blank" rel="noopener">Join on WhatsApp</a>
      </div>

      <div class="section-label">The Prayer Circle</div>
      <div class="card stack" style="margin-bottom:16px;">
        <p style="font-size:13.5px; color:var(--ink-2); line-height:1.6;">A live, corporate prayer call &mdash; built on scripture, led in declaration. Tuesdays, 1:00&ndash;2:00 AM ET (Toronto) / 6:00&ndash;7:00 AM WAT (Lagos), via X Spaces.</p>
        <a class="btn btn-outline btn-block" href="https://x.com/wfnglobal" target="_blank" rel="noopener">Join the Circle on X</a>
      </div>
    `;
  }

  var LIBRARY_BOOKS = [
    {
      badge: "Book Three", slug: "not-consumed",
      top: "NOT", bottom: "CONSUMED",
      bg0: "#3B1740", bg1: "#1D0C22", bg2: "#0A0509",
      gold0: "#F6E8BE", gold1: "#C9A968",
      title: "Not Consumed",
      desc: "Sin took the covering. Mercy would not let go — what sin costs us, and the faithfulness of Christ that keeps us from being consumed."
    },
    {
      badge: "Book Two", slug: "look-back-look-forward",
      top: "LOOK BACK,", bottom: "LOOK FORWARD",
      bg0: "#2A3F2E", bg1: "#162419", bg2: "#0A120B",
      gold0: "#F6E8BE", gold1: "#C9A968",
      title: "Look Back, Look Forward",
      desc: "Thank God for the past. Trust Him for what's next — eight chapters on remembering rightly and stepping forward without fear."
    },
    {
      badge: "Book One", slug: "ask-boldly",
      top: "ASK", bottom: "BOLDLY",
      bg0: "#332B1C", bg1: "#1D1810", bg2: "#100C08",
      gold0: "#F6E8BE", gold1: "#C9A968",
      title: "Ask Boldly",
      desc: "Why some prayers move Heaven and others don't — eight chapters on boldness, honest motive, and faith that doesn't faint."
    }
  ];

  function viewLibraryIntro() {
    setHeader("Library", true);
    setActiveTab("library");
    const skip = gateSkipped("library");
    const b = LIBRARY_BOOKS[0];
    viewEl.innerHTML = `
      <div class="gate-stage">
        <div class="gate-inner">
          <div class="gate-back">
            <div class="gate-back-top">
              <button class="gate-back-close" data-gate-close type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
                Close
              </button>
            </div>
            <div class="gate-back-body">
              <div class="gate-kicker" style="color:#6E8A5C;">Welcome to the Archive</div>
              <h2 class="gate-back-headline">A book on glass is still a book to study.</h2>
              <p class="gate-back-text">Read here the way the Bereans read — searching the Scriptures daily, weighing every page against what God has already said, slow and unhurried, with the Spirit as your teacher.</p>
            </div>
            <div class="gate-preview-card" style="background:linear-gradient(165deg,#EBF0E6 0%,#D9E4D1 100%); border:1px solid rgba(110,138,92,0.28);">
              <svg class="gate-preview-watermark" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="75" fill="none" stroke="#6E8A5C" stroke-width="1.4"/><circle cx="80" cy="80" r="50" fill="none" stroke="#6E8A5C" stroke-width="1.4"/></svg>
              <span class="gate-preview-badge" style="color:#4C6340;">${esc(b.badge)}</span>
              <h3 class="gate-preview-title">${esc(b.title)}</h3>
              <p class="gate-preview-text" style="color:#394C30;">${esc(b.desc)}</p>
              <a class="gate-preview-cta" style="background:#6E8A5C;" href="/library/${b.slug}.html">Open the Library <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
            </div>
            <p class="gate-footnote">&ldquo;They searched the scriptures daily, whether those things were so.&rdquo; &mdash; Acts 17:11</p>
          </div>

          <div class="gate-door-left" data-gate-trigger role="button" tabindex="0" aria-expanded="false" aria-label="Tap to unlock the archive" style="background:repeating-linear-gradient(180deg, #7F9A6E 0px, #7F9A6E 26px, #6E8A5C 26px, #6E8A5C 52px); box-shadow:0 22px 50px -20px rgba(0,0,0,0.4);">
            <div style="position:absolute; inset:0; background:linear-gradient(90deg, rgba(0,0,0,0.12), rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.3));"></div>
          </div>
          <div class="gate-door-right" data-gate-trigger role="button" tabindex="0" aria-hidden="true" style="background:repeating-linear-gradient(180deg, #7F9A6E 0px, #7F9A6E 26px, #6E8A5C 26px, #6E8A5C 52px); box-shadow:0 22px 50px -20px rgba(0,0,0,0.4);">
            <div style="position:absolute; inset:0; background:linear-gradient(90deg, rgba(0,0,0,0.3), rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.12));"></div>
          </div>

          <div class="gate-slide-copy" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; padding:30px 24px 24px; pointer-events:none; color:#FFFDF8; text-align:center;">
            ${gateEmblemRing(`
              <rect x="36" y="38" width="14" height="42" rx="1.5" fill="none" stroke="#FDFBF5" stroke-width="2"/>
              <rect x="53" y="34" width="14" height="46" rx="1.5" fill="none" stroke="#FDFBF5" stroke-width="2"/>
              <rect x="70" y="40" width="14" height="40" rx="1.5" fill="none" stroke="#FDFBF5" stroke-width="2"/>
            `)}
            <div class="gate-front-eyebrow">Full Books, Free to Read</div>
            <h1 class="gate-front-title">Library</h1>
            <div class="gate-front-rule"></div>
            <p class="gate-front-text">These shelves hold whole books, not just verses. Give them the same unhurried study you'd give a printed volume — and the same reverence, knowing what you're reading is still His Word at work.</p>
            <p class="gate-front-text italic">Let the Spirit, not curiosity alone, lead you through each page.</p>
            <p class="gate-front-verse">&ldquo;Thy word is a lamp unto my feet, and a light unto my path.&rdquo; &mdash; Psalm 119:105</p>
            <div class="gate-front-cta">
              <span>Tap to Unlock the Archive</span>
              <svg class="gate-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M12 19l-6-6M12 19l6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="bible-intro-callout">
        <div class="ico" style="background:#6E8A5C;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6l-5 3.6 1.9-5.8L4 8.8h6.1z"/></svg></div>
        <div>
          <h3>Be a Berean With These Pages Too</h3>
          <p>The Bereans were praised not for believing quickly but for checking carefully — searching the Scriptures to see if what they'd heard was so. Read every book here the same way.</p>
          <p>Take your time. A chapter finished in a sitting isn't the goal; a truth settled in your spirit is.</p>
        </div>
      </div>

      <a class="btn btn-block" id="libraryIntroEnter" href="#/library/list">Open the Library</a>
      <label class="gate-skip">
        <input type="checkbox" data-gate-skip ${skip ? "checked" : ""}>
        Don't show this page again
      </label>
    `;
    wireGate("library");
  }

  function viewLibrary() {
    setHeader("Library", true);
    setActiveTab("library");
    viewEl.innerHTML = LIBRARY_BOOKS.map(function(b, i){
      var gradId = "libBg" + i, textId = "libGold" + i;
      var topSize = b.top.length > 8 ? 46 : 78;
      var bottomSize = b.bottom.length > 8 ? 46 : 78;
      return `
      <div class="section-label">${esc(b.badge)}</div>
      <div class="library-row">
        <div class="library-cover">
          <svg viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
            <defs>
              <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${b.bg0}"/><stop offset="50%" stop-color="${b.bg1}"/><stop offset="100%" stop-color="${b.bg2}"/>
              </linearGradient>
              <linearGradient id="${textId}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="${b.gold0}"/><stop offset="100%" stop-color="${b.gold1}"/>
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill="url(#${gradId})"/>
            <text x="300" y="460" text-anchor="middle" font-family="Georgia, serif" font-size="${topSize}" font-weight="900" fill="url(#${textId})">${esc(b.top)}</text>
            <text x="300" y="548" text-anchor="middle" font-family="Georgia, serif" font-size="${bottomSize}" font-weight="900" fill="url(#${textId})">${esc(b.bottom)}</text>
            <text x="300" y="800" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2" fill="#F0DFAE">OLADAPO OLALEYE</text>
          </svg>
        </div>
        <div class="body">
          <h3>${esc(b.title)}</h3>
          <div class="author">By Oladapo Olaleye &middot; Word and Faith Network</div>
          <p>${esc(b.desc)}</p>
          <div class="library-actions">
            <a class="btn btn-sm" href="/library/${b.slug}.html">Read</a>
            <a class="btn btn-outline btn-sm" href="/assets/library/${b.slug}.pdf" download>Download PDF</a>
          </div>
        </div>
      </div>
      `;
    }).join("") + `
      <a class="home-row" href="/library/" style="margin-top:4px;">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/></svg></div>
        <div class="body"><h3>Browse the Library</h3><p>All titles on wfnglobal.org</p></div>
        <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
      </a>
    `;
  }

  // ---------------------------------------------------------------------
  // Profile: name/avatar, notes, highlights, saved verses, personal prayer list
  // ---------------------------------------------------------------------

  function dateLabel(ts) {
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function viewProfile() {
    const profile = WFNStore.getProfile();
    setHeader("Profile", true);
    setActiveTab("profile");

    if (!profile) {
      viewEl.innerHTML = `
        <div class="card profile-setup-card">
          <h2>Set Up Your Profile</h2>
          <p>Your name is kept on this device only — there's no account or sign-in.</p>
          <input type="text" id="profileNameInput" placeholder="Your name" style="width:100%; border:1px solid var(--border); border-radius:12px; padding:12px 14px; font-size:15px; margin-bottom:14px; text-align:center;">
          <button class="btn btn-block" id="profileSaveBtn">Save Profile</button>
        </div>
      `;
      document.getElementById("profileSaveBtn").addEventListener("click", () => {
        const input = document.getElementById("profileNameInput");
        if (WFNStore.saveProfile(input.value)) viewProfile();
      });
      return;
    }

    const notes = WFNStore.getNotes();
    const marks = WFNStore.getMarks();
    const highlights = marks.filter((m) => m.color);
    const savedVerses = marks.filter((m) => m.saved);
    const prayers = WFNStore.getPrayers();
    const streak = WFNStore.getStreak();
    const daysThisYear = WFNStore.getDaysActiveThisYear();

    viewEl.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${esc(profile.initial)}</div>
        <div>
          <h2 class="profile-name">${esc(profile.name)}</h2>
          <a class="profile-edit-link" href="#/profile/edit">Edit Profile</a>
        </div>
      </div>

      <div class="activity-card">
        <div class="activity-stat">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#C9A968" stroke-width="1.7"><path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-1-2-1-2 2 1 3 4 3 6a6 6 0 0 1-12 0c0-4 2-5 2-7 0-1.5-.5-2.5-1-4 1 .3 2.5 1 3 0z"/></svg></div>
          <div class="activity-num">${streak}</div>
          <div class="activity-label">Day${streak === 1 ? "" : "s"} Streak</div>
        </div>
        <div class="activity-stat">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#C9A968" stroke-width="1.7"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg></div>
          <div class="activity-num">${daysThisYear}</div>
          <div class="activity-label">Days in ${new Date().getFullYear()}</div>
        </div>
      </div>

      <a class="menu-row" href="#/profile/notes">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v13l-4 3-4-3-4 3-4-3V4z"/></svg></div>
        <div class="label">Notes</div>
        <div class="count">${notes.length}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </a>
      <a class="menu-row" href="#/profile/highlights">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20l4-1 10-10-3-3L5 16l-1 4z"/></svg></div>
        <div class="label">Highlights</div>
        <div class="count">${highlights.length}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </a>
      <a class="menu-row" href="#/profile/verses">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg></div>
        <div class="label">Saved Verses</div>
        <div class="count">${savedVerses.length}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </a>
      <a class="menu-row" href="#/profile/prayer">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9z"/></svg></div>
        <div class="label">My Prayer List</div>
        <div class="count">${prayers.length}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </a>
      <a class="menu-row" href="#/profile/appearance">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg></div>
        <div class="label">Appearance</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </a>
    `;
  }

  function viewProfileAppearance() {
    setHeader("Appearance", true);
    setActiveTab("profile");
    const pref = getThemePref();
    const rotate = getRotatePref();
    const reduceMotion = getMotionPref();

    const themeOpts = [
      { mode: "light", label: "Light", icon: `<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>` },
      { mode: "dark", label: "Dark", icon: `<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>` },
      { mode: "auto", label: "Auto", icon: `<path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/><circle cx="12" cy="12" r="9"/>` }
    ].map((o) => `
      <button class="theme-opt" data-mode="${o.mode}" data-active="${pref === o.mode ? 1 : 0}" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${o.icon}</svg>
        ${o.label}
      </button>
    `).join("");

    viewEl.innerHTML = `
      <div class="section-label">Appearance</div>
      <div class="card" style="margin-bottom:20px;">
        <p style="font-size:13px; color:var(--ink-2); margin:0 0 14px; line-height:1.55;">Choose how Word &amp; Faith looks on this device.</p>
        <div class="theme-row">${themeOpts}</div>
      </div>

      <div class="card" style="margin-bottom:20px; padding:0;">
        <div style="display:flex; align-items:center; gap:14px; padding:17px 18px; border-bottom:1px solid var(--border);">
          <div style="flex:1;">
            <h3 style="font-size:14.5px; margin:0 0 3px;">Rotating Backgrounds</h3>
            <p style="font-size:12.5px; color:var(--ink-2); line-height:1.5; margin:0;">The Verse of the Day and Today's Declaration cards cycle through vibrant color.</p>
          </div>
          <button class="sheet-toggle" id="rotateToggle" data-on="${rotate ? 1 : 0}" type="button" aria-label="Toggle rotating backgrounds"></button>
        </div>
        <div style="display:flex; align-items:center; gap:14px; padding:17px 18px;">
          <div style="flex:1;">
            <h3 style="font-size:14.5px; margin:0 0 3px;">Reduce Motion</h3>
            <p style="font-size:12.5px; color:var(--ink-2); line-height:1.5; margin:0;">Turn off background transitions and animation.</p>
          </div>
          <button class="sheet-toggle" id="motionToggle" data-on="${reduceMotion ? 1 : 0}" type="button" aria-label="Toggle reduce motion"></button>
        </div>
      </div>

      <div class="section-label">Reading</div>
      <button class="menu-row" id="appearanceReaderSettingsBtn" type="button" style="width:100%; text-align:left; border:1px solid var(--border);">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h11M19 7h1M4 17h1M9 17h11M4 12h7M15 12h5"/><circle cx="18" cy="7" r="2.2"/><circle cx="7" cy="17" r="2.2"/><circle cx="11" cy="12" r="2.2"/></svg></div>
        <div class="label">Text Size &amp; Fonts</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </button>
    `;

    viewEl.querySelectorAll(".theme-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyTheme(btn.dataset.mode);
        viewProfileAppearance();
      });
    });
    document.getElementById("rotateToggle").addEventListener("click", () => {
      setRotatePref(!rotate);
      viewProfileAppearance();
    });
    document.getElementById("motionToggle").addEventListener("click", () => {
      setMotionPref(!reduceMotion);
      viewProfileAppearance();
    });
    document.getElementById("appearanceReaderSettingsBtn").addEventListener("click", openReaderSettingsSheet);
  }

  function viewProfileEdit() {
    const profile = WFNStore.getProfile();
    setHeader("Edit Profile", true);
    setActiveTab("profile");
    viewEl.innerHTML = `
      <div class="card">
        <input type="text" id="profileNameInput" value="${esc(profile ? profile.name : "")}" placeholder="Your name" style="width:100%; border:1px solid var(--border); border-radius:12px; padding:12px 14px; font-size:15px; margin-bottom:14px;">
        <button class="btn btn-block" id="profileSaveBtn">Save</button>
      </div>
    `;
    document.getElementById("profileSaveBtn").addEventListener("click", () => {
      const input = document.getElementById("profileNameInput");
      WFNStore.saveProfile(input.value);
      location.hash = "#/profile";
    });
  }

  function emptyState(msg) {
    return `<div class="empty-state">${esc(msg)}</div>`;
  }

  function viewProfileNotes() {
    setHeader("Notes", true);
    setActiveTab("profile");
    const notes = WFNStore.getNotes();
    if (!notes.length) { viewEl.innerHTML = emptyState("No notes yet. Add one from any sermon or Bible chapter."); return; }
    viewEl.innerHTML = notes.map((n) => `
      <div class="list-item" data-id="${n.id}">
        <div class="list-item-top">
          <span class="list-item-ref">${esc(n.refLabel)}</span>
          <span class="list-item-date">${dateLabel(n.createdAt)}</span>
        </div>
        <p class="list-item-text">${esc(n.text)}</p>
        <div class="list-item-actions">
          <button class="danger" data-action="delete">Delete</button>
        </div>
      </div>`).join("");
    wireListDeletes(viewEl, (id) => { WFNStore.deleteNote(id); viewProfileNotes(); });
  }

  function viewProfileHighlights() {
    setHeader("Highlights", true);
    setActiveTab("profile");
    const highlights = WFNStore.getMarks().filter((m) => m.color);
    if (!highlights.length) { viewEl.innerHTML = emptyState("No highlighted verses yet. Tap any verse in the Bible to highlight it."); return; }
    viewEl.innerHTML = highlights.map((m) => `
      <a class="list-item" data-id="${m.id}" href="#/bible/${m.bookSlug}/${m.chapter}" data-color="${m.color}" style="display:block; border-left:4px solid var(--gold-light);">
        <div class="list-item-top">
          <span class="list-item-ref">${esc(m.bookName)} ${m.chapter}:${m.verse}</span>
          <span class="list-item-date">${dateLabel(m.createdAt)}</span>
        </div>
        <p class="list-item-text">${esc(m.text)}</p>
      </a>`).join("");
  }

  function viewProfileVerses() {
    setHeader("Saved Verses", true);
    setActiveTab("profile");
    const saved = WFNStore.getMarks().filter((m) => m.saved);
    if (!saved.length) { viewEl.innerHTML = emptyState("No saved verses yet. Tap any verse in the Bible to save it."); return; }
    viewEl.innerHTML = saved.map((m) => `
      <a class="list-item" data-id="${m.id}" href="#/bible/${m.bookSlug}/${m.chapter}" style="display:block;">
        <div class="list-item-top">
          <span class="list-item-ref">${esc(m.bookName)} ${m.chapter}:${m.verse}</span>
          <span class="list-item-date">${dateLabel(m.createdAt)}</span>
        </div>
        <p class="list-item-text">${esc(m.text)}</p>
      </a>`).join("");
  }

  function viewProfilePrayer() {
    setHeader("My Prayer List", true);
    setActiveTab("profile");
    hideNoteFab();
    const prayers = WFNStore.getPrayers();
    const list = prayers.length
      ? prayers.map((p) => `
        <div class="list-item ${p.answered ? "answered" : ""}" data-id="${p.id}">
          <p class="list-item-text">${esc(p.text)}</p>
          <div class="list-item-actions">
            <button data-action="answered">${p.answered ? "Mark Unanswered" : "Mark Answered"}</button>
            <button class="danger" data-action="delete">Delete</button>
          </div>
        </div>`).join("")
      : emptyState("Nothing here yet. Add a prayer request below.");
    viewEl.innerHTML = `
      <div class="card" style="margin-bottom:20px; display:flex; gap:10px;">
        <input type="text" id="prayerInput" placeholder="Add a prayer request…" style="flex:1; border:1px solid var(--border); border-radius:12px; padding:11px 14px; font-size:14px;">
        <button class="btn" id="prayerAddBtn">Add</button>
      </div>
      ${list}
    `;
    document.getElementById("prayerAddBtn").addEventListener("click", () => {
      const input = document.getElementById("prayerInput");
      if (WFNStore.addPrayer(input.value)) viewProfilePrayer();
    });
    viewEl.querySelectorAll('[data-action="answered"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        WFNStore.togglePrayerAnswered(btn.closest(".list-item").dataset.id);
        viewProfilePrayer();
      });
    });
    wireListDeletes(viewEl, (id) => { WFNStore.deletePrayer(id); viewProfilePrayer(); });
  }

  function wireListDeletes(container, onDelete) {
    container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        onDelete(btn.closest(".list-item").dataset.id);
      });
    });
  }

  // ---------------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------------

  function route() {
    hideNoteFab();
    const hash = location.hash.replace(/^#\/?/, "");
    const parts = hash.split("/").filter(Boolean);

    if (parts.length === 0 || parts[0] === "home") return viewHome();
    if (parts[0] === "bible") {
      if (parts.length === 1) {
        if (gateSkipped("bible")) { location.replace("#/bible/books"); return; }
        return viewBibleIntro();
      }
      if (parts[1] === "books") return viewBibleBooks();
      if (parts[1] === "search") return viewBibleSearch(parts[2]);
      if (parts.length === 2) return viewBibleChapters(parts[1]);
      if (parts.length >= 3) return viewBibleReader(parts[1], parts[2]);
    }
    if (parts[0] === "sermons") {
      if (parts.length >= 2) {
        if (parts[1] === "list") return viewSermonsList();
        // Deep link straight out to the full sermon page on the main site.
        location.href = "/articles/" + parts[1] + ".html";
        return;
      }
      if (gateSkipped("sermons")) { location.replace("#/sermons/list"); return; }
      return viewSermonsIntro();
    }
    if (parts[0] === "prayer") {
      if (parts.length >= 2 && parts[1] === "list") return viewPrayer();
      if (gateSkipped("prayer")) { location.replace("#/prayer/list"); return; }
      return viewPrayerIntro();
    }
    if (parts[0] === "library") {
      if (parts.length >= 2 && parts[1] === "list") return viewLibrary();
      if (gateSkipped("library")) { location.replace("#/library/list"); return; }
      return viewLibraryIntro();
    }
    if (parts[0] === "profile") {
      if (parts.length === 1) return viewProfile();
      if (parts[1] === "edit") return viewProfileEdit();
      if (parts[1] === "notes") return viewProfileNotes();
      if (parts[1] === "highlights") return viewProfileHighlights();
      if (parts[1] === "verses") return viewProfileVerses();
      if (parts[1] === "prayer") return viewProfilePrayer();
      if (parts[1] === "appearance") return viewProfileAppearance();
      return viewProfile();
    }

    return viewHome();
  }

  // ---------------------------------------------------------------------
  // Back navigation: a real in-app history stack, so the header's back
  // arrow returns to wherever the person actually came from (e.g. the
  // chapter list after reading a chapter) instead of always jumping Home.
  // ---------------------------------------------------------------------

  let backStack = [];
  let isBackNav = false;

  backEl.addEventListener("click", (e) => {
    e.preventDefault();
    if (backStack.length) {
      isBackNav = true;
      location.hash = backStack.pop();
    } else {
      location.hash = "#/home";
    }
  });

  window.addEventListener("hashchange", (e) => {
    if (!isBackNav) {
      const oldHash = (() => {
        try { return new URL(e.oldURL).hash || "#/home"; } catch (err) { return "#/home"; }
      })();
      backStack.push(oldHash);
    }
    isBackNav = false;
    route();
  });

  window.addEventListener("DOMContentLoaded", () => {
    WFNStore.recordActivityToday();
    route();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/app/sw.js").catch(() => {});
    }
  });
})();

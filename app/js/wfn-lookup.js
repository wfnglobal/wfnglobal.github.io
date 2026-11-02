/* WFN Lookup & Translate — shared across the app and every website page.
 * Adds two things that work on ANY selected text, anywhere this script is
 * loaded, without leaving the page:
 *   - Lookup: a plain-English (or Bible-name) definition of a word
 *   - Translate: the selected text rendered into one of the app's added
 *     languages (Yoruba, Igbo, Hausa, Pidgin, Spanish, French, Portuguese)
 *
 * This does NOT touch the Bible reading page's existing per-word tap
 * definitions (the ".w" word buttons in app.js) — that stays exactly as
 * it is. This is a separate, selection-based layer available everywhere
 * else: sermon pages, library chapters, the homepage, declaration text,
 * and inside the app's own sheets.
 *
 * Exposes window.WFNLookup = { defineWord, translateText, TRANSLATE_LANGS }
 * so other scripts (app.js) can build their own UI on top of the same
 * lookup/translate pipeline instead of duplicating it.
 */
(function () {
  "use strict";

  var TRANSLATE_LANGS = [
    { code: "en", name: "English" },
    { code: "yo", name: "Yorùbá" },
    { code: "ig", name: "Igbo" },
    { code: "ha", name: "Hausa" },
    { code: "pcm", name: "Pidgin" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "pt", name: "Português" }
  ];
  var TIMEOUT_MS = 7000;
  var NO_MT_LANGS = { pcm: true };
  var DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/";

  function esc(s) {
    return (s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fetchWithTimeout(url, ms) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, ms) : null;
    return fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(
      function (res) { if (t) clearTimeout(t); return res; },
      function (err) { if (t) clearTimeout(t); throw err; }
    );
  }

  // ---- Translation pipeline: two free engines, cached on-device, a
  // couple of retries each before giving up (ported from the app's own
  // Verse-of-the-Day/Declaration translate pipeline so behavior matches). ----
  function cacheKey(text, lang) {
    var h = 0;
    for (var i = 0; i < text.length; i++) { h = (h * 31 + text.charCodeAt(i)) | 0; }
    return "wfn-translate-cache:" + lang + ":" + h;
  }
  function getCached(text, lang) { try { return localStorage.getItem(cacheKey(text, lang)); } catch (e) { return null; } }
  function setCached(text, lang, v) { try { localStorage.setItem(cacheKey(text, lang), v); } catch (e) {} }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function fetchGoogleTranslate(text, lang) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" + lang + "&dt=t&q=" + encodeURIComponent(text);
    return fetchWithTimeout(url, TIMEOUT_MS).then(function (res) { return res.json(); }).then(function (json) {
      var out = (json && json[0]) ? json[0].map(function (seg) { return seg[0]; }).join("") : "";
      return out.trim() || null;
    });
  }
  function looksLikeMtError(out) {
    if (!out) return true;
    var t = out.trim();
    if (/query length limit|invalid (source|target)|is not supported|please select|no translations? found|mymemory warning|ambiguous/i.test(t)) return true;
    if (t.length < 80 && t === t.toUpperCase() && /^[A-Z0-9 .:,'"-]+$/.test(t)) return true;
    return false;
  }
  function fetchMyMemory(text, lang) {
    var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=en|" + lang;
    return fetchWithTimeout(url, TIMEOUT_MS).then(function (res) { return res.json(); }).then(function (json) {
      var out = json && json.responseData && json.responseData.translatedText;
      var looksReal = out && out.trim() && out.trim().toLowerCase() !== text.trim().toLowerCase() && !looksLikeMtError(out);
      return looksReal ? out.trim() : null;
    });
  }
  async function translateOne(text, lang) {
    if (lang === "en") return text;
    var cached = getCached(text, lang);
    if (cached && !looksLikeMtError(cached)) return cached;
    var myMemoryUsable = text.length <= 480;
    var attempts = [];
    if (!NO_MT_LANGS[lang]) {
      attempts.push(function () { return fetchGoogleTranslate(text, lang); });
      attempts.push(function () { return fetchGoogleTranslate(text, lang); });
      if (!myMemoryUsable) attempts.push(function () { return fetchGoogleTranslate(text, lang); });
    }
    if (myMemoryUsable) {
      attempts.push(function () { return fetchMyMemory(text, lang); });
      attempts.push(function () { return fetchMyMemory(text, lang); });
    }
    for (var i = 0; i < attempts.length; i++) {
      try {
        var out = await attempts[i]();
        if (out) { setCached(text, lang, out); return out; }
      } catch (e) { /* try the next engine/attempt */ }
      if (i < attempts.length - 1) await sleep(350 + i * 250);
    }
    return null;
  }
  async function translateText(text, lang) {
    if (!lang || lang === "en") return text;
    return await translateOne(text, lang);
  }

  // ---- Dictionary lookup: Bible names/terms first (same compiled
  // dictionary the Bible reader uses), then a plain English dictionary. ----
  var bibleDictPromise = null;
  function getBibleDict() {
    if (!bibleDictPromise) {
      bibleDictPromise = fetch("/app/data/bible-dictionary.json")
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (json) { return (json && json.entries) || {}; })
        .catch(function () { return {}; });
    }
    return bibleDictPromise;
  }
  function lookupBibleDict(dict, key) {
    if (dict[key]) return dict[key];
    if (key.slice(-2) === "'s" && dict[key.slice(0, -2)]) return dict[key.slice(0, -2)];
    if (key.slice(-1) === "s" && dict[key.slice(0, -1)]) return dict[key.slice(0, -1)];
    if (key.slice(-2) === "es" && dict[key.slice(0, -2)]) return dict[key.slice(0, -2)];
    return null;
  }
  async function defineWord(word) {
    var clean = (word || "").replace(/[^A-Za-z']/g, "");
    var key = clean.toLowerCase();
    if (!key) return { word: word || "", def: null };
    var dict = await getBibleDict();
    var hit = lookupBibleDict(dict, key);
    if (hit) return { word: clean, def: hit };
    try {
      var res = await fetchWithTimeout(DICTIONARY_API + encodeURIComponent(key), TIMEOUT_MS);
      if (!res.ok) throw new Error("no definition");
      var json = await res.json();
      var meaning = json[0] && json[0].meanings && json[0].meanings[0];
      var def = meaning && meaning.definitions && meaning.definitions[0] && meaning.definitions[0].definition;
      return { word: clean, def: def || null };
    } catch (e) {
      return { word: clean, def: null };
    }
  }

  window.WFNLookup = { defineWord: defineWord, translateText: translateText, TRANSLATE_LANGS: TRANSLATE_LANGS };

  // -------------------------------------------------------------------
  // Selection-triggered floating toolbar — DISABLED. Lookup and Translate
  // now live inside the single "Copy / Share / Pray" bar (wfn-tts.js,
  // #wfnShareBar) so there's one toolbar on selected/tapped text, not two
  // competing for the same spot. The API above (defineWord/translateText/
  // TRANSLATE_LANGS) is still used by that bar and by the Bible verse
  // sheet and Declaration page, so it stays exported. Everything below
  // this point is kept but inert (wrapped in `if (false)`) in case a
  // standalone pill is ever wanted again.
  // -------------------------------------------------------------------
  if (false) {
  var style = document.createElement("style");
  style.textContent =
    ".wfn-sel-toolbar{position:fixed;z-index:9999;display:flex;gap:3px;background:#1C1710;border-radius:11px;padding:5px;box-shadow:0 14px 34px -14px rgba(0,0,0,.55);opacity:0;transform:translateY(4px) scale(.98);pointer-events:none;transition:opacity .14s ease,transform .14s ease;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}" +
    ".wfn-sel-toolbar.show{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}" +
    ".wfn-sel-btn{appearance:none;border:none;background:none;color:#F6EAD2;font:inherit;font-size:12.5px;font-weight:600;padding:7px 12px;border-radius:7px;cursor:pointer;white-space:nowrap;}" +
    ".wfn-sel-btn:hover,.wfn-sel-btn:active{background:rgba(255,255,255,.14);}" +
    ".wfn-lookup-pop{position:fixed;z-index:9999;max-width:280px;min-width:200px;background:#FFFDF8;color:#231F18;border-radius:13px;padding:16px 18px;font-size:13.5px;line-height:1.55;box-shadow:0 18px 44px -16px rgba(0,0,0,.42);border:1px solid rgba(35,31,24,.1);opacity:0;transform:translateY(4px);pointer-events:none;transition:opacity .16s ease,transform .16s ease;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}" +
    ".wfn-lookup-pop.show{opacity:1;transform:translateY(0);pointer-events:auto;}" +
    ".wfn-lookup-pop b{display:block;margin-bottom:5px;color:#9C7A34;text-transform:capitalize;font-size:13px;letter-spacing:.01em;}" +
    ".wfn-lookup-pop select{margin-top:10px;width:100%;font-size:12.5px;padding:7px 9px;border-radius:8px;border:1px solid rgba(35,31,24,.15);font-family:inherit;background:#fff;}" +
    ".wfn-lookup-pop .wfn-pop-close{position:absolute;top:7px;right:8px;width:22px;height:22px;border:none;background:none;color:#8C8370;cursor:pointer;font-size:17px;line-height:1;border-radius:50%;}" +
    ".wfn-lookup-pop .wfn-pop-close:hover{background:rgba(35,31,24,.06);}" +
    ".wfn-lookup-pop .wfn-pop-note{margin-top:8px;font-size:11.5px;color:#8C8370;}";
  document.head.appendChild(style);

  var toolbar, pop;
  function ensureEls() {
    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.className = "wfn-sel-toolbar";
      toolbar.innerHTML =
        '<button type="button" class="wfn-sel-btn" data-act="lookup">Lookup</button>' +
        '<button type="button" class="wfn-sel-btn" data-act="translate">Translate</button>';
      document.body.appendChild(toolbar);
    }
    if (!pop) {
      pop = document.createElement("div");
      pop.className = "wfn-lookup-pop";
      document.body.appendChild(pop);
    }
  }
  function hideToolbar() { if (toolbar) toolbar.classList.remove("show"); }
  function hidePop() { if (pop) pop.classList.remove("show"); }
  function closeBtnHtml() { return '<button type="button" class="wfn-pop-close" aria-label="Close">&times;</button>'; }
  function wireClose() { var b = pop.querySelector(".wfn-pop-close"); if (b) b.addEventListener("click", hidePop); }

  function placeNear(el, rect) {
    var w = el.offsetWidth || 180, h = el.offsetHeight || 40;
    var left = Math.max(10, Math.min(window.innerWidth - w - 10, rect.left + rect.width / 2 - w / 2));
    var top = rect.top - h - 10;
    if (top < 10) top = Math.min(window.innerHeight - h - 10, rect.bottom + 10);
    el.style.left = left + "px";
    el.style.top = top + "px";
  }

  var lastSelectionText = "", lastRect = null;

  function onSelectionChange() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { hideToolbar(); return; }
    var text = sel.toString().trim();
    if (!text || text.length > 400) { hideToolbar(); return; }
    var anchor = sel.anchorNode;
    var el = anchor && (anchor.nodeType === 1 ? anchor : anchor.parentElement);
    if (!el || el.closest("input, textarea, select, .wfn-sel-toolbar, .wfn-lookup-pop")) { hideToolbar(); return; }
    ensureEls();
    lastSelectionText = text;
    lastRect = sel.getRangeAt(0).getBoundingClientRect();
    if (!lastRect || (!lastRect.width && !lastRect.height)) { hideToolbar(); return; }
    placeNear(toolbar, lastRect);
    toolbar.classList.add("show");
    hidePop();
  }
  var selTimer;
  document.addEventListener("selectionchange", function () {
    clearTimeout(selTimer);
    selTimer = setTimeout(onSelectionChange, 60);
  });
  document.addEventListener("scroll", hideToolbar, true);
  document.addEventListener("mousedown", function (e) {
    if (!toolbar && !pop) return;
    if ((toolbar && toolbar.contains(e.target)) || (pop && pop.contains(e.target))) return;
    hideToolbar();
    hidePop();
  });

  async function handleLookup() {
    var text = lastSelectionText;
    var firstWord = (text.match(/[A-Za-z']+/) || [text])[0];
    pop.innerHTML = closeBtnHtml() + "<b>" + esc(firstWord) + "</b>Looking up…";
    placeNear(pop, lastRect);
    pop.classList.add("show");
    wireClose();
    var multiWord = /\s/.test(text.trim());
    var result = await defineWord(firstWord);
    var defText = result && result.def ? esc(result.def) : "No definition found for this word.";
    var note = multiWord
      ? '<div class="wfn-pop-note">Showing the first word of your selection — select just one word for a precise definition.</div>'
      : "";
    pop.innerHTML = closeBtnHtml() + "<b>" + esc((result && result.word) || firstWord) + "</b>" + defText + note;
    wireClose();
    placeNear(pop, lastRect);
  }

  function handleTranslate() {
    var text = lastSelectionText;
    var preview = text.length > 120 ? text.slice(0, 120) + "…" : text;
    var opts = TRANSLATE_LANGS.filter(function (l) { return l.code !== "en"; })
      .map(function (l) { return '<option value="' + l.code + '">' + esc(l.name) + "</option>"; }).join("");
    pop.innerHTML =
      closeBtnHtml() + '<b>Translate</b>&ldquo;' + esc(preview) + '&rdquo;' +
      '<select><option value="">Choose a language…</option>' + opts + "</select>";
    placeNear(pop, lastRect);
    pop.classList.add("show");
    wireClose();
    pop.querySelector("select").addEventListener("change", async function (e) {
      var lang = e.target.value;
      if (!lang) return;
      var langName = (TRANSLATE_LANGS.filter(function (l) { return l.code === lang; })[0] || {}).name || lang;
      pop.innerHTML = closeBtnHtml() + "<b>" + esc(langName) + "</b>Translating…";
      wireClose();
      placeNear(pop, lastRect);
      var out = await translateText(text, lang);
      var note = out ? "" : '<div class="wfn-pop-note">Translation is temporarily unavailable — showing the original English.</div>';
      pop.innerHTML = closeBtnHtml() + "<b>" + esc(langName) + "</b>" + esc(out || text) + note;
      wireClose();
      placeNear(pop, lastRect);
    });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".wfn-sel-btn") : null;
    if (!btn) return;
    e.preventDefault();
    hideToolbar();
    if (btn.dataset.act === "lookup") handleLookup();
    else if (btn.dataset.act === "translate") handleTranslate();
  });
  } // end inert block
})();

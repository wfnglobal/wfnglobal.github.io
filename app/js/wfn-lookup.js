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
 * Exposes window.WFNLookup = { defineWord, lookupFull, renderLookupInto,
 *   openLookup, translateText, TRANSLATE_LANGS }
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

  // ---- Dictionary. A full English dictionary ships with the app
  // (/app/data/dict/<first two letters>.json — Princeton WordNet 3.1, ~83k
  // words with every main sense, example sentences and synonyms, plus
  // pronunciation from the CMU Pronouncing Dictionary), so lookups work
  // offline and never depend on a live API. On top of that: a King James
  // glossary for archaic forms (hath, cometh, spake…), a lemmatizer so
  // inflected words (arose, smote, nations, sanctified) find their entry,
  // the Easton/Smith Bible dictionary for names, places and Bible terms,
  // and — when online — a picture from Wikipedia for concrete things
  // (animals, plants, objects, places, people). ----
  var APP_DATA = (typeof window !== "undefined" && typeof window.WFN_BASE === "string" ? window.WFN_BASE : "/") + "app/data/";
  var DICT_BASE = APP_DATA + "dict/";
  var KJV = {
    thee: "you (object form)", thou: "you (one person, as the subject)", thy: "your", thine: "yours; your (before a vowel)",
    ye: "you (more than one person)", hath: "has", hast: "have (with “thou”)", hadst: "had (with “thou”)", doth: "does",
    dost: "do (with “thou”)", didst: "did (with “thou”)", shalt: "shall (with “thou”)", wilt: "will (with “thou”)",
    art: "are (with “thou”)", wast: "were (with “thou”)", wert: "were (with “thou”)", canst: "can (with “thou”)",
    unto: "to; toward", whosoever: "whoever", whomsoever: "whomever", verily: "truly; certainly",
    behold: "look! — pay attention to what follows", saith: "says", spake: "spoke", sware: "swore", brake: "broke",
    begat: "fathered; was the father of", smote: "struck hard; defeated", slew: "killed", wrought: "worked; made; brought about",
    wherefore: "why; for what reason — or: therefore", nigh: "near", betwixt: "between", peradventure: "perhaps; by chance",
    howbeit: "nevertheless; however", forasmuch: "since; seeing that", henceforth: "from now on", hither: "here; to this place",
    thither: "there; to that place", whither: "where; to what place", thence: "from there", hence: "from here; therefore",
    whence: "from where", yea: "yes; indeed", nay: "no", lo: "look! see!", shew: "show", shewed: "showed",
    holpen: "helped", durst: "dared", wot: "know", wist: "knew", trow: "think; believe", ere: "before",
    anon: "at once; soon", aught: "anything", naught: "nothing", raiment: "clothing", victuals: "food",
    kine: "cows; cattle", brethren: "brothers; fellow believers", firmament: "the sky; the expanse of the heavens",
    sup: "eat supper; dine", meet: "fitting; proper (as in “it is meet”)", quick: "living, alive (as in “the quick and the dead”)",
    conversation: "way of life; conduct", charity: "love — self-giving, Christlike love", prevent: "go before; come ahead of",
    let: "hinder, restrain (in older usage) — or: allow", suffer: "allow, permit — or: endure", corn: "grain of any kind (wheat, barley)",
    meat: "food in general", tarry: "wait; stay", amen: "so be it; truly", selah: "a pause — likely a musical rest to reflect",
    hosanna: "“save now!” — a cry of praise", abba: "father (Aramaic, intimate)", mammon: "wealth; riches",
    publican: "tax collector", scrip: "a small bag or wallet", lest: "so that … not; for fear that"
  };
  var CONCRETE = { "noun.animal": 1, "noun.plant": 1, "noun.artifact": 1, "noun.food": 1, "noun.object": 1, "noun.body": 1, "noun.location": 1, "noun.person": 1, "noun.substance": 1, "noun.phenomenon": 1 };
  var POS_ORDER = { noun: 0, verb: 1, adjective: 2, adverb: 3 };

  var shardCache = {}, excPromise = null;
  function getShard(word) {
    var k = word.replace(/[^a-z]/g, "").slice(0, 2) || "_";
    if (!shardCache[k]) {
      shardCache[k] = fetch(DICT_BASE + k + ".json")
        .then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { delete shardCache[k]; return {}; });
    }
    return shardCache[k];
  }
  function getExc() {
    if (!excPromise) excPromise = fetch(DICT_BASE + "_exc.json").then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { excPromise = null; return {}; });
    return excPromise;
  }

  var bibleDictPromise = null;
  function getBibleDict() {
    if (!bibleDictPromise) {
      bibleDictPromise = fetch(APP_DATA + "bible-dictionary.json")
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (json) { return (json && json.entries) || {}; })
        .catch(function () { bibleDictPromise = null; return {}; });
    }
    return bibleDictPromise;
  }
  function lookupBibleDict(dict, key) {
    if (dict[key]) return dict[key];
    if (key.slice(-2) === "'s" && dict[key.slice(0, -2)]) return dict[key.slice(0, -2)];
    if (key.slice(-1) === "s" && dict[key.slice(0, -1)]) return dict[key.slice(0, -1)];
    if (key.slice(-3) === "ites" && dict[key.slice(0, -4)]) return dict[key.slice(0, -4)];
    if (key.slice(-3) === "ite" && dict[key.slice(0, -3)]) return dict[key.slice(0, -3)];
    return null;
  }

  // Candidate base forms for an inflected word, best guess first
  // (WordNet's "morphy" suffix rules + King James -eth/-est endings +
  // doubled consonants + a few British spellings).
  function baseForms(w) {
    var out = [];
    function add(x) { if (x && x.length > 1 && out.indexOf(x) < 0) out.push(x); }
    var m;
    if ((m = w.match(/^(.+?)(eth|est)$/))) {
      var s = m[1];
      add(s); add(s + "e");
      if (/(.)\1$/.test(s)) add(s.slice(0, -1));
      if (/i$/.test(s)) add(s.slice(0, -1) + "y");
    }
    if (/th$/.test(w)) add(w.slice(0, -2));
    if (/st$/.test(w)) add(w.slice(0, -2));
    if (/ies$/.test(w)) add(w.slice(0, -3) + "y");
    if (/(s|x|z|ch|sh)es$/.test(w)) add(w.slice(0, -2));
    if (/es$/.test(w)) add(w.slice(0, -1));
    if (/s$/.test(w) && !/ss$/.test(w)) add(w.slice(0, -1));
    if (/ied$/.test(w)) add(w.slice(0, -3) + "y");
    if ((m = w.match(/^(.+?)(ed|ing)$/))) {
      var b = m[1];
      if (/(.)\1$/.test(b) && !/(ll|ss|ff|zz)$/.test(b)) add(b.slice(0, -1));
      add(b + "e"); add(b);
      if (/y$/.test(b) === false && /i$/.test(b)) add(b.slice(0, -1) + "y");
    }
    if ((m = w.match(/^(.+?)(er|est)$/))) {
      var a = m[1];
      if (/i$/.test(a)) add(a.slice(0, -1) + "y");
      if (/(.)\1$/.test(a)) add(a.slice(0, -1));
      add(a); add(a + "e");
    }
    if (/ly$/.test(w)) { add(w.slice(0, -2)); if (/ily$/.test(w)) add(w.slice(0, -3) + "y"); }
    if (/men$/.test(w)) add(w.slice(0, -3) + "man");
    if (/our$/.test(w)) add(w.slice(0, -3) + "or");
    if (/ise$/.test(w)) add(w.slice(0, -3) + "ize");
    if (/ised$/.test(w)) add(w.slice(0, -4) + "ize");
    if (/re$/.test(w)) add(w.slice(0, -2) + "er");
    return out;
  }

  function normalizeWord(word) {
    return (word || "").replace(/[‘’]/g, "'").replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "").replace(/'s$/i, "").replace(/[^A-Za-z'-]/g, "");
  }

  // Full lookup — returns everything the renderer needs.
  async function lookupFull(word) {
    var clean = normalizeWord(word);
    var key = clean.toLowerCase().replace(/'/g, "");
    var res = { input: clean, lemma: null, entry: null, kjv: KJV[key] || null, formOf: null, bible: null, online: null };
    if (!key) return res;
    var exc = await getExc();
    var shard = await getShard(key);
    if (shard[key]) { res.lemma = key; res.entry = shard[key]; }
    var base = exc[key];
    if (!base) {
      var cands = baseForms(key);
      for (var i = 0; i < cands.length && !base; i++) {
        var sh = await getShard(cands[i]);
        if (sh[cands[i]]) base = cands[i];
      }
    }
    if (base && base !== key) {
      var bsh = await getShard(base);
      if (bsh[base]) {
        if (!res.entry) { res.lemma = base; res.entry = bsh[base]; res.formOf = base; }
        else res.alsoForm = base;
      }
    }
    var bd = await getBibleDict();
    res.bible = lookupBibleDict(bd, key) || (base ? lookupBibleDict(bd, base) : null);
    // Last resort for words WordNet doesn't carry: the free online dictionary.
    if (!res.entry && !res.bible && !res.kjv) {
      try {
        var r = await fetchWithTimeout(DICTIONARY_API + encodeURIComponent(key), TIMEOUT_MS);
        if (r.ok) {
          var json = await r.json();
          var e = {};
          (json || []).forEach(function (j) {
            (j.meanings || []).forEach(function (mn) {
              var p = mn.partOfSpeech || "other";
              e[p] = (e[p] || []).concat((mn.definitions || []).slice(0, 6).map(function (d) {
                var o = { d: d.definition };
                if (d.example) o.e = [d.example];
                if (d.synonyms && d.synonyms.length) o.s = d.synonyms.slice(0, 5);
                return o;
              }));
            });
            if (!e._p && j.phonetic) e._p = j.phonetic.replace(/^\/|\/$/g, "");
          });
          if (Object.keys(e).some(function (k) { return k[0] !== "_"; })) { res.entry = e; res.lemma = key; res.online = true; }
        }
      } catch (err) { /* offline */ }
    }
    return res;
  }

  // Back-compat: the short one-line answer some older callers want.
  async function defineWord(word) {
    var r = await lookupFull(word);
    var first = null;
    if (r.entry) {
      var poss = Object.keys(r.entry).filter(function (k) { return k[0] !== "_"; });
      if (poss.length) first = r.entry[poss[0]][0].d;
    }
    var def = r.kjv ? r.kjv + (first ? " — " + first : "") : (first || r.bible || null);
    return { word: r.input, def: def };
  }

  // Picture from Wikipedia's free summary API (only for concrete things).
  var imgCache = {};
  function fetchImage(title) {
    if (imgCache[title] !== undefined) return Promise.resolve(imgCache[title]);
    var url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.charAt(0).toUpperCase() + title.slice(1).replace(/ /g, "_")) + "?redirect=true";
    return fetchWithTimeout(url, 6000).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var out = (j && j.type === "standard" && j.thumbnail && j.thumbnail.source)
        ? { src: (j.originalimage && j.originalimage.width <= 1200 ? j.originalimage.source : j.thumbnail.source.replace(/\/\d+px-/, "/640px-")), page: j.content_urls && j.content_urls.mobile && j.content_urls.mobile.page, title: j.title }
        : null;
      imgCache[title] = out;
      return out;
    }).catch(function () { return null; });
  }

  var LOOKUP_CSS = [
    ".wfl{font-family:'Inter',-apple-system,system-ui,sans-serif; color:var(--wfn-glass-ink,#231F18);}",
    ".wfl-top{display:flex; align-items:flex-end; gap:12px; flex-wrap:wrap; margin:2px 0 4px;}",
    ".wfl-word{font-family:'Fraunces',Georgia,serif; font-size:34px; line-height:1.1; font-weight:600; letter-spacing:-0.015em;}",
    ".wfl-ipa{font-size:15px; color:var(--wfn-glass-ink-2,#5C5444); padding-bottom:4px;}",
    ".wfl-say{border:1px solid var(--wfn-glass-line,rgba(0,0,0,.1)); background:rgba(255,255,255,.25); color:var(--wfn-glass-accent,#9C7A34); width:32px; height:32px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; padding:0; margin-bottom:2px;}",
    ".wfl-say svg{width:16px; height:16px;}",
    ".wfl-form{font-size:13.5px; color:var(--wfn-glass-ink-2,#5C5444); margin:2px 0 10px;}",
    ".wfl-form a,.wfl-link{color:var(--wfn-glass-accent,#9C7A34); font-weight:600; cursor:pointer; text-decoration:none; border:0; background:none; padding:0; font:inherit;}",
    ".wfl-img{margin:12px 0 4px; border-radius:18px; overflow:hidden; position:relative; background:rgba(0,0,0,.05); display:none;}",
    ".wfl-img.on{display:block;}",
    ".wfl-img img{display:block; width:100%; max-height:230px; object-fit:cover;}",
    ".wfl-img figcaption{position:absolute; left:0; right:0; bottom:0; padding:18px 12px 7px; font-size:11px; color:#fff; background:linear-gradient(transparent,rgba(0,0,0,.55)); text-align:right;}",
    ".wfl-img figcaption a{color:#fff; opacity:.9;}",
    ".wfl-kjv{margin:12px 0 4px; padding:11px 14px; border-radius:14px; background:rgba(156,122,52,.12); font-size:14.5px; line-height:1.5;}",
    ".wfl-kjv b{color:var(--wfn-glass-accent,#9C7A34); font-size:11px; letter-spacing:.12em; text-transform:uppercase; display:block; margin-bottom:2px;}",
    ".wfl-pos{font-size:12px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--wfn-glass-accent,#9C7A34); margin:18px 0 6px; padding-top:12px; border-top:1px solid var(--wfn-glass-line,rgba(0,0,0,.1));}",
    ".wfl-pos:first-of-type{border-top:0; padding-top:0;}",
    ".wfl ol{margin:0; padding:0 0 0 22px;}",
    ".wfl li{margin:0 0 11px; font-size:15.5px; line-height:1.55; padding-left:2px;}",
    ".wfl li::marker{color:var(--wfn-glass-ink-3,#8C8370); font-weight:600; font-size:13px;}",
    ".wfl-ex{display:block; font-family:'Fraunces',Georgia,serif; font-style:italic; color:var(--wfn-glass-ink-2,#5C5444); font-size:14.5px; margin-top:3px;}",
    ".wfl-syn{display:flex; flex-wrap:wrap; gap:5px; margin-top:6px;}",
    ".wfl-syn button{border:1px solid var(--wfn-glass-line,rgba(0,0,0,.1)); background:rgba(255,255,255,.22); color:var(--wfn-glass-ink-2,#5C5444); border-radius:100px; padding:3px 10px; font:inherit; font-size:12.5px; cursor:pointer;}",
    "html[data-theme='dark'] .wfl-syn button, html[data-theme='dark'] .wfl-say{background:rgba(255,255,255,.07);}",
    ".wfl-bible{font-family:'Fraunces',Georgia,serif; font-size:15px; line-height:1.6; color:var(--wfn-glass-ink-2,#5C5444);}",
    ".wfl-src{font-size:11.5px; color:var(--wfn-glass-ink-3,#8C8370); margin-top:16px; line-height:1.5;}",
    ".wfl-none{font-size:15px; color:var(--wfn-glass-ink-2,#5C5444); margin:10px 0;}"
  ].join("\n");
  var cssDone = false;
  function ensureLookupCss() {
    if (window.WFNGlass && window.WFNGlass.ensureStyle) window.WFNGlass.ensureStyle();
    if (cssDone) return; cssDone = true;
    var st = document.createElement("style"); st.textContent = LOOKUP_CSS; document.head.appendChild(st);
  }
  var SPEAK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function trimBible(t) {
    t = (t || "").replace(/\s+/g, " ").trim();
    if (t.length <= 700) return { short: t, more: null };
    var cut = t.lastIndexOf(". ", 640);
    if (cut < 300) cut = 640;
    return { short: t.slice(0, cut + 1), more: t };
  }

  function renderLookup(r) {
    var h = '<div class="wfl">';
    var head = r.entry ? (r.formOf ? r.input.toLowerCase() : r.lemma) : r.input;
    if (r.bible && !r.entry) head = cap(r.input.toLowerCase());
    h += '<div class="wfl-top"><span class="wfl-word">' + esc(head) + "</span>";
    if (r.entry && r.entry._p && !r.formOf) h += '<span class="wfl-ipa">/' + esc(r.entry._p) + "/</span>";
    if (typeof speechSynthesis !== "undefined") h += '<button type="button" class="wfl-say" data-say="' + esc(head) + '" aria-label="Hear pronunciation">' + SPEAK_SVG + "</button>";
    h += "</div>";
    if (r.formOf) h += '<div class="wfl-form">A form of <button type="button" class="wfl-link" data-look="' + esc(r.formOf) + '">' + esc(r.formOf) + "</button>" + (r.entry._p ? ' &nbsp;<span class="wfl-ipa">/' + esc(r.entry._p) + "/</span>" : "") + "</div>";
    if (r.alsoForm) h += '<div class="wfl-form">Also a form of <button type="button" class="wfl-link" data-look="' + esc(r.alsoForm) + '">' + esc(r.alsoForm) + "</button></div>";
    h += '<figure class="wfl-img"></figure>';
    if (r.kjv) h += '<div class="wfl-kjv"><b>In the King James Bible</b>' + esc(r.kjv) + "</div>";
    if (r.entry) {
      var poss = Object.keys(r.entry).filter(function (k) { return k[0] !== "_"; });
      poss.sort(function (a, b) { return (r.entry[b].length - r.entry[a].length) || ((POS_ORDER[a] || 9) - (POS_ORDER[b] || 9)); });
      poss.forEach(function (p) {
        h += '<div class="wfl-pos">' + esc(p) + "</div><ol>";
        r.entry[p].forEach(function (s) {
          h += "<li>" + esc(cap(s.d));
          (s.e || []).forEach(function (ex) { ex = ex.replace(/["\u201d]?\s*-\s*[A-Z][A-Za-z.' ]+$/, "").replace(/^["\u201c]|["\u201d]$/g, ""); h += '<span class="wfl-ex">“' + esc(ex) + "”</span>"; });
          if (s.s && s.s.length) h += '<div class="wfl-syn">' + s.s.map(function (x) { return '<button type="button" data-look="' + esc(x) + '">' + esc(x) + "</button>"; }).join("") + "</div>";
          h += "</li>";
        });
        h += "</ol>";
      });
    }
    if (r.bible) {
      var b = trimBible(r.bible);
      h += '<div class="wfl-pos">In the Bible</div><div class="wfl-bible">' + esc(b.short) +
        (b.more ? ' <button type="button" class="wfl-link" data-more="1">Read more</button>' : "") + "</div>";
    }
    if (!r.entry && !r.bible && !r.kjv) h += '<div class="wfl-none">No definition found for “' + esc(r.input) + '”. Try selecting a single word, or check the spelling.</div>';
    var src = [];
    if (r.entry && !r.online) src.push("WordNet 3.1, Princeton University");
    if (r.online) src.push("Free Dictionary API");
    if (r.bible) src.push("Easton’s & Smith’s Bible Dictionaries");
    if (src.length) h += '<div class="wfl-src">Sources: ' + src.join(" · ") + '<span class="wfl-imgsrc"></span></div>';
    return h + "</div>";
  }

  function wantsImage(r) {
    if (!r.entry) return !!r.bible; // Bible names/places
    var poss = Object.keys(r.entry).filter(function (k) { return k[0] !== "_"; });
    if (!r.entry.noun || !CONCRETE[r.entry._x]) return false;
    var nounN = r.entry.noun.length;
    return poss.every(function (p) { return r.entry[p].length <= nounN; });
  }

  // Render into any element and wire up its links/buttons.
  var lookupSeq = 0;
  async function renderLookupInto(el, word, opts) {
    ensureLookupCss();
    var seq = ++lookupSeq;
    var r = await lookupFull(word);
    if (seq !== lookupSeq) return r;
    el.innerHTML = (opts && opts.head || "") + renderLookup(r);
    el.querySelectorAll("[data-look]").forEach(function (b) {
      b.addEventListener("click", function () {
        el.innerHTML = (opts && opts.head || "") + '<div class="wfl"><div class="wfl-none">Looking up&hellip;</div></div>';
        var p = el.closest(".wg-panel"); if (p) p.scrollTop = 0;
        renderLookupInto(el, b.dataset.look, opts);
      });
    });
    var more = el.querySelector("[data-more]");
    if (more) more.addEventListener("click", function () { more.parentNode.textContent = r.bible.replace(/\s+/g, " "); });
    var say = el.querySelector("[data-say]");
    if (say) say.addEventListener("click", function () {
      try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(say.dataset.say); u.lang = "en-US"; u.rate = 0.85; speechSynthesis.speak(u); } catch (e) {}
    });
    if (wantsImage(r)) {
      var title = r.entry ? r.lemma : r.input.toLowerCase();
      var img = await fetchImage(title);
      if (img && seq === lookupSeq) {
        var fig = el.querySelector(".wfl-img");
        if (fig) {
          fig.innerHTML = '<img alt="' + esc(img.title) + '" src="' + esc(img.src) + '"><figcaption>' + esc(img.title) + (img.page ? ' · <a href="' + esc(img.page) + '" target="_blank" rel="noopener">Wikipedia</a>' : "") + "</figcaption>";
          fig.querySelector("img").addEventListener("load", function () { fig.classList.add("on"); });
          var is = el.querySelector(".wfl-imgsrc"); if (is) is.textContent = " · Image: Wikipedia";
        }
      }
    }
    return r;
  }

  // Opens the frosted-glass Look Up sheet (falls back to a plain overlay
  // on pages without the glass system).
  function openLookup(word, note) {
    ensureLookupCss();
    var G = window.WFNGlass;
    var head = G ? G.head("Look Up") : "";
    var loading = head + '<div class="wfl"><div class="wfl-top"><span class="wfl-word">' + esc(normalizeWord(word)) + '</span></div><div class="wfl-none">Looking up&hellip;</div></div>';
    var body = G ? G.open(loading) : null;
    if (!body) return;
    var extra = note ? '<div class="wg-note" style="margin-top:0;margin-bottom:6px;">' + esc(note) + "</div>" : "";
    renderLookupInto(body, word, { head: head + extra });
  }

  window.WFNLookup = { defineWord: defineWord, lookupFull: lookupFull, renderLookupInto: renderLookupInto, openLookup: openLookup, translateText: translateText, TRANSLATE_LANGS: TRANSLATE_LANGS };

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

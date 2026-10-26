/* Word and Faith Network — shared "Listen" (text-to-speech) engine.
 *
 * Exposes window.WFNTTS, a small wrapper around the browser's built-in
 * speechSynthesis API (free, on-device, works offline on most platforms
 * once a voice is installed — no account, no API key, no server cost).
 *
 * On a plain website page (a sermon article, a library book) this file
 * also mounts its own small floating "Listen" control automatically.
 * The app sets window.WFN_TTS_MANUAL = true before loading this file and
 * builds its own control instead, using the app's existing bottom-sheet
 * UI — see app.js (openListenSheet).
 */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var SUPPORTED = "speechSynthesis" in window;
  var PREF_VOICE_KEY = "wfn-tts-voice";
  var PREF_RATE_KEY = "wfn-tts-rate";
  var RATE_OPTIONS = [0.8, 1, 1.15, 1.3, 1.5];

  // Named voices. Only real, distinct, unmodified device voices are ever
  // offered — no pitch-shifted fakes standing in for a voice that doesn't
  // exist, since a pitched duplicate is what sounded "terrible" to readers.
  // If the browser/OS only has one good voice installed, readers get one
  // option, not five. A French voice is offered when the device actually
  // has one; Jamaican Patois, Swahili, Twi, and Arabic were removed — no
  // mainstream browser ships a clear native voice for them, so every one of
  // those slots was silently falling back to a mangled substitute anyway.
  var ENGLISH_NAME_POOL = ["Bridget", "Declan", "Grace", "Marcus", "Naomi"];
  var VOICE_DEFS = [
    { name: "Amélie — French", langRe: /^fr/i }
  ];

  // iOS/macOS tags its "fun" sound-effect voices (Whisper, Bubbles, Zarvox,
  // Trinoids, Organ, Bells, Boing, Cellos, Jester, Wobble, Albert, Bahh,
  // "Bad News", "Good News", Superstar, plus the old robotic "Fred") with a
  // plain en-US language code, exactly like the real speaking voices — so
  // the "just take the first 5 en* voices" approach from the last pass was
  // quietly handing readers a mix of real voices and these joke ones, which
  // is exactly what sounded "muffled and terrible." They're blocked here by
  // name so only genuine reading voices ever fill a slot.
  var NOVELTY_VOICE_NAMES = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|rocko|sandy|shelley|junior|kathy|princess|ralph|hysterical)$/i;

  function isNovelty(v) {
    return NOVELTY_VOICE_NAMES.test((v.name || "").trim());
  }

  // When both a plain and an "Enhanced"/"Premium" copy of the same voice are
  // installed (iOS offers higher-quality downloads for several voices), the
  // better-sounding one wins rather than whichever happened to sort first.
  function qualityRank(v) {
    return /enhanced|premium|neural|natural/i.test(v.name || "") ? 0 : 1;
  }

  var listeners = [];
  var state = "idle"; // idle | playing | paused
  var queue = [];
  var queueIndex = 0;
  var cachedSlots = null;

  function emit() {
    listeners.forEach(function (fn) {
      try { fn(state); } catch (e) {}
    });
  }

  // Labeled slots mapped onto whatever voices the device/browser actually
  // has — never more than the number of genuinely distinct voices found,
  // and never pitch-shifted to fake a voice that isn't really there. A
  // language slot (French) is only included when a real native voice for
  // it exists; otherwise it's left out rather than silently substituted.
  function buildSlots() {
    if (!SUPPORTED) return [];
    var all = window.speechSynthesis.getVoices() || [];
    if (!all.length) return [];
    var real = all.filter(function (v) { return !isNovelty(v); });
    if (!real.length) real = all; // if everything got filtered, don't show nothing
    var en = real.filter(function (v) { return /^en/i.test(v.lang); });
    var enPool = en.length ? en : real;
    // Dedupe by base name (stripping an " (Enhanced)"/" (Premium)" suffix),
    // keeping the best-quality copy when more than one is installed.
    var byBase = {};
    enPool.forEach(function (v) {
      var base = (v.name || "").replace(/\s*\((enhanced|premium|neural|natural)\)\s*$/i, "").trim().toLowerCase();
      var existing = byBase[base];
      if (!existing || qualityRank(v) < qualityRank(existing)) byBase[base] = v;
    });
    var enUniq = Object.keys(byBase).map(function (k) { return byBase[k]; });
    var slots = [];
    var cap = Math.min(enUniq.length, ENGLISH_NAME_POOL.length);
    for (var i = 0; i < cap; i++) {
      slots.push({
        index: slots.length,
        label: ENGLISH_NAME_POOL[i],
        voice: enUniq[i],
        pitch: 1,
        native: true
      });
    }
    if (!slots.length && enUniq.length === 0 && real.length) {
      // No voice tagged "en*" at all — still offer whatever the device has
      // rather than show nothing.
      slots.push({ index: 0, label: ENGLISH_NAME_POOL[0], voice: real[0], pitch: 1, native: true });
    }
    VOICE_DEFS.forEach(function (def) {
      var voice = real.filter(function (v) { return def.langRe.test(v.lang); })[0] || null;
      if (!voice) return; // no real voice for this language — don't fake it
      slots.push({ index: slots.length, label: def.name, voice: voice, pitch: 1, native: true });
    });
    // "Pidgin" isn't a voice any engine actually has — it reads the page's
    // text after it's been run through the same Pidgin translation used
    // elsewhere on the site, using the best voice above, rather than a
    // pitched fake standing in for an accent (which is what made the other
    // slots sound bad in the first place).
    if (slots.length) {
      slots.push({
        index: slots.length,
        label: "Pidgin (translated)",
        voice: slots[0].voice,
        pitch: 1,
        native: true,
        pidgin: true
      });
    }
    return slots;
  }

  function getVoiceSlots(cb) {
    if (!SUPPORTED) { cb([]); return; }
    var slots = buildSlots();
    if (slots.length) {
      cachedSlots = slots;
      cb(slots);
      return;
    }
    // Voices often load asynchronously on first page load.
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      cachedSlots = buildSlots();
      cb(cachedSlots);
    }
    window.speechSynthesis.onvoiceschanged = finish;
    setTimeout(finish, 800);
  }

  function getPrefIndex() {
    try {
      var v = parseInt(localStorage.getItem(PREF_VOICE_KEY), 10);
      // Not clamped to a fixed count here — the real voice list varies by
      // device and is only known once speechSynthesis reports it; speakNext()
      // and the voice-select UI both fall back to slot 0 if this index turns
      // out to be out of range for what's actually available.
      return isNaN(v) ? 0 : Math.max(0, v);
    } catch (e) { return 0; }
  }
  function setPrefIndex(i) {
    try { localStorage.setItem(PREF_VOICE_KEY, String(i)); } catch (e) {}
  }
  function getRate() {
    try {
      var r = parseFloat(localStorage.getItem(PREF_RATE_KEY));
      return isNaN(r) ? 1 : r;
    } catch (e) { return 1; }
  }
  function setRate(r) {
    try { localStorage.setItem(PREF_RATE_KEY, String(r)); } catch (e) {}
  }

  // Break text into short, sentence-sized pieces. Keeps each utterance
  // well under what mobile speech engines choke on, and means pausing
  // lands at a natural sentence break rather than mid-word.
  function chunk(text) {
    var clean = (text || "").replace(/\s+/g, " ").trim();
    if (!clean) return [];
    var sentences = clean.match(/[^.!?]+[.!?]*(\s+|$)/g) || [clean];
    var chunks = [];
    var current = "";
    sentences.forEach(function (s) {
      if ((current + s).length > 220 && current) {
        chunks.push(current.trim());
        current = s;
      } else {
        current += s;
      }
    });
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  function buildQueue(items) {
    var out = [];
    (items || []).forEach(function (item) {
      chunk(item).forEach(function (c) { out.push(c); });
    });
    return out;
  }

  function speakNext() {
    if (queueIndex >= queue.length) {
      state = "idle";
      clearKeepAlive();
      emit();
      return;
    }
    var slots = cachedSlots || buildSlots();
    var slot = (slots && slots[getPrefIndex()]) || (slots && slots[0]);
    var u = new SpeechSynthesisUtterance(queue[queueIndex]);
    // Defensive: an unusable voice object should never silently kill the
    // whole reading queue — fall back to the engine's default voice instead.
    if (slot && slot.voice) {
      try { u.voice = slot.voice; } catch (e) {}
    }
    u.pitch = slot ? slot.pitch : 1;
    u.rate = getRate();
    u.onend = function () {
      if (state !== "playing") return; // stopped or paused mid-flight
      queueIndex++;
      speakNext();
    };
    u.onerror = function () {
      if (state !== "playing") return;
      queueIndex++;
      speakNext();
    };
    try {
      window.speechSynthesis.speak(u);
    } catch (e) {
      queueIndex++;
      speakNext();
    }
  }

  // Chrome silently drops a speak() call made in the same tick as a
  // preceding cancel() — give it a beat to actually clear first.
  var SPEAK_HANDOFF_MS = 60;
  var speakHandoffTimer = null;

  // Chrome also auto-stops an utterance that runs past ~15s unless it's
  // nudged; a pause/resume pulse while actively speaking keeps it alive
  // without the listener noticing (resume() is a no-op once truly done).
  var keepAliveTimer = null;
  function clearKeepAlive() {
    if (keepAliveTimer) { clearInterval(keepAliveTimer); keepAliveTimer = null; }
  }
  function startKeepAlive() {
    clearKeepAlive();
    keepAliveTimer = setInterval(function () {
      if (state !== "playing") return;
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);
  }

  function speak(items) {
    if (!SUPPORTED) return false;
    if (speakHandoffTimer) { clearTimeout(speakHandoffTimer); speakHandoffTimer = null; }
    window.speechSynthesis.cancel();
    queue = buildQueue(items);
    queueIndex = 0;
    if (!queue.length) return false;
    state = "playing";
    emit();
    startKeepAlive();
    speakHandoffTimer = setTimeout(function () {
      speakHandoffTimer = null;
      speakNext();
    }, SPEAK_HANDOFF_MS);
    return true;
  }

  function pause() {
    if (!SUPPORTED || state !== "playing") return;
    window.speechSynthesis.pause();
    state = "paused";
    emit();
  }
  function resume() {
    if (!SUPPORTED || state !== "paused") return;
    window.speechSynthesis.resume();
    state = "playing";
    emit();
  }
  function stop() {
    if (!SUPPORTED) return;
    if (speakHandoffTimer) { clearTimeout(speakHandoffTimer); speakHandoffTimer = null; }
    clearKeepAlive();
    window.speechSynthesis.cancel();
    queue = [];
    queueIndex = 0;
    state = "idle";
    emit();
  }
  function onState(fn) {
    listeners.push(fn);
    return function unsubscribe() {
      listeners = listeners.filter(function (f) { return f !== fn; });
    };
  }

  window.WFNTTS = {
    supported: SUPPORTED,
    getVoiceSlots: getVoiceSlots,
    getPrefIndex: getPrefIndex,
    setPrefIndex: setPrefIndex,
    getRate: getRate,
    setRate: setRate,
    rateOptions: RATE_OPTIONS,
    speak: speak,
    pause: pause,
    resume: resume,
    stop: stop,
    onState: onState,
    getState: function () { return state; },
    isPidginIndex: function (i) {
      var slots = cachedSlots || buildSlots();
      var s = slots && slots[i];
      return !!(s && s.pidgin);
    }
  };

  if (SUPPORTED) {
    // Nudge Chrome, which sometimes needs an early call before it reports voices.
    window.speechSynthesis.getVoices();
  }

  // ---------------------------------------------------------------------
  // Self-mounting floating widget for plain website pages. The app sets
  // window.WFN_TTS_MANUAL = true and skips all of this.
  // ---------------------------------------------------------------------
  if (window.WFN_TTS_MANUAL || !SUPPORTED) return;

  function collectReadable() {
    var body = document.querySelector(".article-body");
    if (body) {
      var items = [];
      var titleEl = document.querySelector(".article-title");
      if (titleEl) items.push(titleEl.textContent);
      body.querySelectorAll("p, h2").forEach(function (el) { items.push(el.textContent); });
      return items;
    }
    var chapters = document.querySelectorAll("article.chapter");
    if (chapters.length) {
      var out = [];
      chapters.forEach(function (ch) {
        var eyebrow = ch.querySelector(".chapter-eyebrow");
        var title = ch.querySelector(".chapter-title");
        if (eyebrow) out.push(eyebrow.textContent);
        if (title) out.push(title.textContent);
        ch.querySelectorAll("p").forEach(function (p) { out.push(p.textContent); });
      });
      return out;
    }
    return null;
  }

  // Same two page shapes as collectReadable(), but returns the actual
  // elements (not just their text) so a translation can be written back
  // into the page, with each element's original English text captured
  // once up front so "Original" can restore it exactly.
  function collectTranslatable() {
    var body = document.querySelector(".article-body");
    var els = [];
    if (body) {
      var titleEl = document.querySelector(".article-title");
      if (titleEl) els.push(titleEl);
      body.querySelectorAll("p, h2").forEach(function (el) { els.push(el); });
    } else {
      document.querySelectorAll("article.chapter").forEach(function (ch) {
        var eyebrow = ch.querySelector(".chapter-eyebrow");
        var title = ch.querySelector(".chapter-title");
        if (eyebrow) els.push(eyebrow);
        if (title) els.push(title);
        ch.querySelectorAll("p").forEach(function (p) { els.push(p); });
      });
    }
    if (!els.length) return null;
    return els.map(function (el) { return { el: el, original: el.textContent }; });
  }

  // Translate: Yorùbá, Igbo, and Hausa route through Google's public
  // translation endpoint — the engine behind translate.google.com, which
  // has carried all three for years without the tiny shared daily quota
  // that made the previous free provider unreliable. Nigerian Pidgin has
  // no mainstream MT engine behind it at all (not Google, not Microsoft),
  // so it's attempted on a best-effort community translation memory and,
  // when that comes back empty, the page says so plainly instead of
  // leaving "Translating…" on screen forever.
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
  var TRANSLATE_TIMEOUT_MS = 7000;
  var NO_MT_LANGS = { pcm: true };

  function fetchWithTimeout(url, ms) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, ms);
    return fetch(url, { signal: controller.signal }).then(
      function (res) { clearTimeout(timer); return res; },
      function (err) { clearTimeout(timer); throw err; }
    );
  }

  // On-device cache so the same sentence on this page is never fetched
  // twice from the free endpoint, and still works offline once seen.
  function cacheKey(text, langCode) {
    var h = 0;
    for (var i = 0; i < text.length; i++) { h = (h * 31 + text.charCodeAt(i)) | 0; }
    return "wfn-translate-cache:" + langCode + ":" + h;
  }
  function getCached(text, langCode) {
    try { return localStorage.getItem(cacheKey(text, langCode)); } catch (e) { return null; }
  }
  function setCached(text, langCode, translated) {
    try { localStorage.setItem(cacheKey(text, langCode), translated); } catch (e) {}
  }

  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  function fetchGoogleTranslate(text, langCode) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" + langCode + "&dt=t&q=" + encodeURIComponent(text);
    return fetchWithTimeout(url, TRANSLATE_TIMEOUT_MS)
      .then(function (res) { return res.json(); })
      .then(function (json) {
        var out = (json && json[0]) ? json[0].map(function (seg) { return seg[0]; }).join("") : "";
        return out && out.trim() ? out : null;
      });
  }

  // MyMemory's free endpoint returns its error messages as ordinary
  // "translatedText" — e.g. "QUERY LENGTH LIMIT EXCEEDED. MAX ALLOWED
  // QUERY: 500 CHARS" for anything over 500 characters — with nothing in
  // the response marking it as an error. Left unfiltered, that error text
  // gets treated as a real translation and read aloud to listeners.
  function looksLikeMtError(out) {
    if (!out) return true;
    var t = out.trim();
    if (/query length limit|invalid (source|target)|is not supported|please select|no translations? found|mymemory warning|ambiguous/i.test(t)) return true;
    if (t.length < 80 && t === t.toUpperCase() && /^[A-Z0-9 .:,'"-]+$/.test(t)) return true;
    return false;
  }

  function fetchMyMemory(text, langCode) {
    var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=en|" + langCode;
    return fetchWithTimeout(url, TRANSLATE_TIMEOUT_MS)
      .then(function (res) { return res.json(); })
      .then(function (json) {
        var out = json && json.responseData && json.responseData.translatedText;
        var looksReal = out && out.trim() && out.trim().toLowerCase() !== text.trim().toLowerCase() && !looksLikeMtError(out);
        return looksReal ? out : null;
      });
  }

  // Two independent free engines, tried in sequence with short backoffs —
  // neither has an SLA and both occasionally throttle or drop a request
  // without warning, worse during peak hours on a shared IP. Trying Google
  // twice then MyMemory twice before giving up is what made this reliable.
  function translateOne(text, langCode) {
    if (langCode === "en") return Promise.resolve(text);

    var cached = getCached(text, langCode);
    if (cached && !looksLikeMtError(cached)) return Promise.resolve(cached);

    // MyMemory hard-rejects anything over ~500 characters with an error
    // message (see looksLikeMtError), so for longer passages it would
    // never succeed — skip it and give Google the extra attempt instead.
    var myMemoryUsable = text.length <= 480;

    var attempts = [];
    if (!NO_MT_LANGS[langCode]) {
      attempts.push(function () { return fetchGoogleTranslate(text, langCode); });
      attempts.push(function () { return fetchGoogleTranslate(text, langCode); });
      if (!myMemoryUsable) attempts.push(function () { return fetchGoogleTranslate(text, langCode); });
    }
    if (myMemoryUsable) {
      attempts.push(function () { return fetchMyMemory(text, langCode); });
      attempts.push(function () { return fetchMyMemory(text, langCode); });
    }

    var i = 0;
    function tryNext() {
      if (i >= attempts.length) return Promise.resolve(null);
      var attempt = attempts[i++];
      return attempt().catch(function () { return null; }).then(function (out) {
        if (out) { setCached(text, langCode, out); return out; }
        if (i >= attempts.length) return null;
        return sleep(350 + i * 250).then(tryNext);
      });
    }
    return tryNext();
  }

  // Runs translateOne over a list with at most a few requests in flight at
  // once, instead of firing every request in the same instant — a burst of
  // simultaneous unauthenticated requests is what a free endpoint throttles
  // or drops first.
  function translateTextsLimited(texts, langCode) {
    var results = new Array(texts.length);
    var next = 0;
    function worker() {
      var i = next++;
      if (i >= texts.length) return Promise.resolve();
      return translateOne(texts[i], langCode).then(function (out) {
        results[i] = out;
        return worker();
      });
    }
    var workers = [];
    for (var w = 0; w < Math.min(4, texts.length); w++) workers.push(worker());
    return Promise.all(workers).then(function () { return results; });
  }

  function translatePairs(pairs, langCode, noteEl) {
    if (noteEl) noteEl.hidden = true;
    if (!langCode || langCode === "en") {
      pairs.forEach(function (p) { p.el.textContent = p.original; });
      return Promise.resolve();
    }
    pairs.forEach(function (p) { p.el.textContent = "Translating…"; });
    var anyFailed = false;
    return translateTextsLimited(pairs.map(function (p) { return p.original; }), langCode).then(function (outs) {
      pairs.forEach(function (p, i) {
        if (outs[i]) {
          p.el.textContent = outs[i];
        } else {
          p.el.textContent = p.original;
          anyFailed = true;
        }
      });
    }).then(function () {
      if (!noteEl) return;
      if (anyFailed && NO_MT_LANGS[langCode]) {
        noteEl.hidden = false;
        noteEl.textContent = "Pidgin translation isn't available for this page yet — no major translation engine fully supports it, so this is shown in English for now.";
      } else if (anyFailed) {
        noteEl.hidden = false;
        noteEl.textContent = "Translation is temporarily unavailable — showing the original English.";
      }
    });
  }

  function mountWidget() {
    var items = collectReadable();
    if (!items || !items.length) return;
    var translatable = collectTranslatable();

    var style = document.createElement("style");
    style.textContent = [
      /* Docked to the LEFT edge, vertically centered — its own corner,
         clear of the "Back to App" pill at bottom-right. Collapsed by
         default to a slim ear-tab mostly tucked off the edge of the
         viewport, so almost none of it sits over the article; the
         exposed sliver carries a waveform icon as the permanent cue
         that it's there, backed by a one-time glow + label the first
         time a reader sees it. */
      "#wfnVoiceStack{position:fixed;left:0;top:58%;transform:translateY(-50%);z-index:150;display:flex;flex-direction:row-reverse;align-items:center;font-family:'Inter',-apple-system,system-ui,sans-serif;}",
      "#wfnListenTray{display:flex;flex-direction:column;gap:9px;padding:9px;margin-left:8px;border-radius:22px;background:rgba(251,248,241,0.94);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(35,31,24,0.12);box-shadow:0 16px 36px -12px rgba(80,64,24,0.22);max-width:168px;overflow:hidden;opacity:1;transform:scale(1) translateX(0);transform-origin:left center;transition:max-width .22s ease,opacity .18s ease,transform .22s ease,margin .22s ease,padding .22s ease;}",
      "#wfnVoiceStack.wfnl-collapsed #wfnListenTray{max-width:0;opacity:0;transform:scale(.85) translateX(-10px);margin-left:0;padding:0;pointer-events:none;border-width:0;}",
      "#wfnListenBtn,#wfnTranslateBtn{display:flex;align-items:center;justify-content:center;gap:8px;border:none;border-radius:100px;width:148px;height:48px;box-sizing:border-box;font-size:13px;font-weight:700;cursor:pointer;flex-shrink:0;}",
      "#wfnListenBtn{background:#9C7A34;color:#2A2008;box-shadow:0 6px 14px -6px rgba(80,64,24,0.22);}",
      "#wfnTranslateBtn{background:#231F18;color:#E7CE94;outline:1.5px solid #C9A968;outline-offset:-1.5px;}",
      "#wfnListenBtn:active,#wfnTranslateBtn:active{transform:scale(0.96);}",
      "#wfnListenBtn svg,#wfnTranslateBtn svg{width:18px;height:18px;flex-shrink:0;}",
      "#wfnListenPanel,#wfnTranslatePanel{padding:14px 16px 4px;}",
      "#wfnListenPanel.wfnl-panel-hidden,#wfnTranslatePanel.wfnl-panel-hidden{display:none;}",
      "#wfnListenPanel h4,#wfnTranslatePanel h4{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:1.05rem;color:#231F18;margin-bottom:2px;}",
      "#wfnListenPanel .wfnl-sub,#wfnTranslatePanel .wfnl-sub{font-size:12px;color:#8C8370;margin-bottom:10px;}",
      "#wfnListenPanel label,#wfnTranslatePanel label{display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9C7A34;margin:12px 0 6px;}",
      "#wfnListenPanel select,#wfnTranslatePanel select{width:100%;padding:9px 10px;border-radius:9px;border:1px solid rgba(35,31,24,0.16);font-size:13.5px;font-family:inherit;background:#FBF8F1;color:#231F18;}",
      "#wfnListenControls{display:flex;gap:10px;margin:16px 0 14px;}",
      "#wfnListenControls button{flex:1;border:none;border-radius:100px;padding:10px 0;font-weight:600;font-size:13.5px;cursor:pointer;font-family:inherit;}",
      "#wfnListenPlay{background:#9C7A34;color:#FFFDF8;}",
      "#wfnListenStop{background:#F4EEE0;color:#564E3E;}",
      "#wfnTranslateNote{font-size:12px;color:#8C8370;font-style:italic;line-height:1.5;margin:4px 0 14px;}",
      "#wfnVoiceToggle{position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0;width:42px;height:68px;border-radius:0 18px 18px 0;border:none;cursor:pointer;background:#231F18;color:#E7CE94;box-shadow:4px 0 18px -6px rgba(80,64,24,0.3);margin-left:-16px;transition:margin-left .22s ease;}",
      "#wfnVoiceStack:not(.wfnl-collapsed) #wfnVoiceToggle{margin-left:0;}",
      "#wfnVoiceToggle:active{transform:scale(0.94);}",
      "#wfnVoiceToggle svg{width:19px;height:19px;position:absolute;}",
      "#wfnVoiceToggle .wfnl-icon-expanded{display:none;}",
      "#wfnVoiceStack:not(.wfnl-collapsed) #wfnVoiceToggle .wfnl-icon-collapsed{display:none;}",
      "#wfnVoiceStack:not(.wfnl-collapsed) #wfnVoiceToggle .wfnl-icon-expanded{display:block;}",
      "#wfnVoiceToggle.wfnl-hint-pulse{animation:wfnlPulse 1.3s ease-in-out 3;}",
      ".wfnl-hint{position:absolute;left:52px;top:50%;transform:translateY(-50%);white-space:nowrap;background:#231F18;color:#FFFDF8;font-size:12.5px;font-weight:700;padding:8px 14px;border-radius:100px;box-shadow:0 8px 20px -6px rgba(80,64,24,0.3);opacity:0;pointer-events:none;animation:wfnlHintIn .3s ease .5s forwards,wfnlHintOut .3s ease 3.8s forwards;}",
      ".wfnl-hint::before{content:'';position:absolute;left:-5px;top:50%;width:8px;height:8px;background:#231F18;transform:translateY(-50%) rotate(45deg);border-radius:1px;}",
      "@keyframes wfnlPulse{0%,100%{box-shadow:4px 0 18px -6px rgba(80,64,24,0.3),0 0 0 0 rgba(201,169,104,.5);}50%{box-shadow:4px 0 18px -6px rgba(80,64,24,0.3),0 0 0 8px rgba(201,169,104,0);}}",
      "@keyframes wfnlHintIn{to{opacity:1;}}",
      "@keyframes wfnlHintOut{to{opacity:0;}}"
    ].join("\n");
    document.head.appendChild(style);

    var translateOptionsHtml = '<option value="">Translate…</option>' + TRANSLATE_LANGS.map(function (l) {
      return '<option value="' + l.code + '">' + l.name.replace(/</g, "&lt;") + "</option>";
    }).join("");

    var stack = document.createElement("div");
    stack.id = "wfnVoiceStack";
    stack.innerHTML =
      '<div id="wfnListenTray">' +
      (translatable
        ? '<button id="wfnTranslateBtn" type="button" aria-label="Translate this page">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h8M9 5v3M11 8c-1 3-3 5-6 6M8 8c1.3 3.6 3.4 6 7 7.5"/><path d="M14 21l4-9 4 9M15.5 18h5"/></svg>' +
          "Translate" +
          "</button>"
        : "") +
      '<button id="wfnListenBtn" type="button" aria-label="Listen to this page">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"/></svg>' +
      '<span id="wfnListenBtnLabel">Listen</span>' +
      "</button>" +
      '<div id="wfnListenPanel" class="wfnl-panel-hidden">' +
      "<h4>Listen</h4>" +
      '<p class="wfnl-sub">Have this page read aloud.</p>' +
      '<label for="wfnVoiceSel">Voice</label>' +
      '<select id="wfnVoiceSel"></select>' +
      '<label for="wfnRateSel">Speed</label>' +
      '<select id="wfnRateSel"></select>' +
      '<div id="wfnListenControls">' +
      '<button id="wfnListenPlay" type="button">Play</button>' +
      '<button id="wfnListenStop" type="button">Stop</button>' +
      "</div>" +
      "</div>" +
      (translatable
        ? '<div id="wfnTranslatePanel" class="wfnl-panel-hidden">' +
          "<h4>Translate</h4>" +
          '<p class="wfnl-sub">Read this page in another language.</p>' +
          '<select id="wfnTranslateSel">' + translateOptionsHtml + "</select>" +
          '<p id="wfnTranslateNote" hidden></p>' +
          "</div>"
        : "") +
      "</div>" +
      '<button id="wfnVoiceToggle" type="button" aria-label="Show the Listen button">' +
      '<svg class="wfnl-icon-collapsed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10v4M10 6v12M14 9v6M18 7v10"/></svg>' +
      '<svg class="wfnl-icon-expanded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>' +
      "</button>";
    document.body.appendChild(stack);

    var voiceSel = stack.querySelector("#wfnVoiceSel");
    var rateSel = stack.querySelector("#wfnRateSel");
    var playBtn = stack.querySelector("#wfnListenPlay");
    var stopBtn = stack.querySelector("#wfnListenStop");
    var btn = stack.querySelector("#wfnListenBtn");
    var btnLabel = stack.querySelector("#wfnListenBtnLabel");
    var toggle = stack.querySelector("#wfnVoiceToggle");
    var translateBtn = stack.querySelector("#wfnTranslateBtn");
    var listenPanelEl = stack.querySelector("#wfnListenPanel");
    var translatePanelEl = stack.querySelector("#wfnTranslatePanel");
    var translateSel = stack.querySelector("#wfnTranslateSel");
    var translateNoteEl = stack.querySelector("#wfnTranslateNote");

    if (translateBtn) {
      translateBtn.addEventListener("click", function () {
        listenPanelEl.classList.add("wfnl-panel-hidden");
        translatePanelEl.classList.toggle("wfnl-panel-hidden");
      });
      translateSel.addEventListener("change", function () {
        translatePairs(translatable, translateSel.value, translateNoteEl);
      });
    }

    window.WFNTTS.getVoiceSlots(function (slots) {
      voiceSel.innerHTML = slots.length
        ? slots
            .map(function (s) {
              return '<option value="' + s.index + '">' + s.label.replace(/</g, "&lt;") + "</option>";
            })
            .join("")
        : '<option value="0">Default Voice</option>';
      voiceSel.value = String(window.WFNTTS.getPrefIndex());
    });
    window.WFNTTS.rateOptions.forEach(function (r) {
      var o = document.createElement("option");
      o.value = r;
      o.textContent = r + "x";
      rateSel.appendChild(o);
    });
    rateSel.value = String(window.WFNTTS.getRate());

    // When "Pidgin (translated)" is chosen, run the items through the same
    // Pidgin translation the Translate panel uses before reading them —
    // falling back line-by-line to the English original if a given
    // sentence has no Pidgin translation available, rather than stalling.
    function speakSelected() {
      var idx = parseInt(voiceSel.value, 10) || 0;
      if (!window.WFNTTS.isPidginIndex(idx)) {
        window.WFNTTS.speak(items);
        return;
      }
      btnLabel.textContent = "Translating…";
      translateTextsLimited(items, "pcm").then(function (outs) {
        var pidginItems = outs.map(function (r, i) { return r || items[i]; });
        window.WFNTTS.speak(pidginItems);
      });
    }

    voiceSel.addEventListener("change", function () {
      window.WFNTTS.setPrefIndex(parseInt(voiceSel.value, 10) || 0);
      if (window.WFNTTS.getState() !== "idle") speakSelected();
    });
    rateSel.addEventListener("change", function () {
      window.WFNTTS.setRate(parseFloat(rateSel.value) || 1);
      if (window.WFNTTS.getState() !== "idle") speakSelected();
    });

    var panelEl = stack.querySelector("#wfnListenPanel");
    btn.addEventListener("click", function () {
      if (translatePanelEl) translatePanelEl.classList.add("wfnl-panel-hidden");
      panelEl.classList.toggle("wfnl-panel-hidden");
    });

    playBtn.addEventListener("click", function () {
      var st = window.WFNTTS.getState();
      if (st === "playing") { window.WFNTTS.pause(); return; }
      if (st === "paused") { window.WFNTTS.resume(); return; }
      speakSelected();
    });
    stopBtn.addEventListener("click", function () {
      window.WFNTTS.stop();
    });

    window.WFNTTS.onState(function (st) {
      playBtn.textContent = st === "playing" ? "Pause" : st === "paused" ? "Resume" : "Play";
      btnLabel.textContent = st === "idle" ? "Listen" : st === "playing" ? "Listening…" : "Paused";
    });

    window.addEventListener("pagehide", function () {
      window.WFNTTS.stop();
    });

    // ---- hide / unhide the whole control, with a one-time discovery hint ----
    var COLLAPSE_KEY = "wfn-voice-fab-collapsed";
    var HINT_KEY = "wfn-voice-hint-seen";

    function setCollapsed(on) {
      stack.classList.toggle("wfnl-collapsed", on);
      toggle.setAttribute("aria-label", on ? "Show the Listen button" : "Hide the Listen button");
      try { localStorage.setItem(COLLAPSE_KEY, on ? "1" : "0"); } catch (e) {}
    }
    function dismissHint() {
      var hintEl = toggle.querySelector(".wfnl-hint");
      if (hintEl) hintEl.parentNode.removeChild(hintEl);
      toggle.classList.remove("wfnl-hint-pulse");
      try { localStorage.setItem(HINT_KEY, "1"); } catch (e) {}
    }

    var storedCollapse = null, hintSeen = false;
    try {
      storedCollapse = localStorage.getItem(COLLAPSE_KEY);
      hintSeen = localStorage.getItem(HINT_KEY) === "1";
    } catch (e) {}
    var autoread = location.hash === "#autoread";
    var startCollapsed = autoread ? false : (storedCollapse === null ? true : storedCollapse === "1");
    setCollapsed(startCollapsed);

    if (startCollapsed && !hintSeen) {
      toggle.classList.add("wfnl-hint-pulse");
      var hintEl = document.createElement("span");
      hintEl.className = "wfnl-hint";
      hintEl.textContent = "Tap to listen";
      toggle.appendChild(hintEl);
      setTimeout(dismissHint, 4200);
    }

    toggle.addEventListener("click", function () {
      dismissHint();
      setCollapsed(!stack.classList.contains("wfnl-collapsed"));
    });

    // Arrived here via a Tolu "...and read it" request from the app —
    // start reading right away and clear the marker from the URL.
    if (autoread) {
      dismissHint();
      panelEl.classList.remove("wfnl-panel-hidden");
      if (history.replaceState) {
        history.replaceState(null, "", location.pathname + location.search);
      }
      setTimeout(function () { window.WFNTTS.speak(items); }, 300);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountWidget);
  } else {
    mountWidget();
  }
})();

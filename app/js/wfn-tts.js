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
  var VOICE_SLOT_LABELS = ["Voice 1", "Voice 2", "Voice 3", "Voice 4", "Voice 5"];
  var RATE_OPTIONS = [0.8, 1, 1.15, 1.3, 1.5];

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

  function shortVoiceName(name) {
    return (name || "").replace(/^(Google|Microsoft)\s+/i, "").replace(/\s*\(.*\)\s*/g, "").trim();
  }

  // Five labeled "slots" mapped onto whatever voices the device/browser
  // actually has. Devices vary wildly in how many voices they expose —
  // this still always offers five choices, reusing voices with a slight
  // pitch variation when a device truly only has one or two installed.
  function buildSlots() {
    if (!SUPPORTED) return [];
    var all = window.speechSynthesis.getVoices() || [];
    if (!all.length) return [];
    var en = all.filter(function (v) { return /^en/i.test(v.lang); });
    var pool = en.length ? en : all;
    var seen = {};
    var uniq = pool.filter(function (v) {
      if (seen[v.name]) return false;
      seen[v.name] = 1;
      return true;
    });
    var pitches = [1, 1, 1, 0.92, 1.08];
    var slots = [];
    for (var i = 0; i < 5; i++) {
      var v = uniq.length ? uniq[i % uniq.length] : null;
      var usingFallbackPitch = uniq.length < 5;
      slots.push({
        index: i,
        label: VOICE_SLOT_LABELS[i] + (v ? " — " + shortVoiceName(v.name) : ""),
        voice: v,
        pitch: usingFallbackPitch ? pitches[i] : 1
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
      return isNaN(v) ? 0 : Math.min(4, Math.max(0, v));
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
      emit();
      return;
    }
    var slots = cachedSlots || buildSlots();
    var slot = (slots && slots[getPrefIndex()]) || (slots && slots[0]);
    var u = new SpeechSynthesisUtterance(queue[queueIndex]);
    if (slot && slot.voice) u.voice = slot.voice;
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
    window.speechSynthesis.speak(u);
  }

  function speak(items) {
    if (!SUPPORTED) return false;
    window.speechSynthesis.cancel();
    queue = buildQueue(items);
    queueIndex = 0;
    if (!queue.length) return false;
    state = "playing";
    emit();
    speakNext();
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
    getState: function () { return state; }
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

  function mountWidget() {
    var items = collectReadable();
    if (!items || !items.length) return;

    var style = document.createElement("style");
    style.textContent = [
      "#wfnListenBtn{position:fixed;left:max(18px,env(safe-area-inset-left,0px));bottom:max(18px,env(safe-area-inset-bottom,0px));z-index:150;display:flex;align-items:center;gap:8px;background:#231F18;color:#FFFDF8;border:1px solid rgba(255,253,248,0.12);border-radius:100px;padding:12px 18px 12px 14px;font-family:'Inter',-apple-system,system-ui,sans-serif;font-size:13px;font-weight:600;box-shadow:0 10px 28px -8px rgba(0,0,0,0.4);cursor:pointer;}",
      "#wfnListenBtn:active{transform:scale(0.97);}",
      "#wfnListenBtn svg{width:16px;height:16px;flex-shrink:0;}",
      "#wfnListenPanel{position:fixed;left:max(18px,env(safe-area-inset-left,0px));bottom:max(82px,calc(env(safe-area-inset-bottom,0px) + 82px));z-index:150;width:min(300px,calc(100vw - 36px));background:#FFFFFF;border:1px solid rgba(35,31,24,0.11);border-radius:16px;padding:18px;box-shadow:0 16px 40px -12px rgba(0,0,0,0.25);font-family:'Inter',-apple-system,system-ui,sans-serif;}",
      "#wfnListenPanel[hidden]{display:none;}",
      "#wfnListenPanel h4{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:1.05rem;color:#231F18;margin-bottom:2px;}",
      "#wfnListenPanel .wfnl-sub{font-size:12px;color:#8C8370;margin-bottom:10px;}",
      "#wfnListenPanel label{display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9C7A34;margin:12px 0 6px;}",
      "#wfnListenPanel select{width:100%;padding:9px 10px;border-radius:9px;border:1px solid rgba(35,31,24,0.16);font-size:13.5px;font-family:inherit;background:#FBF8F1;color:#231F18;}",
      "#wfnListenControls{display:flex;gap:10px;margin-top:16px;}",
      "#wfnListenControls button{flex:1;border:none;border-radius:100px;padding:10px 0;font-weight:600;font-size:13.5px;cursor:pointer;font-family:inherit;}",
      "#wfnListenPlay{background:#9C7A34;color:#FFFDF8;}",
      "#wfnListenStop{background:#F4EEE0;color:#564E3E;}"
    ].join("\n");
    document.head.appendChild(style);

    var btn = document.createElement("button");
    btn.id = "wfnListenBtn";
    btn.type = "button";
    btn.setAttribute("aria-label", "Listen to this page");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"/></svg>' +
      '<span id="wfnListenBtnLabel">Listen</span>';
    document.body.appendChild(btn);

    var panel = document.createElement("div");
    panel.id = "wfnListenPanel";
    panel.hidden = true;
    panel.innerHTML =
      "<h4>Listen</h4>" +
      '<p class="wfnl-sub">Have this page read aloud.</p>' +
      '<label for="wfnVoiceSel">Voice</label>' +
      '<select id="wfnVoiceSel"></select>' +
      '<label for="wfnRateSel">Speed</label>' +
      '<select id="wfnRateSel"></select>' +
      '<div id="wfnListenControls">' +
      '<button id="wfnListenPlay" type="button">Play</button>' +
      '<button id="wfnListenStop" type="button">Stop</button>' +
      "</div>";
    document.body.appendChild(panel);

    var voiceSel = panel.querySelector("#wfnVoiceSel");
    var rateSel = panel.querySelector("#wfnRateSel");
    var playBtn = panel.querySelector("#wfnListenPlay");
    var stopBtn = panel.querySelector("#wfnListenStop");
    var btnLabel = btn.querySelector("#wfnListenBtnLabel");

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

    voiceSel.addEventListener("change", function () {
      window.WFNTTS.setPrefIndex(parseInt(voiceSel.value, 10) || 0);
      if (window.WFNTTS.getState() !== "idle") window.WFNTTS.speak(items);
    });
    rateSel.addEventListener("change", function () {
      window.WFNTTS.setRate(parseFloat(rateSel.value) || 1);
      if (window.WFNTTS.getState() !== "idle") window.WFNTTS.speak(items);
    });

    btn.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
    });

    playBtn.addEventListener("click", function () {
      var st = window.WFNTTS.getState();
      if (st === "playing") { window.WFNTTS.pause(); return; }
      if (st === "paused") { window.WFNTTS.resume(); return; }
      window.WFNTTS.speak(items);
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountWidget);
  } else {
    mountWidget();
  }
})();

// WFN App 2.0 — Listen & Tolu (voice), and Translate.
// Ported from the classic app so nothing is lost: Listen reads any screen
// with a choice of voice and speed (Play, Pause, Resume, Stop); Tolu takes a
// spoken or typed request, opens the right screen and reads it; Translate
// turns any marked block into Yorùbá, Igbo, Hausa, Pidgin and more.
(function () {
  "use strict";
  const W = window.WFN2;
  const { esc, icon, C, $, $$ } = W;
  const TTS = () => (window.WFNTTS && window.WFNTTS.supported ? window.WFNTTS : null);

  // ---------- floating voice controls ----------
  function mountStack() {
    if ($("#voiceStack")) return;
    const el = document.createElement("div");
    el.id = "voiceStack"; el.className = "voice-stack";
    el.innerHTML = `<div class="voice-tray" id="voiceTray">
        <button class="voice-pill" id="vTolu" type="button">${icon("mic", "sm")}Ask Tolu</button>
        <button class="voice-pill" id="vListen" type="button">${icon("listen", "sm")}<span id="vListenTxt">Listen</span></button>
      </div>
      <button class="voice-fab" id="vToggle" type="button" aria-expanded="false" aria-label="Show Listen and Ask Tolu">${icon("wave")}</button>`;
    document.body.appendChild(el);
    applyPrefs();
    let open = W.read("wfn2-voice-open", false);
    const set = (v) => { open = v; el.classList.toggle("open", v); $("#vToggle").setAttribute("aria-expanded", String(v)); $("#vToggle").setAttribute("aria-label", v ? "Hide voice controls" : "Show Listen and Ask Tolu"); W.write("wfn2-voice-open", v); };
    set(open);
    $("#vToggle").onclick = () => set(!open);
    $("#vListen").onclick = listenSheet;
    $("#vTolu").onclick = toluSheet;
    const watch = () => { const t = TTS(); if (!t) return setTimeout(watch, 400); t.onState((st) => { const x = $("#vListenTxt"); if (x) x.textContent = st === "playing" ? "Playing…" : st === "paused" ? "Paused" : "Listen"; el.classList.toggle("playing", st !== "idle"); }); };
    watch();
  }
  // Listen and Ask Tolu are optional (You → Listen & Tolu).
  function applyPrefs() {
    const s = W.settings(), el = $("#voiceStack");
    if (!el) return;
    const L = s.showListen !== false, T = s.showTolu !== false;
    $("#vListen").hidden = !L; $("#vTolu").hidden = !T;
    el.hidden = (!L && !T) || /^#\/(climb|scan|invite)/.test(location.hash);
    $("#vToggle").setAttribute("aria-label", L && T ? "Show Listen and Ask Tolu" : L ? "Show Listen" : "Show Ask Tolu");
  }
  W.applyVoicePrefs = applyPrefs;
  W.openTolu = () => toluSheet();
  W.openListen = () => listenSheet();
  window.addEventListener("hashchange", () => {
    if (location.hash === "#/tolu") { history.replaceState(null, "", "#/"); W.route(); setTimeout(toluSheet, 300); return; }
    applyPrefs();
  });
  if (location.hash === "#/tolu") setTimeout(() => { history.replaceState(null, "", "#/"); W.route(); setTimeout(toluSheet, 300); }, 400);

  // ---------- Listen ----------
  function listenSheet() {
    const t = TTS();
    if (!t) return W.sheet(`<div class="sheet-head"><h2>Listen</h2><button class="btn sm soft" data-close>Close</button></div><p class="ink2">This browser can’t read text aloud. Try the latest Chrome, Safari or Edge.</p>`);
    const items = W.getReadable();
    W.sheet(`<div class="sheet-head"><h2>Listen</h2><button class="btn sm soft" data-close>Close</button></div>
      <p class="small ink2">${items.length ? "Have this screen read aloud, in your choice of voice." : "There’s nothing to read on this screen yet."}</p>
      <label class="small" for="lv" style="font-weight:600;color:var(--ink-2)">Voice</label><select class="field" id="lv"></select>
      <label class="small" for="lr" style="font-weight:600;color:var(--ink-2)">Speed</label><select class="field" id="lr"></select>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn lg" id="lp">Play</button><button class="btn lg ghost" id="ls">${icon("stop", "sm")}Stop</button></div>`, (el) => {
      const vs = $("#lv", el), rs = $("#lr", el), pb = $("#lp", el);
      t.getVoiceSlots((slots) => {
        vs.innerHTML = slots.length ? slots.map((s) => `<option value="${s.index}">${esc(s.label)}</option>`).join("") : `<option value="0">Default voice</option>`;
        vs.value = String(t.getPrefIndex());
      });
      rs.innerHTML = t.rateOptions.map((r) => `<option value="${r}">${r}x${r === 1 ? " (normal)" : ""}</option>`).join("");
      rs.value = String(t.getRate());
      async function play() {
        const idx = parseInt(vs.value, 10) || 0;
        const src = W.getReadable();
        if (!src.length) return;
        if (t.isPidginIndex(idx) && window.WFNLookup) {
          pb.textContent = "Translating…";
          const out = await limited(src, "pcm");
          return t.speak(out.map((o, i) => o || src[i]));
        }
        t.speak(src);
      }
      vs.onchange = () => { t.setPrefIndex(parseInt(vs.value, 10) || 0); if (t.getState() !== "idle") play(); };
      rs.onchange = () => { t.setRate(parseFloat(rs.value) || 1); if (t.getState() !== "idle") play(); };
      pb.onclick = () => { const st = t.getState(); if (st === "playing") return t.pause(); if (st === "paused") return t.resume(); play(); };
      $("#ls", el).onclick = () => W.stopSpeaking();
      const lab = () => { pb.textContent = t.getState() === "playing" ? "Pause" : t.getState() === "paused" ? "Resume" : "Play"; };
      lab(); t.onState(() => { if (document.body.contains(pb)) lab(); });
    });
  }

  // ---------- Tolu ----------
  const EXAMPLES = ["Open today’s sermon", "John 3 verse 16", "A verse about peace", "Pray for me", "What’s the weather?", "Set a timer for 10 minutes", "Remind me to pray at 9 pm", "Translate God is good into Yoruba", "Directions to the nearest church", "Play worship music", "Read this page", "Stop reading"];
  let lastSearch = null;
  let pendingRead = false;
  function readSoon() { pendingRead = true; setTimeout(() => { if (!pendingRead) return; pendingRead = false; const t = TTS(); const items = W.getReadable(); if (t && items.length) t.speak(items); }, 1400); }
  function go(h) { location.hash = h; }

  async function search(qRaw) {
    const q = qRaw.trim(), ql = q.toLowerCase();
    if (q.length < 2) return "Tell me a word or phrase to search for.";
    const sermons = (C.SERMONS || []).filter((s) => (s.title + " " + s.ref + " " + s.excerpt).toLowerCase().includes(ql));
    const studies = (C.BIBLE_STUDY || []).filter((s) => (s.title + " " + s.excerpt).toLowerCase().includes(ql));
    const books = (C.LIBRARY_BOOKS || []).filter((b) => (b.title + " " + b.desc).toLowerCase().includes(ql));
    let verses = [];
    try { verses = window.WFNBible ? await window.WFNBible.search(q, 5) : []; } catch (e) {}
    const total = sermons.length + studies.length + books.length + verses.length;
    if (!total) { lastSearch = null; return `I searched the sermons, Bible studies, the library and the whole Bible for “${qRaw}” and found nothing. Try another word.`; }
    if (total === sermons.length && sermons.length === 1) { go("#/sermon/" + sermons[0].slug); readSoon(); return `Found the sermon “${sermons[0].title}”. Opening and reading it now.`; }
    if (total === studies.length && studies.length === 1) { go("#/study/" + studies[0].slug); readSoon(); return `Found the Bible study “${studies[0].title}”. Opening it now.`; }
    if (total === verses.length) { const r = verses[0]; go(`#/bible/${r.slug}/${r.chapter}/${r.verse}`); readSoon(); return `Found “${qRaw}” in ${r.book} ${r.chapter}:${r.verse}. Opening and reading that chapter now.`; }
    lastSearch = { sermons, studies, books, verses };
    const parts = [];
    if (sermons.length) parts.push(`${sermons.length} sermon${sermons.length > 1 ? "s" : ""}, including “${sermons[0].title}”`);
    if (studies.length) parts.push(`${studies.length} Bible stud${studies.length > 1 ? "ies" : "y"}`);
    if (verses.length) parts.push(`${verses.length} verse${verses.length > 1 ? "s" : ""}, starting with ${verses[0].book} ${verses[0].chapter}:${verses[0].verse}`);
    if (books.length) parts.push(`${books.length} book${books.length > 1 ? "s" : ""} in the library`);
    return `For “${qRaw}” I found ${parts.join(", and ")}. Say “open the sermon”, “open the study”, “open that verse” or “open the book”.`;
  }

  const ORD = { first: "1", second: "2", third: "3", "1st": "1", "2nd": "2", "3rd": "3" };
  async function findBook(phrase) {
    let s = phrase.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().replace(/^(the\s+)?book\s+of\s+/, "");
    s = s.replace(/^(first|second|third|1st|2nd|3rd)\s+/, (m, w) => (ORD[w] || w) + " ").trim();
    if (!s) return null;
    const idx = await W.bookIndex();
    const sl = s.replace(/\s+/g, "-");
    return idx.find((b) => b.slug === sl) || idx.find((b) => b.name.toLowerCase() === s) || idx.find((b) => b.name.toLowerCase().startsWith(s)) || idx.find((b) => s.startsWith(b.name.toLowerCase())) || null;
  }

  // ---------- Tolu, the everyday assistant ----------
  // Like Siri, as far as a web app on a phone can go: time and date,
  // weather, timers, reminders into the phone's Calendar, calls, texts,
  // WhatsApp, directions, web search, music, opening apps, maths, word
  // meanings, translation, Bible verses on any subject, prayer, and app
  // settings. Anything that leaves the app (a call, Maps, Calendar) comes
  // back as a button to tap, because phones only allow that from a tap.
  const LANG_NAMES = { yoruba: "yo", "yorùbá": "yo", igbo: "ig", hausa: "ha", pidgin: "pcm", french: "fr", spanish: "es", portuguese: "pt", swahili: "sw", german: "de", arabic: "ar", chinese: "zh", hindi: "hi", italian: "it", twi: "ak", zulu: "zu", amharic: "am", english: "en" };
  const APPS = { youtube: "https://www.youtube.com/@WordandFaithNetwork-l2x", instagram: "https://instagram.com/wordfaithnetwork", whatsapp: "https://chat.whatsapp.com/J0JkLpylQiVKTHKcJkaKEs", x: "https://x.com/wfnglobal", twitter: "https://x.com/wfnglobal", facebook: "https://facebook.com", "wfn website": "https://wfnglobal.org", website: "https://wfnglobal.org", maps: "https://maps.apple.com/", "google maps": "https://maps.google.com/", gmail: "https://mail.google.com/", email: "mailto:", spotify: "https://open.spotify.com/", "apple music": "https://music.apple.com/" };
  const WX = { 0: "clear skies", 1: "mostly clear", 2: "partly cloudy", 3: "overcast", 45: "fog", 48: "freezing fog", 51: "light drizzle", 53: "drizzle", 55: "heavy drizzle", 61: "light rain", 63: "rain", 65: "heavy rain", 66: "freezing rain", 67: "heavy freezing rain", 71: "light snow", 73: "snow", 75: "heavy snow", 77: "snow grains", 80: "light showers", 81: "showers", 82: "heavy showers", 85: "snow showers", 86: "heavy snow showers", 95: "thunderstorms", 96: "thunderstorms with hail", 99: "severe thunderstorms with hail" };
  const isApple = /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent);
  const act = (text, label, href, extra) => Object.assign({ text, action: { label, href } }, extra || {});
  const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, "forty-five": 45, fifty: 50, sixty: 60, ninety: 90, a: 1, an: 1, half: 0.5 };
  const num = (w) => (/^\d+(\.\d+)?$/.test(w) ? parseFloat(w) : NUMW[w]);

  function parseWhen(s) {
    const now = new Date();
    let m = s.match(/in (\d+|[a-z-]+) (minute|min|hour|hr|day)s?/);
    if (m && num(m[1]) != null) { const n = num(m[1]); const unit = /^h/.test(m[2]) ? 3600e3 : /^d/.test(m[2]) ? 864e5 : 6e4; return new Date(now.getTime() + n * unit); }
    m = s.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/);
    let day = new Date(now);
    if (/\btomorrow\b/.test(s)) day.setDate(day.getDate() + 1);
    const dn = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].findIndex((d) => new RegExp("\\b" + d + "\\b").test(s));
    if (dn >= 0) { const diff = (dn - day.getDay() + 7) % 7 || 7; day.setDate(day.getDate() + diff); }
    if (/\btonight\b/.test(s) && !m) { day.setHours(21, 0, 0, 0); return day; }
    if (/\bthis morning|in the morning\b/.test(s) && !m) { day.setDate(day.getDate() + (now.getHours() >= 9 ? 1 : 0)); day.setHours(7, 0, 0, 0); return day; }
    if (!m || !/at\s+\d|\d\s*(am|pm|a\.m|p\.m)|\d:\d/.test(s)) return null;
    let h = parseInt(m[1], 10); const mi = parseInt(m[2] || "0", 10); const ap = (m[3] || "").replace(/\./g, "");
    if (ap === "pm" && h < 12) h += 12; if (ap === "am" && h === 12) h = 0;
    if (!ap && /\b(tonight|evening|night)\b/.test(s) && h < 12) h += 12;
    day.setHours(h, mi, 0, 0);
    if (day <= now && dn < 0 && !/\btomorrow\b/.test(s)) day.setDate(day.getDate() + 1);
    return day;
  }
  function icsFor(title, when, mins) {
    const pad = (n) => String(n).padStart(2, "0");
    const f = (d) => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z";
    const end = new Date(when.getTime() + (mins || 15) * 6e4);
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//WFN//Tolu//EN", "BEGIN:VEVENT", "UID:" + Date.now() + "@wfnglobal.org", "DTSTAMP:" + f(new Date()), "DTSTART:" + f(when), "DTEND:" + f(end), "SUMMARY:" + title.replace(/[,;\\]/g, " "), "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", "DESCRIPTION:" + title.replace(/[,;\\]/g, " "), "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  }
  const fmtTime = (d) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const fmtDay = (d) => { const t = new Date(); const tm = new Date(t); tm.setDate(t.getDate() + 1); return d.toDateString() === t.toDateString() ? "today" : d.toDateString() === tm.toDateString() ? "tomorrow" : d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); };

  // In-app timer with sound, vibration and a notification when it ends.
  let timer = null;
  function beep() { try { const A = window.AudioContext || window.webkitAudioContext; const ctx = new A(); [0, 0.35, 0.7].forEach((t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.0001, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.3); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.32); }); } catch (e) {} }
  function startTimer(ms, label) {
    stopTimer();
    const end = Date.now() + ms;
    const chip = document.createElement("button");
    chip.className = "tolu-timer"; chip.type = "button"; chip.setAttribute("aria-label", "Timer. Tap to cancel");
    document.body.appendChild(chip);
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      const s = Math.ceil(left / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      chip.innerHTML = `${icon("history", "xs")}<span>${label ? esc(label) + " · " : ""}${h ? h + ":" : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(sec).padStart(2, "0")}</span>${icon("close", "xs")}`;
      if (left <= 0) {
        stopTimer(); beep(); if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
        const msg = (label ? label + ". " : "") + "Your timer is done.";
        W.toast(msg); const t = TTS(); if (t) t.speak([msg]);
        try { if ("Notification" in window && Notification.permission === "granted") new Notification("WFN timer", { body: msg, icon: W.BASE + "app/icons/icon-192.png" }); } catch (e) {}
      }
    };
    chip.onclick = () => { stopTimer(); W.toast("Timer cancelled"); };
    timer = { id: setInterval(tick, 500), chip, end };
    tick();
  }
  function stopTimer() { if (timer) { clearInterval(timer.id); timer.chip.remove(); timer = null; } }

  function calc(s) {
    let e = s.replace(/^(what is|what's|whats|calculate|how much is|compute)\s+/, "").replace(/\?$/, "")
      .replace(/(\d+(?:\.\d+)?)\s*(?:%|percent) of (\d+(?:\.\d+)?)/g, "($1/100*$2)")
      .replace(/\bplus\b|\band\b/g, "+").replace(/\bminus\b|\bless\b/g, "-").replace(/\btimes\b|\bmultiplied by\b|\bx\b|×/g, "*").replace(/\bdivided by\b|\bover\b|÷/g, "/")
      .replace(/\bsquared\b/g, "**2").replace(/\bto the power of\b/g, "**").replace(/,/g, "");
    if (!/\d/.test(e) || !/^[\d\s+\-*/().]+$/.test(e) || !/[+\-*/]/.test(e)) return null;
    try { const r = Function('"use strict";return (' + e + ")")(); if (typeof r !== "number" || !isFinite(r)) return null; return +r.toFixed(6); } catch (err) { return null; }
  }

  async function weather(place) {
    let lat, lon, name = place;
    try {
      if (place) {
        const g = await (await fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(place))).json();
        if (!g.results || !g.results.length) return `I couldn’t find a place called ${place}.`;
        lat = g.results[0].latitude; lon = g.results[0].longitude; name = g.results[0].name + (g.results[0].country ? ", " + g.results[0].country : "");
      } else {
        const pos = await new Promise((res, rej) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, maximumAge: 6e5 }) : rej(new Error("no geo")));
        lat = pos.coords.latitude; lon = pos.coords.longitude; name = "where you are";
      }
    } catch (e) { return "I need your location for that. Allow location for this site, or say a city, like “weather in Lagos”."; }
    try {
      const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`)).json();
      const c = w.current, d = w.daily;
      return `Right now ${name === "where you are" ? "where you are" : "in " + name} it’s ${Math.round(c.temperature_2m)} degrees with ${WX[c.weather_code] || "mixed weather"}. Today’s high is ${Math.round(d.temperature_2m_max[0])}, the low ${Math.round(d.temperature_2m_min[0])}, with a ${d.precipitation_probability_max[0] || 0} percent chance of rain.`;
    } catch (e) { return "I couldn’t reach the weather service just now. Try again in a moment."; }
  }

  // Well-loved verses for the things people most often ask about.
  const TOPIC_VERSES = {
    peace: ["philippians/4/7", "john/14/27", "isaiah/26/3", "psalms/4/8"], anxi: ["philippians/4/6", "1-peter/5/7", "matthew/6/34"], worry: ["philippians/4/6", "1-peter/5/7", "matthew/6/34"],
    fear: ["isaiah/41/10", "2-timothy/1/7", "psalms/27/1", "joshua/1/9"], afraid: ["isaiah/41/10", "psalms/56/3", "joshua/1/9"],
    heal: ["jeremiah/17/14", "isaiah/53/5", "exodus/15/26", "psalms/103/3"], sick: ["james/5/15", "jeremiah/30/17", "psalms/41/3"],
    strength: ["isaiah/40/31", "philippians/4/13", "nehemiah/8/10", "psalms/46/1"], weak: ["2-corinthians/12/9", "isaiah/40/29"],
    love: ["1-corinthians/13/4", "john/3/16", "romans/8/38", "1-john/4/19"], faith: ["hebrews/11/1", "romans/10/17", "mark/11/24", "hebrews/11/6"],
    hope: ["jeremiah/29/11", "romans/15/13", "psalms/42/11", "lamentations/3/22"], provision: ["philippians/4/19", "psalms/23/1", "matthew/6/33"], money: ["philippians/4/19", "deuteronomy/8/18", "malachi/3/10"], financ: ["philippians/4/19", "deuteronomy/8/18", "proverbs/3/9"],
    protect: ["psalms/91/1", "psalms/121/7", "isaiah/54/17", "2-thessalonians/3/3"], safety: ["psalms/4/8", "psalms/91/11", "proverbs/18/10"],
    forgiv: ["1-john/1/9", "ephesians/4/32", "psalms/103/12", "colossians/3/13"], sleep: ["psalms/4/8", "proverbs/3/24", "psalms/127/2"],
    grief: ["psalms/34/18", "matthew/5/4", "revelation/21/4", "john/11/25"], death: ["john/11/25", "1-corinthians/15/55", "revelation/21/4"],
    wisdom: ["james/1/5", "proverbs/3/5", "proverbs/2/6"], guidance: ["proverbs/3/6", "psalms/32/8", "isaiah/30/21", "psalms/119/105"], direction: ["proverbs/3/6", "psalms/32/8", "isaiah/30/21"],
    joy: ["nehemiah/8/10", "psalms/16/11", "romans/15/13", "john/15/11"], patien: ["isaiah/40/31", "galatians/6/9", "psalms/27/14"], wait: ["isaiah/40/31", "psalms/27/14", "habakkuk/2/3"],
    marriage: ["ephesians/5/25", "genesis/2/24", "ecclesiastes/4/9"], children: ["proverbs/22/6", "psalms/127/3", "isaiah/54/13"], family: ["joshua/24/15", "acts/16/31", "psalms/127/1"],
    exam: ["philippians/4/13", "daniel/1/17", "james/1/5", "proverbs/16/3"], success: ["joshua/1/8", "proverbs/16/3", "deuteronomy/28/13"], work: ["colossians/3/23", "proverbs/16/3", "psalms/90/17"], job: ["proverbs/16/3", "philippians/4/19", "deuteronomy/28/12"],
    lonel: ["deuteronomy/31/6", "psalms/68/6", "matthew/28/20"], depress: ["psalms/34/18", "psalms/42/11", "isaiah/61/3"], trust: ["proverbs/3/5", "psalms/56/3", "isaiah/26/4"],
    salvation: ["romans/10/9", "john/3/16", "acts/4/12", "ephesians/2/8"], grace: ["ephesians/2/8", "2-corinthians/12/9", "hebrews/4/16"], prayer: ["philippians/4/6", "jeremiah/33/3", "mark/11/24", "1-thessalonians/5/17"],
    thank: ["1-thessalonians/5/18", "psalms/100/4", "psalms/107/1"], victory: ["1-corinthians/15/57", "romans/8/37", "1-john/5/4"], courage: ["joshua/1/9", "deuteronomy/31/6", "psalms/31/24"],
  };
  async function everyday(body, raw) {
    const t = TTS();
    // greetings and help
    if (/^(how are you|how're you|how do you do)/.test(body)) return "I’m well, thank you. God is good. What can I do for you?";
    if (/^(who are you|what are you|what is your name|what's your name)/.test(body)) return "I’m Tolu, the voice of the WFN app. Ask me for Scripture, sermons and prayer, or everyday things like the time, the weather, a timer, a reminder, a call or directions.";
    if (/^(what can you do|help|what do you do)\b/.test(body)) return "I can open any Bible verse or sermon, read to you, find a verse about anything, pray with you, translate, define words, tell the time and the weather, set timers, add reminders to your calendar, call or text a number, get directions, search the web, play worship music, do maths, and change the app’s settings.";
    if (/^(thank you|thanks)/.test(body)) return "You’re welcome. God bless you.";
    // time and date
    if (/\bwhat('s| is)? the time\b|\bwhat time is it\b|^time$/.test(body)) return "It’s " + fmtTime(new Date()) + ".";
    if (/\bwhat('s| is)? (the |today's )?date\b|\bwhat day is (it|today)\b|\btoday's date\b/.test(body)) return "Today is " + new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) + ".";
    // weather
    let m = body.match(/\b(?:weather|temperature|forecast|raining|rain|cold|hot)\b(?:.*?\b(?:in|for|at)\s+([a-z .'-]+))?/);
    if (m && /weather|temperature|forecast|is it (raining|cold|hot)|will it rain/.test(body)) return weather(m[1] ? m[1].replace(/\b(today|tomorrow|now|right now)\b/g, "").trim() : "");
    // timers
    m = body.match(/(?:set (?:a |an )?)?timer (?:for )?(\d+|[a-z-]+) (second|sec|minute|min|hour|hr)s?(?: (?:and|&) (\d+|[a-z-]+) (second|minute)s?)?/) || body.match(/^(\d+|[a-z-]+) (second|minute|hour)s? timer/);
    if (m && num(m[1]) != null) {
      const unit = (u) => (/^h/.test(u) ? 3600e3 : /^s/.test(u) ? 1e3 : 6e4);
      let ms = num(m[1]) * unit(m[2]); if (m[3] && num(m[3]) != null) ms += num(m[3]) * unit(m[4]);
      const label = /pray/.test(body) ? "Prayer" : /fast/.test(body) ? "Fasting" : "";
      startTimer(ms, label);
      if ("Notification" in window && Notification.permission === "default") { try { Notification.requestPermission(); } catch (e) {} }
      return `Timer set for ${m[1]} ${m[2]}${num(m[1]) === 1 ? "" : "s"}${m[3] ? " and " + m[3] + " " + m[4] + "s" : ""}. I’ll ring here in the app, so keep WFN open.`;
    }
    if (/\b(cancel|stop) (the )?timer\b/.test(body)) { const had = !!timer; stopTimer(); return had ? "Timer cancelled." : "There’s no timer running."; }
    // reminders and alarms -> Calendar
    m = body.match(/^(?:remind me|set a reminder|reminder|wake me|set an alarm|alarm)(?: to| for| that)?\s*(.*)$/);
    if (m) {
      const when = parseWhen(body);
      const what = (m[1] || "").replace(/\b(at|on|in|by)\s+\d.*$|\b(tomorrow|tonight|today)\b.*$|\bin \w+ (minute|hour|day)s?.*$/g, "").replace(/\s+/g, " ").trim() || (/wake|alarm/.test(body) ? "Wake up and pray" : "Reminder");
      if (!when) return `When should I remind you to ${what}? Say a time, like “remind me to ${what} at 9 pm”.`;
      const title = what.charAt(0).toUpperCase() + what.slice(1);
      return act(`Okay. “${title}”, ${fmtDay(when)} at ${fmtTime(when)}. Tap Add to Calendar and your phone will remind you.`, "Add to Calendar", icsFor(title, when), { download: "wfn-reminder.ics" });
    }
    // calls, texts, WhatsApp, email
    const phone = (raw.match(/(\+?\d[\d\s().-]{6,}\d)/) || [])[1];
    if (/^(call|phone|ring|dial)\b/.test(body)) {
      if (phone) { const n = phone.replace(/[^\d+]/g, ""); return act(`Tap Call to ring ${phone.trim()}.`, "Call " + phone.trim(), "tel:" + n); }
      return "Say the number, like “call 416 555 0123”. Apps can’t read your contacts, so I need the number itself.";
    }
    m = body.match(/^(?:text|message|sms)\s+(.+?)(?:\s+(?:saying|that|to say)\s+(.+))?$/);
    if (m) {
      if (!phone) return "Say the number and the message, like “text 416 555 0123 saying I’m praying for you”.";
      const n = phone.replace(/[^\d+]/g, ""), msg = m[2] || "";
      return act(`Ready to text ${phone.trim()}${msg ? ": “" + msg + "”" : ""}.`, "Open Messages", "sms:" + n + (msg ? (isApple ? "&" : "?") + "body=" + encodeURIComponent(msg) : ""));
    }
    if (/^whatsapp\b/.test(body)) {
      if (phone) { const n = phone.replace(/[^\d]/g, ""); const msg = (raw.match(/(?:saying|that)\s+(.+)$/i) || [])[1] || ""; return act(`Opening WhatsApp to ${phone.trim()}.`, "Open WhatsApp", "https://wa.me/" + n + (msg ? "?text=" + encodeURIComponent(msg) : "")); }
      return act("Opening the WFN WhatsApp prayer group.", "Open WhatsApp group", APPS.whatsapp);
    }
    if (/^(email|e-mail|mail)\b/.test(body)) {
      const to = (raw.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0] || (/(wfn|prayer team|ministry)/.test(body) ? "wordandfaithnetwork@gmail.com" : "");
      return act(to ? `Writing an email to ${to}.` : "Opening your email.", "Open Mail", "mailto:" + to);
    }
    // directions
    m = body.match(/^(?:directions to|navigate to|take me to|how do i get to|drive to|where is)\s+(.+)$/);
    if (m && !/\b(verse|scripture|sermon|study|bible|chapter|book of)\b/.test(body)) {
      const q = ((raw.match(/(?:directions to|navigate to|take me to|how do i get to|drive to|where is)\s+(.+)$/i) || [])[1] || m[1]).replace(/\?$/, "").trim();
      const href = isApple ? "https://maps.apple.com/?daddr=" + encodeURIComponent(q) : "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q);
      return act(`Here are directions to ${q}.`, "Open Maps", href);
    }
    // web search
    m = body.match(/^(?:search the web for|search google for|google|look up online|search online for|search the internet for)\s+(.+)$/);
    if (m) return act(`Searching the web for “${m[1]}”.`, "Open results", "https://www.google.com/search?q=" + encodeURIComponent(m[1]));
    // music
    m = body.match(/^play\s+(.+)$/);
    if (m && !/\b(sermon|study|declaration|prayer|chapter|psalm|verse|game|quiz)\b/.test(body)) {
      let q = m[1].replace(/\b(some|me|a|the)\b/g, " ").replace(/\s+/g, " ").trim();
      if (/^(music|songs?|worship|praise|gospel)( music| songs?)?$/.test(q)) q = "gospel worship music";
      return act(`Here’s ${q} on YouTube.`, "Play on YouTube", "https://www.youtube.com/results?search_query=" + encodeURIComponent(q));
    }
    // open other apps and sites
    m = body.match(/^open\s+(youtube|instagram|whatsapp|x|twitter|facebook|wfn website|website|maps|google maps|gmail|email|spotify|apple music)$/);
    if (m) return act(`Opening ${m[1]}.`, "Open " + m[1].replace(/\b\w/g, (c) => c.toUpperCase()), APPS[m[1]]);
    // maths
    const r = calc(body);
    if (r != null) return `That’s ${r.toLocaleString()}.`;
    // translate
    m = body.match(/^(?:translate|say)\s+["“]?(.+?)["”]?\s+(?:to|into|in)\s+([a-zà-ù]+)$/) || body.match(/^how do (?:you|i) say\s+["“]?(.+?)["”]?\s+in\s+([a-zà-ù]+)$/);
    if (m && LANG_NAMES[m[2]]) {
      if (!window.WFNLookup) return "Translation is still loading. Try again in a moment.";
      const out = await window.WFNLookup.translateText(m[1], LANG_NAMES[m[2]]);
      return out ? `In ${m[2].charAt(0).toUpperCase() + m[2].slice(1)}: ${out}` : `I couldn’t translate that into ${m[2]} just now.`;
    }
    // verses on a subject
    m = body.match(/^(?:give me |read me |find |show me )?(?:a |some )?(?:bible )?(?:verses?|scriptures?|passages?) (?:about|on|for|that talks about)\s+(.+)$/);
    if (m) {
      const topic = m[1].replace(/\?$/, "").trim();
      const key = Object.keys(TOPIC_VERSES).find((k) => topic.includes(k));
      if (key) {
        const refs = TOPIC_VERSES[key], pick = refs[Math.floor(Math.random() * refs.length)];
        const [slug, c, vv] = pick.split("/");
        const idx = await W.bookIndex(), bk = idx.find((x) => x.slug === slug), bd = await W.book(slug);
        lastSearch = { sermons: [], studies: [], books: [], verses: [{ slug, book: bk.name, chapter: +c, verse: +vv }] };
        return `${bk.name} ${c}:${vv}. ${W.plain(bd.chapters[+c - 1][+vv - 1])} Say “open that verse” to read the whole chapter.`;
      }
      let hits = [];
      try { hits = window.WFNBible ? await window.WFNBible.search(topic, 5) : []; } catch (e) {}
      if (!hits.length) { const word = topic.split(" ").pop(); try { hits = await window.WFNBible.search(word, 5); } catch (e) {} }
      if (!hits.length) return `I couldn’t find a verse about ${topic}. Try one word, like “peace” or “healing”.`;
      const h = hits[Math.floor(Math.random() * Math.min(3, hits.length))];
      const b = await W.book(h.slug); const txt = W.plain(b.chapters[h.chapter - 1][h.verse - 1]);
      lastSearch = { sermons: [], studies: [], books: [], verses: [h] };
      return `${h.book} ${h.chapter}:${h.verse}. ${txt} Say “open that verse” to read the whole chapter.`;
    }
    if (/^(read me |give me )?a (random )?psalm$/.test(body)) { const n = 1 + Math.floor(Math.random() * 150); go("#/bible/psalms/" + n); readSoon(); return `Here’s Psalm ${n}. Reading it now.`; }
    if (/\bverse of the day\b|^(today's|todays) verse/.test(body)) { const v = (C.VERSES || [])[0] || {}; return `Today’s verse is ${v.ref}. ${v.text}`; }
    // pray
    m = body.match(/^pray (?:for|with|over) (?:me|us)(?: (?:about|for|concerning) (.+))?$/) || body.match(/^pray (?:about|for|concerning) (.+)$/);
    if (m) {
      const need = (m[1] || "").replace(/\bmy\b/g, "your").trim();
      return `Let’s pray. Father, thank You that You hear us. ${need ? "We bring " + need + " to You. " : ""}Your Word says, be careful for nothing, but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God, and the peace of God shall keep your heart and mind through Christ Jesus. Let that peace rest on this child of Yours now. ${need ? "Move in " + need + " by Your power. " : ""}In Jesus’ mighty name, amen.`;
    }
    // meanings, Bible names, people
    m = body.match(/^(?:define|definition of|what does (.+?) mean|what is the meaning of|meaning of|who (?:was|is|were)|what (?:is|was|are) (?:a |an |the )?)\s*(.*)$/);
    if (m && !/\b(time|date|weather|day)\b/.test(body)) {
      const word = (m[1] || m[2] || "").replace(/\?$/, "").replace(/^(a|an|the)\s+/, "").trim();
      if (word && word.split(" ").length <= 3) {
        if (window.WFNLookup) { W.closeSheet(); setTimeout(() => window.WFNLookup.openLookup(word), 150); return `Here’s what “${word}” means.`; }
        return "The dictionary is still loading. Try again in a moment.";
      }
    }
    // app settings
    if (/\b(dark mode|night mode|turn off the lights)\b/.test(body) && !/\b(off|disable)\b.*dark/.test(body)) { W.setSetting("theme", "dark"); return "Dark mode is on."; }
    if (/\b(light mode|day mode)\b|\bdark mode off\b|\bturn off dark mode\b/.test(body)) { W.setSetting("theme", "light"); return "Light mode is on."; }
    if (/\b(bigger|larger|increase).*(text|font|letters)|(text|font).*(bigger|larger)\b/.test(body)) { W.setSetting("size", Math.min(34, W.settings().size + 2)); return "Text is bigger now, " + W.settings().size + " point."; }
    if (/\b(smaller|decrease|reduce).*(text|font|letters)|(text|font).*smaller\b/.test(body)) { W.setSetting("size", Math.max(14, W.settings().size - 2)); return "Text is smaller now, " + W.settings().size + " point."; }
    if (/\b(read|speak|talk) (faster|quicker)\b/.test(body) && t) { const o = t.rateOptions, i = Math.min(o.length - 1, o.indexOf(t.getRate()) + 1); t.setRate(o[i]); return "Reading speed is now " + o[i] + " times."; }
    if (/\b(read|speak|talk) (slower|more slowly)\b/.test(body) && t) { const o = t.rateOptions, i = Math.max(0, o.indexOf(t.getRate()) - 1); t.setRate(o[i]); return "Reading speed is now " + o[i] + " times."; }
    // honest about what a web app can't touch
    if (/\b(flashlight|torch|bluetooth|wi-?fi|airplane|volume|brightness|screenshot|selfie|take a (photo|picture)|unlock|lock the phone)\b/.test(body)) return "That’s a phone setting only Siri or your phone’s Control Centre can change. I can do anything inside WFN, and open calls, texts, Maps, Calendar and the web for you.";
    return null;
  }

  async function command(raw) {
    const stripped = raw.replace(/^\s*(hi|hey|hello|ok|okay)?\s*tolu[,:]?\s*/i, "").trim();
    const body = (stripped || raw).toLowerCase().replace(/[’']/g, "'").trim();
    const t = TTS();
    if (!stripped && /\btolu\b/i.test(raw)) return "Hi! I’m listening. Ask for a sermon, a Bible verse, today’s prayer, the library, or say “search for” anything.";
    if (/\bstop\b/.test(body) || /^pause\b/.test(body)) { if (/^pause/.test(body) && t) t.pause(); else W.stopSpeaking(); return /^pause/.test(body) ? "Paused." : "Stopped."; }
    if (/^(resume|continue)\b/.test(body)) { if (t) t.resume(); return "Resuming."; }
    if (!/\b(sermon|study|declaration|bible|chapter)\b/.test(body) || /\b(verses? about|scriptures? (about|for)|pray for|translate|define|meaning)\b/.test(body)) {
      const ev = await everyday(body, raw);
      if (ev) return ev;
    }
    if (lastSearch && body.length < 40) {
      const L = lastSearch;
      if (/\bsermon\b/.test(body) && L.sermons.length) { lastSearch = null; go("#/sermon/" + L.sermons[0].slug); readSoon(); return `Opening “${L.sermons[0].title}”. Reading it now.`; }
      if (/\bstudy\b/.test(body) && L.studies.length) { lastSearch = null; go("#/study/" + L.studies[0].slug); readSoon(); return `Opening “${L.studies[0].title}”.`; }
      if (/\b(verse|scripture|bible)\b/.test(body) && L.verses.length) { const r = L.verses[0]; lastSearch = null; go(`#/bible/${r.slug}/${r.chapter}/${r.verse}`); readSoon(); return `Opening ${r.book} ${r.chapter}. Reading it now.`; }
      if (/\b(book|library)\b/.test(body) && L.books.length) { lastSearch = null; go("#/book/" + L.books[0].slug); return `Opening “${L.books[0].title}”.`; }
    }
    const sm = body.match(/^(?:search(?: for)?|find|look up|look for|do you have (?:anything|something) (?:on|about))\s+(.+)$/);
    if (sm) return search(sm[1]);
    if (/^(read|listen to)\s+(this|it|the page|this page)\b/.test(body) || body === "read") { const items = W.getReadable(); if (t && items.length) { t.speak(items); return "Reading this page now."; } return "There’s nothing to read on this screen yet."; }
    if (/\bsermons?\b/.test(body) && /\b(all|archive|list|past)\b/.test(body)) { go("#/sermons"); return "Opening all the sermons."; }
    if (/\bsermon\b/.test(body)) { const s = (C.SERMONS || [])[0]; go("#/sermon/" + s.slug); readSoon(); return `Opening today’s sermon, ${s.title}. Reading it now.`; }
    if (/\b(bible )?study\b/.test(body)) { const s = (C.BIBLE_STUDY || [])[0]; go("#/study/" + s.slug); readSoon(); return `Opening today’s Bible study, ${s.title}. Reading it now.`; }
    if (/\bdeclaration\b/.test(body) || (/\bprayer\b/.test(body) && /\btoday\b/.test(body))) { go("#/prayer/declaration"); readSoon(); return "Opening today’s declaration, and reading it now."; }
    if (/\bnight prayer\b/.test(body)) { go("#/prayer/night"); readSoon(); return "Opening the night prayer."; }
    if (/\b(fire prayer|dream)/.test(body)) { go("#/dreams/fire"); readSoon(); return "Opening tonight’s fire prayer."; }
    if (/\bprayer request\b/.test(body)) { go("#/prayer/request"); return "Opening a new prayer request."; }
    if (/\bprayer\b/.test(body) && !/\bbook of\b/.test(body)) { go("#/prayer"); return "Opening Prayer."; }
    if (/\bverse of the day\b/.test(body)) { go("#/"); readSoon(); return "Here’s the Verse of the Day."; }
    if (/\blibrary\b/.test(body)) { go("#/library"); return "Opening the library."; }
    if (/\b(give|donat|offering|tithe)/.test(body)) { go("#/give"); return "Opening Give."; }
    if (/\b(invite|qr)\b/.test(body)) { go("#/invite"); return "Opening your invite code."; }
    if (/\bjesus\b/.test(body)) { go("#/jesus"); return "Opening the Story of Jesus."; }
    if (/\b(game|quiz|climb)\b/.test(body)) { go("#/climb"); return "Opening the Word Climb."; }
    if (/\bhome\b|\btoday\b/.test(body)) { go("#/"); return "Opening Today."; }
    const bm = body.match(/(?:open|go to|read|show me|turn to)?\s*(?:the\s+)?(?:book\s+of\s+)?((?:\d|first|second|third)?\s*[a-z]+(?:\s+(?:of\s+)?[a-z]+)?)\s*(?:chapter\s*)?(\d+)?\s*(?:(?:verse|:)\s*(\d+))?/i);
    if (bm && bm[1] && bm[1].trim().length > 1) {
      const b = await findBook(bm[1].replace(/\s*chapter$/, ""));
      if (b) {
        const ch = Math.min(Math.max(parseInt(bm[2] || "1", 10), 1), b.chapters), v = bm[3] ? parseInt(bm[3], 10) : null;
        go(`#/bible/${b.slug}/${ch}${v ? "/" + v : ""}`); readSoon();
        return `Opening ${b.name}, chapter ${ch}${v ? ", verse " + v : ""}. Reading it now.`;
      }
    }
    return search(stripped || raw);
  }

  function toluSheet() {
    W.sheet(`<div class="sheet-head"><h2>Tolu</h2><button class="btn sm soft" data-close>Close</button></div>
      <p class="small ink2">Tap the mic once, then just talk. Say “Hi Tolu” any time, then what you’d like to open or hear: a sermon, a Bible verse, today’s prayer, the library, or “search for” any word.</p>
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:6px 0">
        <button class="tolu-mic" id="tm" type="button" aria-label="Tap to speak">${icon("mic")}</button>
        <span class="small muted" id="tst" aria-live="polite">Tap to speak to Tolu</span>
        <span class="serif" id="ttr" style="font-size:16px;text-align:center"></span>
      </div>
      <form id="tf" style="display:flex;gap:8px"><label class="sr" for="ti">Type a request</label><input class="field" id="ti" placeholder="Or type a request…" autocomplete="off"><button class="btn" type="submit">Send</button></form>
      <div id="trp" class="band" hidden style="font-size:15px;line-height:23px"></div>
      <span class="small muted">Try saying</span>
      <div class="chips">${EXAMPLES.map((x) => `<button class="chip" type="button" data-cmd="${esc(x)}">“${esc(x)}”</button>`).join("")}</div>`, (el) => {
      const st = $("#tst", el), tr = $("#ttr", el), rp = $("#trp", el), mic = $("#tm", el);
      let busy = false, live = false, rec = null, suppress = false;
      async function handle(text) {
        if (busy) return; busy = true;
        tr.textContent = "“" + text + "”"; st.textContent = "Thinking…";
        let reply;
        try { reply = await command(text); } catch (e) { reply = "Something went wrong on my end. Try that again."; }
        const said = typeof reply === "string" ? reply : reply.text;
        rp.hidden = false;
        rp.innerHTML = "<b>Tolu:</b> " + esc(said) + (reply && reply.action ? `<div style="padding-top:12px"><a class="btn lg block" id="tAct" href="${esc(reply.action.href)}" ${/^https?:/.test(reply.action.href) ? 'target="_blank" rel="noopener"' : ""} ${reply.download ? `download="${esc(reply.download)}"` : ""}>${esc(reply.action.label)}</a></div>` : "");
        const t = TTS();
        if (t && !/reading it now|reading that chapter now|reading this page now|^stopped|^paused/i.test(said)) { try { t.speak([said]); } catch (e) {} }
        st.textContent = live ? "Listening. Say “Hi Tolu” or a request" : "Tap to speak to Tolu";
        busy = false;
      }
      $$("[data-cmd]", el).forEach((b) => b.onclick = () => handle(b.dataset.cmd));
      $("#tf", el).onsubmit = (e) => { e.preventDefault(); const v = $("#ti", el).value.trim(); if (v) { handle(v); $("#ti", el).value = ""; } };
      const R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) { st.textContent = "Voice isn’t supported in this browser. Type a request below."; mic.disabled = true; mic.style.opacity = "0.5"; return; }
      const stop = () => { live = false; if (rec) { try { rec.onend = null; rec.stop(); } catch (e) {} rec = null; } mic.classList.remove("on"); st.textContent = "Tap to speak to Tolu"; };
      const start = () => {
        if (!live) return;
        rec = new R(); rec.lang = "en-US"; rec.continuous = true; rec.interimResults = false;
        rec.onstart = () => { mic.classList.add("on"); st.textContent = "Listening. Say “Hi Tolu” or a request"; };
        rec.onresult = (e) => { if (suppress) return; for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) handle(e.results[i][0].transcript); };
        rec.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { stop(); st.textContent = "Microphone access is blocked. Allow it in your browser, or type below."; } };
        rec.onend = () => { mic.classList.remove("on"); rec = null; if (live) setTimeout(() => { try { start(); } catch (e) { stop(); } }, 250); };
        try { rec.start(); } catch (e) {}
      };
      mic.onclick = () => { if (live) return stop(); live = true; const t = TTS(); if (t) t.onState((s) => { suppress = s === "playing"; }); start(); };
      const obs = new MutationObserver(() => { if (!document.body.contains(el)) { stop(); obs.disconnect(); } });
      obs.observe(document.body, { childList: true });
    });
  }

  // ---------- Translate ----------
  // Any element with data-tr gets translated; a button with data-translate
  // ("#selector" of the container) opens the language picker.
  async function limited(texts, lang) {
    const out = new Array(texts.length); let next = 0;
    const worker = async () => { while (next < texts.length) { const i = next++; try { out[i] = await window.WFNLookup.translateText(texts[i], lang); } catch (e) { out[i] = null; } } };
    await Promise.all(Array.from({ length: Math.min(4, texts.length) }, worker));
    return out;
  }
  W.translateTexts = limited;
  function langs() { return (window.WFNLookup && window.WFNLookup.TRANSLATE_LANGS) || [{ code: "en", name: "English" }]; }
  async function translateIn(root, lang, btn) {
    const els = $$("[data-tr]", root);
    if (!els.length) return;
    els.forEach((e) => { if (e.dataset.orig == null) e.dataset.orig = e.textContent; });
    if (lang === "en") { els.forEach((e) => { e.textContent = e.dataset.orig; }); if (btn) btn.querySelector("[data-tlab]").textContent = "Translate"; return; }
    if (btn) btn.querySelector("[data-tlab]").textContent = "Translating…";
    const outs = await limited(els.map((e) => e.dataset.orig), lang);
    let failed = 0;
    els.forEach((e, i) => { if (outs[i]) e.textContent = outs[i]; else { e.textContent = e.dataset.orig; failed++; } });
    const name = (langs().find((l) => l.code === lang) || {}).name || lang;
    if (btn) btn.querySelector("[data-tlab]").textContent = failed === els.length ? "Translate" : name;
    if (failed) W.toast(failed === els.length ? (lang === "pcm" ? "Pidgin isn’t available for this text yet. Showing English." : "Translation is unavailable right now. Showing English.") : "Some lines stayed in English.");
  }
  function pickLang(onPick, current) {
    W.sheet(`<div class="sheet-head"><h2>Translate</h2><button class="btn sm soft" data-close>Close</button></div>
      <div class="card list" role="radiogroup" aria-label="Language" style="box-shadow:none">${langs().map((l) => `<button class="row-link" role="radio" aria-checked="${(current || "en") === l.code}" data-lang="${l.code}"><span class="grow"><span class="label">${esc(l.name)}</span></span><span class="radio-dot" aria-hidden="true"></span></button>`).join("")}</div>
      <p class="small muted">Machine translation. Helpful for meaning, not a replacement for a published translation.</p>`, (el) => {
      $$("[data-lang]", el).forEach((b) => b.onclick = () => { W.closeSheet(); onPick(b.dataset.lang); });
    });
  }
  W.pickLang = pickLang;
  W.translateBtn = (target, cls) => `<button class="chip icon-chip ${cls || ""}" type="button" data-translate="${target}" aria-label="Translate">${icon("globe", "xs")}<span data-tlab class="sr">Translate</span></button>`;
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-translate]");
    if (!b) return;
    const root = document.querySelector(b.dataset.translate);
    if (!root) return;
    if (!window.WFNLookup) return W.toast("Translate is still loading. Try again in a moment.");
    pickLang((lang) => { b.dataset.lang = lang; translateIn(root, lang, b); }, b.dataset.lang);
  });

  W.mountVoice = mountStack;
})();

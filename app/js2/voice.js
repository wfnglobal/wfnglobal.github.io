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
    let open = W.read("wfn2-voice-open", false);
    const set = (v) => { open = v; el.classList.toggle("open", v); $("#vToggle").setAttribute("aria-expanded", String(v)); $("#vToggle").setAttribute("aria-label", v ? "Hide voice controls" : "Show Listen and Ask Tolu"); W.write("wfn2-voice-open", v); };
    set(open);
    $("#vToggle").onclick = () => set(!open);
    $("#vListen").onclick = listenSheet;
    $("#vTolu").onclick = toluSheet;
    const watch = () => { const t = TTS(); if (!t) return setTimeout(watch, 400); t.onState((st) => { const x = $("#vListenTxt"); if (x) x.textContent = st === "playing" ? "Playing…" : st === "paused" ? "Paused" : "Listen"; el.classList.toggle("playing", st !== "idle"); }); };
    watch();
  }
  window.addEventListener("hashchange", () => { const s = $("#voiceStack"); if (s) s.hidden = /^#\/(climb|scan|invite)/.test(location.hash); });

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
  const EXAMPLES = ["Hi Tolu", "Open today’s sermon", "Open John chapter 3 verse 16", "Search for faith", "Open today’s prayer", "Read this page", "Stop reading"];
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

  async function command(raw) {
    const stripped = raw.replace(/^\s*(hi|hey|hello|ok|okay)?\s*tolu[,:]?\s*/i, "").trim();
    const body = (stripped || raw).toLowerCase().replace(/[’']/g, "'").trim();
    const t = TTS();
    if (!stripped && /\btolu\b/i.test(raw)) return "Hi! I’m listening. Ask for a sermon, a Bible verse, today’s prayer, the library, or say “search for” anything.";
    if (/\bstop\b/.test(body) || /^pause\b/.test(body)) { if (/^pause/.test(body) && t) t.pause(); else W.stopSpeaking(); return /^pause/.test(body) ? "Paused." : "Stopped."; }
    if (/^(resume|continue)\b/.test(body)) { if (t) t.resume(); return "Resuming."; }
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
      <div class="chips">${EXAMPLES.map((x) => `<button class="chip" type="button" data-cmd="${esc(x)}">“${esc(x)}”</button>`).join("")}</div>
      <div id="trp" class="band" hidden style="font-size:15px;line-height:23px"></div>`, (el) => {
      const st = $("#tst", el), tr = $("#ttr", el), rp = $("#trp", el), mic = $("#tm", el);
      let busy = false, live = false, rec = null, suppress = false;
      async function handle(text) {
        if (busy) return; busy = true;
        tr.textContent = "“" + text + "”"; st.textContent = "Thinking…";
        let reply;
        try { reply = await command(text); } catch (e) { reply = "Something went wrong on my end. Try that again."; }
        rp.hidden = false; rp.innerHTML = "<b>Tolu:</b> " + esc(reply);
        const t = TTS();
        if (t && !/reading it now|reading that chapter now|reading this page now|^stopped|^paused/i.test(reply)) { try { t.speak([reply]); } catch (e) {} }
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
  W.translateBtn = (target, cls) => `<button class="chip ${cls || ""}" type="button" data-translate="${target}">${icon("globe", "xs")}<span data-tlab>Translate</span></button>`;
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

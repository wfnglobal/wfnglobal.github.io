// WFN App 2.0 — The Word Climb.
// Five camps from Genesis to Revelation on a mountain map, four ways to play,
// a daily challenge with a streak, Scripture hints and "Learn why" after every
// answer (each question carries its Bible reference, app/js2/climb-refs.js),
// camp badges and a Certificate of the Climb at the summit.
// Questions and scrolls come from the shared bank in app/js/wordclimb.js.
(function () {
  "use strict";
  const W = window.WFN2;
  const { esc, icon } = W;

  const KEY = "wfn2-climb";
  const PASS = 8, RUN = 10, SPRINT_SECS = 60;
  const CAMP_POS = [[46, 352], [132, 300], [196, 248], [222, 186], [196, 118]];

  function bank() {
    const G = window.WFNGame;
    const R = window.WFN_CLIMB_REFS || [];
    if (!G || !G.LEVELS) return null;
    const all = [];
    G.LEVELS.forEach((lv, ci) => lv.questions.forEach((q, qi) => all.push({ ...q, camp: ci, id: ci + "." + qi, ref: (R[ci] || [])[qi] || "" })));
    return { levels: G.LEVELS, scrolls: G.SCROLLS, all };
  }
  function state() {
    const s = W.read(KEY, {});
    return Object.assign({ camp: 0, badges: [], seen: {}, best: 0, streak: 0, lastDaily: "", daily: null, correct: 0, finishedAt: null }, s);
  }
  function save(s) { W.write(KEY, s); }
  function today() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function yesterday() { const d = new Date(Date.now() - 86400000); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function rng(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function shuffle(a, r) { a = a.slice(); r = r || Math.random; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function parseRef(r) { const m = String(r).match(/^([a-z0-9-]+) (\d+):(\d+)(?:-(\d+))?$/); return m ? { slug: m[1], ch: +m[2], v1: +m[3], v2: +(m[4] || m[3]) } : null; }
  let bookNames = null;
  async function names() {
    if (bookNames) return bookNames;
    const idx = await W.bookIndex();
    bookNames = {}; idx.forEach((b) => (bookNames[b.slug] = b.name));
    return bookNames;
  }
  async function verseOf(ref) {
    const p = parseRef(ref); if (!p) return null;
    const [nm, data] = await Promise.all([names(), W.book(p.slug)]);
    const ch = data.chapters[p.ch - 1] || [];
    const text = ch.slice(p.v1 - 1, p.v2).map(W.plain).join(" ");
    const label = (nm[p.slug] || p.slug) + " " + p.ch + ":" + p.v1 + (p.v2 > p.v1 ? "–" + p.v2 : "");
    return { text, label, href: "#/bible/" + p.slug + "/" + p.ch + "/" + p.v1 };
  }
  const Sound = { play(name) { const S = window.WFNGame && window.WFNGame.Sound; try { if (S && !S.isMuted()) S[name](); } catch (e) {} } };
  function muted() { const S = window.WFNGame && window.WFNGame.Sound; return S ? S.isMuted() : true; }

  // ---------- views ----------
  W.view("climb", async function (main, parts) {
    let tries = 0;
    while (!bank() && tries++ < 40) await new Promise((r) => setTimeout(r, 75));
    const B = bank();
    if (!B) { main.innerHTML = W.topbar("The Word Climb", { back: "#/" }) + '<div class="page"><div class="empty">The game didn’t load. Check your connection and try again.</div></div>'; return; }
    const [mode, arg] = parts;
    if (!mode) return home(main, B);
    if (mode === "books") return books(main, B);
    if (mode === "cert") return certificate(main, B);
    if (mode === "c") return challengeIntro(main, B, arg);
    if (mode === "play") return play(main, B, arg, parts[2]);
    return home(main, B);
  });

  function campMap(s, B) {
    const at = Math.min(s.camp, 4), done = s.camp >= 5;
    const path = "M46 352 C90 340 120 330 132 300 S170 262 196 248 S228 210 222 186 S206 150 196 118";
    const len = [0, 0.25, 0.5, 0.72, 1][at];
    return `<svg viewBox="0 0 358 380" class="wc2-map-svg" role="img" aria-label="Mountain map with five camps. ${done ? "You reached the summit." : "You are at camp " + (at + 1) + ", " + esc(B.levels[at].name) + "."}">
      <defs>
        <linearGradient id="wc2Sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--wc2-sky1)"/><stop offset="1" stop-color="var(--wc2-sky2)"/></linearGradient>
        <linearGradient id="wc2Far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--wc2-far1)"/><stop offset="1" stop-color="var(--wc2-far2)"/></linearGradient>
        <linearGradient id="wc2Near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--wc2-near1)"/><stop offset="1" stop-color="var(--wc2-near2)"/></linearGradient>
        <radialGradient id="wc2Sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#F6D9A4" stop-opacity="0.95"/><stop offset="1" stop-color="#F6D9A4" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="358" height="380" fill="url(#wc2Sky)"/>
      <circle cx="292" cy="70" r="70" fill="url(#wc2Sun)"/>
      <circle cx="292" cy="70" r="16" fill="#FBE7C2"/>
      <path d="M0 380 L70 230 L120 270 L190 110 L250 190 L290 150 L358 260 L358 380Z" fill="url(#wc2Far)"/>
      <path d="M190 110 l22 32 -14 -6 -10 10 -8 -12 -12 6z" fill="#FFFFFF" opacity="0.92"/>
      <path d="M290 150 l14 22 -9 -4 -7 6 -6 -8z" fill="#FFFFFF" opacity="0.8"/>
      <path d="M0 380 L40 320 L110 290 L170 300 L230 250 L300 290 L358 300 L358 380Z" fill="url(#wc2Near)"/>
      <path d="${path}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7" opacity="0.9"/>
      <path d="${path}" fill="none" stroke="var(--spruce)" stroke-width="3.2" stroke-linecap="round" pathLength="1" stroke-dasharray="${done ? 1 : len} 1"/>
      <path d="M196 106 V78" stroke="#1F1D1B" stroke-width="2" stroke-linecap="round"/><path d="M196 78 l14 4.5 -14 4.5z" fill="${done ? "#E2A85A" : "#B9B2A6"}"/>
      ${CAMP_POS.map(([x, y], i) => {
        const st = done || i < s.camp ? "done" : i === at ? "here" : "next";
        return `<g class="wc2-camp ${st}"><circle cx="${x}" cy="${y}" r="${st === "here" ? 17 : 14}" class="ring"/>${st === "here" ? `<circle cx="${x}" cy="${y}" r="24" class="pulse"/>` : ""}<text x="${x}" y="${y + 4.5}" text-anchor="middle">${st === "done" ? "✓" : i + 1}</text></g>`;
      }).join("")}
    </svg>
    <div class="wc2-labels" aria-hidden="true">${CAMP_POS.map(([x, y], i) => `<span style="left:${(x / 358) * 100}%;top:${(y / 380) * 100}%" class="${i === at && !done ? "here" : ""} ${i === 4 ? "top" : ""}">${esc(B.levels[i].name)}</span>`).join("")}</div>`;
  }

  async function home(main, B) {
    const s = state();
    const done = s.camp >= 5;
    const at = Math.min(s.camp, 4);
    const dailyDone = s.lastDaily === today();
    const streak = s.lastDaily === today() || s.lastDaily === yesterday() ? s.streak : 0;
    const daily = await dailySet(B);
    main.innerHTML = `
    <div class="wc2">
      <header class="topbar">
        <a class="icon-btn" href="#/" data-back aria-label="Back">${icon("back")}</a>
        <span style="flex-grow:1"></span>
        ${streak ? `<span class="wc2-streak" title="Daily challenge streak">${icon("flame", "xs")}${streak}-day streak</span>` : ""}
        <button class="icon-btn" id="wcSnd" aria-label="Sound" aria-pressed="${!muted()}">${icon(muted() ? "mute" : "listen")}</button>
      </header>
      <div class="page" style="padding-top:0;gap:26px">
        <section class="wc2-hero">
          <svg width="60" height="60" viewBox="0 0 56 56" aria-hidden="true"><defs><linearGradient id="wcI" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DCE7F3"/><stop offset="1" stop-color="#F6E3C4"/></linearGradient></defs><rect width="56" height="56" rx="18" fill="url(#wcI)"/><path d="M6 46l15-21 7 9 6-8 16 20z" fill="#435C82"/><path d="M21 25l4 5.6-4-1.6-3 2.4z" fill="#fff"/><path d="M14 46c6-3 10-4 12-8s6-6 8-10" fill="none" stroke="#F5D59A" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 3.4"/><path d="M34 26V13" stroke="#1F1D1B" stroke-width="1.6" stroke-linecap="round"/><path d="M34 13l8 2.6-8 2.6z" fill="#E2A85A"/></svg>
          <h1>The Word Climb</h1>
          <p>${B.all.length} questions, five camps, one summit. Climb from Genesis to Revelation.</p>
        </section>

        <section class="card wc2-map" aria-label="Your climb">
          <div class="wc2-map-art">${campMap(s, B)}</div>
          <div class="wc2-map-foot">
            <span class="grow"><span class="small" style="font-weight:600">${done ? "Summit reached" : "Camp " + (at + 1) + " · " + esc(B.levels[at].name)}</span>
              <span class="wc2-bar"><span style="width:${(Math.min(s.camp, 5) / 5) * 100}%"></span></span></span>
            <span class="small muted" style="font-variant-numeric:tabular-nums">${Math.min(s.camp, 5)}/5 camps</span>
          </div>
          <a class="btn lg block" href="#/climb/play/camp">${done ? "Climb again from any camp" : s.camp === 0 && !s.badges.length ? "Start the climb" : "Continue the climb"}</a>
        </section>

        <a class="card pad wc2-daily ${dailyDone ? "done" : ""}" href="#/climb/play/daily">
          <span style="display:flex;align-items:center;gap:8px"><span class="eyebrow amber" style="flex-grow:1">Today’s challenge</span><span class="small muted">${dailyDone ? "Done · " + s.daily.score + "/5" : "New at midnight"}</span></span>
          <span class="serif" style="font-size:21px;line-height:27px">${esc(daily.title)}</span>
          <span class="small ink2">${esc(daily.sub)}</span>
          <span class="chip ${dailyDone ? "" : "spruce"}" style="align-self:flex-start">${dailyDone ? "Play again for practice" : "Start · about 2 min"}</span>
        </a>

        <section class="section" aria-labelledby="modesH">
          <h2 id="modesH" class="h2" style="padding:0 4px">Ways to play</h2>
          <div class="wc2-modes">
            ${[
              ["#/climb/play/camp", "mount", "c-spruce", "Continue the climb", done ? "Summit reached · replay any camp" : "Camp " + (at + 1) + " · " + RUN + " questions, pass with " + PASS],
              ["#/climb/books", "bible", "c-amber", "Practice by book", "Pick any book of the Bible"],
              ["#/climb/play/sprint", "timer", "c-slate", "Sixty-second sprint", s.best ? "Your best: " + s.best : "As many as you can"],
              ["#/climb/play/friend", "people", "c-ink", "Challenge a friend", "Send the same 10 questions"],
            ].map(([h, ic, c, t, m]) => `<a class="card wc2-mode" href="${h}"><span class="tile-ic ${c}">${icon(ic)}</span><span><span class="t">${t}</span><span class="m">${esc(m)}</span></span></a>`).join("")}
          </div>
        </section>

        <section class="card pad" aria-labelledby="helpH" style="display:flex;flex-direction:column;gap:12px">
          <h2 id="helpH" style="margin:0;font:600 15px var(--sans)">Help on the climb</h2>
          <div class="wc2-help">
            <span><b>${icon("bible", "xs")}Scripture hint</b> shows the verse that holds the answer, twice per run.</span>
            <span><b>${icon("half", "xs")}50/50</b> removes two wrong answers, once per run.</span>
            <span><b>${icon("info", "xs")}Learn why</b> after every answer, with the verse to read.</span>
          </div>
        </section>

        <section class="section" aria-labelledby="badgesH">
          <div class="section-head"><h2 id="badgesH" class="h2">Camp badges</h2><span class="small muted">${s.badges.length} of 5</span></div>
          <div class="wc2-badges">${B.levels.map((lv, i) => { const got = s.badges.includes(i); return `<span class="wc2-badge ${got ? "got" : ""}" title="${esc(lv.name)}"><span class="medal">${got ? icon("check", "xs") : i + 1}</span><span class="nm">${esc(lv.name.split(" ")[0].replace("'", "’"))}</span></span>`; }).join("")}</div>
          ${done ? `<a class="btn block" href="#/climb/cert">${icon("sparkle", "sm")}Your Certificate of the Climb</a>` : `<p class="small muted" style="padding:0 4px">Reach the summit for your Certificate of the Climb.</p>`}
        </section>
      </div>
    </div>`;
    W.$("#wcSnd").onclick = (e) => { const S = window.WFNGame && window.WFNGame.Sound; if (S) S.toggle(null); e.currentTarget.setAttribute("aria-pressed", String(!muted())); e.currentTarget.innerHTML = icon(muted() ? "mute" : "listen"); };
  }

  // Today's challenge: five questions from the book of today's sermon when
  // the bank has enough, otherwise five drawn for the date.
  async function dailySet(B) {
    const key = today();
    let book = null;
    try { const t = await W.today(); const ref = (t.sermon && t.sermon.ref) || ""; const nm = await names();
      const m = ref.match(/^(\d?\s?[A-Za-z][A-Za-z ]+?)\s+\d/); if (m) { const want = m[1].trim().toLowerCase().replace(/^psalm$/, "psalms"); book = Object.keys(nm).find((sl) => nm[sl].toLowerCase() === want) || null; } } catch (e) {}
    const r = rng(hash("daily-" + key));
    const pool = book ? B.all.filter((q) => (parseRef(q.ref) || {}).slug === book) : [];
    const nm = await names();
    if (pool.length >= 5) return { qs: shuffle(pool, r).slice(0, 5), title: "Five questions from " + nm[book], sub: "Drawn from the book of today’s sermon. Keep your streak alive." };
    return { qs: shuffle(B.all, r).slice(0, 5), title: "Five questions for " + new Date().toLocaleDateString(undefined, { weekday: "long" }), sub: "A fresh mix from Genesis to Revelation. Keep your streak alive." };
  }

  async function books(main, B) {
    const nm = await names();
    const idx = await W.bookIndex();
    const count = {};
    B.all.forEach((q) => { const p = parseRef(q.ref); if (p) count[p.slug] = (count[p.slug] || 0) + 1; });
    const list = idx.filter((b) => count[b.slug] >= 2);
    main.innerHTML = W.topbar("Practice by book", { back: "#/climb" }) + `<div class="page tight">
      <p class="small ink2" style="padding:0 4px">Pick a book. No pass mark, no clock: just questions, answers and the verse behind each one.</p>
      ${["old", "new"].map((t) => `<h2 class="eyebrow" style="padding:8px 4px 0">${t === "old" ? "Old Testament" : "New Testament"}</h2>
        <div class="wc2-books">${list.filter((b) => b.testament === t).map((b) => `<a href="#/climb/play/book/${b.slug}"><span>${esc(nm[b.slug])}</span><span class="n">${count[b.slug]}</span></a>`).join("")}</div>`).join("")}
    </div>`;
  }

  function challengeIntro(main, B, code) {
    const [seed, score, who] = String(code || "").split(".");
    const name = who ? decodeURIComponent(who) : "A friend";
    main.innerHTML = W.topbar("Challenge", { back: "#/climb" }) + `<div class="page">
      <section class="card pad" style="display:flex;flex-direction:column;gap:14px;align-items:flex-start">
        <span class="tile-ic lg c-ink">${icon("people")}</span>
        <h1 style="margin:0;font:400 28px/34px var(--serif)">${esc(name)} scored ${esc(score || "?")}/10.</h1>
        <p class="ink2" style="font-size:15.5px;line-height:24px">Same ten questions, same order. Can you match it?</p>
        <a class="btn lg" href="#/climb/play/friend/${esc(seed)}.${esc(score || "")}.${esc(who || "")}">Take the challenge</a>
      </section></div>`;
  }

  // ---------- the game ----------
  let timer = null;
  window.addEventListener("hashchange", () => { clearInterval(timer); timer = null; });

  async function play(main, B, mode, arg) {
    const s = state();
    let qs = [], title = "", campIdx = null, friend = null;
    if (mode === "camp") {
      campIdx = s.camp >= 5 ? (arg != null ? +arg : 4) : s.camp;
      if (s.camp >= 5 && arg == null) return pickCamp(main, B);
      const pool = B.all.filter((q) => q.camp === campIdx);
      const seen = s.seen[campIdx] || [];
      let fresh = pool.filter((q) => !seen.includes(q.id));
      if (fresh.length < RUN) { fresh = pool; s.seen[campIdx] = []; save(s); }
      qs = shuffle(fresh).slice(0, RUN);
      title = "Camp " + (campIdx + 1) + " · " + B.levels[campIdx].name;
    } else if (mode === "daily") {
      const d = await dailySet(B); qs = d.qs; title = "Today’s challenge";
    } else if (mode === "book") {
      const nm = await names();
      qs = shuffle(B.all.filter((q) => (parseRef(q.ref) || {}).slug === arg)).slice(0, RUN);
      title = "Practice · " + (nm[arg] || arg);
    } else if (mode === "sprint") {
      qs = shuffle(B.all); title = "Sixty-second sprint";
    } else if (mode === "friend") {
      let seed, target = null, who = null;
      if (arg) { const p = arg.split("."); seed = parseInt(p[0], 36); target = p[1] ? +p[1] : null; who = p[2] ? decodeURIComponent(p[2]) : null; }
      else seed = Math.floor(Math.random() * 2e9);
      qs = shuffle(B.all, rng(seed)).slice(0, RUN);
      friend = { seed: seed.toString(36), target, who };
      title = target != null ? "Challenge from " + (who || "a friend") : "Challenge a friend";
    }
    if (!qs.length) return W.go("#/climb");

    const run = { i: 0, score: 0, fifty: 1, hints: 2, answered: false, timeLeft: SPRINT_SECS, results: [] };
    const sprint = mode === "sprint";
    const back = mode === "book" ? "#/climb/books" : "#/climb";

    const frame = () => `
      <div class="wc2 wc2-game">
        <header class="topbar">
          <a class="icon-btn" href="${back}" aria-label="Leave the game">${icon("close")}</a>
          <h1 style="font-size:14px">${esc(title)}</h1>
          <span class="wc2-count" id="wcCount" aria-live="polite"></span>
        </header>
        <div class="wc2-track" aria-hidden="true"><span id="wcTrack"></span></div>
        <div class="page" id="wcBody" style="gap:18px;padding-top:18px"></div>
      </div>`;
    main.innerHTML = frame();
    const body = W.$("#wcBody");

    const counter = () => {
      W.$("#wcCount").textContent = sprint ? run.timeLeft + "s · " + run.score : (run.i + 1) + " / " + qs.length;
      W.$("#wcTrack").style.width = (sprint ? (run.timeLeft / SPRINT_SECS) * 100 : (run.i / qs.length) * 100) + "%";
    };
    if (sprint) {
      timer = setInterval(() => {
        run.timeLeft -= 1; counter();
        if (run.timeLeft <= 5 && run.timeLeft > 0) Sound.play("tick");
        if (run.timeLeft <= 0) { clearInterval(timer); timer = null; finish(); }
      }, 1000);
    }

    const ask = () => {
      const q = qs[run.i % qs.length];
      run.answered = false;
      counter();
      const order = sprint ? [0, 1, 2, 3] : [0, 1, 2, 3];
      body.innerHTML = `
        <section class="wc2-q">
          <span class="eyebrow ${["spruce", "amber", "slate", "spruce", "amber"][q.camp]}">${esc(B.levels[q.camp].name)}</span>
          <h2>${esc(q.q)}</h2>
        </section>
        <div class="wc2-opts" role="group" aria-label="Answers">${order.map((k) => `<button class="wc2-opt" data-k="${k}"><span class="key">${"ABCD"[k]}</span><span class="txt">${esc(q.opts[k])}</span></button>`).join("")}</div>
        ${sprint ? "" : `<div class="wc2-tools" role="toolbar" aria-label="Help">
          <button class="chip" id="wcHint" ${run.hints ? "" : "disabled"}>${icon("bible", "xs")}Scripture hint${run.hints ? " · " + run.hints : ""}</button>
          <button class="chip" id="wcFifty" ${run.fifty ? "" : "disabled"}>${icon("half", "xs")}50/50</button>
        </div>`}
        <div id="wcHintBox"></div>
        <div id="wcWhy"></div>`;
      W.$$(".wc2-opt", body).forEach((b) => b.onclick = () => answer(+b.dataset.k));
      const h = W.$("#wcHint", body);
      if (h) h.onclick = async () => {
        if (!run.hints || run.answered) return;
        run.hints--; h.disabled = true; h.innerHTML = icon("bible", "xs") + "Scripture hint";
        const v = await verseOf(q.ref);
        W.$("#wcHintBox").innerHTML = v ? `<blockquote class="scripture-box wc2-hint"><p>${esc(v.text)}</p><cite>${esc(v.label)} · KJV</cite></blockquote>` : "";
      };
      const f = W.$("#wcFifty", body);
      if (f) f.onclick = () => {
        if (!run.fifty || run.answered) return;
        run.fifty = 0; f.disabled = true;
        shuffle([0, 1, 2, 3].filter((k) => k !== q.a)).slice(0, 2).forEach((k) => { const b = W.$(`.wc2-opt[data-k="${k}"]`, body); b.classList.add("gone"); b.disabled = true; });
      };
    };

    const answer = async (k) => {
      if (run.answered) return;
      run.answered = true;
      const q = qs[run.i % qs.length];
      const ok = k === q.a;
      if (ok) run.score++;
      run.results.push({ id: q.id, ok });
      W.$$(".wc2-opt", body).forEach((b) => { const kk = +b.dataset.k; b.disabled = true; if (kk === q.a) b.classList.add("right"); else if (kk === k) b.classList.add("wrong"); });
      Sound.play(ok ? "correct" : "wrong");
      if (navigator.vibrate && !ok) navigator.vibrate(40);
      if (sprint) { counter(); setTimeout(() => { if (run.timeLeft > 0) { run.i++; ask(); } }, ok ? 380 : 750); return; }
      const v = await verseOf(q.ref).catch(() => null);
      const last = run.i === qs.length - 1;
      W.$("#wcHintBox").innerHTML = "";
      W.$("#wcWhy").innerHTML = `<section class="wc2-why ${ok ? "ok" : "no"}" aria-live="polite">
          <span class="wc2-verdict">${icon(ok ? "check" : "close", "xs")}${ok ? ["Right on.", "That’s it.", "Correct.", "Well climbed."][run.i % 4] : "Not quite. The answer is " + esc(q.opts[q.a]) + "."}</span>
          ${v ? `<span class="eyebrow">Learn why</span><p class="serif">${esc(v.text)}</p><a class="small" href="${v.href}">${esc(v.label)} · read in the Bible</a>` : ""}
          <button class="btn lg block" id="wcNext">${last ? "See how you did" : "Next question"}</button>
        </section>`;
      W.$("#wcNext").onclick = () => { if (last) finish(); else { run.i++; ask(); window.scrollTo({ top: 0, behavior: "smooth" }); } };
      W.$("#wcNext").focus({ preventScroll: true });
      W.$("#wcWhy").scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    const finish = () => {
      const st = state();
      st.correct = (st.correct || 0) + run.score;
      let head = "", msg = "", extra = "", actions = "";
      const n = sprint ? run.results.length : qs.length;
      if (mode === "camp") {
        st.seen[campIdx] = (st.seen[campIdx] || []).concat(run.results.map((r) => r.id));
        const passed = run.score >= PASS;
        const sc = B.scrolls[campIdx];
        if (passed) {
          if (!st.badges.includes(campIdx)) st.badges.push(campIdx);
          if (st.camp === campIdx) st.camp = campIdx + 1;
          if (st.camp >= 5 && !st.finishedAt) st.finishedAt = Date.now();
          Sound.play(campIdx === 4 ? "scroll" : "levelUp");
          head = campIdx === 4 ? "You reached the summit." : "Camp " + (campIdx + 1) + " complete.";
          msg = "“" + esc(sc.name) + "” is yours. Here is the word for this camp.";
          extra = `<blockquote class="scripture-box"><p>${esc(sc.verse)}</p><cite>${esc(sc.ref)}</cite></blockquote>
            <p class="serif" style="font-style:italic;font-size:17px;line-height:27px;white-space:pre-line;color:var(--ink-2)">${esc(sc.poem)}</p>
            <p style="font-size:15.5px;line-height:24px">${esc(sc.word)}</p>`;
          actions = campIdx === 4 ? `<a class="btn lg block" href="#/climb/cert">${icon("sparkle", "sm")}Get your certificate</a><a class="btn lg block ghost" href="#/climb">Back to the mountain</a>`
            : `<a class="btn lg block" href="#/climb/play/camp">Climb to Camp ${campIdx + 2}</a><a class="btn lg block ghost" href="#/climb">Back to the mountain</a>`;
        } else {
          head = "Almost. " + run.score + " of " + qs.length + ".";
          msg = "You need " + PASS + " to pass Camp " + (campIdx + 1) + ". Every question you missed showed its verse, so the next run is yours.";
          actions = `<a class="btn lg block" href="#/climb/play/camp${st.camp >= 5 ? "/" + campIdx : ""}" id="wcAgain">Try Camp ${campIdx + 1} again</a><a class="btn lg block ghost" href="#/climb">Back to the mountain</a>`;
        }
      } else if (mode === "daily") {
        if (st.lastDaily !== today()) { st.streak = st.lastDaily === yesterday() ? (st.streak || 0) + 1 : 1; st.lastDaily = today(); st.daily = { score: run.score }; }
        head = run.score + " of 5 today.";
        msg = st.streak > 1 ? "That’s a " + st.streak + "-day streak. Come back tomorrow to keep it going." : "Come back tomorrow for five new questions and start a streak.";
        actions = `<button class="btn lg block" id="wcShare">${icon("share", "sm")}Share your score</button><a class="btn lg block ghost" href="#/climb">Back to the mountain</a>`;
      } else if (mode === "sprint") {
        const best = run.score > (st.best || 0);
        if (best) st.best = run.score;
        head = run.score + " right in 60 seconds.";
        msg = best ? "A new personal best." : "Your best is " + st.best + ".";
        actions = `<a class="btn lg block" href="#/climb/play/sprint" id="wcAgain">Sprint again</a><button class="btn lg block ghost" id="wcShare">${icon("share", "sm")}Share your score</button><a class="btn block soft" href="#/climb">Back to the mountain</a>`;
      } else if (mode === "friend") {
        head = run.score + " of 10.";
        if (friend.target != null) msg = run.score > friend.target ? "You beat " + esc(friend.who || "your friend") + " (" + friend.target + "/10)." : run.score === friend.target ? "A tie with " + esc(friend.who || "your friend") + "." : esc(friend.who || "Your friend") + " scored " + friend.target + "/10. Send it back with your score.";
        else msg = "Now send these same ten questions to a friend and see if they can beat you.";
        actions = `<button class="btn lg block" id="wcShare">${icon("share", "sm")}Send the challenge</button><a class="btn lg block ghost" href="#/climb">Back to the mountain</a>`;
      } else {
        head = run.score + " of " + n + ".";
        msg = "Practice as often as you like. Every verse you read here is one you’ll remember.";
        actions = `<a class="btn lg block" href="#/climb/play/book/${esc(arg)}" id="wcAgain">Practise this book again</a><a class="btn lg block ghost" href="#/climb/books">Choose another book</a>`;
      }
      save(st);
      W.$("#wcCount").textContent = ""; W.$("#wcTrack").style.width = "100%";
      const pct = n ? run.score / n : 0;
      body.innerHTML = `<section class="wc2-done">
          <div class="wc2-ring" style="--p:${Math.round(pct * 100)}"><span>${run.score}<small>/${sprint ? n : qs.length}</small></span></div>
          <h2>${head}</h2><p class="ink2">${msg}</p>${extra}
          <div class="stack" style="width:100%">${actions}</div>
        </section>`;
      window.scrollTo(0, 0);
      // A button that points at the address we're already on would do nothing: start the next run directly.
      W.$$("a.btn", body).forEach((a) => a.addEventListener("click", (e) => {
        if (a.getAttribute("href") === location.hash) { e.preventDefault(); window.scrollTo(0, 0); W.route(); }
      }));
      const sh = W.$("#wcShare");
      if (sh) sh.onclick = () => {
        const p = W.profile(); const first = (p.name || "").split(" ")[0];
        if (mode === "friend") {
          const url = "https://wfnglobal.org/app/#/climb/c/" + friend.seed + "." + run.score + (first ? "." + encodeURIComponent(first) : "");
          W.shareOrCopy({ title: "The Word Climb", text: "I scored " + run.score + "/10 on The Word Climb. Same ten Bible questions — can you beat me?", url });
        } else {
          W.shareOrCopy({ title: "The Word Climb", text: (mode === "sprint" ? "I got " + run.score + " Bible questions right in 60 seconds" : "I scored " + run.score + "/5 on today’s Word Climb challenge") + " on the WFN app. Your turn:", url: "https://wfnglobal.org/app/#/climb" });
        }
      };
    };

    ask();
  }

  function pickCamp(main, B) {
    main.innerHTML = W.topbar("Choose a camp", { back: "#/climb" }) + `<div class="page tight">
      <p class="small ink2" style="padding:0 4px">You’ve reached the summit. Replay any camp.</p>
      <div class="card list">${B.levels.map((lv, i) => `<a class="row-link" href="#/climb/play/camp/${i}"><span class="tile-ic c-spruce" style="font:600 14px var(--sans)">${i + 1}</span><span class="grow"><span class="label">${esc(lv.name)}</span><span class="hint">${esc(lv.tier)}</span></span><span class="chev">${icon("chev", "xs")}</span></a>`).join("")}</div></div>`;
  }

  // ---------- certificate ----------
  function certificate(main, B) {
    const s = state();
    if (s.camp < 5) return W.go("#/climb");
    const p = W.profile();
    main.innerHTML = W.topbar("Certificate of the Climb", { back: "#/climb" }) + `<div class="page">
      <canvas id="wcCert" width="1080" height="1350" class="wc2-cert" role="img" aria-label="Certificate of the Climb"></canvas>
      ${p.name ? "" : `<p class="small muted" style="text-align:center">Add your name in You so it appears on the certificate.</p>`}
      <button class="btn lg block" id="wcCS">${icon("share", "sm")}Share your certificate</button>
    </div>`;
    const c = W.$("#wcCert"), x = c.getContext("2d");
    const draw = () => {
      const g = x.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, "#F7F3EA"); g.addColorStop(1, "#EFE7D6");
      x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
      // mountain band
      const m = x.createLinearGradient(0, 760, 0, 1350); m.addColorStop(0, "#9FB0C8"); m.addColorStop(1, "#435C82");
      x.fillStyle = m; x.beginPath(); x.moveTo(0, 1350); x.lineTo(0, 1120); x.lineTo(210, 930); x.lineTo(340, 1030); x.lineTo(540, 780); x.lineTo(700, 960); x.lineTo(820, 880); x.lineTo(1080, 1100); x.lineTo(1080, 1350); x.fill();
      x.fillStyle = "rgba(255,255,255,0.9)"; x.beginPath(); x.moveTo(540, 780); x.lineTo(600, 860); x.lineTo(565, 845); x.lineTo(540, 870); x.lineTo(518, 842); x.lineTo(486, 856); x.fill();
      x.strokeStyle = "#1F1D1B"; x.lineWidth = 5; x.beginPath(); x.moveTo(540, 780); x.lineTo(540, 700); x.stroke();
      x.fillStyle = "#E2A85A"; x.beginPath(); x.moveTo(540, 700); x.lineTo(590, 716); x.lineTo(540, 732); x.fill();
      // frame
      x.strokeStyle = "#B08A4A"; x.lineWidth = 3; x.strokeRect(44, 44, 992, 1262); x.lineWidth = 1; x.strokeRect(58, 58, 964, 1234);
      x.textAlign = "center"; x.fillStyle = "#985F1E";
      x.font = "600 26px 'Instrument Sans', sans-serif"; x.fillText("WORD AND FAITH NETWORK · THE WORD CLIMB", 540, 160);
      x.fillStyle = "#1F1D1B"; x.font = "400 86px Literata, Georgia, serif"; x.fillText("Certificate", 540, 290); x.fillText("of the Climb", 540, 390);
      x.fillStyle = "#55514B"; x.font = "400 30px 'Instrument Sans', sans-serif"; x.fillText("This certifies that", 540, 480);
      x.fillStyle = "#2A6766"; x.font = "500 64px Literata, Georgia, serif"; x.fillText(p.name || "A faithful climber", 540, 570);
      x.fillStyle = "#55514B"; x.font = "400 30px 'Instrument Sans', sans-serif"; x.fillText("climbed all five camps, from Genesis to Revelation,", 540, 640); x.fillText("and reached the summit.", 540, 682);
      x.fillStyle = "#1F1D1B"; x.font = "italic 400 30px Literata, Georgia, serif"; x.fillText("“Behold, I make all things new.” Revelation 21:5", 540, 1200);
      x.fillStyle = "rgba(255,255,255,0.92)"; x.font = "600 26px 'Instrument Sans', sans-serif";
      x.fillText(new Date(s.finishedAt || Date.now()).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) + "  ·  wfnglobal.org/app", 540, 1262);
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(draw);
    W.$("#wcCS").onclick = () => c.toBlob(async (blob) => {
      const file = blob && new File([blob], "word-climb-certificate.png", { type: "image/png" });
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: "The Word Climb", text: "I reached the summit of The Word Climb on the WFN app: wfnglobal.org/app" }); return; } catch (e) { if (e.name === "AbortError") return; } }
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "word-climb-certificate.png"; document.body.appendChild(a); a.click(); a.remove();
    }, "image/png");
  }
})();

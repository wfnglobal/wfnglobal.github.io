// WFN App 2.0 — Bible: books, chapters, reader, reading settings, search.
(function () {
  "use strict";
  const W = window.WFN2;
  const { esc, icon } = W;

  W.view("bible", async function (main, parts) {
    if (parts.length === 0) return home(main);
    if (parts.length === 1) return chapters(main, parts[0]);
    return reader(main, parts[0], +parts[1], parts[2] ? +parts[2] : null);
  });

  // Bible versions, same list as the classic app. Public-domain versions
  // come from bible-api.com; Yorùbá, Igbo and Hausa are machine-translated
  // from the KJV and labelled that way.
  const BIBLE_API = "https://bible-api.com/";
  const VERSIONS = [
    { code: "kjv", name: "King James Version", short: "KJV" },
    { code: "web", name: "World English Bible", short: "WEB" },
    { code: "asv", name: "American Standard Version", short: "ASV" },
    { code: "bbe", name: "Bible in Basic English", short: "BBE" },
    { code: "darby", name: "Darby Translation", short: "Darby" },
    { code: "ylt", name: "Young’s Literal Translation", short: "YLT" },
    { code: "dra", name: "Douay-Rheims", short: "DRA" },
    { code: "webbe", name: "World English Bible, British Edition", short: "WEBBE" },
    { code: "oeb-us", name: "Open English Bible, US", short: "OEB" },
    { code: "clementine", name: "Clementine Vulgate (Latin)", short: "Latin" },
    { code: "yo-mt", name: "Yorùbá (machine-translated)", short: "Yorùbá", mt: "yo" },
    { code: "ig-mt", name: "Igbo (machine-translated)", short: "Igbo", mt: "ig" },
    { code: "ha-mt", name: "Hausa (machine-translated)", short: "Hausa", mt: "ha" },
  ];
  // Highlight colours use the classic app's names so highlights made there still show.
  const HL = { gold: "#F7E3B5", green: "#CDE8E4", blue: "#D6E2F2", pink: "#F3D6D6" };
  const HL_ALIAS = { mint: "green", sky: "blue", rose: "pink" };
  function hlName(c) { return HL_ALIAS[c] || c; }
  function hlColor(c) { return HL[hlName(c)] || HL.gold; }

  async function home(main) {
    const idx = await W.bookIndex();
    const last = W.read("wfn2-last-read", null);
    let tab = W.read("wfn2-testament", "new");
    const marks = W.S.getMarks();
    const study = (W.C.BIBLE_STUDY || [])[0];
    const render = () => {
      main.innerHTML = `
      <header class="page-head"><div class="row"><h1 style="flex-grow:1">Bible</h1><button class="icon-btn" id="rs" aria-label="Reading settings">${icon("aa")}</button></div><p class="small muted">King James Version offline, plus 12 more versions</p></header>
      <div class="page">
        ${W.intro("bible", { eyebrow: "You are on holy ground", title: "An electronic Bible is still the Bible", body: ["The screen changes. His Word does not. Approach it the way you would walk into a sanctuary: with a quiet heart and a praying spirit."], list: [["Pray before you tap.", "Ask the Holy Spirit to open your understanding."], ["Let it interrupt you.", "If a verse stops you, stay there."], ["Use the tools to understand, not to argue.", "Word meanings, other versions and translations are here to deepen your grasp of the text."], ["Return daily, not just in emergencies.", "The Word is bread for every day."], ["Guard the moment.", "Silence notifications where you can."]], verse: "For the word of God is quick, and powerful, and sharper than any twoedged sword.", ref: "Hebrews 4:12" })}
        <form class="search-field" action="#" id="bs" role="search"><span aria-hidden="true">${icon("search", "sm")}</span><input name="q" type="search" placeholder="Search the Bible, sermons and studies" aria-label="Search" autocomplete="off"></form>
        ${last ? `<a class="hero" href="#/bible/${esc(last.slug)}/${last.ch}" style="text-decoration:none;gap:8px;padding:20px 22px">
          <span class="eyebrow">Continue reading</span><span class="serif" style="font-size:28px;line-height:34px">${esc(last.name)} ${last.ch}</span>
          <span style="font-size:14px;color:var(--hero-2)">${esc((last.snippet || "").slice(0, 110))}${last.snippet && last.snippet.length > 110 ? "…" : ""}</span></a>` : ""}
        ${study ? `<section class="section"><div class="section-head"><h2 class="h2">Bible study</h2><a href="#/studies">All ${(W.C.BIBLE_STUDY || []).length}</a></div>
          <a class="card" href="#/study/${esc(study.slug)}" style="display:flex;gap:14px;padding:14px;text-decoration:none;color:var(--ink)">
            ${study.poster ? `<img src="${esc(W.asset(study.poster))}" alt="" loading="lazy" style="width:84px;height:105px;border-radius:14px;object-fit:cover;flex-shrink:0;background:var(--sunk)">` : ""}
            <span style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="eyebrow amber">Today · ${esc(((study.verses || [])[0] || {}).ref || "")}</span><span class="serif" style="font-size:19px;line-height:25px">${esc(study.title)}</span><span class="small ink2">${esc(study.excerpt)}</span></span></a></section>` : ""}
        <section class="section" id="books" aria-label="Books of the Bible">
          <div class="seg" role="tablist" aria-label="Testament">
            <button role="tab" id="tabOT" data-t="old" aria-selected="${tab === "old"}" aria-controls="bookNav">Old Testament</button>
            <button role="tab" id="tabNT" data-t="new" aria-selected="${tab === "new"}" aria-controls="bookNav">New Testament</button>
          </div>
          <div class="card book-nav" id="bookNav" role="tabpanel" aria-labelledby="${tab === "old" ? "tabOT" : "tabNT"}"></div>
        </section>
        ${marks.length ? `<section class="section"><div class="section-head"><h2 class="h2">Your highlights</h2><a href="#/kept/highlights">All</a></div>
          <div class="card list">${marks.slice(0, 3).map((m) => `<a class="row-link" href="#/bible/${m.bookSlug}/${m.chapter}/${m.verse}"><span style="width:10px;height:28px;border-radius:4px;flex-shrink:0;background:${m.color ? hlColor(m.color) : "var(--amber)"}"></span><span class="grow"><span class="label serif" style="font-size:16px">${esc(m.text.slice(0, 90))}${m.text.length > 90 ? "…" : ""}</span><span class="hint">${esc(m.bookName)} ${m.chapter}:${m.verse}</span></span></a>`).join("")}</div></section>` : ""}
      </div>`;
      // Books of the Bible: two tabs, then book -> chapter -> verse, all on one page.
      let openBook = null, openCh = null;
      const nav = W.$("#bookNav", main);
      const PER_ROW = 5;
      const chapterGrid = (bk) => {
        let html = "";
        const rowEnd = openCh ? Math.min(bk.chapters, Math.ceil(openCh / PER_ROW) * PER_ROW) : 0;
        for (let c = 1; c <= bk.chapters; c++) {
          html += `<button type="button" data-ch="${c}" class="${openCh === c ? "on" : ""}" aria-pressed="${openCh === c}" aria-label="Chapter ${c}">${c}</button>`;
          if (c === rowEnd) html += `<div class="bn-verses" id="bnVerses"><div class="bn-vhead"><span>${esc(bk.name)} ${openCh}</span><button type="button" class="bn-close" aria-label="Close">${icon("close", "xs")}</button></div>
            <a class="btn block bn-read" href="#/bible/${bk.slug}/${openCh}">Read ${esc(bk.name)} ${openCh}</a>
            <span class="bn-vlabel">Or start at a verse</span><div class="bn-vgrid"><span class="small muted">Loading…</span></div></div>`;
        }
        return html;
      };
      const drawNav = async () => {
        const books = idx.filter((x) => x.testament === tab);
        nav.innerHTML = books.map((bk) => {
          const open = bk.slug === openBook;
          return `<div class="bn-book ${open ? "open" : ""}">
            <button class="bn-row" type="button" data-book="${bk.slug}" aria-expanded="${open}"><span class="bn-name">${esc(bk.name)}</span><span class="bn-count">${bk.chapters}</span><span class="bn-chev">${icon("down", "xs")}</span></button>
            ${open ? `<div class="bn-ch" role="group" aria-label="${esc(bk.name)} chapters">${chapterGrid(bk)}</div>` : ""}
          </div>`;
        }).join("");
        W.$$("[data-book]", nav).forEach((x) => x.onclick = () => { const was = openBook === x.dataset.book; openBook = was ? null : x.dataset.book; openCh = null; drawNav().then(() => { if (!was) { const row = W.$(`[data-book="${openBook}"]`, nav); if (row) row.scrollIntoView({ behavior: "smooth", block: "start" }); } }); });
        W.$$("[data-ch]", nav).forEach((x) => x.onclick = () => { const c = +x.dataset.ch; openCh = openCh === c ? null : c;
          drawNav().then(() => { const v = W.$("#bnVerses", nav); if (v) v.scrollIntoView({ behavior: "smooth", block: "nearest" }); }); });
        const cl = W.$(".bn-close", nav); if (cl) cl.onclick = () => { openCh = null; drawNav(); };
        if (openBook && openCh) {
          const g = W.$(".bn-vgrid", nav);
          try {
            const data = await W.book(openBook);
            const n = (data.chapters[openCh - 1] || []).length;
            g.innerHTML = Array.from({ length: n }, (_, i) => `<a href="#/bible/${openBook}/${openCh}/${i + 1}">${i + 1}</a>`).join("");
          } catch (err) { g.innerHTML = '<span class="small muted">Couldn’t load the verses. Check your connection.</span>'; }
        }
      };
      drawNav();
      W.$$("[data-t]", main).forEach((x) => x.onclick = () => { tab = x.dataset.t; W.write("wfn2-testament", tab); openBook = null; openCh = null;
        W.$$("[data-t]", main).forEach((y) => y.setAttribute("aria-selected", String(y === x))); nav.setAttribute("aria-labelledby", x.id); drawNav(); });
      W.$("#bs").onsubmit = (e) => { e.preventDefault(); const q = e.target.q.value.trim(); if (q) W.go("#/search/" + encodeURIComponent(q)); };
      W.$("#rs").onclick = () => settingsSheet();
      if (W.read("wfn2-goto-books", false)) { W.write("wfn2-goto-books", false); setTimeout(() => W.$(tab === "old" ? "#ot" : "#nt").scrollIntoView({ block: "start" }), 60); }
    };
    render();
  }

  async function chapters(main, slug) {
    const idx = await W.bookIndex();
    const b = idx.find((x) => x.slug === slug);
    if (!b) return W.go("#/bible");
    const readCh = W.read("wfn2-read-ch", {})[slug] || [];
    main.innerHTML = W.topbar(b.name, { back: "#/bible" }) + `<div class="page tight">
      <div style="display:flex;align-items:center;gap:8px"><p class="eyebrow" style="flex-grow:1">${b.testament === "old" ? "Old" : "New"} Testament · ${b.chapters} chapters</p><a class="chip" href="#/bible" id="allBooks">All books</a></div>
      <div class="grid-ch">${Array.from({ length: b.chapters }, (_, i) => `<a href="#/bible/${slug}/${i + 1}" class="${readCh.includes(i + 1) ? "read" : ""}" aria-label="Chapter ${i + 1}${readCh.includes(i + 1) ? ", read" : ""}">${i + 1}</a>`).join("")}</div></div>`;
    W.$("#allBooks").onclick = () => { W.write("wfn2-testament", b.testament); W.write("wfn2-goto-books", true); };
  }

  // In the dark app, "Light" reading follows the app into Dark so the page never glares at night.
  function readTheme() { const s = W.settings(); return s.read === "light" && document.documentElement.dataset.theme === "dark" ? "dark" : s.read; }
  let selected = [];
  let current = null; // { slug, name, ch, plain: [...], version }

  function wrapWords(html) {
    // Wrap each word (outside tags) in a tappable span for the dictionary.
    return html.replace(/(<[^>]+>)|([A-Za-z][A-Za-z']*)/g, (m, tag, word) => (tag ? tag : `<span class="w">${word}</span>`));
  }

  async function reader(main, slug, ch, focusVerse) {
    const [idx, data] = await Promise.all([W.bookIndex(), W.book(slug)]);
    const bi = idx.findIndex((x) => x.slug === slug);
    const b = idx[bi];
    if (!b || !data.chapters[ch - 1]) return W.go("#/bible/" + slug);
    const kjv = data.chapters[ch - 1];
    const set = W.settings();
    selected = [];
    const prev = ch > 1 ? `#/bible/${slug}/${ch - 1}` : bi > 0 ? `#/bible/${idx[bi - 1].slug}/${idx[bi - 1].chapters}` : null;
    const next = ch < b.chapters ? `#/bible/${slug}/${ch + 1}` : bi < idx.length - 1 ? `#/bible/${idx[bi + 1].slug}/1` : null;
    W.write("wfn2-last-read", { slug, name: b.name, ch, snippet: W.plain(kjv[0]) });
    const rc = W.read("wfn2-read-ch", {}); rc[slug] = Array.from(new Set((rc[slug] || []).concat(ch))); W.write("wfn2-read-ch", rc);
    let version = W.read("wfn2-version", "kjv");
    if (!VERSIONS.find((v) => v.code === version)) version = "kjv";
    current = { slug, name: b.name, ch, plain: kjv.map(W.plain), version: "kjv" };

    main.innerHTML = `<div class="reader ${set.nums ? "" : "no-nums"} ${set.red ? "red" : ""} ${set.byverse === false ? "" : "by-verse"}" data-read="${readTheme()}">
      <div class="ch-fab prev">${prev ? `<a href="${prev}" aria-label="Previous chapter">${icon("back", "sm")}</a>` : `<span aria-hidden="true">${icon("back", "sm")}</span>`}</div>
      <div class="ch-fab next">${next ? `<a href="${next}" aria-label="Next chapter">${icon("chev", "sm")}</a>` : `<span aria-hidden="true">${icon("chev", "sm")}</span>`}</div>
      <header class="topbar">
        <a class="icon-btn" href="#/bible/${slug}" aria-label="Chapters of ${esc(b.name)}">${icon("back")}</a>
        <button class="book-btn" id="bookBtn" type="button" aria-label="Choose a book: Old or New Testament">${esc(b.name)} ${ch} ${icon("down", "xs")}</button>
        <button class="icon-btn" id="rListen" aria-label="Listen to this chapter" aria-pressed="false">${icon("listen")}</button>
        <button class="icon-btn" id="rSet" aria-label="Reading settings">${icon("aa")}</button>
      </header>
      <div class="reader-tools" role="toolbar" aria-label="Reader tools">
        <button class="chip" id="verBtn" type="button" aria-label="Bible version">${icon("layers", "xs")}<span id="verLab">KJV</span>${icon("down", "xs")}</button>
        <button class="chip" id="jumpBtn" type="button">${icon("jump", "xs")}Jump</button>
        <button class="chip" id="sumBtn" type="button" aria-expanded="false">${icon("summary", "xs")}Summary</button>
        <button class="chip icon-chip" id="trBtn" type="button" aria-label="Translate">${icon("globe", "xs")}</button>
      </div>
      <article class="reader-text" aria-label="${esc(b.name)} chapter ${ch}">
        <h2>${esc(b.name)} ${ch}</h2>
        <p id="verNote" class="small" hidden style="font-family:var(--sans);margin:0 0 16px;opacity:.75"></p>
        <p id="sumText" hidden style="font-family:var(--sans);font-size:15px;line-height:24px;margin:0 0 20px;padding:14px 16px;border-radius:16px;background:rgba(127,127,127,0.08)"></p>
        ${set.lookup !== false ? `<p class="small" id="tapHint" style="font-family:var(--sans);margin:0 0 14px;opacity:.7">Tap any word for its meaning. Tap a verse number, or the space beside a verse, to highlight, save or share.</p>` : ""}
        <p id="verses" style="margin:0"></p>
      </article>
      <nav class="chapter-nav" aria-label="Chapters">
        ${prev ? `<a class="btn ghost" href="${prev}">${icon("back", "sm")}Previous</a>` : "<span></span>"}
        ${next ? `<a class="btn" href="${next}">Next chapter${icon("chev", "sm")}</a>` : ""}
      </nav>
    </div>`;

    const versesEl = W.$("#verses");
    const lookupOn = set.lookup !== false;
    function paint(texts, isHtml) {
      const marks = W.S.getMarks().filter((m) => m.bookSlug === slug && m.chapter === ch);
      const notes = W.S.getNotes().filter((n) => n.refKey && (n.refKey.indexOf("bible:" + slug + ":" + ch + ":") === 0 || n.refKey.indexOf(slug + ":" + ch + ":") === 0));
      versesEl.innerHTML = texts.map((t, i) => {
        const v = i + 1, m = marks.find((x) => x.verse === v);
        const noted = notes.some((n) => n.refKey === "bible:" + slug + ":" + ch + ":" + v || n.refKey === slug + ":" + ch + ":" + v);
        const body = isHtml ? t.replace(/class="woc"/g, 'class="wj"') : esc(t);
        return `<span class="v ${m && m.color ? "hl-" + hlName(m.color) : ""} ${noted ? "noted" : ""}" id="v${v}" data-v="${v}"><sup role="button" tabindex="0" aria-label="Verse ${v}, highlight, save or share">${v}</sup>${lookupOn ? wrapWords(body) : body} </span>`;
      }).join("");
    }
    async function fetchVersion(code) {
      const ver = VERSIONS.find((v) => v.code === code);
      if (code === "kjv") return { texts: kjv, html: true };
      if (ver.mt) {
        const plain = kjv.map(W.plain);
        const outs = await W.translateTexts(plain, ver.mt);
        return { texts: outs.map((o, i) => o || plain[i]), note: `Machine-translated from the KJV, not a published ${ver.short} Bible. Helpful for meaning, not a substitute for a professional translation.` };
      }
      const r = await fetch(BIBLE_API + encodeURIComponent(b.name + " " + ch).replace(/%20/g, "+") + "?translation=" + code);
      if (!r.ok) throw new Error("bad");
      const j = await r.json();
      if (!j.verses || !j.verses.length) throw new Error("none");
      const arr = []; j.verses.forEach((x) => { arr[x.verse - 1] = x.text.trim(); });
      return { texts: Array.from(arr, (x) => x || "") };
    }
    async function load(code) {
      const ver = VERSIONS.find((v) => v.code === code) || VERSIONS[0];
      W.$("#verLab").textContent = ver.short;
      const note = W.$("#verNote");
      if (code !== "kjv") { versesEl.innerHTML = `<span style="font-family:var(--sans);font-size:15px;opacity:.7">Loading ${esc(ver.name)}…</span>`; }
      try {
        const r = await fetchVersion(code);
        paint(r.texts, !!r.html);
        current.plain = r.texts.map((t) => (r.html ? W.plain(t) : t));
        current.version = code;
        note.hidden = !r.note && code === "kjv";
        note.textContent = r.note || (code === "kjv" ? "" : ver.name);
        W.write("wfn2-version", code);
      } catch (e) {
        paint(kjv, true); current.plain = kjv.map(W.plain); current.version = "kjv"; W.$("#verLab").textContent = "KJV";
        note.hidden = false; note.textContent = "Couldn’t load " + ver.name + " right now. Check your connection. Showing the KJV.";
      }
      wireVerses();
    }
    const XR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-8l-4 3v-3H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M7.5 9.5h9M7.5 12.5h6"/></svg>';
    let xref = null;
    function addXr() {
      const chx = (xref && xref[String(ch)]) || {};
      W.$$(".v", versesEl).forEach((p) => {
        if (p.querySelector(".xr") || !chx[p.dataset.v]) return;
        const btn = document.createElement("button");
        btn.type = "button"; btn.className = "xr"; btn.innerHTML = XR;
        btn.setAttribute("aria-label", "Related verses for " + b.name + " " + ch + ":" + p.dataset.v);
        btn.addEventListener("click", (e) => { e.stopPropagation(); const v = +p.dataset.v; related(slug, b.name, ch, v, current.plain[v - 1] || ""); });
        p.appendChild(btn);
      });
    }
    if (window.WFNBible) window.WFNBible.getXref(slug).then((d) => { xref = d; addXr(); }).catch(() => {});
    function wireVerses() {
      addXr();
      W.$$(".v", versesEl).forEach((el) => {
        const sup = el.querySelector("sup");
        const pick = () => toggle(el);
        sup.addEventListener("click", (e) => { e.stopPropagation(); pick(); });
        sup.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
        el.addEventListener("click", (e) => {
          if (window.getSelection && String(window.getSelection()).length > 1) return;
          const w = e.target.closest(".w");
          if (w && lookupOn) { lookup(w.textContent); return; }
          pick();
        });
      });
    }
    const toggle = (el) => {
      const v = +el.dataset.v;
      if (selected.includes(v)) { selected = selected.filter((x) => x !== v); el.classList.remove("sel"); }
      else { selected.push(v); el.classList.add("sel"); }
      selBar(slug, b.name, ch);
    };

    paint(kjv, true); wireVerses();
    if (version !== "kjv") load(version);
    if (focusVerse) { const el = W.$("#v" + focusVerse); if (el) setTimeout(() => { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1800); }, 80); }
    W.setReadable(() => [b.name + ", chapter " + ch + "."].concat(current.plain));

    W.$("#bookBtn").onclick = () => { W.write("wfn2-testament", b.testament); W.write("wfn2-goto-books", true); W.go("#/bible"); };
    W.$("#rSet").onclick = () => settingsSheet(() => reader(main, slug, ch));
    W.$("#rListen").onclick = (e) => W.speak([b.name + ", chapter " + ch + "."].concat(current.plain), e.currentTarget);
    W.$("#verBtn").onclick = () => W.sheet(`<div class="sheet-head"><h2>Bible version</h2><button class="btn sm soft" data-close>Close</button></div>
      <div class="card list" role="radiogroup" aria-label="Bible version" style="box-shadow:none">${VERSIONS.map((v) => `<button class="row-link" role="radio" aria-checked="${current.version === v.code}" data-ver="${v.code}"><span class="grow"><span class="label">${esc(v.name)}</span><span class="hint">${v.code === "kjv" ? "Works offline" : v.mt ? "Machine-translated from the KJV" : "Public domain · needs a connection"}</span></span><span class="radio-dot" aria-hidden="true"></span></button>`).join("")}</div>`, (el) => {
      W.$$("[data-ver]", el).forEach((x) => x.onclick = () => { W.closeSheet(); load(x.dataset.ver); });
    });
    W.$("#jumpBtn").onclick = () => W.sheet(`<div class="sheet-head"><h2>Jump to a verse</h2><button class="btn sm soft" data-close>Close</button></div>
      <p class="small muted">${esc(b.name)} ${ch} · ${kjv.length} verses</p>
      <div class="grid-ch">${kjv.map((_, i) => `<a href="#" data-jv="${i + 1}">${i + 1}</a>`).join("")}</div>`, (el) => {
      W.$$("[data-jv]", el).forEach((x) => x.onclick = (e) => { e.preventDefault(); W.closeSheet(); const t = W.$("#v" + x.dataset.jv); if (t) { t.scrollIntoView({ behavior: "smooth", block: "center" }); t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash"); setTimeout(() => t.classList.remove("flash"), 1800); } });
    });
    W.$("#sumBtn").onclick = async (e) => {
      const p = W.$("#sumText");
      if (!p.hidden) { p.hidden = true; e.currentTarget.setAttribute("aria-expanded", "false"); return; }
      p.textContent = "Loading…"; p.hidden = false; e.currentTarget.setAttribute("aria-expanded", "true");
      let txt = null;
      try { txt = window.WFNBible ? await window.WFNBible.getChapterSummary(slug, ch) : null; } catch (err) {}
      p.textContent = txt || "A plain-English summary for this chapter is coming soon.";
    };
    W.$("#trBtn").onclick = () => W.pickLang(async (lang) => {
      if (lang === "en") return load("kjv");
      const mt = VERSIONS.find((v) => v.mt === lang);
      if (mt) return load(mt.code);
      versesEl.style.opacity = ".5";
      const outs = await W.translateTexts(kjv.map(W.plain), lang);
      versesEl.style.opacity = "";
      paint(outs.map((o, i) => o || W.plain(kjv[i])), false);
      current.plain = outs.map((o, i) => o || W.plain(kjv[i]));
      const n = W.$("#verNote"); n.hidden = false; n.textContent = "Machine-translated from the KJV. Tap Translate, then English, to go back.";
      W.$("#verLab").textContent = (W.read && ((window.WFNLookup.TRANSLATE_LANGS.find((l) => l.code === lang) || {}).name)) || lang;
      wireVerses();
    });
  }

  function lookup(word) {
    if (window.WFNLookup && window.WFNLookup.openLookup) return window.WFNLookup.openLookup(word);
    W.toast("The dictionary is still loading. Try again in a moment.");
  }

  async function related(slug, name, ch, v, text) {
    if (!window.WFNBible || !window.WFNGlass) return W.toast("Related verses are still loading.");
    let x = null;
    try { x = await window.WFNBible.getXref(slug); } catch (e) {}
    const codes = (x && x[String(ch)] && x[String(ch)][String(v)]) || [];
    if (!codes.length) return W.toast("No related verses for " + name + " " + ch + ":" + v);
    const books = await W.bookIndex();
    const items = codes.map((code) => { const r = window.WFNBible.parseXref(code); const bk = books[r.b] || {}; let label = `${bk.name} ${r.c}:${r.v}`; if (r.ec !== r.c) label += `–${r.ec}:${r.ev}`; else if (r.ev !== r.v) label += `–${r.ev}`; return Object.assign(r, { slug: bk.slug, label }); });
    const G = window.WFNGlass;
    const body = G.open(G.head(`${esc(name)} ${ch}:${v}`) + `<div class="wg-scripture">${esc(text)}</div><div class="wg-rule"></div><div class="wg-label">Related across the Bible · ${items.length}</div><div class="wg-list">${items.map((it, i) => `<button type="button" class="wg-row" data-i="${i}"><span class="wg-row-main"><span class="wg-row-ref">${esc(it.label)}</span><span class="wg-row-text">…</span></span></button>`).join("")}</div><div class="wg-note">Cross-references from OpenBible.info (CC BY).</div>`);
    body.querySelector(".wg-list").addEventListener("click", (e) => { const row = e.target.closest(".wg-row"); if (!row) return; const it = items[+row.dataset.i]; G.close(); W.go(`#/bible/${it.slug}/${it.c}/${it.v}`); });
    items.forEach(async (it, i) => { try { const bd = await W.book(it.slug); const parts = []; for (let c = it.c; c <= it.ec; c++) { const vs = bd.chapters[c - 1] || []; const from = c === it.c ? it.v : 1, to = c === it.ec ? it.ev : vs.length; for (let k = from; k <= to && parts.length < 6; k++) if (vs[k - 1]) parts.push(W.plain(vs[k - 1])); } const el = body.querySelector(`.wg-row[data-i="${i}"] .wg-row-text`); if (el) el.textContent = parts.join(" "); } catch (err) {} });
  }

  function selBar(slug, name, ch) {
    let bar = W.$(".selbar");
    if (!selected.length) { if (bar) bar.remove(); return; }
    selected.sort((a, b) => a - b);
    const ref = name + " " + ch + ":" + rangeLabel(selected);
    const text = selected.map((v) => current.plain[v - 1] || "").join(" ");
    const kjvText = () => W.book(slug).then((d) => selected.map((v) => W.plain(d.chapters[ch - 1][v - 1])));
    if (!bar) { bar = document.createElement("div"); bar.className = "selbar"; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", "Verse actions"); document.body.appendChild(bar); }
    const mk = selected.length === 1 ? W.S.getMark(slug, ch, selected[0]) : null;
    const verLab = (VERSIONS.find((v) => v.code === current.version) || { short: "KJV" }).short;
    bar.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:0 4px">
        <b style="flex-grow:1;font:600 14px var(--sans)">${esc(ref)}</b>
        <div class="swatches" role="group" aria-label="Highlight colour">${Object.keys(HL).map((c) => `<button class="swatch" data-c="${c}" aria-label="Highlight ${c}" aria-pressed="${!!(mk && hlName(mk.color) === c)}" style="background:${HL[c]}"></button>`).join("")}</div>
      </div>
      <div class="acts">
        <button data-a="save">${icon(mk && mk.saved ? "check" : "save")}${mk && mk.saved ? "Saved" : "Save"}</button>
        <button data-a="note">${icon("pen")}Note</button>
        <button data-a="copy">${icon("copy")}Copy</button>
        <button data-a="share">${icon("share")}Share</button>
        <button data-a="pray">${icon("hand")}Pray</button>
        <button data-a="lookup">${icon("search")}Look up</button>
        <button data-a="translate">${icon("globe")}Translate</button>
        <button data-a="related">${icon("related")}Related</button>
      </div>
      <button class="btn sm soft" data-a="clear" style="align-self:center">Done</button>`;
    const cleanup = () => { selected = []; W.$$(".v.sel").forEach((e) => e.classList.remove("sel")); bar.remove(); };
    W.$$(".swatch", bar).forEach((s) => s.onclick = async () => {
      const c = s.dataset.c;
      const ktexts = await kjvText();
      selected.forEach((v, i) => {
        const cur = W.S.getMark(slug, ch, v);
        const nxt = cur && hlName(cur.color) === c ? null : c;
        W.S.setHighlight(slug, name, ch, v, ktexts[i], nxt);
        const el = W.$("#v" + v);
        el.className = el.className.replace(/\bhl-\w+/g, "").trim();
        if (nxt) el.classList.add("hl-" + nxt);
      });
      cleanup();
    });
    bar.onclick = async (e) => {
      const a = e.target.closest("[data-a]"); if (!a) return;
      const act = a.dataset.a;
      const full = "“" + text + "” " + ref + " (" + verLab + ")";
      if (act === "clear") return cleanup();
      if (act === "copy") { W.copyText(full); return cleanup(); }
      if (act === "share") { W.shareOrCopy({ title: ref, text: full }); return cleanup(); }
      if (act === "pray") { cleanup(); if (window.WFNShare && window.WFNShare.pray) window.WFNShare.pray(text, ref); return; }
      if (act === "save") { const kt = await kjvText(); selected.forEach((v, i) => W.S.toggleSaved(slug, name, ch, v, kt[i])); W.toast("Saved to your verses"); return cleanup(); }
      if (act === "note") { const v0 = selected[0]; cleanup(); return noteSheet({ type: "bible", refKey: "bible:" + slug + ":" + ch + ":" + v0, refLabel: ref, quote: text, onSave: () => { const el = W.$("#v" + v0); if (el) el.classList.add("noted"); } }); }
      if (act === "related") { const v0 = selected[0]; cleanup(); return related(slug, name, ch, v0, current.plain[v0 - 1] || ""); }
      if (act === "lookup") {
        const words = Array.from(new Set((text.match(/[A-Za-z][A-Za-z']+/g) || [])));
        cleanup();
        return W.sheet(`<div class="sheet-head"><h2>Look up a word</h2><button class="btn sm soft" data-close>Close</button></div><p class="small muted">${esc(ref)}</p><div class="chips">${words.map((w) => `<button class="chip" data-w="${esc(w)}">${esc(w)}</button>`).join("")}</div><div id="lkOut" style="font-size:15px;line-height:23px"></div>`, (el) => {
          W.$$("[data-w]", el).forEach((b) => b.onclick = async () => { const out = W.$("#lkOut", el); out.innerHTML = "<b>" + esc(b.dataset.w) + "</b> · looking up…"; if (window.WFNLookup) await window.WFNLookup.renderLookupInto(out, b.dataset.w); });
        });
      }
      if (act === "translate") {
        cleanup();
        return W.pickLang(async (lang) => {
          W.sheet(`<div class="sheet-head"><h2>${esc(ref)}</h2><button class="btn sm soft" data-close>Close</button></div><p class="serif" id="tvOut" style="font-size:18px;line-height:29px">Translating…</p><p class="small muted">Original: ${esc(text)}</p>`);
          const out = lang === "en" ? text : window.WFNLookup ? await window.WFNLookup.translateText(text, lang) : null;
          const el = W.$("#tvOut"); if (el) el.textContent = out || (text + " (translation unavailable right now)");
        });
      }
    };
  }
  function rangeLabel(vs) {
    const out = []; let s = vs[0], p = vs[0];
    for (let i = 1; i <= vs.length; i++) { if (vs[i] === p + 1) { p = vs[i]; continue; } out.push(s === p ? s : s + "–" + p); s = p = vs[i]; }
    return out.join(", ");
  }

  function noteSheet(o) {
    W.sheet(`<div class="sheet-head"><h2>Note</h2><button class="btn sm soft" data-close>Cancel</button></div>
      ${o.quote ? `<p class="serif ink2" style="font-size:16px;line-height:26px;border-left:3px solid var(--spruce);padding-left:12px">${esc(o.quote.slice(0, 220))}${o.quote.length > 220 ? "…" : ""}</p>` : ""}
      <label class="sr" for="nt">Your note</label><textarea class="field" id="nt" placeholder="What is God saying to you here?"></textarea>
      <button class="btn lg block" id="ntSave">Save note</button>`, (el) => {
      W.$("#ntSave", el).onclick = () => {
        const txt = W.$("#nt", el).value.trim();
        if (!txt) return W.$("#nt", el).focus();
        W.S.addNote(o.type || "verse", o.refKey, o.refLabel, txt);
        W.closeSheet(); W.toast("Note saved"); if (o.onSave) o.onSave();
      };
    });
  }
  W.noteSheet = noteSheet;

  function settingsSheet(onChange) {
    const s = W.settings();
    const body = () => `<div class="sheet-head"><h2>Reading</h2><button class="btn sm soft" data-close>Done</button></div>
      <div class="theme-grid" role="radiogroup" aria-label="Reading theme">${W.READ_THEMES.map((t) => `<button role="radio" aria-checked="${s.read === t.id}" data-read="${t.id}" style="background:${t.bg};color:${t.ink}"><span>Aa</span>${t.name}</button>`).join("")}</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;font:600 13px var(--sans);color:var(--ink-2)"><label for="sz" style="flex-grow:1">Text size</label><span style="font-variant-numeric:tabular-nums" id="szv">${s.size} pt</span></div>
        <div style="display:flex;align-items:center;gap:14px"><span class="serif" style="font-size:14px">A</span><input id="sz" type="range" min="14" max="34" value="${s.size}"><span class="serif" style="font-size:24px">A</span></div>
      </div>
      <div class="font-row" role="radiogroup" aria-label="Font">${W.FONTS.map((f) => `<button role="radio" aria-checked="${s.font === f.id}" data-font="${f.id}"><b style="font-family:${esc(f.stack)}">Aa</b><small>${esc(f.name.replace(" Hyperlegible", "").replace(" Sans", ""))}</small></button>`).join("")}</div>
      <div class="card list" style="border-radius:18px">
        ${[["byverse", "Verse by verse", "Each verse on its own line, like the classic app"], ["nums", "Verse numbers", "Small numbers before each verse"], ["red", "Words of Jesus in red", "Gospels, Acts and Revelation"], ["lookup", "Tap a word to define it", "Dictionary, Bible names and KJV words"]].map(([k, l, h]) => `<label class="row-link" style="min-height:54px"><span class="grow"><span class="label" style="font-size:15px">${l}</span><span class="hint">${h}</span></span><span class="switch"><input type="checkbox" data-k="${k}" ${s[k] !== false && (k !== "red" || s[k]) && (k !== "nums" || s[k]) ? "checked" : ""}><span></span></span></label>`).join("")}
      </div>`;
    const wire = (el) => {
      W.$$("[data-read]", el).forEach((b) => b.onclick = () => { W.setSetting("read", b.dataset.read); refresh(el); });
      W.$$("[data-font]", el).forEach((b) => b.onclick = () => { W.setSetting("font", b.dataset.font); refresh(el); });
      W.$$("[data-k]", el).forEach((c) => c.onchange = () => { W.setSetting(c.dataset.k, c.checked); if ((c.dataset.k === "lookup" || c.dataset.k === "byverse") && onChange) { W.closeSheet(); onChange(); } else if (onChange) applyLive(); });
      const sz = W.$("#sz", el);
      sz.oninput = () => { W.setSetting("size", +sz.value); W.$("#szv", el).textContent = sz.value + " pt"; };
    };
    const applyLive = () => {
      const r = W.$(".reader"); if (!r) return;
      const st = W.settings();
      r.dataset.read = readTheme(); r.classList.toggle("no-nums", !st.nums); r.classList.toggle("red", !!st.red);
    };
    const refresh = (el) => { const keep = el.scrollTop; el.innerHTML = '<span class="grab" aria-hidden="true"></span>' + body(); wire(el); el.scrollTop = keep; applyLive(); };
    W.sheet(body(), wire);
  }
  W.readingSheet = settingsSheet;

  // ---------- search ----------
  W.view("search", async function (main, parts) {
    const q0 = parts[0] || "";
    main.innerHTML = W.topbar("Search", { back: "#/bible" }) + `<div class="page tight">
      <form class="search-field" id="sf" role="search"><span aria-hidden="true">${icon("search", "sm")}</span><input name="q" type="search" value="${esc(q0)}" placeholder="A word, phrase or reference" aria-label="Search" autocomplete="off"></form>
      <div id="res" aria-live="polite"></div></div>`;
    const f = W.$("#sf");
    f.onsubmit = (e) => { e.preventDefault(); const q = f.q.value.trim(); if (q) history.replaceState(null, "", "#/search/" + encodeURIComponent(q)); run(q); };
    if (!q0) { f.q.focus(); W.$("#res").innerHTML = `<div class="chips" style="padding-top:6px">${["faith", "John 3:16", "peace", "Psalm 23", "fear not", "healing"].map((s) => `<a class="chip" href="#/search/${encodeURIComponent(s)}">${esc(s)}</a>`).join("")}</div>`; }
    else run(q0);
  });
  async function run(q) {
    const res = W.$("#res");
    res.innerHTML = '<p class="small muted" style="padding:8px 4px">Searching…</p>';
    const ql = q.toLowerCase();
    const C = W.C;
    // reference jump: "John 3:16", "1 cor 13", "psalm 23"
    const idx = await W.bookIndex();
    const m = q.match(/^\s*(\d?\s*[a-z][a-z ]*?)\s*(\d+)(?::(\d+))?\s*$/i);
    let jump = "";
    if (m) {
      const nm = m[1].replace(/\s+/g, " ").trim().toLowerCase();
      const b = idx.find((x) => x.name.toLowerCase() === nm || x.name.toLowerCase().startsWith(nm) || x.slug.replace(/-/g, " ").startsWith(nm.replace(/^(\d)\s*/, "$1 ")));
      if (b && +m[2] <= b.chapters) jump = `<a class="card pad-s" href="#/bible/${b.slug}/${m[2]}${m[3] ? "/" + m[3] : ""}" style="display:flex;gap:12px;align-items:center;text-decoration:none;color:var(--ink)"><span class="tile-ic c-amber">${icon("bible")}</span><span class="grow" style="flex-grow:1"><span class="serif" style="font-size:18px">${esc(b.name)} ${m[2]}${m[3] ? ":" + m[3] : ""}</span><br><span class="small muted">Open in the Bible</span></span>${icon("chev", "sm")}</a>`;
    }
    const sermons = (C.SERMONS || []).filter((s) => (s.title + " " + s.excerpt + " " + s.ref).toLowerCase().includes(ql)).slice(0, 5);
    const studies = (C.BIBLE_STUDY || []).filter((s) => (s.title + " " + s.excerpt + " " + (s.body || []).join(" ")).toLowerCase().includes(ql)).slice(0, 5);
    const verses = [];
    if (q.length >= 3) {
      for (const b of idx) {
        const d = await W.book(b.slug);
        d.chapters.forEach((c, ci) => c.forEach((t, vi) => { if (verses.length < 60) { const p = W.plain(t); if (p.toLowerCase().includes(ql)) verses.push({ b, ch: ci + 1, v: vi + 1, p }); } }));
        if (verses.length >= 60) break;
      }
    }
    const hi = (s) => esc(s).replace(new RegExp("(" + ql.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark style=\"background:var(--amber-soft);color:inherit;border-radius:3px\">$1</mark>");
    res.innerHTML = `${jump}
      ${sermons.length || studies.length ? `<section class="section" style="margin-top:14px"><h2 class="eyebrow" style="padding:0 4px">Sermons and studies</h2><div class="card list">${studies.map((s) => `<a class="row-link" href="#/study/${s.slug}"><span class="grow"><span class="label serif">${esc(s.title)}</span><span class="hint">Bible study · ${esc(s.date || "")}</span></span></a>`).join("")}${sermons.map((s) => `<a class="row-link" href="#/sermon/${s.slug}"><span class="grow"><span class="label serif">${esc(s.title)}</span><span class="hint">Sermon · ${esc(s.ref)}</span></span></a>`).join("")}</div></section>` : ""}
      <section class="section" style="margin-top:14px"><h2 class="eyebrow" style="padding:0 4px">${verses.length ? verses.length + (verses.length === 60 ? "+" : "") + " verses" : "Verses"}</h2>
      ${verses.length ? `<div class="card list">${verses.map((r) => `<a class="row-link" href="#/bible/${r.b.slug}/${r.ch}/${r.v}"><span class="grow"><span class="serif" style="font-size:16px;line-height:25px">${hi(r.p)}</span><span class="hint">${esc(r.b.name)} ${r.ch}:${r.v}</span></span></a>`).join("")}</div>` : `<div class="empty">${q.length < 3 ? "Type at least three letters to search verses." : "No verses found for “" + esc(q) + "”."}</div>`}</section>`;
  }
})();

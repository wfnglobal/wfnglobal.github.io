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

  async function home(main) {
    const idx = await W.bookIndex();
    const last = W.read("wfn2-last-read", null);
    let tab = W.read("wfn2-testament", "new");
    const marks = W.S.getMarks();
    const render = () => {
      main.innerHTML = `
      <header class="page-head"><div class="row"><h1 style="flex-grow:1">Bible</h1><button class="icon-btn" id="rs" aria-label="Reading settings">${icon("aa")}</button></div><p class="small muted">King James Version · works offline</p></header>
      <div class="page">
        <form class="search-field" action="#" id="bs" role="search"><span aria-hidden="true">${icon("search", "sm")}</span><input name="q" type="search" placeholder="Search the Bible, sermons and studies" aria-label="Search" autocomplete="off"></form>
        ${last ? `<a class="hero" href="#/bible/${esc(last.slug)}/${last.ch}" style="text-decoration:none;gap:8px;padding:20px 22px">
          <span class="eyebrow">Continue reading</span><span class="serif" style="font-size:28px;line-height:34px">${esc(last.name)} ${last.ch}</span>
          <span style="font-size:14px;color:var(--hero-2)">${esc((last.snippet || "").slice(0, 110))}${last.snippet && last.snippet.length > 110 ? "…" : ""}</span></a>` : ""}
        <section class="section">
          <div class="seg" role="tablist" aria-label="Testament">
            <button role="tab" aria-selected="${tab === "old"}" data-t="old">Old Testament</button>
            <button role="tab" aria-selected="${tab === "new"}" data-t="new">New Testament</button>
          </div>
          <div class="grid-books">${idx.filter((b) => b.testament === tab).map((b) => `<a href="#/bible/${b.slug}">${esc(b.name)}</a>`).join("")}</div>
        </section>
        ${marks.length ? `<section class="section"><div class="section-head"><h2 class="h2">Your highlights</h2><a href="#/kept/highlights">All ${marks.length}</a></div>
          <div class="card list">${marks.slice(0, 3).map((m) => `<a class="row-link" href="#/bible/${m.bookSlug}/${m.chapter}/${m.verse}"><span style="width:10px;height:28px;border-radius:4px;flex-shrink:0;background:${m.color ? hlColor(m.color) : "var(--amber)"}"></span><span class="grow"><span class="label serif" style="font-size:16px">${esc(m.text.slice(0, 90))}${m.text.length > 90 ? "…" : ""}</span><span class="hint">${esc(m.bookName)} ${m.chapter}:${m.verse}</span></span></a>`).join("")}</div></section>` : ""}
      </div>`;
      W.$$("[data-t]", main).forEach((b) => b.onclick = () => { tab = b.dataset.t; W.write("wfn2-testament", tab); render(); });
      W.$("#bs").onsubmit = (e) => { e.preventDefault(); const q = e.target.q.value.trim(); if (q) W.go("#/search/" + encodeURIComponent(q)); };
      W.$("#rs").onclick = () => settingsSheet();
    };
    render();
  }
  function hlColor(c) { return { gold: "#F7E3B5", mint: "#CDE8E4", rose: "#F3D6D6", sky: "#D6E2F2" }[c] || "#F7E3B5"; }

  async function chapters(main, slug) {
    const idx = await W.bookIndex();
    const b = idx.find((x) => x.slug === slug);
    if (!b) return W.go("#/bible");
    const readCh = W.read("wfn2-read-ch", {})[slug] || [];
    main.innerHTML = W.topbar(b.name, { back: "#/bible" }) + `<div class="page tight"><p class="eyebrow">${b.chapters} chapters</p>
      <div class="grid-ch">${Array.from({ length: b.chapters }, (_, i) => `<a href="#/bible/${slug}/${i + 1}" class="${readCh.includes(i + 1) ? "read" : ""}" aria-label="Chapter ${i + 1}${readCh.includes(i + 1) ? ", read" : ""}">${i + 1}</a>`).join("")}</div></div>`;
  }

  // In the dark app, "Light" reading follows the app into Dark so the page never glares at night.
  function readTheme() { const s = W.settings(); return s.read === "light" && document.documentElement.dataset.theme === "dark" ? "dark" : s.read; }
  let selected = [];
  async function reader(main, slug, ch, focusVerse) {
    const [idx, data] = await Promise.all([W.bookIndex(), W.book(slug)]);
    const bi = idx.findIndex((x) => x.slug === slug);
    const b = idx[bi];
    if (!b || !data.chapters[ch - 1]) return W.go("#/bible/" + slug);
    const verses = data.chapters[ch - 1];
    const set = W.settings();
    selected = [];
    const marks = W.S.getMarks().filter((m) => m.bookSlug === slug && m.chapter === ch);
    const notes = W.S.getNotes().filter((n) => n.refKey && n.refKey.indexOf(slug + ":" + ch + ":") === 0);
    const markOf = (v) => marks.find((m) => m.verse === v);
    const prev = ch > 1 ? `#/bible/${slug}/${ch - 1}` : bi > 0 ? `#/bible/${idx[bi - 1].slug}/${idx[bi - 1].chapters}` : null;
    const next = ch < b.chapters ? `#/bible/${slug}/${ch + 1}` : bi < idx.length - 1 ? `#/bible/${idx[bi + 1].slug}/1` : null;
    W.write("wfn2-last-read", { slug, name: b.name, ch, snippet: W.plain(verses[0]) });
    const rc = W.read("wfn2-read-ch", {}); rc[slug] = Array.from(new Set((rc[slug] || []).concat(ch))); W.write("wfn2-read-ch", rc);

    main.innerHTML = `<div class="reader ${set.nums ? "" : "no-nums"} ${set.red ? "red" : ""}" data-read="${readTheme()}">
      <header class="topbar">
        <a class="icon-btn" href="#/bible/${slug}" aria-label="Chapters">${icon("back")}</a>
        <a class="book-btn" href="#/bible/${slug}" style="text-decoration:none">${esc(b.name)} ${ch} ${icon("down", "xs")}</a>
        <button class="icon-btn" id="rListen" aria-label="Listen to this chapter" aria-pressed="false">${icon("listen")}</button>
        <button class="icon-btn" id="rSet" aria-label="Reading settings">${icon("aa")}</button>
      </header>
      <article class="reader-text" aria-label="${esc(b.name)} chapter ${ch}">
        <h2>${esc(b.name)} ${ch}</h2>
        <button class="chip summary-btn" id="sumBtn" aria-expanded="false">${icon("summary", "xs")}What this chapter is about</button>
        <p id="sumText" class="small" hidden style="font-family:var(--sans);font-size:15px;line-height:24px;margin:0 0 20px;padding:14px 16px;border-radius:16px;background:rgba(127,127,127,0.08)"></p>
        <p style="margin:0">${verses.map((t, i) => {
          const v = i + 1, m = markOf(v), noted = notes.some((n) => n.refKey === slug + ":" + ch + ":" + v);
          return `<span class="v ${m && m.color ? "hl-" + m.color : ""} ${noted ? "noted" : ""}" id="v${v}" data-v="${v}" role="button" tabindex="0"><sup>${v}</sup>${t.replace(/class="woc"/g, 'class="wj"')} </span>`;
        }).join("")}</p>
      </article>
      <nav class="chapter-nav" aria-label="Chapters">
        ${prev ? `<a class="btn ghost" href="${prev}">${icon("back", "sm")}Previous</a>` : "<span></span>"}
        ${next ? `<a class="btn" href="${next}">Next chapter${icon("chev", "sm")}</a>` : ""}
      </nav>
    </div>`;
    if (focusVerse) { const el = W.$("#v" + focusVerse); if (el) setTimeout(() => { el.scrollIntoView({ block: "center" }); el.classList.add("sel"); setTimeout(() => el.classList.remove("sel"), 1600); }, 60); }

    W.$("#rSet").onclick = () => settingsSheet(() => reader(main, slug, ch));
    W.$("#rListen").onclick = (e) => W.speak(b.name + " chapter " + ch + ". " + verses.map(W.plain).join(" "), e.currentTarget);
    W.$("#sumBtn").onclick = async (e) => {
      const p = W.$("#sumText");
      if (!p.hidden) { p.hidden = true; e.currentTarget.setAttribute("aria-expanded", "false"); return; }
      p.textContent = "Loading…"; p.hidden = false; e.currentTarget.setAttribute("aria-expanded", "true");
      try { const s = await W.getJSON("summaries/" + slug + ".json"); p.textContent = (s.chapters && s.chapters[String(ch)]) || "A summary for this chapter is coming soon."; }
      catch (err) { p.textContent = "A summary for this chapter is coming soon."; }
    };
    const toggle = (el) => {
      const v = +el.dataset.v;
      if (selected.includes(v)) { selected = selected.filter((x) => x !== v); el.classList.remove("sel"); }
      else { selected.push(v); el.classList.add("sel"); }
      selBar(main, slug, b.name, ch, verses);
    };
    W.$$(".v", main).forEach((el) => {
      el.addEventListener("click", (e) => { if (window.getSelection && String(window.getSelection()).length > 1) return; toggle(el); });
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(el); } });
    });
  }

  function selBar(main, slug, name, ch, verses) {
    let bar = W.$(".selbar");
    if (!selected.length) { if (bar) bar.remove(); return; }
    selected.sort((a, b) => a - b);
    const ref = name + " " + ch + ":" + rangeLabel(selected);
    const text = selected.map((v) => W.plain(verses[v - 1])).join(" ");
    if (!bar) { bar = document.createElement("div"); bar.className = "selbar"; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", "Verse actions"); document.body.appendChild(bar); }
    const mk = selected.length === 1 ? W.S.getMark(slug, ch, selected[0]) : null;
    bar.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:0 4px">
        <b style="flex-grow:1;font:600 14px var(--sans)">${esc(ref)}</b>
        <div class="swatches" role="group" aria-label="Highlight colour">${["gold", "mint", "rose", "sky"].map((c) => `<button class="swatch" data-c="${c}" aria-label="Highlight ${c}" aria-pressed="${mk && mk.color === c}" style="background:${hlColor(c)}"></button>`).join("")}</div>
      </div>
      <div class="acts">
        <button data-a="save">${icon(mk && mk.saved ? "check" : "save")}${mk && mk.saved ? "Saved" : "Save"}</button>
        <button data-a="note">${icon("pen")}Note</button>
        <button data-a="copy">${icon("copy")}Copy</button>
        <button data-a="share">${icon("share")}Share</button>
        <button data-a="clear">${icon("close")}Clear</button>
      </div>`;
    const cleanup = () => { selected = []; W.$$(".v.sel").forEach((e) => e.classList.remove("sel")); bar.remove(); };
    W.$$(".swatch", bar).forEach((s) => s.onclick = () => {
      const c = s.dataset.c;
      selected.forEach((v) => {
        const cur = W.S.getMark(slug, ch, v);
        const next = cur && cur.color === c ? null : c;
        W.S.setHighlight(slug, name, ch, v, W.plain(verses[v - 1]), next);
        const el = W.$("#v" + v);
        el.className = el.className.replace(/\bhl-\w+/g, "").trim();
        if (next) el.classList.add("hl-" + next);
      });
      cleanup();
    });
    bar.onclick = (e) => {
      const a = e.target.closest("[data-a]"); if (!a) return;
      const act = a.dataset.a;
      if (act === "clear") return cleanup();
      if (act === "copy") { W.copyText("“" + text + "” " + ref + " (KJV)"); return cleanup(); }
      if (act === "share") { W.shareOrCopy({ title: ref, text: "“" + text + "” " + ref + " (KJV)" }); return cleanup(); }
      if (act === "save") { selected.forEach((v) => W.S.toggleSaved(slug, name, ch, v, W.plain(verses[v - 1]))); W.toast("Saved to your verses"); return cleanup(); }
      if (act === "note") {
        const v0 = selected[0];
        cleanup();
        noteSheet({ refKey: slug + ":" + ch + ":" + v0, refLabel: ref, quote: text, onSave: () => { const el = W.$("#v" + v0); if (el) el.classList.add("noted"); } });
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
        ${[["nums", "Verse numbers", "Small numbers before each verse"], ["red", "Words of Jesus in red", "Gospels, Acts and Revelation"]].map(([k, l, h]) => `<label class="row-link" style="min-height:54px"><span class="grow"><span class="label" style="font-size:15px">${l}</span><span class="hint">${h}</span></span><span class="switch"><input type="checkbox" data-k="${k}" ${s[k] ? "checked" : ""}><span></span></span></label>`).join("")}
      </div>`;
    const wire = (el) => {
      W.$$("[data-read]", el).forEach((b) => b.onclick = () => { W.setSetting("read", b.dataset.read); refresh(el); });
      W.$$("[data-font]", el).forEach((b) => b.onclick = () => { W.setSetting("font", b.dataset.font); refresh(el); });
      W.$$("[data-k]", el).forEach((c) => c.onchange = () => { W.setSetting(c.dataset.k, c.checked); if (onChange) applyLive(); });
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

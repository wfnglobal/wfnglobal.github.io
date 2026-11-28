// WFN App 2.0: Word puzzles. A crossword built from any chapter, sermon, study or book,
// whose answers fill in a short summary. One engine, many sources.
//   #/puzzles                    hub
//   #/puzzle/bible/<book>/<ch>   a Bible chapter (KJV clues, chapter summary)
//   #/puzzle/sermon/<slug>       a sermon
//   #/puzzle/study/<slug>        a Bible study
//   #/puzzle/book/<slug>         a library book
//   #/puzzle/story/<slug>        a story chapter (hand-crafted)
(function () {
  "use strict";
  const W = window.WFN2;
  if (!W) return;
  const { esc, icon } = W;
  const C = window.WFN_CONTENT || {};
  const S = window.WFN_STORY || { chapters: [] };

  const css = `
  .pz-card{display:flex;align-items:center;gap:14px;text-decoration:none;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px 16px;box-shadow:var(--shadow)}
  .pz-card .pz-ic{width:44px;height:44px;border-radius:12px;background:#0E141B;color:#D9B76E;display:flex;align-items:center;justify-content:center;font:600 20px var(--serif);flex:none}
  .pz-card .t{display:block;font:400 18px/24px var(--serif)}.pz-card .s{display:block;font-size:13px;line-height:19px;color:var(--ink-2)}
  .pz{display:flex;flex-direction:column;gap:14px;padding-bottom:40px}
  .pz-eye{font:600 11px/1 var(--sans);letter-spacing:.22em;text-transform:uppercase;color:var(--amber)}
  .pz h1{margin:0;font:400 30px/36px var(--serif)}.pz .lead{margin:0;font-size:15px;line-height:23px;color:var(--ink-2)}
  .pz-bar{display:flex;align-items:center;gap:12px}.pz-track{flex:1;height:6px;border-radius:3px;background:var(--track,var(--line));overflow:hidden}
  .pz-fill{height:100%;width:0;background:var(--amber);transition:width .4s}.pz-count{font:600 12px var(--sans);letter-spacing:.08em;color:var(--amber);white-space:nowrap}
  .pz-now{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px 14px;min-height:92px}
  .pz-now .tag{display:inline-block;font:700 10px var(--sans);letter-spacing:.16em;text-transform:uppercase;padding:3px 8px;border-radius:99px;margin-right:8px;background:var(--slate-soft);color:var(--slate)}
  .pz-now .tag.scripture{background:var(--amber-soft);color:var(--amber)}
  .pz-now .ref{font-size:12px;color:var(--ink-3)}.pz-now .txt{font:400 17px/25px var(--serif);margin-top:7px}
  .pz-gridbox{display:flex;justify-content:center;overflow:hidden;padding:4px 0}
  .pz-grid{display:grid;gap:2px;touch-action:manipulation}
  .pz-c{width:var(--pcs,32px);height:var(--pcs,32px);position:relative;border-radius:5px;background:var(--card);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font:600 calc(var(--pcs,32px)*.52)/1 var(--sans);color:var(--ink);cursor:pointer;user-select:none}
  .pz-c.x{background:transparent;border:0;cursor:default}
  .pz-c .n{position:absolute;top:1px;left:3px;font-size:calc(var(--pcs,32px)*.28);font-weight:600;color:var(--amber);line-height:1}
  .pz-c.w{background:var(--slate-soft);border-color:var(--slate)}.pz-c.cur{background:var(--amber-soft);border-color:var(--amber);box-shadow:0 0 0 1px var(--amber)}
  .pz-c.bad{color:#C0392B;background:rgba(192,57,43,.14)}.pz-c.done{color:var(--amber)}
  .pz-btns{display:flex;gap:8px;flex-wrap:wrap}
  .pz-cols{display:grid;grid-template-columns:1fr;gap:16px}@media(min-width:640px){.pz-cols{grid-template-columns:1fr 1fr}}
  .pz-cl h3{font:600 11px var(--sans);letter-spacing:.22em;text-transform:uppercase;color:var(--amber);margin:0 0 6px}
  .pz-cl ol{list-style:none;margin:0;padding:0}.pz-cl li{display:flex;gap:10px;padding:9px 10px;border-radius:10px;cursor:pointer;font-size:14.5px;line-height:21px}
  .pz-cl li b{color:var(--amber);min-width:22px}.pz-cl li.on{background:var(--sunk)}.pz-cl li.ok{color:var(--ink-3);text-decoration:line-through}
  .pz-cl li small{display:block;color:var(--ink-3);font-size:11.5px;margin-top:2px}
  .pz-sum{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px 16px}
  .pz-sum p{font:400 17px/32px var(--serif);margin:0 0 12px}.pz-sum p:last-of-type{margin-bottom:0}
  .pz-bl{display:inline-block;min-width:3em;border-bottom:2px solid var(--ink-3);margin:0 2px;padding:0 3px;text-align:center;font:600 .84em var(--sans);letter-spacing:.12em;color:transparent;cursor:pointer;position:relative}
  .pz-bl i{position:absolute;left:0;right:0;top:-1em;font:600 9px var(--sans);letter-spacing:.06em;color:var(--ink-3);font-style:normal}
  .pz-bl.f{color:var(--amber);border-color:var(--amber)}.pz-bl.f i{display:none}
  .pz-fin{display:none;margin-top:14px;padding-top:14px;border-top:1px solid var(--line);flex-direction:column;gap:10px}.pz-fin.on{display:flex}
  .pz-fin q{font:italic 400 20px/28px var(--serif);color:var(--amber);quotes:none}
  .pz-kb{position:fixed;left:-200px;top:0;width:10px;height:10px;opacity:0;font-size:16px}
  .pz-pick{display:flex;gap:8px;flex-wrap:wrap}.pz-pick select{flex:1;min-width:130px;padding:12px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:400 15px var(--sans)}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ------------------------------------------------------------------ generator
  const STOP = new Set(("about above after again against all also always among and any are because been before being between both but came can could did does done down during each even ever every few for from had has have her here him his how into its just like made make many may more most much must near not now off once one only other our out over own said same say she should since some such than that the their them then there these they this those through too under until upon very was were what when where which while who whom whose why will with within without would yet you your unto thou thee thy thine hath shall saith said came come went him himself herself itself themselves therefore whereof wherein whosoever behold already exactly people really actually something someone everything anything nothing everyone another together still today while maybe often never always whole whether either neither because without instead rather quite almost enough perhaps simply truly").split(/\s+/));
  const plainText = (h) => String(h || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function sentences(text) { return String(text).split(/(?<=[.!?;:”"])\s+(?=[A-Z“"‘'(])/).map((s) => s.trim()).filter((s) => s.length >= 28 && s.length <= 230); }

  // sources: [{text, ref, tag}] where each text is one clue-able sentence (or verse)
  // summary: array of paragraphs the answers must also appear in
  function pickWords(sources, summary, max) {
    const sum = summary.join(" ");
    const cand = new Map();
    const re = /[A-Za-z][A-Za-z’']*/g; let m;
    while ((m = re.exec(sum))) {
      let w = m[0].replace(/[’']s$/i, "");
      if (!/^[A-Za-z]+$/.test(w)) continue;
      const lw = w.toLowerCase();
      if (lw.length < 4 || lw.length > 11 || STOP.has(lw) || /ly$/.test(lw)) continue;
      const proper = /^[A-Z]/.test(w) && m.index > 0 && !/[.!?]\s*$/.test(sum.slice(Math.max(0, m.index - 3), m.index));
      const c = cand.get(lw) || { w: lw, n: 0, proper: false };
      c.n++; c.proper = c.proper || proper; cand.set(lw, c);
    }
    const usedSrc = new Set(); const out = [];
    const list = [...cand.values()].map((c) => ({ ...c, score: (c.proper ? 3 : 0) + Math.min(c.n, 3) * 0.7 + (c.w.length >= 6 ? 1 : 0) + Math.random() * 0 })).sort((a, b) => b.score - a.score || a.w.localeCompare(b.w));
    for (const c of list) {
      const wre = new RegExp("\\b" + c.w + "\\b", "i");
      let best = -1, bl = 1e9;
      sources.forEach((s, i) => { if (usedSrc.has(i)) return; if (wre.test(s.text)) { const l = Math.abs(s.text.length - 110); if (l < bl) { bl = l; best = i; } } });
      if (best < 0) continue;
      usedSrc.add(best);
      const s = sources[best];
      out.push({ a: c.w.toUpperCase(), clue: s.text.replace(new RegExp("\\b" + c.w + "\\b", "gi"), "______"), tag: s.tag || "story", ref: s.ref || "" });
      if (out.length >= max) break;
    }
    return out;
  }

  function layout(words, seed) {
    let best = null;
    for (let t = 0; t < 400; t++) {
      const rnd = rng(seed + t * 7919);
      const ws = words.slice().sort((a, b) => b.a.length - a.a.length || rnd() - 0.5);
      const grid = new Map(), placed = [];
      const key = (r, c) => r + "," + c;
      const can = (w, r, c, dr, dc) => {
        let inter = 0;
        for (let i = 0; i < w.length; i++) {
          const rr = r + dr * i, cc = c + dc * i, g = grid.get(key(rr, cc));
          if (g !== undefined) { if (g !== w[i]) return 0; inter++; }
          else if (grid.has(key(rr + dc, cc + dr)) || grid.has(key(rr - dc, cc - dr))) return 0;
        }
        if (grid.has(key(r - dr, c - dc)) || grid.has(key(r + dr * w.length, c + dc * w.length))) return 0;
        return inter;
      };
      const put = (e, r, c, dr, dc) => { for (let i = 0; i < e.a.length; i++) grid.set(key(r + dr * i, c + dc * i), e.a[i]); placed.push({ ...e, r, c, dir: dc ? "A" : "D" }); };
      put(ws[0], 0, 0, 0, 1);
      let rest = ws.slice(1);
      for (let pass = 0; pass < 3; pass++) {
        const left = [];
        for (const e of rest) {
          let b = null;
          for (const [dr, dc] of [[1, 0], [0, 1]]) for (const [k, ch] of [...grid.entries()]) {
            const [pr, pc] = k.split(",").map(Number);
            for (let i = 0; i < e.a.length; i++) if (e.a[i] === ch) { const r = pr - dr * i, c = pc - dc * i, s = can(e.a, r, c, dr, dc); if (s >= 1 && (!b || s > b.s || (s === b.s && rnd() < 0.3))) b = { s, r, c, dr, dc }; }
          }
          if (b) put(e, b.r, b.c, b.dr, b.dc); else left.push(e);
        }
        rest = left;
      }
      const rs = [...grid.keys()].map((k) => +k.split(",")[0]), cs = [...grid.keys()].map((k) => +k.split(",")[1]);
      const h = Math.max(...rs) - Math.min(...rs) + 1, w = Math.max(...cs) - Math.min(...cs) + 1;
      const score = placed.length * 1000 - Math.max(h, w) * 10 - h * w;
      if (!best || score > best.score) best = { score, placed, grid, h, w };
    }
    const r0 = Math.min(...[...best.grid.keys()].map((k) => +k.split(",")[0])), c0 = Math.min(...[...best.grid.keys()].map((k) => +k.split(",")[1]));
    const ents = best.placed.map((e) => ({ a: e.a, clue: e.clue, tag: e.tag, ref: e.ref, r: e.r - r0, c: e.c - c0, dir: e.dir }));
    return { rows: best.h, cols: best.w, ents };
  }

  function numberEnts(P) {
    const starts = [...new Set(P.ents.map((e) => e.r * 100 + e.c))].sort((a, b) => a - b);
    P.ents.forEach((e) => { e.n = starts.indexOf(e.r * 100 + e.c) + 1; });
    return P;
  }

  function build(meta) {
    // meta: {id, title, eyebrow, sources, summary, back, read} or a premade puzzle
    let P;
    if (meta.premade) P = JSON.parse(JSON.stringify(meta.premade));
    else {
      const words = pickWords(meta.sources, meta.summary, 12);
      if (words.length < 5) return null;
      P = layout(words, hash(meta.id));
    }
    P.summary = meta.summary;
    return numberEnts(P);
  }

  // ------------------------------------------------------------------ player
  function play(main, meta, P) {
    const E = P.ents.map((e, i) => ({ ...e, i, cells: [...e.a].map((_, k) => [e.r + (e.dir === "D" ? k : 0), e.c + (e.dir === "A" ? k : 0)]) }));
    const cells = {};
    E.forEach((e) => e.cells.forEach(([r, c], k) => { const key = r + "," + c; (cells[key] = cells[key] || { r, c, a: e.a[k], ents: [], v: "" }).ents.push(e.i); }));
    const SK = "wfn2-pz-" + meta.id;
    try { const s = JSON.parse(localStorage.getItem(SK) || "{}"); for (const k in s) if (cells[k]) cells[k].v = s[k]; } catch (e) {}
    let cur = null, dir = "A"; const bad = new Set();
    main.innerHTML = W.topbar("Word puzzle", { back: meta.back || "#/puzzles" }) + `<div class="page pz">
      <span class="pz-eye">${esc(meta.eyebrow || "Word puzzle")}</span><h1>${esc(meta.title)}</h1>
      <p class="lead">Tap a square and type. Tap it again to switch between across and down. Every answer drops into the summary below.</p>
      <div class="pz-bar"><div class="pz-track"><div class="pz-fill" id="pzf"></div></div><div class="pz-count" id="pzn"></div></div>
      <div class="pz-now" id="pznow"></div>
      <div class="pz-gridbox"><div class="pz-grid" id="pzg"></div></div>
      <div class="pz-btns"><button class="btn sm" id="pzc">Check</button><button class="btn sm soft" id="pzh">Reveal letter</button><button class="btn sm soft" id="pzr">Reveal word</button><button class="btn sm ghost" id="pzx">Start over</button></div>
      <div class="pz-cols"><div class="pz-cl"><h3>Across</h3><ol id="pza"></ol></div><div class="pz-cl"><h3>Down</h3><ol id="pzd"></ol></div></div>
      <h2 class="h2" style="padding:0 4px;margin-top:6px">The summary, in your words</h2>
      <div class="pz-sum"><div id="pzs"></div><div class="pz-fin" id="pzfin">${meta.finale ? `<q>${esc(meta.finale)}</q>` : `<q>Well done. Now you know it.</q>`}${meta.read ? `<a class="btn" href="${esc(meta.read.href)}">${esc(meta.read.label)}</a>` : ""}</div></div>
      <input class="pz-kb" id="pzk" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Type your answer">
    </div>`;
    const $ = (id) => main.querySelector("#" + id);
    const g = $("pzg");
    const cs = () => { const w = Math.min(innerWidth - 40, 720); return Math.max(20, Math.min(44, Math.floor((w - (P.cols - 1) * 2) / P.cols))); };
    g.style.setProperty("--pcs", cs() + "px"); g.style.gridTemplateColumns = `repeat(${P.cols},var(--pcs))`;
    const num = {}; E.forEach((e) => { const k = e.r + "," + e.c; if (!num[k]) num[k] = e.n; });
    for (let r = 0; r < P.rows; r++) for (let c = 0; c < P.cols; c++) {
      const x = cells[r + "," + c], d = document.createElement("div");
      d.className = "pz-c" + (x ? "" : " x"); d.id = "pz" + r + "_" + c;
      if (x) { d.innerHTML = (num[r + "," + c] ? `<span class="n">${num[r + "," + c]}</span>` : "") + `<span class="l"></span>`; d.onclick = () => pick(x); }
      g.appendChild(d);
    }
    const solved = (e) => e.cells.every(([r, c], k) => cells[r + "," + c].v === e.a[k]);
    const actEnt = () => cur ? E[cur.ents.find((i) => E[i].dir === dir) ?? cur.ents[0]] : null;
    const kb = $("pzk");
    function focusKb() { try { kb.focus({ preventScroll: true }); } catch (e) {} }
    function pick(x) { if (cur === x && x.ents.length > 1) dir = dir === "A" ? "D" : "A"; else if (!x.ents.some((i) => E[i].dir === dir)) dir = E[x.ents[0]].dir; cur = x; render(); focusKb(); }
    function jump(e) { cur = cells[e.cells[0].join(",")]; dir = e.dir; render(); focusKb(); g.scrollIntoView({ behavior: "smooth", block: "center" }); }
    function render() {
      const act = actEnt();
      for (const k in cells) {
        const x = cells[k], d = main.querySelector("#pz" + x.r + "_" + x.c);
        d.querySelector(".l").textContent = x.v;
        d.className = "pz-c" + (act && act.cells.some(([r, c]) => r === x.r && c === x.c) ? " w" : "") + (cur === x ? " cur" : "") + (bad.has(k) ? " bad" : "") + (x.ents.some((i) => solved(E[i])) && !bad.has(k) ? " done" : "");
      }
      let n = 0;
      E.forEach((e) => { const ok = solved(e); if (ok) n++; const li = main.querySelector("#pzli" + e.i); li.className = (act && act.i === e.i ? "on " : "") + (ok ? "ok" : ""); });
      $("pzf").style.width = (n / E.length * 100) + "%"; $("pzn").textContent = n + " / " + E.length;
      $("pznow").innerHTML = act ? `<span class="tag ${act.tag}">${act.tag === "scripture" ? "Scripture" : "Story"}</span><span class="ref">${esc(act.ref)}${act.ref ? " · " : ""}${act.n} ${act.dir === "A" ? "across" : "down"} · ${act.a.length} letters</span><div class="txt">${esc(act.clue)}</div>` : `<div class="txt" style="color:var(--ink-3)">Tap any square to begin. The clue shows here.</div>`;
      main.querySelectorAll(".pz-bl").forEach((b) => { const e = E[b.dataset.i], ok = solved(e); b.classList.toggle("f", ok); b.innerHTML = ok ? esc(e.a) : `<i>${e.n}${e.dir === "A" ? "A" : "D"}</i>${"&nbsp;".repeat(Math.max(3, Math.round(e.a.length * 1.1)))}`; });
      $("pzfin").classList.toggle("on", n === E.length);
      try { const o = {}; for (const k in cells) if (cells[k].v) o[k] = cells[k].v; localStorage.setItem(SK, JSON.stringify(o)); } catch (e) {}
    }
    [["A", "pza"], ["D", "pzd"]].forEach(([d, id]) => E.filter((e) => e.dir === d).sort((a, b) => a.n - b.n).forEach((e) => {
      const li = document.createElement("li"); li.id = "pzli" + e.i;
      li.innerHTML = `<b>${e.n}</b><span>${esc(e.clue)}<small>${e.tag === "scripture" ? "Scripture" : "Story"}${e.ref ? " · " + esc(e.ref) : ""}</small></span>`;
      li.onclick = () => jump(e); $(id).appendChild(li);
    }));
    $("pzs").innerHTML = (P.summary || []).map((p) => "<p>" + p.replace(/\{([A-Z]+)\}/g, (m, w) => { const e = E.find((x) => x.a === w); return e ? `<span class="pz-bl" data-i="${e.i}"></span>` : w.toLowerCase(); }) + "</p>").join("");
    main.querySelectorAll(".pz-bl").forEach((b) => b.onclick = () => jump(E[b.dataset.i]));
    const move = (step) => { const e = actEnt(); if (!e) return; const k = e.cells.findIndex(([r, c]) => r === cur.r && c === cur.c) + step; if (k >= 0 && k < e.cells.length) cur = cells[e.cells[k].join(",")]; };
    kb.addEventListener("input", () => { const v = kb.value.toUpperCase().replace(/[^A-Z]/g, ""); kb.value = ""; if (v && cur) { bad.delete(cur.r + "," + cur.c); cur.v = v.slice(-1); move(1); render(); } });
    kb.addEventListener("keydown", (ev) => {
      const k = ev.key;
      if (k === "Backspace") { ev.preventDefault(); if (!cur) return; bad.delete(cur.r + "," + cur.c); if (cur.v) cur.v = ""; else { move(-1); cur.v = ""; } render(); }
      else if (k.startsWith("Arrow")) { ev.preventDefault(); if (!cur) return; const dd = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[k]; let r = cur.r + dd[0], c = cur.c + dd[1]; while (r >= 0 && c >= 0 && r < P.rows && c < P.cols) { if (cells[r + "," + c]) { cur = cells[r + "," + c]; break; } r += dd[0]; c += dd[1]; } render(); }
      else if (k === "Tab" || k === "Enter") { ev.preventDefault(); const o = E.slice().sort((a, b) => a.dir.localeCompare(b.dir) || a.n - b.n); const j = (o.indexOf(actEnt()) + (ev.shiftKey ? -1 : 1) + o.length) % o.length; dir = o[j].dir; cur = cells[o[j].cells[0].join(",")]; render(); }
    });
    $("pzc").onclick = () => { bad.clear(); for (const k in cells) { const x = cells[k]; if (x.v && x.v !== x.a) bad.add(k); } render(); if (!bad.size) W.toast("So far so good."); };
    $("pzh").onclick = () => { if (!cur) return W.toast("Tap a square first."); cur.v = cur.a; bad.delete(cur.r + "," + cur.c); move(1); render(); };
    $("pzr").onclick = () => { const e = actEnt(); if (!e) return W.toast("Tap a square first."); e.cells.forEach(([r, c], k) => { cells[r + "," + c].v = e.a[k]; bad.delete(r + "," + c); }); render(); };
    $("pzx").onclick = () => { for (const k in cells) cells[k].v = ""; bad.clear(); cur = null; render(); };
    render();
  }

  // ------------------------------------------------------------------ sources
  async function fetchArticle(slug) {
    try { const r = await fetch(W.BASE + "articles/" + slug + ".html", { cache: "no-cache" }); if (!r.ok) return null; return new DOMParser().parseFromString(await r.text(), "text/html"); } catch (e) { return null; }
  }
  function proseToMeta(id, title, eyebrow, paras, ref, back, read, tag) {
    const clean = paras.map((p) => p.replace(/\s+/g, " ").trim()).filter((p) => p.length > 40);
    const sources = []; clean.forEach((p) => sentences(p).forEach((s) => sources.push({ text: s, ref, tag: tag || "story" })));
    // summary: the opening paragraphs, trimmed to about 700 characters
    const summary = []; let len = 0; for (const p of clean) { if (len > 650) break; summary.push(p.length > 520 ? p.slice(0, p.lastIndexOf(". ", 520) + 1 || 520) : p); len += p.length; }
    return { id, title, eyebrow, sources, summary: markBlanks(summary, sources), back, read, finale: "Now you know it. Go and do it." };
  }
  // turn the chosen answer words in the summary into {WORD} blanks, once each
  function markBlanks(summary, sources) { return summary; }

  async function loadMeta(kind, a, b) {
    if (kind === "story") {
      const c = (S.chapters || []).find((x) => x.slug === a);
      if (!c || !c.puzzle) return null;
      return { id: "story-" + a, title: "The Cave: Word Puzzle", eyebrow: "Nothing New Under the Sun · Chapter " + c.number, premade: c.puzzle, summary: c.puzzle.summary, back: "#/story/" + a, read: { href: "#/story/" + a, label: "Read Chapter " + c.number + ": " + c.title }, finale: c.puzzle.finale || "Whose hand gets to do it?" };
    }
    if (kind === "bible") {
      const [idx, data] = await Promise.all([W.bookIndex(), W.book(a)]);
      const bk = idx.find((x) => x.slug === a); const ch = parseInt(b, 10);
      if (!bk || !data.chapters[ch - 1]) return null;
      let sum = ""; try { sum = window.WFNBible ? await window.WFNBible.getChapterSummary(a, ch) : ""; } catch (e) {}
      const sources = data.chapters[ch - 1].map((v, i) => ({ text: plainText(v), ref: bk.name + " " + ch + ":" + (i + 1), tag: "scripture" })).filter((s) => s.text.length > 28);
      if (!sum) return null;
      return { id: "bible-" + a + "-" + ch, title: bk.name + " " + ch, eyebrow: "Bible puzzle · KJV", sources, summary: [sum], back: "#/bible/" + a + "/" + ch, read: { href: "#/bible/" + a + "/" + ch, label: "Read " + bk.name + " " + ch }, finale: "That is the chapter in your own words." };
    }
    if (kind === "sermon") {
      let s = (C.SERMONS || []).find((x) => x.slug === a); if (!s) { try { const t = await W.today(); if (t.sermon && t.sermon.slug === a) s = t.sermon; } catch (e) {} } if (!s) return null;
      const doc = await fetchArticle(a);
      const body = doc && doc.querySelector(".article-body");
      const paras = body ? Array.from(body.querySelectorAll("p")).map((p) => p.textContent) : [s.excerpt];
      return proseToMeta("sermon-" + a, s.title, "Sermon puzzle", [s.excerpt].concat(paras), s.ref, "#/sermon/" + a, { href: "#/sermon/" + a, label: "Back to the sermon" });
    }
    if (kind === "study") {
      let s = (C.BIBLE_STUDY || []).find((x) => x.slug === a); if (!s) { try { const t = await W.today(); if (t.study && t.study.slug === a) s = t.study; } catch (e) {} } if (!s) return null;
      const m = proseToMeta("study-" + a, s.title, "Bible study puzzle", [s.excerpt].concat(s.body || []), (s.verses && s.verses[0] ? s.verses[0].ref : ""), "#/study/" + a, { href: "#/study/" + a, label: "Back to the study" });
      (s.verses || []).forEach((v) => sentences(v.text).concat([v.text]).forEach((t) => m.sources.push({ text: t, ref: v.ref + " · KJV", tag: "scripture" })));
      return m;
    }
    if (kind === "book") {
      const b2 = (C.LIBRARY_BOOKS || []).find((x) => x.slug === a); if (!b2) return null;
      let paras = [b2.desc];
      try { const r = await fetch(W.BASE + "library/" + a + ".html"); if (r.ok) { const d = new DOMParser().parseFromString(await r.text(), "text/html"); const ps = Array.from(d.querySelectorAll("main p, article p, .chapter p")).map((p) => p.textContent).filter((t) => t.length > 60).slice(0, 40); if (ps.length) paras = [b2.desc].concat(ps); } } catch (e) {}
      return proseToMeta("book-" + a, b2.title, "Library puzzle", paras, b2.title, "#/book/" + a, { href: "#/book/" + a, label: "Back to the book" });
    }
    return null;
  }

  // after sources are known, wrap answer words in the summary as {WORD}
  function wrapSummary(P, meta) {
    const sum = meta.summary.map((p) => p);
    P.ents.forEach((e) => {
      const re = new RegExp("\\b" + e.a + "\\b", "gi");
      for (let i = 0; i < sum.length; i++) sum[i] = sum[i].replace(re, "{" + e.a + "}");
    });
    P.summary = sum;
  }

  W.view("puzzle", async function (main, parts) {
    main.innerHTML = W.topbar("Word puzzle", { back: "#/puzzles" }) + `<div class="page"><p class="small muted" style="padding:20px 4px">Building your puzzle…</p></div>`;
    const meta = await loadMeta(parts[0], parts[1], parts[2]);
    if (!meta) { main.innerHTML = W.topbar("Word puzzle", { back: "#/puzzles" }) + `<div class="page"><p class="serif" style="padding:20px 4px">This one is not ready yet. Try another chapter or message.</p></div>`; return; }
    const P = build(meta);
    if (!P) { main.innerHTML = W.topbar("Word puzzle", { back: meta.back }) + `<div class="page"><p class="serif" style="padding:20px 4px">There are not enough key words in this passage to make a good puzzle. Try the next chapter.</p></div>`; return; }
    if (!meta.premade) wrapSummary(P, meta);
    play(main, meta, P);
  });

  // ------------------------------------------------------------------ hub
  W.view("puzzles", async function (main) {
    const t = await W.today().catch(() => ({}));
    const idx = await W.bookIndex().catch(() => []);
    const ch1 = (S.chapters || []).find((c) => c.puzzle);
    const row = (href, title, sub, ic) => `<a class="pz-card" href="${href}"><span class="pz-ic">${ic || "?"}</span><span><span class="t">${esc(title)}</span><span class="s">${esc(sub)}</span></span></a>`;
    const books = (C.LIBRARY_BOOKS || []).slice(0, 6);
    main.innerHTML = W.topbar("Puzzles", { back: "#/" }) + `<div class="page pz">
      <span class="pz-eye">Learn it by playing it</span><h1>Word puzzles</h1>
      <p class="lead">Every puzzle is built from the passage itself. Solve the clues, and the answers fill in a short summary, so you leave knowing what it said.</p>
      ${ch1 ? row("#/puzzle/story/" + ch1.slug, "The Cave: Chapter One", "Maya, Graham, and David in the cave", "★") : ""}
      ${t.sermon ? row("#/puzzle/sermon/" + t.sermon.slug, "Today’s sermon", t.sermon.title, "S") : ""}
      ${t.study ? row("#/puzzle/study/" + t.study.slug, "Today’s Bible study", t.study.title, "B") : ""}
      <h2 class="h2" style="padding:0 4px;margin-top:8px">Any Bible chapter</h2>
      <div class="pz-pick"><select id="pzbk" aria-label="Book">${idx.map((b) => `<option value="${esc(b.slug)}" data-n="${b.chapters}">${esc(b.name)}</option>`).join("")}</select><select id="pzch" aria-label="Chapter"></select><button class="btn" id="pzgo">Play</button></div>
      ${books.length ? `<h2 class="h2" style="padding:0 4px;margin-top:8px">From the library</h2>${books.map((b) => row("#/puzzle/book/" + b.slug, b.title, "A puzzle on the book", "L")).join("")}` : ""}
    </div>`;
    const bk = main.querySelector("#pzbk"), ch = main.querySelector("#pzch");
    const fill = () => { const n = +bk.selectedOptions[0].dataset.n || 1; ch.innerHTML = Array.from({ length: n }, (_, i) => `<option>${i + 1}</option>`).join(""); };
    if (bk) { const l = W.read("wfn2-last-read", null); if (l && idx.find((b) => b.slug === l.slug)) bk.value = l.slug; fill(); if (l && l.slug === bk.value) ch.value = String(l.ch); bk.onchange = fill; main.querySelector("#pzgo").onclick = () => W.go("#/puzzle/bible/" + bk.value + "/" + ch.value); }
  });

  // entry card used by the other views
  W.puzzleCard = function (href, title, sub) {
    return `<a class="pz-card" href="${esc(href)}"><span class="pz-ic">?</span><span><span class="t">${esc(title || "Test what you read")}</span><span class="s">${esc(sub || "A five-minute word puzzle. Your answers write the summary.")}</span></span></a>`;
  };
})();

// WFN App 2.0 — Today
(function () {
  "use strict";
  const W = window.WFN2;
  const { esc, icon, C } = W;

  function dayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function doneToday() { const all = W.read("wfn2-done", {}); return all[dayKey()] || {}; }
  function markDone(k, v) {
    const all = W.read("wfn2-done", {});
    const t = all[dayKey()] || {};
    if (v === false) delete t[k]; else t[k] = true;
    all[dayKey()] = t;
    // keep the last 60 days only
    Object.keys(all).sort().slice(0, -60).forEach((x) => delete all[x]);
    W.write("wfn2-done", all);
  }
  // One-time fix: earlier builds ticked steps just for opening a page. Start today clean.
  try { if (!localStorage.getItem("wfn2-done-v2")) { const all = W.read("wfn2-done", {}); delete all[dayKey()]; W.write("wfn2-done", all); localStorage.setItem("wfn2-done-v2", "1"); } } catch (e) {}
  // What you've actually opened today. A step can be ticked only once it has
  // been opened (Verse of the Day ticks itself); Night prayer opens at 6pm.
  function seenToday() { const all = W.read("wfn2-seen", {}); return all[dayKey()] || {}; }
  function markSeen(k) {
    const all = W.read("wfn2-seen", {});
    Object.keys(all).filter((d) => d !== dayKey()).forEach((d) => delete all[d]);
    const s = all[dayKey()] || {}; if (s[k]) return; s[k] = true; all[dayKey()] = s; W.write("wfn2-seen", all);
  }
  const NIGHT_HOUR = 18;
  function canTick(k) {
    if (k === "verse" || doneToday()[k]) return true;
    if (k === "night" && new Date().getHours() < NIGHT_HOUR) return false;
    return !!seenToday()[k];
  }
  W.markDone = markDone; W.doneToday = doneToday; W.dayKey = dayKey; W.markSeen = markSeen;

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }

  function shareHidden() { try { return localStorage.getItem("wfn-app-share-dismissed") === "1"; } catch (e) { return false; } }

  W.view("", async function (main) {
    const t = await W.today();
    const p = W.profile();
    const name = p.name ? ", " + esc(p.name.split(" ")[0]) : "";
    const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    const evening = new Date().getHours() >= 18;
    // Your day in the Word starts itself: Verse of the Day is ticked the first
    // time Today opens each day. Everything after it is ticked by hand.
    const autoKey = "wfn2-verse-auto-" + dayKey();
    if (!W.read(autoKey, false)) { markDone("verse"); W.write(autoKey, true);
      try { Object.keys(localStorage).filter((k) => k.indexOf("wfn2-verse-auto-") === 0 && k !== autoKey).forEach((k) => localStorage.removeItem(k)); } catch (e) {} }
    const done = doneToday();
    const steps = [
      ["verse", "Verse of the Day", "#/"],
      ["declaration", "Today’s declaration", "#/prayer/declaration"],
      ["study", "Bible study", "#/study/" + t.study.slug],
      ["sermon", "Sermon", "#/sermon/" + t.sermon.slug],
      ["night", "Night prayer", "#/prayer/night"],
    ];
    const nDone = steps.filter((s) => done[s[0]]).length;
    function tail(k, d) {
      if (d[k]) return '<span class="small muted" style="padding-right:6px">Done</span>';
      if (k === "night" && new Date().getHours() < NIGHT_HOUR) return '<span class="small muted" style="padding-right:4px">From 6pm</span>';
      return `<span class="chev">${icon("chev", "xs")}</span>`;
    }
    const plan = (C.READING_PLANS || [])[0];
    const prog = plan ? W.S.getPlanProgress(plan.slug) : null;
    const nextDay = plan ? Math.min(plan.days.length, (prog && prog.completedDays ? prog.completedDays.length : 0) + 1) : 0;
    const lastRead = W.read("wfn2-last-read", null);
    const declPreview = (t.declaration.lines || []).filter(Boolean).slice(0, 2);

    main.innerHTML = `
    <header class="page-head">
      <div class="row">
        ${W.emblem(30, document.documentElement.dataset.theme === "dark" ? "#EFEBE4" : "#1F1D1B")}
        <span style="flex-grow:1"></span>
        <a class="icon-btn" href="#/search" aria-label="Search">${icon("search")}</a>
      </div>
      <p class="eyebrow" style="margin-top:10px">${esc(date)}</p>
      <h1>${greeting()}${name}</h1>
    </header>

    <div class="page">
      <section class="hero" id="votd" aria-labelledby="votdH">
        <div style="display:flex;align-items:center;gap:8px;margin:-6px -10px -6px 0"><h2 id="votdH" class="eyebrow" style="flex-grow:1">Verse of the Day</h2>
          <button class="icon-btn on-hero" id="vMore" aria-label="More: meaning, listen, share, translate" aria-expanded="false" aria-controls="votdMore">${icon("summary")}</button></div>
        <p class="verse" data-tr>${esc(t.verse.text)}</p>
        <span class="ref">${esc(t.verse.ref)} · KJV${done.verse ? ` <span class="amen-dot" title="Amen’d">${icon("check", "xs")}</span>` : ""}</span>
        <div class="reveal" id="votdMore" hidden>
          ${t.verse.summary ? `<p class="summary" data-tr>${esc(t.verse.summary)}</p>` : ""}
          <div class="mini-actions" role="toolbar" aria-label="Verse actions">
            <button class="glass-ic" id="vListen" aria-label="Listen" aria-pressed="false">${icon("listen", "sm")}</button>
            <button class="glass-ic" id="vShare" aria-label="Share">${icon("share", "sm")}</button>
            <button class="glass-ic" type="button" data-translate="#votd" aria-label="Translate">${icon("globe", "sm")}<span data-tlab class="sr">Translate</span></button>
            <span style="flex-grow:1"></span>
            <button class="amen-pill ${done.verse ? "on" : ""}" id="vAmen" aria-pressed="${!!done.verse}">${icon("check", "xs")}<span>${done.verse ? "Amen’d" : "Amen"}</span></button>
          </div>
        </div>
      </section>

      <section class="card pad" id="decl" aria-labelledby="declH" style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center"><h2 id="declH" class="eyebrow spruce" style="flex-grow:1">Today’s Declaration</h2><span class="small muted">${esc(t.declaration.ref || "")}</span></div>
        <div class="serif decl-text" style="font-size:18px;line-height:29px;display:flex;flex-direction:column;gap:10px">${declPreview.map((l) => `<p data-tr>${esc(l)}</p>`).join("")}</div>
        <div class="reveal" id="declMore" hidden>
          <div class="serif" style="font-size:18px;line-height:29px;display:flex;flex-direction:column;gap:10px">${(t.declaration.lines || []).filter(Boolean).slice(2).map((l) => `<p data-tr>${esc(l)}</p>`).join("")}</div>
          <div class="mini-actions light" role="toolbar" aria-label="Declaration actions">
            <button class="glass-ic" id="dListen" aria-label="Listen" aria-pressed="false">${icon("listen", "sm")}</button>
            <button class="glass-ic" type="button" data-translate="#decl" aria-label="Translate">${icon("globe", "sm")}<span data-tlab class="sr">Translate</span></button>
            <button class="glass-ic" id="dShare" aria-label="Share">${icon("share", "sm")}</button>
            <a class="glass-ic" href="#/prayer/declaration" aria-label="Open full screen">${icon("expand", "sm")}</a>
            <span style="flex-grow:1"></span>
            <button class="amen-pill ${done.declaration ? "on" : ""}" id="dAmen" aria-pressed="${!!done.declaration}">${icon("check", "xs")}<span>${done.declaration ? "Declared" : "Amen"}</span></button>
          </div>
        </div>
        <button class="glass-btn" id="declBtn" aria-expanded="false" aria-controls="declMore"><span class="glass-sheen" aria-hidden="true"></span>${icon("flame", "sm")}<span id="declLab">Declare it all</span></button>
      </section>

      <section class="card pad" aria-labelledby="dayH" style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;align-items:baseline"><h2 id="dayH" class="h2" style="flex-grow:1">Your day in the Word</h2><span class="small muted" id="dayCount" style="font-variant-numeric:tabular-nums">${nDone} of ${steps.length}</span></div>
        <div style="display:flex;gap:4px" aria-hidden="true">${steps.map((s) => `<span data-bar="${s[0]}" style="flex:1;height:5px;border-radius:9px;transition:background .25s;background:${done[s[0]] ? "var(--spruce)" : "var(--sunk)"}"></span>`).join("")}</div>
        <div class="list day-list" style="margin:0 -18px">
          ${steps.map((s) => `<div class="row-link" style="min-height:52px;padding:0 10px 0 6px;gap:4px">
            <button class="day-tick" type="button" data-tick="${s[0]}" role="checkbox" aria-checked="${!!done[s[0]]}" aria-label="${s[1]}: mark ${done[s[0]] ? "not done" : "done"}"><span class="radio-dot ${done[s[0]] ? "on" : canTick(s[0]) ? "" : "locked"}" aria-hidden="true"></span></button>
            <a class="grow day-go" href="${s[2]}" data-go="${s[0]}" style="flex-direction:row;align-items:center;min-height:52px;text-decoration:none;color:var(--ink)"><span class="label" style="flex-grow:1;${done[s[0]] ? "color:var(--ink-3)" : ""}">${s[1]}</span><span class="day-tail">${tail(s[0], done)}</span></a>
          </div>`).join("")}
        </div>
      </section>

      <a class="feature" href="#/study/${esc(t.study.slug)}">
        ${t.study.poster ? `<img class="poster" src="${esc(W.asset(t.study.poster))}" alt="${esc(t.study.posterAlt || "")}" loading="lazy">` : ""}
        <span class="meta"><span class="eyebrow amber">Today’s Bible study · ${esc((t.study.verses || []).map((v) => v.ref).slice(0, 2).join(" · ") || t.study.ref || "")}</span>
        <h3>${esc(t.study.title)}</h3><p>${esc(t.study.excerpt)}</p></span>
      </a>

      <a class="feature" href="#/sermon/${esc(t.sermon.slug)}">
        <img class="poster" src="${esc(W.sermonPoster(t.sermon.slug))}" alt="" loading="lazy" onerror="this.remove()">
        <span class="meta"><span class="eyebrow slate">Today’s sermon · ${esc(t.sermon.ref || "")}</span>
        <h3>${esc(t.sermon.title)}</h3><p>${esc(t.sermon.excerpt)}</p></span>
      </a>

      ${lastRead ? `<a class="card pad-s" href="#/bible/${esc(lastRead.slug)}/${lastRead.ch}" style="display:flex;align-items:center;gap:14px;text-decoration:none;color:var(--ink)">
        <span class="tile-ic c-amber">${icon("bible")}</span>
        <span style="flex-grow:1;display:flex;flex-direction:column;gap:2px"><span class="small muted">Continue reading</span><span class="serif" style="font-size:18px">${esc(lastRead.name)} ${lastRead.ch}</span></span>${icon("chev", "sm")}</a>` : ""}

      ${plan ? `<a class="card pad" href="#/plan/${esc(plan.slug)}/${nextDay}" style="display:flex;flex-direction:column;gap:10px;text-decoration:none;color:var(--ink)">
        <span class="eyebrow spruce">Reading plan · Day ${nextDay} of ${plan.days.length}</span>
        <span class="h2">${esc(plan.title)}</span>
        <span class="small ink2">${esc(plan.days[nextDay - 1].title)} · ${esc(plan.days[nextDay - 1].ref)}</span>
        <span style="height:5px;border-radius:9px;background:var(--sunk);overflow:hidden"><span style="display:block;height:5px;width:${Math.round(((nextDay - 1) / plan.days.length) * 100)}%;background:var(--spruce)"></span></span>
      </a>` : ""}

      <section class="section" aria-labelledby="nightH">
        <a class="card pad" href="${evening ? "#/prayer/night" : "#/dreams/fire"}" style="display:flex;flex-direction:column;gap:10px;text-decoration:none;color:var(--ink)">
          <span style="display:flex;align-items:center;gap:8px"><span class="tile-ic c-slate">${icon(evening ? "moon" : "flame")}</span><span id="nightH" class="eyebrow slate" style="flex-grow:1">${evening ? "Before you close your eyes" : "Tonight’s fire prayer"}</span></span>
          <span class="serif" style="font-size:21px;line-height:28px">${esc(evening ? "Night prayer" : t.dreamFire.title)}</span>
          <span class="small ink2">${esc(evening ? (t.night.text || "").slice(0, 120) + "…" : "Twelve prayer points to cover you before you sleep. New at midnight.")}</span>
        </a>
      </section>

      <section class="section" aria-labelledby="exH">
        <h2 id="exH" class="h2" style="padding:0 4px">Explore</h2>
        <a class="way-hero" href="#/way" style="background-image:url('${W.BASE}app/img/museum/05-galilee.jpg')">
          <span class="way-hero-k">New · Open-world game</span>
          <span class="way-hero-t">THE WAY</span>
          <span class="way-hero-s">Walk Galilee. Sail the lake. Five deeds from the Gospels.</span>
          <span class="way-hero-b">${icon("play", "sm")}Play</span>
        </a>
        <div class="explore">
          <a class="card" href="${lastRead ? `#/bible/${esc(lastRead.slug)}/${lastRead.ch}` : "#/bible/genesis/1"}"><span class="tile-ic lg c-amber">${icon("bible")}</span><span><span class="t">Read the Bible</span><br><span class="s">${lastRead ? "Back to " + esc(lastRead.name) + " " + lastRead.ch : "Start with Genesis, or any book"}</span></span></a>
          <a class="card" href="#/studies"><span class="tile-ic lg c-spruce">${icon("summary")}</span><span><span class="t">Bible Study</span><br><span class="s">A new study every morning</span></span></a>
          <a class="card" href="#/sermons"><span class="tile-ic lg c-slate">${icon("sermons")}</span><span><span class="t">Sermons</span><br><span class="s">Today’s and every past sermon</span></span></a>
          <a class="card" href="${plan ? "#/plan/" + esc(plan.slug) : "#/library"}"><span class="tile-ic lg c-amber">${icon("check")}</span><span><span class="t">Reading Plans</span><br><span class="s">A few minutes a day</span></span></a>
          <a class="card" href="#/library"><span class="tile-ic lg c-slate">${icon("library")}</span><span><span class="t">The Library</span><br><span class="s">Full books, free to read</span></span></a>
          <a class="card" href="#/jesus"><span class="tile-ic lg c-amber">${icon("gate")}</span><span><span class="t">The Story of Jesus</span><br><span class="s">Walk it like a museum, 12 galleries</span></span></a>
          <a class="card" href="#/climb"><span class="tile-ic lg c-spruce">${icon("mount")}</span><span><span class="t">The Word Climb</span><br><span class="s">100-question Bible quiz</span></span></a>
          <a class="card" href="#/dreams"><span class="tile-ic lg c-slate">${icon("moon")}</span><span><span class="t">Dreams</span><br><span class="s">Discernment and fire prayer</span></span></a>
          <a class="card" href="#/invite"><span class="tile-ic lg c-ink">${icon("qr")}</span><span><span class="t">Invite a friend</span><br><span class="s">Share WFN with your QR code</span></span></a>
        </div>
      </section>

      <a class="card pad" href="#/prayer" style="display:flex;gap:14px;align-items:center;text-decoration:none;color:var(--ink)">
        <span class="tile-ic lg c-spruce">${icon("prayer")}</span>
        <span style="display:flex;flex-direction:column;gap:3px;flex-grow:1"><span style="font:600 16px var(--sans)">Pray with us</span><span class="small ink2">The WhatsApp prayer group and the weekly Prayer Circle on X</span></span>
        <span class="chev muted">${icon("chev", "sm")}</span>
      </a>

      ${!shareHidden() ? `<section class="card pad" id="shareCard" style="display:flex;flex-direction:column;gap:12px">
        <span class="eyebrow amber">Share the Word</span>
        <h2 class="h2">Share Word &amp; Faith Network</h2>
        <p class="small ink2" style="font-size:14.5px;line-height:22px">Know someone who needs a word today? Send them the app. Daily verses, sermons and prayer, free.</p>
        <div style="display:flex;gap:8px"><button class="btn" id="shareApp">${icon("share", "sm")}Share the app</button><button class="btn ghost" id="shareNo">Not now</button></div>
      </section>` : ""}
    </div>`;

    const toggle = (btn, panel, on) => { panel.hidden = !on; btn.setAttribute("aria-expanded", String(on)); };
    const vMore = W.$("#vMore"), vPanel = W.$("#votdMore");
    vMore.onclick = () => toggle(vMore, vPanel, vPanel.hidden);
    W.$("#vListen").onclick = (e) => W.speak([W.$("#votd .verse").textContent, t.verse.ref.replace(":", ", verse ")], e.currentTarget);
    W.$("#vShare").onclick = () => W.shareOrCopy({ title: "Verse of the Day", text: "“" + t.verse.text + "” " + t.verse.ref, url: "https://wfnglobal.org/app/" });
    const amen = (btn, key, onTxt, offTxt, msg) => {
      const on = !doneToday()[key];
      markDone(key, on);
      btn.classList.toggle("on", on); btn.setAttribute("aria-pressed", String(on));
      btn.querySelector("span").textContent = on ? onTxt : offTxt;
      if (on) W.toast(msg);
      refreshDay();
    };
    W.$("#vAmen").onclick = (e) => amen(e.currentTarget, "verse", "Amen’d", "Amen", "Amen. Verse kept for today.");
    W.$("#dAmen").onclick = (e) => amen(e.currentTarget, "declaration", "Declared", "Amen", "Amen. Declared.");
    const dBtn = W.$("#declBtn"), dPanel = W.$("#declMore");
    dBtn.onclick = () => { const on = dPanel.hidden; if (on) { markSeen("declaration"); refreshDay(); } toggle(dBtn, dPanel, on); W.$("#declLab").textContent = on ? "Show less" : "Declare it all"; };
    W.$("#dListen").onclick = (e) => W.speak((t.declaration.lines || []).filter(Boolean), e.currentTarget);
    W.$("#dShare").onclick = () => W.shareOrCopy({ title: "Today’s declaration", text: (t.declaration.lines || []).filter(Boolean).slice(0, 3).join("\n\n") + "\n\n" + (t.declaration.ref || ""), url: "https://wfnglobal.org/app/" });
    // Your day in the Word: nothing is ticked for you; tick any step, in any order.
    const tail2 = (k, d) => tail(k, d);
    function refreshDay() {
      const d = doneToday();
      const n = steps.filter((s) => d[s[0]]).length;
      const c = W.$("#dayCount"); if (c) c.textContent = n + " of " + steps.length;
      W.$$("[data-bar]", main).forEach((b) => { b.style.background = d[b.dataset.bar] ? "var(--spruce)" : "var(--sunk)"; });
      W.$$("[data-tick]", main).forEach((b) => {
        const k = b.dataset.tick, on = !!d[k];
        b.setAttribute("aria-checked", String(on));
        b.querySelector(".radio-dot").classList.toggle("on", on);
        b.querySelector(".radio-dot").classList.toggle("locked", !on && !canTick(k));
        const row = b.parentElement, lab = row.querySelector(".label"), tail = row.querySelector(".day-tail");
        lab.style.color = on ? "var(--ink-3)" : "";
        tail.innerHTML = tail2(k, d);
      });
    }
    W.$$("[data-tick]", main).forEach((b) => b.onclick = () => { const k = b.dataset.tick;
      if (!canTick(k)) {
        if (k === "night") return W.toast("Night prayer opens at 6pm. Come back tonight.");
        const names = { declaration: "the declaration", study: "the Bible study", sermon: "the sermon" };
        W.toast("Open " + (names[k] || "it") + " first, then tick it.");
        if (k === "declaration") { if (dPanel.hidden) dBtn.click(); W.$("#decl").scrollIntoView({ behavior: "smooth", block: "start" }); }
        else { const a = b.parentElement.querySelector(".day-go"); if (a) setTimeout(() => (location.hash = a.getAttribute("href")), 700); }
        return;
      }
      markDone(k, !doneToday()[k]); refreshDay();
      const map = { verse: ["#vAmen", "Amen’d"], declaration: ["#dAmen", "Declared"] }; const m = map[k];
      if (m) { const on = !!doneToday()[k], a = W.$(m[0]); a.classList.toggle("on", on); a.setAttribute("aria-pressed", String(on)); a.querySelector("span").textContent = on ? m[1] : "Amen"; } });
    W.$$('[data-go="verse"]', main).forEach((a) => a.onclick = (e) => { e.preventDefault(); const v = W.$("#votd"); v.scrollIntoView({ behavior: "smooth", block: "center" }); toggle(vMore, vPanel, true); v.classList.add("pulse-once"); setTimeout(() => v.classList.remove("pulse-once"), 1400); });
    const sc = W.$("#shareCard");
    if (sc) {
      const hide = () => { try { localStorage.setItem("wfn-app-share-dismissed", "1"); } catch (e) {} sc.remove(); };
      W.$("#shareNo").onclick = hide;
      W.$("#shareApp").onclick = () => W.shareOrCopy({ title: "Word & Faith Network", text: "Daily Bible verses, sermons and prayer, right from your phone. Join me on Word & Faith Network.", url: "https://wfnglobal.org/app/" });
    }
  });
})();

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
  W.markDone = markDone; W.doneToday = doneToday; W.dayKey = dayKey;

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
    const done = doneToday();
    const steps = [
      ["verse", "Verse of the Day", "#votd"],
      ["declaration", "Today’s declaration", "#decl"],
      ["study", "Bible study", "#/study/" + t.study.slug],
      ["sermon", "Sermon", "#/sermon/" + t.sermon.slug],
      ["night", "Night prayer", "#/prayer/night"],
    ];
    const nDone = steps.filter((s) => done[s[0]]).length;
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
        <a class="chip amber" href="#/give" aria-label="Give to WFN">${icon("hand", "sm")}Give</a>
        <a class="icon-btn" href="#/search" aria-label="Search">${icon("search")}</a>
        <a href="#/you" aria-label="You" style="display:flex">${W.avatar("sm")}</a>
      </div>
      <p class="eyebrow" style="margin-top:10px">${esc(date)}</p>
      <h1>${greeting()}${name}</h1>
    </header>

    <div class="page">
      <section class="hero" id="votd" aria-labelledby="votdH">
        <div style="display:flex;align-items:center;gap:8px"><h2 id="votdH" class="eyebrow" style="flex-grow:1">Verse of the Day</h2></div>
        <p class="verse" data-tr>${esc(t.verse.text)}</p>
        <span class="ref">${esc(t.verse.ref)} · KJV</span>
        ${t.verse.summary ? `<p class="summary" id="votdSum" hidden data-tr>${esc(t.verse.summary)}</p>` : ""}
        <div class="actions">
          <button class="icon-btn on-hero" id="vListen" aria-label="Listen" aria-pressed="false">${icon("listen")}</button>
          <button class="icon-btn on-hero" id="vShare" aria-label="Share">${icon("share")}</button>
          ${t.verse.summary ? `<button class="icon-btn on-hero" id="vSum" aria-label="What this verse means" aria-expanded="false">${icon("summary")}</button>` : ""}
          ${W.translateBtn("#votd", "hero-chip")}
          <span style="flex-grow:1"></span>
          <button class="btn sm light" id="vAmen">${done.verse ? icon("check", "sm") + "Amen" : "Amen"}</button>
        </div>
      </section>

      <section class="card pad" id="decl" aria-labelledby="declH" style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center"><h2 id="declH" class="eyebrow spruce" style="flex-grow:1">Today’s Declaration</h2><span class="small muted">${esc(t.declaration.ref || "")}</span></div>
        <div class="serif" style="font-size:18px;line-height:29px;display:flex;flex-direction:column;gap:10px">${declPreview.map((l) => `<p data-tr>${esc(l)}</p>`).join("")}</div>
        <div style="display:flex;gap:8px;padding-top:4px;flex-wrap:wrap">
          <a class="btn sm" href="#/prayer/declaration">Declare it all</a>
          <button class="btn sm ghost" id="dListen" aria-pressed="false" aria-label="Listen">${icon("listen", "sm")}<span data-ltxt>Listen</span></button>
          ${W.translateBtn("#decl")}
        </div>
      </section>

      <section class="card pad" aria-labelledby="dayH" style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;align-items:baseline"><h2 id="dayH" class="h2" style="flex-grow:1">Your day in the Word</h2><span class="small muted" style="font-variant-numeric:tabular-nums">${nDone} of ${steps.length}</span></div>
        <div style="display:flex;gap:4px" aria-hidden="true">${steps.map((s, i) => `<span style="flex:1;height:5px;border-radius:9px;background:${i < nDone ? "var(--spruce)" : "var(--sunk)"}"></span>`).join("")}</div>
        <div class="list" style="margin:0 -18px">
          ${steps.map((s) => `<a class="row-link" href="${s[2]}" style="min-height:50px">
            <span class="radio-dot ${done[s[0]] ? "on" : ""}" aria-hidden="true"></span>
            <span class="grow"><span class="label" style="${done[s[0]] ? "color:var(--ink-3)" : ""}">${s[1]}</span></span>
            ${done[s[0]] ? '<span class="small muted">Done</span>' : `<span class="chev">${icon("chev", "xs")}</span>`}</a>`).join("")}
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

    const vText = t.verse.text + " " + t.verse.ref;
    W.$("#vListen").onclick = (e) => markDone("verse") || W.speak([W.$("#votd .verse").textContent, t.verse.ref.replace(":", ", verse ")], e.currentTarget);
    W.$("#dListen").onclick = (e) => W.speak((t.declaration.lines || []).filter(Boolean), e.currentTarget);
    W.$("#vShare").onclick = () => markDone("verse") || W.shareOrCopy({ title: "Verse of the Day", text: "“" + t.verse.text + "” " + t.verse.ref, url: "https://wfnglobal.org/app/" });
    const sumBtn = W.$("#vSum");
    if (sumBtn) sumBtn.onclick = () => { const s = W.$("#votdSum"); s.hidden = !s.hidden; sumBtn.setAttribute("aria-expanded", String(!s.hidden)); };
    W.$("#vAmen").onclick = (e) => { markDone("verse"); e.currentTarget.innerHTML = icon("check", "sm") + "Amen"; W.toast("Amen. Verse kept for today."); };
    void vText;
    const sc = W.$("#shareCard");
    if (sc) {
      const hide = () => { try { localStorage.setItem("wfn-app-share-dismissed", "1"); } catch (e) {} sc.remove(); };
      W.$("#shareNo").onclick = hide;
      W.$("#shareApp").onclick = () => W.shareOrCopy({ title: "Word & Faith Network", text: "Daily Bible verses, sermons and prayer, right from your phone. Join me on Word & Faith Network.", url: "https://wfnglobal.org/app/" });
    }
  });
})();

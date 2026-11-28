// WFN App 2.0: "Nothing New Under the Sun" serialized story.
// #/stories        series home + archive of every chapter
// #/story/<slug>   one chapter: swipeable story cards, the chapter, Scripture, the parallel
(function () {
  "use strict";
  const W = window.WFN2;
  const { esc, icon } = W;
  const D = window.WFN_STORY || { series: {}, volumes: [], chapters: [] };

  const css = `
  .nn-hero{background:#0E141B;color:#F4EEE2;border-radius:22px;padding:26px 22px;display:flex;flex-direction:column;gap:12px;position:relative;overflow:hidden}
  .nn-hero:after{content:"";position:absolute;left:-10%;right:-10%;bottom:-104px;height:120px;border-top:1px solid rgba(201,169,104,.35);border-radius:50%}
  .nn-eye{font:600 11px/1 var(--sans,Inter,sans-serif);letter-spacing:.22em;text-transform:uppercase;color:#D9B76E}
  .nn-hero h1{margin:0;font:400 30px/36px var(--serif);color:#F7F1E6}
  .nn-hero p{margin:0;font-size:15px;line-height:23px;color:rgba(244,238,226,.78)}
  .nn-hero cite{font-style:normal;font-size:12px;letter-spacing:.08em;color:rgba(244,238,226,.55)}
  .nn-cards{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding:0 24px;margin:0 -24px;padding:0 24px 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .nn-cards::-webkit-scrollbar{display:none}
  .nn-cards img{flex:none;width:80vw;max-width:380px;height:auto;scroll-snap-align:start;aspect-ratio:4/5;object-fit:cover;border-radius:16px;background:#111;box-shadow:0 22px 40px -24px rgba(0,0,0,.6)}
  .nn-dots{display:flex;justify-content:center;gap:6px}
  .nn-dots span{width:6px;height:6px;border-radius:9px;background:var(--sunk);transition:all .2s}
  .nn-dots span.on{width:18px;background:var(--ink)}
  .nn-time{font:600 13px/1 var(--sans,Inter,sans-serif);letter-spacing:.14em;color:#B3412F}
  .nn-next{border-radius:16px;padding:16px 18px;background:#0E141B;color:#F4EEE2;display:flex;flex-direction:column;gap:6px}
  .nn-next span{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#D9B76E}
  .nn-film{position:relative;border-radius:18px;overflow:hidden;background:#0B0F14;box-shadow:0 22px 40px -24px rgba(0,0,0,.6)}
  .nn-film video{display:block;width:100%;height:auto;max-height:78vh;background:#0B0F14}
  .nn-tabs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;background:var(--sunk);padding:4px;border-radius:14px}
  .nn-tabs button{border:0;background:transparent;font:600 14px/1 var(--sans,Inter,sans-serif);padding:11px 6px;border-radius:11px;color:var(--ink-2);cursor:pointer}
  .nn-tabs button[aria-selected="true"]{background:var(--card,#fff);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.12)}
  .nn-book{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -24px;padding:0 24px 6px;scroll-padding:0 24px;scrollbar-width:none}
  .nn-book::-webkit-scrollbar{display:none}
  .nn-book img{flex:none;width:88vw;max-width:720px;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:12px;scroll-snap-align:start;background:#0B0F14;box-shadow:0 16px 30px -20px rgba(0,0,0,.6)}
  .nn-hint{font-size:13px;color:var(--ink-3);text-align:center}
  .nn-q{font:italic 400 20px/30px var(--serif);border-left:3px solid #D9B76E;padding-left:16px;margin:0}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const vol = (slug) => D.volumes.find((v) => v.slug === slug) || {};
  const latest = () => D.chapters[0];

  // Home-screen feature card, used by today.js
  W.storyFeature = function () {
    const c = latest(); if (!c) return "";
    const v = vol(c.volume);
    return `<a class="feature" href="#/story/${esc(c.slug)}">
      ${c.cards && c.cards[0] ? `<img class="poster" src="${esc(W.asset(c.cards[0].src))}" alt="${esc(c.cards[0].alt)}" loading="lazy">` : ""}
      <span class="meta"><span class="eyebrow slate">Nothing New Under the Sun · ${esc(v.title || "")} · Chapter ${c.number}</span>
      <h3>${esc(c.title)}</h3><p>${esc(c.excerpt)}</p></span></a>`;
  };

  W.view("stories", function (main) {
    const s = D.series;
    main.innerHTML = W.topbar("Stories") + `<div class="page">
      <section class="nn-hero"><span class="nn-eye">A WFN story series</span>
        <h1>${esc(s.title)}</h1><p>${esc(s.blurb)}</p>
        <p class="serif" style="font-style:italic">“${esc(s.verse)}”</p><cite>${esc(s.ref)} · KJV</cite></section>
      ${s.trailer ? `<section style="display:flex;flex-direction:column;gap:10px"><span class="eyebrow amber" style="padding:0 4px">The trailer · 60 seconds</span>
        <div class="nn-film"><video controls playsinline preload="none" poster="${esc(W.asset(s.trailerPoster))}"><source src="${esc(W.asset(s.trailer))}" type="video/mp4"></video></div></section>` : ""}
      ${latest() ? `<a class="btn lg block" href="#/story/${esc(latest().slug)}">${icon("play", "sm")}Start Chapter ${latest().number}: ${esc(latest().title)}</a>` : ""}
      ${D.volumes.map((v) => `
      <section style="display:flex;flex-direction:column;gap:12px">
        <div style="padding:0 4px;display:flex;flex-direction:column;gap:4px"><span class="eyebrow amber">${esc(v.number)} · mirrors ${esc(v.mirror)}</span>
          <h2 class="h2" style="margin:0">${esc(v.title)}</h2><p class="small ink2">${esc(v.lead)}</p></div>
        <div class="card list">${D.chapters.filter((c) => c.volume === v.slug).slice().sort((a, b) => a.number - b.number).map((c) => `
          <a class="thumb-row" href="#/story/${esc(c.slug)}">${c.cards && c.cards[0] ? `<img src="${esc(W.asset(c.cards[0].src))}" alt="" loading="lazy">` : ""}
          <span class="grow"><span class="title">Chapter ${c.number}: ${esc(c.title)}</span><span class="sub">${esc(c.mirror)} · ${esc(c.date)}</span></span></a>`).join("")}</div>
      </section>`).join("")}
    </div>`;
  });

  W.view("story", function (main, parts) {
    const c = D.chapters.find((x) => x.slug === parts[0]) || latest();
    if (!c) return W.go("#/");
    const v = vol(c.volume);
    const time = /^\d{1,2}:\d{2}\.$/;
    main.innerHTML = W.topbar(v.title || "Story", { back: "#/stories", right: `<button class="icon-btn" id="sl" aria-label="Listen" aria-pressed="false">${icon("listen")}</button><button class="icon-btn" id="sa" aria-label="Reading settings">${icon("aa")}</button>` }) + `
    <article class="page" id="nnch" style="padding:20px 24px 40px;gap:22px">
      <div class="nn-tabs" role="tablist" aria-label="How to enjoy this chapter">
        <button role="tab" data-m="cards" aria-selected="true">Cards</button>
        ${c.film ? `<button role="tab" data-m="film" aria-selected="false">${icon("play","xs")} Film</button>` : ""}
        ${c.book ? `<button role="tab" data-m="book" aria-selected="false">Book</button>` : ""}
      </div>
      <div data-pane="film" hidden>${c.film ? `<div class="nn-film"><video controls playsinline preload="none" poster="${esc(W.asset(c.film.poster))}"><source src="${esc(W.asset(c.film.vertical))}" type="video/mp4"></video></div><p class="nn-hint">The chapter as a film, with an original piano score · ${c.film.minutes} min</p>` : ""}</div>
      <div data-pane="book" hidden>${c.book ? `<div class="nn-book">${c.book.map((b, i) => `<img src="${esc(W.asset(b))}" alt="Page ${i + 1}" loading="lazy">`).join("")}</div><p class="nn-hint">Swipe to turn the pages · ${c.book.length} pages</p>` : ""}</div>
      <div data-pane="cards">
      ${c.cards && c.cards.length ? `<div class="nn-cards" id="nnc">${c.cards.map((k) => `<img src="${esc(W.asset(k.src))}" alt="${esc(k.alt)}" loading="lazy">`).join("")}</div>
      <div class="nn-dots" id="nnd" aria-hidden="true">${c.cards.map((_, i) => `<span class="${i ? "" : "on"}"></span>`).join("")}</div>` : ""}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <span class="eyebrow slate">Nothing New Under the Sun · ${esc(v.number || "")} · Chapter ${c.number}</span>
        <h1 data-tr style="margin:0;font:400 34px/40px var(--serif);letter-spacing:-0.01em">${esc(c.title)}</h1>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="small muted" style="flex-grow:1">${esc(v.title || "")} · mirrors ${esc(c.mirror)} · ${Math.max(4, Math.round(c.story.join(" ").split(/\s+/).length / 220))} min read</span>${W.translateBtn ? W.translateBtn("#nnch") : ""}</div>
      </div>
      <div class="prose">${c.story.map((p) => time.test(p) ? `<p class="nn-time" data-tr>${esc(p)}</p>` : `<p data-tr>${esc(p)}</p>`).join("")}</div>
      <div style="display:flex;flex-direction:column;gap:14px"><span class="eyebrow amber">It has happened before</span>
        ${c.scripture.map((s) => `<blockquote class="scripture-box"><p data-tr>${esc(s.text)}</p><cite>${esc(s.ref)} · KJV</cite></blockquote>`).join("")}</div>
      <div class="prose">${c.parallel.map((p) => `<p data-tr>${esc(p)}</p>`).join("")}</div>
      <p class="nn-q" data-tr>${esc(c.question)}</p>
      ${c.puzzle && W.puzzleCard ? W.puzzleCard("#/puzzle/story/" + c.slug, "Test what you read", "A word puzzle from the chapter and 1 Samuel 24. Your answers write the summary.") : ""}
      ${c.next ? `<div class="nn-next"><span>Next</span><p class="serif" data-tr style="margin:0;font-size:17px;line-height:26px">${esc(c.next)}</p></div>` : ""}
      <div class="band" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <button class="btn" id="amen">Amen</button>
        <button class="btn ghost" id="note">${icon("pen", "sm")}Note</button>
        <button class="btn ghost" id="shr">${icon("share", "sm")}Share</button>
      </div>
      <a class="btn block soft" href="#/stories">Every chapter</a>
    </article>`;
    W.$$("#nnch .nn-tabs button").forEach((bt) => bt.onclick = () => {
      W.$$("#nnch .nn-tabs button").forEach((x) => x.setAttribute("aria-selected", String(x === bt)));
      W.$$("#nnch [data-pane]").forEach((p) => { p.hidden = p.dataset.pane !== bt.dataset.m; });
      W.$$("#nnch video").forEach((v) => { if (bt.dataset.m !== "film") v.pause(); });
    });
    const strip = W.$("#nnc"), dots = W.$$("#nnd span");
    if (strip) strip.addEventListener("scroll", () => {
      const i = Math.round(strip.scrollLeft / (strip.firstElementChild.offsetWidth + 10));
      dots.forEach((d, j) => d.classList.toggle("on", j === i));
    }, { passive: true });
    W.$("#sa").onclick = () => W.readingSheet();
    W.$("#sl").onclick = (e) => W.speak(W.$$("#nnch [data-tr]").map((x) => x.textContent), e.currentTarget);
    W.$("#amen").onclick = () => W.toast("Amen.");
    W.$("#note").onclick = () => W.noteSheet({ type: "story", refKey: "story:" + c.slug, refLabel: c.title });
    W.$("#shr").onclick = () => W.shareOrCopy({ title: c.title + ": Nothing New Under the Sun", text: c.excerpt, url: "https://wfnglobal.org/story/" + c.slug + ".html" });
  });
})();

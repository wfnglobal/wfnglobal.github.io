// WFN App 2.0 — Prayer, Dreams, Library, sermons, studies, plans, books.
(function () {
  "use strict";
  const W = window.WFN2;
  const { esc, icon, C } = W;

  function stanzas(lines) {
    const out = [[]];
    (lines || []).forEach((l) => { if (!l) { if (out[out.length - 1].length) out.push([]); } else out[out.length - 1].push(l); });
    return out.filter((s) => s.length);
  }
  function since(ts) {
    const d = Math.max(0, Math.round((Date.now() - ts) / 86400000));
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " + (d === 0 ? "today" : d === 1 ? "1 day" : d + " days");
  }

  // ---------- Prayer ----------
  W.view("prayer", async function (main, parts) {
    const t = await W.today();
    if (parts[0] === "declaration") return declaration(main, t);
    if (parts[0] === "night") return night(main, t);
    if (parts[0] === "request") return request(main);
    if (draft && draft.step === 3) draft = null;
    const mine = W.S.getPrayers();
    const meta = W.read("wfn2-prayer-meta", {});
    const ds = stanzas(t.declaration.lines);
    main.innerHTML = `
    <header class="page-head"><div class="row"><h1 style="flex-grow:1">Prayer</h1><button class="icon-btn" id="addP" aria-label="Add a prayer request">${icon("plus")}</button></div></header>
    <div class="page">
      ${W.intro("prayer", { eyebrow: "You are in the secret place", title: "Shut the door, even on a screen", tone: "spruce", body: ["The door is shut. He sees you here. Prayer on a phone is still prayer: the same Father, the same open ear, the same promise.", "Silence what you can, slow down, and speak to Him as you would in your own room."], verse: "But thou, when thou prayest, enter into thy closet, and when thou hast shut thy door, pray to thy Father which is in secret.", ref: "Matthew 6:6" })}
      <a class="hero" href="#/prayer/declaration" style="text-decoration:none;gap:12px">
        <span class="eyebrow">Today’s declaration · ${esc(t.declaration.ref || "")}</span>
        <span class="serif" style="font-size:21px;line-height:32px">${esc((ds[0] || [])[0] || "")}</span>
        <span style="display:flex;gap:8px;padding-top:4px"><span class="btn sm light">Declare it out loud</span></span>
      </a>
      <a class="card pad" href="#/prayer/request" style="display:flex;align-items:center;gap:14px;text-decoration:none;color:var(--ink)">
        <span class="tile-ic lg c-spruce">${icon("hand")}</span>
        <span style="display:flex;flex-direction:column;gap:3px;flex-grow:1"><span style="font:600 16px var(--sans)">Send a prayer request</span><span class="small ink2">Keep it private, or let the WFN prayer team stand with you</span></span>
        <span class="chev muted">${icon("chev", "sm")}</span>
      </a>
      <section class="section" aria-labelledby="ppH">
        <div class="section-head"><h2 id="ppH" class="h2">Pray through today</h2>${W.translateBtn("#pp")}</div>
        <ol class="card points" id="pp">${(C.PRAYER_POINTS || []).map((p, i) => `<li><span class="n">${i + 1}</span><p data-tr>${esc(p)}</p></li>`).join("")}</ol>
      </section>
      <section class="section" aria-labelledby="myH">
        <div class="section-head"><h2 id="myH" class="h2">My prayer list</h2><span class="small muted">Private, on this phone</span></div>
        <div class="card list" id="myList">
          ${mine.length ? mine.map((m) => `<div class="row-link" style="cursor:default">
            <span class="grow"><span class="label" style="${m.answered ? "color:var(--ink-2)" : ""}">${esc(m.text)}</span><span class="hint">${meta[m.id] ? esc(meta[m.id].topic) + (meta[m.id].team ? " · shared with the prayer team" : "") + " · " : ""}${m.answered ? "Answered " + new Date(m.answeredAt || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Praying since " + since(m.createdAt)}</span></span>
            <button class="chip ${m.answered ? "amber" : "spruce"}" data-ans="${m.id}" aria-label="${m.answered ? "Mark as still praying" : "Mark as answered"}">${m.answered ? "Answered" : "Praying"}</button>
            <button class="icon-btn" data-del="${m.id}" aria-label="Delete">${icon("trash", "sm")}</button></div>`).join("")
          : `<button class="row-link" id="addP2" style="border:0"><span class="tile-ic c-spruce">${icon("plus")}</span><span class="grow"><span class="label">Add something you’re praying for</span><span class="hint">Track it until the answer comes, then write the testimony</span></span></button>`}
        </div>
      </section>
      <section class="section" aria-labelledby="circH">
        <h2 id="circH" class="h2" style="padding:0 4px">Pray with us</h2>
        <div class="card pad" style="display:flex;flex-direction:column;gap:10px">
          <span style="font:600 16px var(--sans)">Prayer &amp; Bible Study on WhatsApp</span>
          <p class="small ink2" style="font-size:14px;line-height:21px">A daily group for prayer requests, Bible study and encouragement with the WFN family.</p>
          <a class="btn" href="https://chat.whatsapp.com/J0JkLpylQiVKTHKcJkaKEs" target="_blank" rel="noopener">Join on WhatsApp</a>
        </div>
        <div class="card pad" style="display:flex;flex-direction:column;gap:10px">
          <span style="font:600 16px var(--sans)">The Prayer Circle</span>
          <p class="small ink2" style="font-size:14px;line-height:21px">A live, corporate prayer call, built on Scripture and led in declaration. Tuesdays, 1:00–2:00 AM ET (Toronto) / 6:00–7:00 AM WAT (Lagos), on X Spaces.</p>
          <a class="btn ghost" href="https://x.com/wfnglobal" target="_blank" rel="noopener">Join the Circle on X</a>
        </div>
      </section>
      <section class="section">
        <a class="card pad" href="#/prayer/night" style="display:flex;gap:14px;text-decoration:none;color:var(--ink)"><span class="tile-ic c-slate">${icon("moon")}</span><span style="display:flex;flex-direction:column;gap:3px"><span class="label" style="font:600 15.5px var(--sans)">Night prayer</span><span class="small ink2">Close the day in His hands</span></span></a>
        <a class="card pad" href="#/dreams" style="display:flex;gap:14px;text-decoration:none;color:var(--ink)"><span class="tile-ic c-amber">${icon("flame")}</span><span style="display:flex;flex-direction:column;gap:3px"><span class="label" style="font:600 15.5px var(--sans)">Dreams &amp; Discernment</span><span class="small ink2">Tonight: ${esc(t.dreamFire.title)}</span></span></a>
      </section>
    </div>`;
    const add = () => W.go("#/prayer/request");
    W.$("#addP").onclick = add;
    const a2 = W.$("#addP2"); if (a2) a2.onclick = add;
    W.$$("[data-ans]", main).forEach((b) => b.onclick = () => { W.S.togglePrayerAnswered(b.dataset.ans); W.route(); });
    W.$$("[data-del]", main).forEach((b) => b.onclick = () => { W.ask("Delete this prayer?", "Delete", () => { W.S.deletePrayer(b.dataset.del); W.route(); }); });
  });


  // ---------- Prayer request: three short steps ----------
  const TOPICS = ["Healing", "Family", "Finances", "Guidance", "Work & business", "Salvation of a loved one", "Protection", "Peace of mind", "Thanksgiving", "Something else"];
  const TEAM_EMAIL = "wordandfaithnetwork@gmail.com";
  const WA_GROUP = "https://chat.whatsapp.com/J0JkLpylQiVKTHKcJkaKEs";
  const IG_DM = "https://ig.me/m/wordfaithnetwork";
  function reqText(d) { return "Prayer request (" + d.topic + "):\n\n" + d.text.trim() + (d.name ? "\n\n— " + d.name : ""); }
  let draft = null;
  function request(main) {
    if (!draft) draft = { step: 1, topic: "", text: "", name: (W.profile().name || "").split(" ")[0], who: "me" };
    const d = draft;
    const bars = [1, 2, 3].map((n) => `<span style="flex:1;height:4px;border-radius:9px;background:${n <= d.step ? "var(--spruce)" : "var(--sunk)"}"></span>`).join("");
    let body = "";
    if (d.step === 1) {
      body = `<span class="label" style="font:600 16px var(--sans)">What would you like prayer for?</span>
        <div class="chips" role="radiogroup" aria-label="Topic">${TOPICS.map((x) => `<button class="chip ${d.topic === x ? "on" : ""}" role="radio" aria-checked="${d.topic === x}" data-topic="${esc(x)}" style="height:40px;padding:0 15px;font-size:14px">${esc(x)}</button>`).join("")}</div>
        <div style="display:flex;justify-content:flex-end;padding-top:6px"><button class="btn lg" id="next" ${d.topic ? "" : "disabled style=\"opacity:.45\""}>Continue</button></div>`;
    } else if (d.step === 2) {
      body = `<label for="rq" style="font:600 15px var(--sans)">Your request <span class="muted" style="font-weight:500">· ${esc(d.topic)}</span></label>
        <textarea class="field" id="rq" placeholder="Write as much or as little as you like." style="min-height:150px;background:var(--card);box-shadow:inset 0 0 0 1px var(--line)">${esc(d.text)}</textarea>
        <label for="fn" style="font:600 15px var(--sans)">First name <span class="muted" style="font-weight:500">(optional)</span></label>
        <input class="field" id="fn" value="${esc(d.name)}" autocomplete="given-name" style="background:var(--card);box-shadow:inset 0 0 0 1px var(--line)">
        <span style="font:600 15px var(--sans);padding-top:4px">Who should see this?</span>
        <div role="radiogroup" aria-label="Who should see this" style="display:flex;flex-direction:column;gap:10px">
          ${[["me", "Just me", "Keep it in my private prayer list on this phone."], ["team", "The WFN prayer team", "Save it, then send it to the Word and Faith Network prayer team so they can stand with you in prayer."]].map(([k, a, b]) => `<button role="radio" aria-checked="${d.who === k}" data-who="${k}" style="display:flex;gap:14px;align-items:flex-start;padding:16px;border-radius:18px;text-align:left;background:var(--card);border:${d.who === k ? "2px solid var(--spruce)" : "1px solid var(--line)"};margin:${d.who === k ? "0" : "1px"}">
            <span class="radio-dot ${d.who === k ? "on" : ""}" aria-hidden="true" style="margin-top:2px"></span><span style="display:flex;flex-direction:column;gap:4px"><span style="font:600 16px var(--sans)">${a}</span><span class="ink2" style="font-size:14px;line-height:21px">${b}</span></span></button>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;gap:10px;padding-top:6px"><button class="btn lg ghost" id="bk">Back</button><button class="btn lg" id="save">Save request</button></div>`;
    } else {
      const team = d.who === "team";
      body = `<span class="tile-ic lg c-spruce" style="width:52px;height:52px;border-radius:18px">${icon("check")}</span>
        <h2 style="margin:0;font:400 26px/32px var(--serif)">${team ? "Saved. Now send it to the prayer team." : "Saved to your prayer list."}</h2>
        <p class="ink2" style="font-size:15px;line-height:23px">${team ? "Your request is in your list on this phone. Send it to the WFN prayer team and they will pray with you. Nothing is shared until you send it." : "It stays private on this phone. Mark it answered when God comes through, and write the testimony."}</p>
        <blockquote class="band" style="margin:0;display:flex;flex-direction:column;gap:6px"><span class="eyebrow">${esc(d.topic)}</span><p class="serif" style="font-size:17px;line-height:27px;white-space:pre-wrap">${esc(d.text)}</p></blockquote>
        ${team ? `<div style="display:flex;flex-direction:column;gap:10px">
            <a class="btn lg block" id="mail" href="mailto:${TEAM_EMAIL}?subject=${encodeURIComponent("Prayer request: " + d.topic)}&body=${encodeURIComponent(reqText(d) + "\n\nSent from the WFN app")}">${icon("note", "sm")}Send by email</a>
            <button class="btn lg block ghost" id="wa" data-href="${WA_GROUP}">${icon("share", "sm")}Post in the WhatsApp group</button>
            <button class="btn lg block ghost" id="ig" data-href="${IG_DM}">${icon("send", "sm")}Message us on Instagram</button>
          </div>
          <p class="small muted">Email opens with your request ready to send to ${TEAM_EMAIL}. For WhatsApp and Instagram, your request is copied first, so you just paste it. Everyone in the WhatsApp group will see what you post there.</p>` : ""}
        <a class="btn lg block ${team ? "soft" : ""}" href="#/prayer" id="done">Back to Prayer</a>`;
    }
    main.innerHTML = W.topbar("Prayer request", { back: "#/prayer" }) + `<div class="page" style="gap:18px">
      ${d.step < 3 ? `<div style="display:flex;flex-direction:column;gap:8px;padding:0 4px"><span class="eyebrow">Prayer request</span><h1 style="margin:0;font:400 32px/38px var(--serif)">What can we pray for?</h1><p class="ink2" style="font-size:15px;line-height:23px">Three short steps. Your request is saved to your prayer list first, so you choose whether and when to share it.</p></div>` : ""}
      <section class="card pad" style="display:flex;flex-direction:column;gap:16px"><div style="display:flex;gap:8px" aria-label="Step ${d.step} of 3">${bars}</div>${body}</section></div>`;
    if (d.step === 1) {
      W.$$("[data-topic]", main).forEach((b) => b.onclick = () => { d.topic = b.dataset.topic; request(main); });
      W.$("#next").onclick = () => { if (d.topic) { d.step = 2; request(main); } };
    } else if (d.step === 2) {
      const keep = () => { d.text = W.$("#rq").value; d.name = W.$("#fn").value.trim(); };
      W.$$("[data-who]", main).forEach((b) => b.onclick = () => { keep(); d.who = b.dataset.who; request(main); });
      W.$("#bk").onclick = () => { keep(); d.step = 1; request(main); };
      W.$("#save").onclick = () => {
        keep();
        if (!d.text.trim()) { W.toast("Write your request first"); return W.$("#rq").focus(); }
        const pr = W.S.addPrayer(d.text.trim());
        if (pr && pr.id) { const meta = W.read("wfn2-prayer-meta", {}); meta[pr.id] = { topic: d.topic, team: d.who === "team" }; W.write("wfn2-prayer-meta", meta); }
        d.step = 3; request(main); window.scrollTo(0, 0);
      };
    } else {
      ["wa", "ig"].forEach((id) => {
        const b = W.$("#" + id); if (!b) return;
        b.onclick = () => {
          const txt = reqText(d), href = b.dataset.href;
          const go = () => { window.open(href, "_blank", "noopener") || (location.href = href); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => { W.toast("Request copied. Paste it in the chat."); setTimeout(go, 600); }, go);
          else { W.copyText(txt); setTimeout(go, 600); }
        };
      });
      W.$("#done").addEventListener("click", () => { draft = null; });
      const m = W.$("#mail"); if (m) m.addEventListener("click", () => setTimeout(() => { draft = null; }, 500));
    }
  }

  function declaration(main, t) {
    W.markSeen && W.markSeen("declaration");
    const ds = stanzas(t.declaration.lines);
    main.innerHTML = W.topbar("Today’s declaration", { back: "#/prayer", right: `<button class="icon-btn" id="dl" aria-label="Listen" aria-pressed="false">${icon("listen")}</button>` }) + `
    <div class="page">
      <div style="display:flex;align-items:center;gap:8px;padding:0 4px"><p class="eyebrow spruce" style="flex-grow:1">${esc(t.declaration.ref || "")} · say it out loud</p>${W.translateBtn("#dprose")}</div>
      <div class="prose" id="dprose" style="gap:22px">${ds.map((s) => `<div style="display:flex;flex-direction:column;gap:12px">${s.map((l) => `<p data-tr style="font-size:calc(var(--read-size) + 1px);line-height:1.6">${esc(l)}</p>`).join("")}</div>`).join('<hr class="hr">')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button class="btn lg" id="amen">Amen</button>
        <button class="btn lg ghost" id="ds">${icon("share", "sm")}Share</button>
      </div>
      <button class="btn block soft" id="dc">${icon("copy", "sm")}Copy the declaration</button>
    </div>`;
    W.$("#dc").onclick = () => W.copyText(W.$$("#dprose p").map((x) => x.textContent).join("\n") + "\n\n" + (t.declaration.ref || "") + "\nwfnglobal.org/app");
    const all = (t.declaration.lines || []).filter(Boolean).join(" ");
    W.$("#dl").onclick = (e) => W.speak(W.$$("#dprose p").map((x) => x.textContent), e.currentTarget, "declaration:" + t.updated); void all;
    W.$("#amen").onclick = () => { W.markDone("declaration"); W.toast("Amen. Declared."); };
    W.$("#ds").onclick = () => W.shareOrCopy({ title: "Today’s declaration", text: (t.declaration.lines || []).filter(Boolean).slice(0, 3).join("\n\n") + "\n\n" + (t.declaration.ref || ""), url: "https://wfnglobal.org/app/" });
  }

  function night(main, t) {
    W.markSeen && W.markSeen("night");
    main.innerHTML = W.topbar("Night prayer", { back: "#/prayer", right: `<button class="icon-btn" id="nl" aria-label="Listen" aria-pressed="false">${icon("listen")}</button>` }) + `
    <div class="page">
      <div style="display:flex;justify-content:center;color:var(--slate)">${icon("moon").replace('class="i "', 'class="i" style="width:44px;height:44px;stroke-width:1.3"')}</div>
      <div style="display:flex;justify-content:flex-end">${W.translateBtn("#nprose")}</div>
      <div class="prose" id="nprose" style="text-align:left"><p data-tr style="font-size:calc(var(--read-size) + 1px);line-height:1.7">${esc(t.night.text || "")}</p><p data-tr style="font-weight:600">${esc(t.night.amen || "Amen.")}</p></div>
      <button class="btn lg block" id="amen">Amen. Goodnight.</button>
    </div>`;
    W.$("#nl").onclick = (e) => W.speak(W.$$("#nprose p").map((x) => x.textContent).join(" "), e.currentTarget);
    W.$("#amen").onclick = () => { W.markDone("night"); W.toast("Rest well. He keeps you."); };
  }

  // ---------- Dreams ----------
  W.view("dreams", async function (main, parts) {
    const t = await W.today();
    if (parts[0] === "fire") return fire(main, parts[1], t);
    if (parts[0] === "archive") return archive(main);
    let arch = [];
    try { arch = (await W.getJSON("dream-archive.json")).prayers || []; } catch (e) {}
    main.innerHTML = `
    <header class="hero-head">
      <a class="icon-btn on-hero" href="#/prayer" data-back aria-label="Back" style="margin-left:-12px">${icon("back")}</a>
      <span style="color:var(--hero-accent)">${icon("moon").replace('class="i "', 'class="i" style="width:40px;height:40px;stroke-width:1.5"')}</span>
      <h1>Dreams &amp; Discernment</h1>
      <p>A strange dream, a nightmare, a recurring one you can’t shake. You don’t have to work it out alone, and you don’t have to be afraid of it.</p>
    </header>
    <div class="page">
      <a class="card pad" href="#/dreams/fire" style="display:flex;flex-direction:column;gap:10px;text-decoration:none;color:var(--ink)">
        <span style="display:flex;align-items:center;gap:8px"><span style="width:6px;height:6px;border-radius:9px;background:var(--spruce)"></span><span class="eyebrow spruce" style="flex-grow:1">Tonight’s fire prayer</span><span class="small muted">New at midnight</span></span>
        <span class="serif" style="font-size:22px;line-height:28px">${esc(t.dreamFire.title)}</span>
        <span class="small ink2" style="font-size:14px">${(t.dreamFire.points || []).length} prayer points to cover you before you close your eyes.</span>
        <span class="btn sm" style="align-self:flex-start;margin-top:4px">Pray now</span>
      </a>
      <section class="section"><h2 class="h2" style="padding:0 4px">What Scripture says</h2>
        <p class="serif" style="padding:0 4px;font-size:17px;line-height:28px">God has spoken through dreams, to Joseph, to Daniel, and in the outpouring of the Spirit. Scripture is just as clear that not every dream is a message. Discernment, not panic.</p>
        <div class="chips" style="padding:0 4px">${[["Genesis 37", "genesis/37"], ["Daniel 2", "daniel/2"], ["Acts 2:17", "acts/2/17"], ["Ecclesiastes 5:3", "ecclesiastes/5/3"], ["Jeremiah 23:28", "jeremiah/23/28"]].map(([l, h]) => `<a class="chip amber" href="#/bible/${h}">${l}</a>`).join("")}</div>
      </section>
      <section class="section"><h2 class="h2" style="padding:0 4px">If the dream frightened you</h2>
        <div class="band" style="display:flex;flex-direction:column;gap:12px"><p class="serif" style="font-size:17.5px;line-height:28px">Father, I will not carry fear from what I saw in my sleep. You did not give me a spirit of fear, but of power, and of love, and of a sound mind. I hand this dream to You now. I lie down in peace, and I rise in peace, because You keep me. In Jesus’ name, amen.</p><span class="small" style="font-weight:600;color:var(--amber)">2 Timothy 1:7</span></div>
      </section>
      <section class="section"><div class="section-head"><h2 class="h2">Dream journal</h2><span class="small muted">Private, on this phone</span></div>
        <a class="card pad-s" href="#/journal/dream" style="display:flex;align-items:center;gap:14px;text-decoration:none;color:var(--ink);border-style:dashed;box-shadow:none;border-color:var(--track)"><span class="tile-ic c-spruce">${icon("plus")}</span><span><span style="font-weight:600">Write down a dream</span><br><span class="small muted">Note it, pray over it, then let it go</span></span></a>
      </section>
      <section class="section"><h2 class="h2" style="padding:0 4px">When to bring in more support</h2>
        <div class="card list">${[["Pray it through with someone", "A trusted prayer partner, or a pastor who knows your life."], ["See a licensed counsellor for recurring nightmares", "They are common and treatable, and often tied to stress or grief."], ["Faith and help work together", "Prayer for the spirit, counsel for the mind. God uses both."]].map(([a, b]) => `<div class="row-link" style="cursor:default"><span class="grow"><span class="label" style="font-weight:600">${a}</span><span class="hint" style="font-size:13.5px;line-height:20px">${b}</span></span></div>`).join("")}</div>
      </section>
      ${arch.length ? `<section class="section"><div class="section-head"><h2 class="h2">Fire prayer archive</h2><a href="#/dreams/archive">All ${arch.length}</a></div>
        <div class="card list">${arch.slice(0, 3).map((a) => `<a class="row-link" href="#/dreams/fire/${a.id}"><span class="small muted" style="width:52px;flex-shrink:0">${esc(shortDate(a.id))}</span><span class="grow"><span class="label serif" style="font-size:16.5px">${esc(a.title)}</span></span><span class="chev">${icon("chev", "xs")}</span></a>`).join("")}</div></section>` : ""}
    </div>`;
  });
  function shortDate(id) { const d = new Date(id + "T12:00:00"); return isNaN(d) ? id : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  async function fire(main, id, t) {
    let p = t.dreamFire;
    if (id) { try { p = ((await W.getJSON("dream-archive.json")).prayers || []).find((x) => x.id === id) || p; } catch (e) {} }
    main.innerHTML = W.topbar("Fire prayer", { back: "#/dreams", right: `<button class="icon-btn" id="fl" aria-label="Listen" aria-pressed="false">${icon("listen")}</button>` }) + `
    <div class="page" id="fire">
      <div style="display:flex;flex-direction:column;gap:10px;padding:0 4px"><span class="eyebrow amber">${esc(p.date || "Tonight")}</span><h2 class="serif" style="margin:0;font-weight:400;font-size:30px;line-height:37px">${esc(p.title)}</h2><p class="serif ink2" data-tr style="font-size:17px;line-height:28px">${esc(p.intro || "")}</p><div>${W.translateBtn("#fire")}</div></div>
      <ol class="card points">${(p.points || []).map((x, i) => `<li><span class="n">${i + 1}</span><p data-tr>${esc(x)}</p></li>`).join("")}</ol>
      <button class="btn lg block" id="amen">Amen</button>
    </div>`;
    W.$("#fl").onclick = (e) => W.speak([p.title].concat(W.$$("#fire [data-tr]").map((x) => x.textContent)), e.currentTarget);
    W.$("#amen").onclick = () => W.toast("Amen. Sleep in peace.");
  }
  async function archive(main) {
    let arch = [];
    try { arch = (await W.getJSON("dream-archive.json")).prayers || []; } catch (e) {}
    main.innerHTML = W.topbar("Fire prayer archive", { back: "#/dreams" }) + `<div class="page tight"><div class="card list">${arch.map((a) => `<a class="row-link" href="#/dreams/fire/${a.id}"><span class="small muted" style="width:52px;flex-shrink:0">${esc(shortDate(a.id))}</span><span class="grow"><span class="label serif" style="font-size:16.5px">${esc(a.title)}</span><span class="hint">${(a.points || []).length} prayer points</span></span><span class="chev">${icon("chev", "xs")}</span></a>`).join("") || '<div class="empty">The archive is empty for now.</div>'}</div></div>`;
  }

  // ---------- Library ----------
  W.view("library", async function (main) {
    const books = C.LIBRARY_BOOKS || [], plans = C.READING_PLANS || [];
    main.innerHTML = `
    <header class="page-head"><div class="row"><h1 style="flex-grow:1">Library</h1><a class="icon-btn" href="#/search" aria-label="Search">${icon("search")}</a></div><p class="small muted">Books by Oladapo Olaleye and reading plans</p></header>
    <div class="page">
      ${W.intro("library", { eyebrow: "Welcome to the archive", title: "Be a Berean with these pages too", tone: "slate", body: ["A book on glass is still a book to study. Full books by Oladapo Olaleye, free to read in the app or download as a PDF.", "Read with your Bible open, and search the Scriptures to see whether these things are so."], verse: "They received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.", ref: "Acts 17:11" })}
      <section class="section"><div class="section-head"><h2 class="h2">Books</h2><span class="small muted">A new book every two weeks</span></div>
        <div class="hscroll">${books.map((b) => `<a class="book-cover" href="#/book/${b.slug}"><img src="${W.BASE}assets/library/${b.slug}-cover.svg" alt="" loading="lazy" onerror="this.style.background='${b.bg1}'"><span>${esc(b.title)}</span></a>`).join("")}</div>
        <div class="card list">${books.map((b) => `<a class="row-link" href="#/book/${b.slug}"><span class="grow"><span class="label serif" style="font-size:17px">${esc(b.title)}</span><span class="hint">${esc(b.badge || "")}</span></span><span class="chev">${icon("chev", "xs")}</span></a>`).join("")}</div>
      </section>
      ${plans.length ? `<section class="section"><h2 class="h2" style="padding:0 4px">Reading plans</h2>${plans.map((pl) => { const pr = W.S.getPlanProgress(pl.slug); const n = (pr && pr.completedDays || []).length; return `<a class="card pad" href="#/plan/${pl.slug}" style="display:flex;flex-direction:column;gap:8px;text-decoration:none;color:var(--ink)"><span class="eyebrow spruce">${pl.days.length} days${n ? " · " + n + " done" : ""}</span><span class="h2">${esc(pl.title)}</span><span class="small ink2">${esc(pl.subtitle)}</span></a>`; }).join("")}</section>` : ""}
    </div>`;
  });

  // ---------- Sermons: its own tab, with the full archive ----------
  W.view("sermons", async function (main) {
    const t = await W.today();
    const all = C.SERMONS || [];
    const notes = W.S.getNotes();
    const nc = (slug) => notes.filter((n) => n.refKey === "sermon:" + slug).length;
    const months = {};
    all.slice(1).forEach((s) => { const k = (s.date || "").replace(/^([A-Za-z]+) \d+, (\d{4})$/, "$1 $2") || "Earlier"; (months[k] = months[k] || []).push(s); });
    main.innerHTML = `
    <header class="page-head"><div class="row"><h1 style="flex-grow:1">Sermons</h1><a class="icon-btn" href="#/search" aria-label="Search sermons">${icon("search")}</a></div><p class="small muted">A new sermon every night by midnight · ${all.length} in the archive</p></header>
    <div class="page">
      ${W.intro("sermons", { eyebrow: "You’re about to hear the Word preached", title: "A recorded message is still a sermon", tone: "slate", body: ["Hearing a sermon through a screen doesn’t make it less preached. Listen the way you would in the room: attentive, unhurried, testing what you hear against Scripture.", "Keep an open Bible beside you, and let what you hear send you back to Scripture rather than replace it."], verse: "Prove all things; hold fast that which is good.", ref: "1 Thessalonians 5:21" })}
      <a class="feature" href="#/sermon/${esc(t.sermon.slug)}">
        <img class="poster" src="${esc(W.sermonPoster(t.sermon.slug))}" alt="" onerror="this.remove()">
        <span class="meta"><span class="eyebrow slate">Today’s sermon · ${esc(t.sermon.ref || "")}</span><h3>${esc(t.sermon.title)}</h3><p>${esc(t.sermon.excerpt)}</p></span>
      </a>
      <p class="serif ink2" style="padding:0 4px;font-size:16px;line-height:26px">“So then faith cometh by hearing, and hearing by the word of God.” <span class="small" style="font-family:var(--sans);font-weight:600;color:var(--amber)">Romans 10:17</span></p>
      ${Object.entries(months).map(([m, list]) => `<section class="section"><h2 class="eyebrow" style="padding:0 4px">${esc(m)}</h2><div class="card list">${list.map((s) => `<div class="thumb-row" style="padding:12px 12px 12px 16px">
        <a href="#/sermon/${s.slug}" style="display:flex;gap:14px;align-items:center;flex-grow:1;min-width:0;text-decoration:none;color:var(--ink)"><span class="ph c-slate" data-slug="${s.slug}">${esc(s.title.charAt(0))}</span><span class="grow"><span class="title">${esc(s.title)}</span><span class="sub">${esc(s.ref)} · ${esc(s.date || "")}</span></span></a>
        <button class="icon-btn" data-note="${s.slug}" data-title="${esc(s.title)}" aria-label="${nc(s.slug) ? nc(s.slug) + " notes" : "Add a note"}">${nc(s.slug) ? `<span class="small" style="font-weight:600;color:var(--spruce)">${nc(s.slug)}</span>` : icon("pen", "sm")}</button></div>`).join("")}</div></section>`).join("")}
    </div>`;
    W.$$(".ph[data-slug]", main).forEach((ph) => { const img = new Image(); img.onload = () => { img.alt = ""; img.style.cssText = "width:56px;height:70px;border-radius:12px;object-fit:cover;flex-shrink:0"; ph.replaceWith(img); }; img.src = W.sermonPoster(ph.dataset.slug); });
    W.$$("[data-note]", main).forEach((b) => b.onclick = () => W.noteSheet({ type: "sermon", refKey: "sermon:" + b.dataset.note, refLabel: b.dataset.title, onSave: () => W.route() }));
  });
  W.view("studies", function (main) {
    main.innerHTML = W.topbar("Bible studies", { back: "#/bible" }) + `<p class="small ink2" style="padding:0 20px">A new study every morning at 7. A parable, a verse, a character, a doctrine.</p>` + `<div class="page tight"><div class="card list">${(C.BIBLE_STUDY || []).map((s) => `<a class="thumb-row" href="#/study/${s.slug}">${s.poster ? `<img src="${esc(W.asset(s.poster))}" alt="" loading="lazy">` : `<span class="ph c-amber">${esc(s.title.charAt(0))}</span>`}<span class="grow"><span class="title">${esc(s.title)}</span><span class="sub">${esc((s.verses || []).map((v) => v.ref).join(" · "))}</span></span></a>`).join("")}</div></div>`;
  });

  // Sermon: reads the full sermon from the website's article page.
  W.view("sermon", async function (main, parts) {
    W.today().then((td) => { if (td.sermon && td.sermon.slug === parts[0] && W.markSeen) W.markSeen("sermon"); }).catch(() => {});
    const slug = parts[0];
    const s = (C.SERMONS || []).find((x) => x.slug === slug) || { slug, title: "", ref: "", excerpt: "" };
    main.innerHTML = W.topbar("Sermon", { back: "#/sermons", right: `<button class="icon-btn" id="sl" aria-label="Listen" aria-pressed="false">${icon("listen")}</button><button class="icon-btn" id="sa" aria-label="Reading settings">${icon("aa")}</button>` }) +
      `<div class="progress" aria-hidden="true"><span id="prog"></span></div><article class="page" id="art" style="padding:20px 24px 40px;gap:20px"><p class="small muted">Loading…</p></article>`;
    W.$("#sa").onclick = () => W.readingSheet();
    let html = "";
    try {
      const r = await fetch(W.BASE + "articles/" + slug + ".html", { cache: "no-cache" });
      if (r.ok) html = await r.text();
    } catch (e) {}
    const doc = html ? new DOMParser().parseFromString(html, "text/html") : null;
    const title = (doc && doc.querySelector(".article-title") ? doc.querySelector(".article-title").textContent : s.title).trim();
    const sub = doc && doc.querySelector(".article-sub") ? doc.querySelector(".article-sub").textContent.trim() : s.excerpt;
    const sText = doc && doc.querySelector(".scripture-text") ? doc.querySelector(".scripture-text").textContent.trim() : "";
    const sRef = doc && doc.querySelector(".scripture-ref") ? doc.querySelector(".scripture-ref").textContent.trim() : s.ref;
    const body = doc && doc.querySelector(".article-body");
    let bodyHtml = "";
    let words = 0;
    if (body) {
      body.querySelectorAll("script, style, .share-bar, button, form, .article-cta").forEach((n) => n.remove());
      Array.from(body.children).forEach((n) => {
        const tag = n.tagName.toLowerCase();
        const txt = n.textContent.trim();
        if (!txt) return;
        words += txt.split(/\s+/).length;
        if (tag === "h2" || tag === "h3") bodyHtml += `<h2 data-tr>${esc(txt)}</h2>`;
        else if (n.classList.contains("pull-verse")) { const cite = n.querySelector("cite"); const ct = cite ? cite.textContent.trim() : ""; if (cite) cite.remove(); bodyHtml += `<p class="pull"><span data-tr>${esc(n.textContent.trim())}</span>${ct ? `<cite>${esc(ct)}</cite>` : ""}</p>`; }
        else if (tag === "ul" || tag === "ol") bodyHtml += `<${tag} style="margin:0;padding-left:22px;display:flex;flex-direction:column;gap:8px">${Array.from(n.querySelectorAll("li")).map((li) => `<li data-tr>${esc(li.textContent.trim())}</li>`).join("")}</${tag}>`;
        else bodyHtml += `<p data-tr>${esc(txt)}</p>`;
      });
    }
    const mins = Math.max(3, Math.round(words / 220));
    const date = s.date || "";
    W.$("#art").innerHTML = `
      <img class="poster" src="${esc(W.sermonPoster(slug))}" alt="" onerror="this.remove()">
      <div style="display:flex;flex-direction:column;gap:10px">
        <span class="eyebrow slate">Sermon${date ? " · " + esc(date) : ""}</span>
        <h1 data-tr style="margin:0;font:400 32px/39px var(--serif);letter-spacing:-0.01em">${esc(title)}</h1>
        <p class="serif ink2" data-tr style="font-style:italic;font-size:18px;line-height:28px">${esc(sub)}</p>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">${words ? `<span class="small muted" style="flex-grow:1">${mins} min read</span>` : ""}${W.translateBtn("#art")}<button class="chip" type="button" id="snote">${icon("pen", "xs")}Note</button></div>
      </div>
      ${sText ? `<blockquote class="scripture-box"><p data-tr>${esc(sText)}</p><cite>${esc(sRef)}</cite></blockquote>` : ""}
      ${bodyHtml ? `<div class="prose">${bodyHtml}</div>` : `<div class="empty">The full sermon opens on the website.<br><br><a class="btn" href="${W.BASE}articles/${esc(slug)}.html">Read on wfnglobal.org</a></div>`}
      <div class="band" style="display:flex;flex-direction:column;gap:12px">
        <span class="eyebrow">At the end of every sermon</span>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn" id="amen">Amen</button><button class="btn ghost" id="shr">${icon("share", "sm")}Share</button></div>
      </div>`;
    W.$("#amen").onclick = () => { W.markDone("sermon"); W.toast("Amen."); };
    W.$("#shr").onclick = () => W.shareOrCopy({ title, text: title + " — " + sub, url: "https://wfnglobal.org/articles/" + slug + ".html" });
    W.$("#sl").onclick = (e) => W.speak(W.$$("#art [data-tr]").map((x) => x.textContent), e.currentTarget, "sermon:" + slug);
    W.$("#snote").onclick = () => W.noteSheet({ type: "sermon", refKey: "sermon:" + slug, refLabel: title });
    if (/autoread/.test(location.hash)) setTimeout(() => W.$("#sl").click(), 500);
    progress();
  });
  function progress() {
    const bar = W.$("#prog");
    if (!bar) return;
    const on = () => { if (!document.body.contains(bar)) return window.removeEventListener("scroll", on); const h = document.documentElement.scrollHeight - innerHeight; bar.style.width = (h > 0 ? Math.min(100, (scrollY / h) * 100) : 0) + "%"; };
    window.addEventListener("scroll", on, { passive: true }); on();
  }

  W.view("study", function (main, parts) {
    W.today().then((td) => { if (td.study && td.study.slug === parts[0] && W.markSeen) W.markSeen("study"); }).catch(() => {});
    const s = (C.BIBLE_STUDY || []).find((x) => x.slug === parts[0]) || (C.BIBLE_STUDY || [])[0];
    if (!s) return W.go("#/library");
    const words = (s.body || []).join(" ").split(/\s+/).length;
    main.innerHTML = W.topbar("Bible study", { back: "#/studies", right: `<button class="icon-btn" id="sl" aria-label="Listen" aria-pressed="false">${icon("listen")}</button><button class="icon-btn" id="sa" aria-label="Reading settings">${icon("aa")}</button>` }) + `
    <div class="progress" aria-hidden="true"><span id="prog"></span></div>
    <article class="page" id="stdy" style="padding:20px 24px 40px;gap:20px">
      ${s.poster ? `<img class="poster" src="${esc(W.asset(s.poster))}" alt="${esc(s.posterAlt || "")}">` : ""}
      <div style="display:flex;flex-direction:column;gap:10px"><span class="eyebrow amber">Bible study · ${esc(s.date || "")}</span>
        <h1 data-tr style="margin:0;font:400 32px/39px var(--serif);letter-spacing:-0.01em">${esc(s.title)}</h1>
        <p class="serif ink2" data-tr style="font-style:italic;font-size:18px;line-height:28px">${esc(s.excerpt)}</p>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="small muted" style="flex-grow:1">${Math.max(3, Math.round(words / 220))} min read · ${(s.verses || []).length} passages</span>${W.translateBtn("#stdy")}</div></div>
      ${(s.verses || []).map((v) => `<blockquote class="scripture-box"><p data-tr>${esc(v.text)}</p><cite>${esc(v.ref)} · KJV</cite></blockquote>`).join("")}
      <div class="prose">${(s.body || []).map((p) => `<p data-tr>${esc(p)}</p>`).join("")}</div>
      <div class="band" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <button class="btn" id="amen">Amen</button>
        <button class="btn ghost" id="note">${icon("pen", "sm")}Note</button>
        <button class="btn ghost" id="shr">${icon("share", "sm")}Share</button>
      </div>
    </article>`;
    W.$("#sa").onclick = () => W.readingSheet();
    W.$("#sl").onclick = (e) => W.speak(W.$$("#stdy [data-tr]").map((x) => x.textContent), e.currentTarget, "study:" + s.slug);
    W.$("#amen").onclick = () => { W.markDone("study"); W.toast("Amen."); };
    W.$("#note").onclick = () => W.noteSheet({ type: "study", refKey: "study:" + s.slug, refLabel: s.title });
    W.$("#shr").onclick = () => W.shareOrCopy({ title: s.title, text: s.title + " — " + s.excerpt, url: "https://wfnglobal.org/app/" });
    progress();
  });

  W.view("plan", function (main, parts) {
    const p = (C.READING_PLANS || []).find((x) => x.slug === parts[0]);
    if (!p) return W.go("#/library");
    const pr = W.S.getPlanProgress(p.slug) || { completedDays: [] };
    const doneDays = pr.completedDays || [];
    if (parts[1]) {
      const n = Math.min(p.days.length, Math.max(1, +parts[1])), d = p.days[n - 1];
      const isDone = doneDays.includes(n);
      main.innerHTML = W.topbar("Day " + n + " of " + p.days.length, { back: "#/plan/" + p.slug }) + `
      <article class="page" id="pday" style="padding:20px 24px 40px;gap:20px">
        <span class="eyebrow spruce">${esc(p.title)}</span>
        <div style="display:flex;align-items:flex-start;gap:10px"><h1 data-tr style="margin:0;flex-grow:1;font:400 30px/37px var(--serif)">${esc(d.title)}</h1>${W.translateBtn("#pday")}</div>
        <blockquote class="scripture-box"><p data-tr>${esc(d.verse)}</p><cite>${esc(d.ref)} · KJV</cite></blockquote>
        <div class="prose"><p data-tr>${esc(d.devotional)}</p></div>
        <div class="band" style="display:flex;flex-direction:column;gap:8px"><span class="eyebrow">Pray</span><p class="serif" data-tr style="font-size:17.5px;line-height:28px">${esc(d.prayer)}</p></div>
        <button class="btn lg block ${isDone ? "ghost" : ""}" id="dn">${isDone ? icon("check", "sm") + "Completed" : "Mark day " + n + " complete"}</button>
        ${n < p.days.length ? `<a class="btn lg block soft" href="#/plan/${p.slug}/${n + 1}">Day ${n + 1}: ${esc(p.days[n].title)}</a>` : ""}
      </article>`;
      W.$("#dn").onclick = () => { if (isDone) W.S.markPlanDayIncomplete(p.slug, n); else { W.S.markPlanDayComplete(p.slug, n); W.toast("Day " + n + " complete"); } W.route(); };
      return;
    }
    main.innerHTML = W.topbar(p.title, { back: "#/library" }) + `<div class="page tight">
      <p class="serif ink2" style="font-size:18px;line-height:28px;padding:0 4px">${esc(p.subtitle)}</p>
      <div class="card list">${p.days.map((d, i) => `<a class="row-link" href="#/plan/${p.slug}/${i + 1}"><span class="radio-dot ${doneDays.includes(i + 1) ? "on" : ""}" aria-hidden="true"></span><span class="grow"><span class="label">Day ${i + 1}: ${esc(d.title)}</span><span class="hint">${esc(d.ref)}</span></span><span class="chev">${icon("chev", "xs")}</span></a>`).join("")}</div>
      ${doneDays.length ? `<button class="btn soft" id="rs">Start over</button>` : ""}</div>`;
    const rs = W.$("#rs"); if (rs) rs.onclick = () => { W.ask("Clear your progress on this plan?", "Start over", () => { W.S.resetPlan(p.slug); W.route(); }); };
  });

  W.view("book", function (main, parts) {
    const b = (C.LIBRARY_BOOKS || []).find((x) => x.slug === parts[0]);
    if (!b) return W.go("#/library");
    main.innerHTML = W.topbar(b.badge, { back: "#/library" }) + `<div class="page">
      <div style="display:flex;justify-content:center;padding-top:6px"><img src="${W.BASE}assets/library/${b.slug}-cover.svg" alt="${esc(b.title)} cover" style="width:200px;aspect-ratio:2/3;object-fit:cover;border-radius:12px;box-shadow:0 30px 50px -26px rgba(0,0,0,0.6);background:${b.bg1}"></div>
      <div style="display:flex;flex-direction:column;gap:8px;text-align:center"><h1 style="margin:0;font:400 30px/36px var(--serif)">${esc(b.title)}</h1><span class="small muted">By Oladapo Olaleye · Word and Faith Network</span></div>
      <p class="serif" style="font-size:18px;line-height:29px">${esc(b.desc)}</p>
      <a class="btn lg block" href="${W.BASE}library/${b.slug}.html">${icon("bible", "sm")}Read the book</a>
      <a class="btn block soft" href="${W.BASE}assets/library/${b.slug}.pdf" target="_blank" rel="noopener">${icon("download", "sm")}Download the PDF</a>
      <button class="btn lg block ghost" id="shr">${icon("share", "sm")}Share this book</button>
    </div>`;
    W.$("#shr").onclick = () => W.shareOrCopy({ title: b.title, text: b.title + " by Oladapo Olaleye — " + b.desc, url: "https://wfnglobal.org/library/" + b.slug + ".html" });
  });
})();

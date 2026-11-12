// WFN App 2.0 — You: profile, kept items, text & font, appearance, journal.
(function () {
  "use strict";
  const W = window.WFN2;
  const { esc, icon } = W;

  function activity() { return W.read("wfn-app-activity", {}); }

  W.view("you", function (main) {
    const p = W.profile();
    const s = W.settings();
    const act = activity();
    const now = new Date();
    const y = now.getFullYear(), mo = now.getMonth();
    const dim = new Date(y, mo + 1, 0).getDate();
    const key = (d) => y + "-" + String(mo + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    const activeDays = Array.from({ length: dim }, (_, i) => !!act[key(i + 1)]);
    const chRead = Object.values(W.read("wfn2-read-ch", {})).reduce((a, b) => a + b.length, 0);
    const notes = W.S.getNotes(), marks = W.S.getMarks(), prayers = W.S.getPrayers();
    const since = p.since ? new Date(p.since).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "";
    const monthName = now.toLocaleDateString(undefined, { month: "long" });

    main.innerHTML = `
    <header style="display:flex;align-items:center;gap:14px;padding:calc(32px + var(--safe-t)) 20px 8px">
      <label for="photo" style="position:relative;flex-shrink:0;cursor:pointer" aria-label="Add or change your profile photo">
        ${W.avatar()}
        <span style="position:absolute;right:-2px;bottom:-2px;width:28px;height:28px;border-radius:999px;background:var(--spruce);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px var(--bg)">${icon("camera", "xs")}</span>
        <input id="photo" type="file" accept="image/*" class="sr">
      </label>
      <span style="display:flex;flex-direction:column;gap:2px;flex-grow:1;min-width:0">
        <h1 style="margin:0;font:400 26px/32px var(--serif)">${esc(p.name || "Welcome")}</h1>
        ${since ? `<span class="small muted">In the Word since ${esc(since)}</span>` : ""}
        <label for="photo" class="small" style="font-weight:600;color:var(--spruce);cursor:pointer">${p.photo ? "Change photo" : "Add a profile photo"}</label>
      </span>
      <button class="btn sm soft" id="edit">${p.name ? "Edit" : "Add name"}</button>
    </header>

    <div class="page" style="gap:26px">
      <section class="card pad" style="display:flex;flex-direction:column;gap:14px" aria-labelledby="rh">
        <div style="display:flex;align-items:baseline"><h2 id="rh" style="margin:0;flex-grow:1;font:600 15px var(--sans)">${esc(monthName)} in the Word</h2><span class="small muted" style="font-variant-numeric:tabular-nums">${activeDays.filter(Boolean).length} of ${now.getDate()} days</span></div>
        <div class="days" aria-hidden="true">${activeDays.map((on, i) => `<span class="${on ? "on" : i < now.getDate() ? "past" : ""}"></span>`).join("")}</div>
        <div class="stats"><div><b>${W.S.getStreak()}</b><span>Day streak</span></div><div><b>${chRead}</b><span>Chapters read</span></div><div><b>${W.S.getDaysActiveThisYear()}</b><span>Days this year</span></div></div>
      </section>

      <section class="section" aria-labelledby="fg">
        <h2 id="fg" class="eyebrow" style="padding:0 4px">Friends &amp; giving</h2>
        <div class="explore">
          <a class="card" href="#/invite"><span class="tile-ic lg c-spruce">${icon("qr")}</span><span><span class="t">Invite friends</span><br><span class="s">Your QR code and scanner</span></span></a>
          <a class="card" href="#/give"><span class="tile-ic lg c-amber">${icon("hand")}</span><span><span class="t">Give</span><br><span class="s">Spread the Word, help the needy</span></span></a>
        </div>
      </section>

      <section class="section" aria-labelledby="kh">
        <h2 id="kh" class="eyebrow" style="padding:0 4px">What you’ve kept</h2>
        <div class="card list">
          ${[["notes", "Notes & journal", notes.length, "var(--spruce)"], ["highlights", "Highlights", marks.filter((m) => m.color).length, "#E8C77E"], ["verses", "Saved verses", marks.filter((m) => m.saved).length, "var(--amber)"], ["prayers", "My prayer list", prayers.length, "var(--slate)"]].map(([k, l, n, c]) =>
            `<a class="row-link" href="#/kept/${k}"><span style="width:10px;height:10px;border-radius:3px;background:${c}"></span><span class="grow"><span class="label">${l}</span></span><span class="small muted" style="font-variant-numeric:tabular-nums">${n}</span><span class="chev">${icon("chev", "xs")}</span></a>`).join("")}
        </div>
      </section>

      <section class="section" aria-labelledby="tf">
        <h2 id="tf" class="eyebrow" style="padding:0 4px">Text &amp; font</h2>
        <div class="card pad" style="display:flex;flex-direction:column;gap:14px;padding:18px">
          <div style="display:flex;align-items:baseline"><label for="fs" style="flex-grow:1;font-weight:500">Font size</label><span class="small" style="font-weight:600;color:var(--ink-2);font-variant-numeric:tabular-nums" id="fsv">${s.size} pt</span></div>
          <div style="display:flex;align-items:center;gap:14px"><span class="serif" style="font-size:14px">A</span><input id="fs" type="range" min="14" max="34" value="${s.size}"><span class="serif" style="font-size:26px">A</span></div>
          <p id="prev" style="padding:12px 14px;border-radius:16px;background:var(--bg);font-family:var(--read-font);font-size:var(--read-size);line-height:1.6">Thy word is a lamp unto my feet, and a light unto my path.</p>
        </div>
        <div class="card list" role="radiogroup" aria-label="Reading font">
          ${W.FONTS.map((f) => `<button class="row-link" role="radio" aria-checked="${s.font === f.id}" data-font="${f.id}" style="min-height:62px">
            <span style="width:44px;font:400 24px ${esc(f.stack)}">Aa</span>
            <span class="grow"><span class="label" style="font-family:${esc(f.stack)};font-size:16px">${esc(f.name)}</span><span class="hint">${esc(f.hint)}</span></span>
            <span class="radio-dot ${s.font === f.id ? "on" : ""}" aria-hidden="true"></span></button>`).join("")}
        </div>
      </section>

      <section class="section" aria-labelledby="ap">
        <h2 id="ap" class="eyebrow" style="padding:0 4px">Appearance</h2>
        <div class="card pad-s" style="display:flex;flex-direction:column;gap:12px">
          <span class="small" style="font-weight:600;color:var(--ink-2);padding:0 2px">App theme</span>
          <div class="seg" role="tablist" aria-label="App theme">${[["auto", "Automatic"], ["light", "Light"], ["dark", "Dark"]].map(([k, l]) => `<button role="tab" aria-selected="${s.theme === k}" data-theme-set="${k}">${l}</button>`).join("")}</div>
          <p class="small muted" style="padding:0 2px">Automatic follows your phone: light by day, dark whenever your phone is in dark mode.</p>
          <label class="row-link" style="padding:6px 2px;min-height:52px"><span class="grow"><span class="label" style="font-size:15px">Reduce motion</span><span class="hint">Turn off animations and transitions</span></span><span class="switch"><input type="checkbox" id="rmo" ${s.reduceMotion ? "checked" : ""}><span></span></span></label>
          <button class="row-link" id="rt" style="padding:6px 2px;min-height:48px"><span class="grow"><span class="label" style="font-size:15px">Reading theme</span><span class="hint">Light, Linen, Mint or Dark · now ${esc((W.READ_THEMES.find((t) => t.id === s.read) || {}).name || "Light")}</span></span><span class="chev">${icon("chev", "xs")}</span></button>
        </div>
      </section>

      <section class="section" aria-labelledby="vc">
        <h2 id="vc" class="eyebrow" style="padding:0 4px">Listen &amp; Ask Tolu</h2>
        <div class="card list">
          <label class="row-link" style="min-height:60px"><span class="tile-ic c-spruce">${icon("listen")}</span><span class="grow"><span class="label">Listen</span><span class="hint">Read any screen aloud, with Pause and Stop</span></span><span class="switch"><input type="checkbox" id="optListen" ${s.showListen !== false ? "checked" : ""}><span></span></span></label>
          <label class="row-link" style="min-height:60px"><span class="tile-ic c-slate">${icon("people")}</span><span class="grow"><span class="label">Natural voice</span><span class="hint">Today’s verse, declaration, sermon and study read in a real human voice</span></span><span class="switch"><input type="checkbox" id="optNatural" ${s.naturalVoice !== false ? "checked" : ""}><span></span></span></label>
          <label class="row-link" style="min-height:60px"><span class="tile-ic c-amber">${icon("mic")}</span><span class="grow"><span class="label">Ask Tolu</span><span class="hint">Your voice assistant for the Word and everyday things</span></span><span class="switch"><input type="checkbox" id="optTolu" ${s.showTolu !== false ? "checked" : ""}><span></span></span></label>
          <button class="row-link" id="siri"><span class="tile-ic c-ink">${icon("sparkle")}</span><span class="grow"><span class="label">Add Tolu to Siri</span><span class="hint">Say “Hey Siri, Tolu” to open Tolu straight away</span></span><span class="chev">${icon("chev", "xs")}</span></button>
          <button class="row-link" id="tryTolu"><span class="tile-ic c-slate">${icon("wave")}</span><span class="grow"><span class="label">Talk to Tolu now</span><span class="hint">Time, weather, timers, reminders, calls, directions, Scripture</span></span><span class="chev">${icon("chev", "xs")}</span></button>
        </div>
      </section>

      <section class="section" aria-labelledby="rm">
        <h2 id="rm" class="eyebrow" style="padding:0 4px">Daily reminders</h2>
        <div class="card list">
          <label class="row-link" style="min-height:60px"><span class="grow"><span class="label">Remind me when the new Word is ready</span><span class="hint" id="nh">${notifHint()}</span></span><span class="switch"><input type="checkbox" id="notif" ${W.read("wfn2-notify", "Notification" in window && Notification.permission === "granted") && "Notification" in window && Notification.permission === "granted" ? "checked" : ""}><span></span></span></label>
        </div>
      </section>

      <section class="section" aria-labelledby="aph">
        <h2 id="aph" class="eyebrow" style="padding:0 4px">App</h2>
        <div class="card list">
          <button class="row-link" id="inst"><span class="grow"><span class="label">Add WFN to your home screen</span><span class="hint">Works offline, opens like an app</span></span><span class="chev">${icon("chev", "xs")}</span></button>
          <button class="row-link" id="bk"><span class="grow"><span class="label">Back up your notes</span><span class="hint">Save a file you can restore on a new phone</span></span><span class="chev">${icon("chev", "xs")}</span></button>
          <a class="row-link" href="#/climb"><span class="grow"><span class="label">The Word Climb</span><span class="hint">100-question Bible quiz</span></span><span class="chev">${icon("chev", "xs")}</span></a>
          <a class="row-link" href="${W.BASE}app/classic.html"><span class="grow"><span class="label">Open the classic app</span><span class="hint">The previous WFN app, with translation and the Tolu voice assistant</span></span><span class="chev">${icon("chev", "xs")}</span></a>
          <button class="row-link" id="about"><span class="grow"><span class="label">About Word &amp; Faith Network</span><span class="hint">Our three pillars, credits, privacy</span></span><span class="chev">${icon("chev", "xs")}</span></button>
        </div>
      </section>
      <p class="small muted" style="text-align:center">WFN App 2.0 · Everything you keep stays on this phone.</p>
    </div>`;

    W.$("#photo").onchange = (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const img = new Image(), url = URL.createObjectURL(f);
      img.onload = () => {
        const n = 320, c = document.createElement("canvas"); c.width = c.height = n;
        const k = Math.min(img.width, img.height), sx = (img.width - k) / 2, sy = (img.height - k) / 2;
        c.getContext("2d").drawImage(img, sx, sy, k, k, 0, 0, n, n);
        try { localStorage.setItem(W.PHOTO_KEY, JSON.stringify(c.toDataURL("image/jpeg", 0.85))); W.toast("Photo updated"); } catch (err) { W.toast("That photo is too large to save"); }
        URL.revokeObjectURL(url); W.route();
      };
      img.src = url;
    };
    W.$("#edit").onclick = () => W.sheet(`<div class="sheet-head"><h2>Your name</h2><button class="btn sm soft" data-close>Cancel</button></div>
      <label class="sr" for="nm">Your name</label><input class="field" id="nm" value="${esc(p.name)}" placeholder="First name" autocomplete="given-name">
      ${p.photo ? `<button class="btn soft" id="rmp">Remove photo</button>` : ""}
      <button class="btn lg block" id="nmS">Save</button>`, (el) => {
      W.$("#nmS", el).onclick = () => { W.S.saveProfile(W.$("#nm", el).value); W.closeSheet(); W.route(); };
      const r = W.$("#rmp", el); if (r) r.onclick = () => { localStorage.removeItem(W.PHOTO_KEY); W.closeSheet(); W.route(); };
    });
    const fs = W.$("#fs");
    fs.oninput = () => { W.setSetting("size", +fs.value); W.$("#fsv").textContent = fs.value + " pt"; };
    W.$$("[data-font]", main).forEach((b) => b.onclick = () => {
      W.setSetting("font", b.dataset.font);
      W.$$("[data-font]", main).forEach((x) => { const on = x === b; x.setAttribute("aria-checked", on); x.querySelector(".radio-dot").classList.toggle("on", on); });
    });
    W.$$("[data-theme-set]", main).forEach((b) => b.onclick = () => { W.setSetting("theme", b.dataset.themeSet); W.$$("[data-theme-set]", main).forEach((x) => x.setAttribute("aria-selected", x === b)); });
    W.$("#rt").onclick = () => W.readingSheet();
    W.$("#rmo").onchange = (e) => W.setSetting("reduceMotion", e.target.checked);
    // Daily reminders go out through OneSignal (sent when the new Word is published).
    const withOS = (fn) => new Promise((res) => { if (window.OneSignalDeferred) window.OneSignalDeferred.push(async (OS) => { try { res(await fn(OS)); } catch (err) { res(null); } }); else res(null); });
    W.$("#notif").onchange = async (e) => {
      if (e.target.checked) {
        if (!("Notification" in window)) { e.target.checked = false; return W.toast("Add WFN to your home screen first, then turn this on."); }
        const perm = await Notification.requestPermission();
        if (perm !== "granted") { e.target.checked = false; W.write("wfn2-notify", false); return W.toast("Notifications are blocked in your phone’s settings"); }
        await withOS((OS) => OS.User.PushSubscription.optIn());
        W.write("wfn2-notify", true); W.toast("Reminders on");
      } else { await withOS((OS) => OS.User.PushSubscription.optOut()); W.write("wfn2-notify", false); W.toast("Reminders off"); }
      W.$("#nh").textContent = notifHint();
    };
    const vp = () => { W.setSetting("showListen", W.$("#optListen").checked); W.setSetting("showTolu", W.$("#optTolu").checked); if (W.applyVoicePrefs) W.applyVoicePrefs(); W.toast("Saved"); };
    W.$("#optListen").onchange = vp; W.$("#optTolu").onchange = vp; W.$("#optNatural").onchange = () => { W.setSetting("naturalVoice", W.$("#optNatural").checked); W.toast("Saved"); };
    W.$("#tryTolu").onclick = () => W.openTolu && W.openTolu();
    W.$("#siri").onclick = () => W.sheet(`<div class="sheet-head"><h2>Add Tolu to Siri</h2><button class="btn sm soft" data-close>Done</button></div>
      <p class="ink2" style="font-size:15px;line-height:23px">Make a one-step Shortcut, then say “Hey Siri, Tolu” and WFN opens with Tolu ready to listen.</p>
      <ol class="points card" style="box-shadow:none">${["Open the Shortcuts app on your iPhone and tap +.", "Tap Add Action, search for “Open URLs”, and choose it.", "Type the link below as the URL.", "Tap the name at the top, call it “Tolu”, and tap Done.", "Now say “Hey Siri, Tolu”."].map((x, i) => `<li><span class="n">${i + 1}</span><p style="font-family:var(--sans);font-size:15.5px;line-height:24px">${x}</p></li>`).join("")}</ol>
      <div style="display:flex;gap:8px;align-items:center"><code style="flex-grow:1;padding:12px 14px;border-radius:14px;background:var(--sunk);font-size:14px;word-break:break-all">https://wfnglobal.org/app/#/tolu</code><button class="btn" id="cpT">Copy</button></div>
      <p class="small muted">On Android, add the same link to Google Assistant routines or as a home-screen shortcut.</p>`, (el) => { W.$("#cpT", el).onclick = () => W.copyText("https://wfnglobal.org/app/#/tolu"); });
    W.$("#inst").onclick = installSheet;
    W.$("#bk").onclick = backupSheet;
    W.$("#about").onclick = aboutSheet;
  });
  function notifHint() {
    if (!("Notification" in window)) return "Add WFN to your home screen to turn this on";
    if (Notification.permission === "denied") return "Blocked in your phone’s settings";
    return "Verse, declaration, study and sermon, every morning";
  }

  function installSheet() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    W.sheet(`<div class="sheet-head"><h2>Add to home screen</h2><button class="btn sm soft" data-close>Done</button></div>
      <ol class="points card" style="box-shadow:none">${(ios
        ? ["Open wfnglobal.org/app in Safari.", "Tap the Share button at the bottom of the screen.", "Choose “Add to Home Screen”, then Add."]
        : ["Open wfnglobal.org/app in Chrome.", "Tap the menu (three dots) at the top right.", "Choose “Install app” or “Add to Home screen”."]).map((t, i) => `<li><span class="n">${i + 1}</span><p style="font-family:var(--sans);font-size:15.5px;line-height:24px">${t}</p></li>`).join("")}</ol>
      <p class="small muted">Once installed, WFN opens full screen and keeps working without a connection.</p>`);
  }
  function backupSheet() {
    W.sheet(`<div class="sheet-head"><h2>Back up</h2><button class="btn sm soft" data-close>Done</button></div>
      <p class="ink2" style="font-size:15px;line-height:23px">Your notes, highlights, saved verses, prayers and plan progress live only on this phone. Save a backup file and keep it somewhere safe, like your email or cloud drive.</p>
      <button class="btn lg block" id="exp">${icon("download", "sm")}Save backup file</button>
      <label class="btn lg block ghost" for="imp" style="cursor:pointer">Restore from a backup</label><input type="file" id="imp" accept="application/json,.json" class="sr">`, (el) => {
      W.$("#exp", el).onclick = () => {
        const data = {}; ["wfn-app-profile", "wfn-app-notes", "wfn-app-marks", "wfn-app-prayers", "wfn-app-plans", "wfn-app-activity", "wfn2-settings", "wfn2-read-ch", "wfn2-photo", "wfn2-since"].forEach((k) => { const v = localStorage.getItem(k); if (v != null) data[k] = v; });
        const blob = new Blob([JSON.stringify({ app: "WFN", v: 2, at: new Date().toISOString(), data })], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "wfn-backup-" + W.dayKey() + ".json"; document.body.appendChild(a); a.click(); a.remove();
        W.toast("Backup saved");
      };
      W.$("#imp", el).onchange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        f.text().then((txt) => {
          const j = JSON.parse(txt);
          if (!j || j.app !== "WFN" || !j.data) throw new Error("bad");
          W.ask("Replace what’s on this phone with this backup?", "Restore", () => {
            Object.entries(j.data).forEach(([k, v]) => localStorage.setItem(k, v));
            W.toast("Restored"); W.route();
          });
        }).catch(() => W.toast("That file isn’t a WFN backup"));
      };
    });
  }
  function aboutSheet() {
    W.sheet(`<div class="sheet-head"><h2>Word &amp; Faith Network</h2><button class="btn sm soft" data-close>Done</button></div>
      <p class="serif" style="font-size:18px;line-height:28px">The Word produces faith, and faith prays.</p>
      <p class="small" style="font-weight:600;color:var(--amber)">Romans 10:17 · So then faith cometh by hearing, and hearing by the word of God.</p>
      <div class="card list" style="box-shadow:none">${[["The Word", "Scripture every day, not just read but declared.", "c-amber"], ["Prayer", "Declarations and prayers grounded in Scripture, morning and night.", "c-spruce"], ["Faith", "Studies, sermons and books that move you from knowing about God to walking in His promises.", "c-slate"]].map(([a, b, c], i) => `<div class="row-link" style="cursor:default"><span class="tile-ic ${c}" style="font:600 15px var(--sans)">${i + 1}</span><span class="grow"><span class="label" style="font-weight:600">${a}</span><span class="hint" style="font-size:13.5px;line-height:20px">${b}</span></span></div>`).join("")}</div>
      <p class="small ink2">Website: <a href="https://wfnglobal.org">wfnglobal.org</a><br>Privacy: WFN doesn’t need an account. Your notes, highlights and prayers stay on this phone.</p>
      <h3 style="margin:6px 0 0;font:600 15px var(--sans)">Credits</h3>
      <p class="small ink2"><b>Scripture text.</b> The Bible reader’s default text is the King James Version (KJV), public domain. Other versions are fetched from free, public-domain or openly licensed sources (bible-api.com). Yorùbá, Igbo and Hausa are machine-translated from the KJV.</p>
      <p class="small ink2"><b>Word definitions.</b> Bible names, places and terms come from Easton’s Bible Dictionary (M.G. Easton, 1897) and Smith’s Bible Dictionary (William Smith, 1863), both public domain, via the open bible-dictionary-dataset project (CC BY 4.0). Modern English words come from a free public dictionary. Related verses are from OpenBible.info (CC BY). Chapter summaries are original to Word &amp; Faith Network.</p>`);
  }

  // ---------- kept lists ----------
  W.view("kept", function (main, parts) {
    const k = parts[0] || "notes";
    const titles = { notes: "Notes & journal", highlights: "Highlights", verses: "Saved verses", prayers: "My prayer list" };
    if (k === "prayers") return W.go("#/prayer");
    if (k === "notes") return W.go("#/journal");
    const marks = W.S.getMarks().filter((m) => (k === "highlights" ? m.color : m.saved)).sort((a, b) => (Math.round(b.createdAt / 60000) - Math.round(a.createdAt / 60000)) || a.verse - b.verse);
    main.innerHTML = W.topbar(titles[k], { back: "#/you" }) + `<div class="page tight">${marks.length ? `<div class="card list">${marks.map((m) => `<div class="row-link" style="align-items:flex-start;padding:14px 18px">
      <a href="#/bible/${m.bookSlug}/${m.chapter}/${m.verse}" class="grow" style="text-decoration:none;color:var(--ink)"><span class="serif" style="font-size:16.5px;line-height:26px;${m.color ? `background:${{ gold: "#F7E3B5", green: "#CDE8E4", mint: "#CDE8E4", pink: "#F3D6D6", rose: "#F3D6D6", blue: "#D6E2F2", sky: "#D6E2F2" }[m.color] || "#F7E3B5"};color:#1F1D1B;border-radius:4px;padding:0 2px;-webkit-box-decoration-break:clone;box-decoration-break:clone` : ""}">${esc(m.text)}</span><span class="hint" style="display:block;margin-top:6px">${esc(m.bookName)} ${m.chapter}:${m.verse}</span></a>
      <button class="icon-btn" data-del="${m.id}" aria-label="Remove">${icon("trash", "sm")}</button></div>`).join("")}</div>`
      : `<div class="empty">${k === "highlights" ? "Tap any verse in the Bible and pick a colour to highlight it." : "Tap any verse in the Bible and choose Save to keep it here."}</div>`}</div>`;
    W.$$("[data-del]", main).forEach((b) => b.onclick = () => { W.S.deleteMark(b.dataset.del); W.route(); });
  });

  W.view("journal", function (main, parts) {
    const dream = parts[0] === "dream";
    const notes = W.S.getNotes();
    main.innerHTML = W.topbar(dream ? "Dream journal" : "Notes & journal", { back: dream ? "#/dreams" : "#/you", right: `<button class="icon-btn" id="nn" aria-label="New entry">${icon("plus")}</button>` }) + `<div class="page tight">
      ${dream ? `<p class="small ink2" style="padding:0 4px">Write it down, pray over it, then let it go. Entries stay private on this phone.</p>` : ""}
      ${notes.filter((n) => !dream || n.type === "dream").length ? `<div class="card list">${notes.filter((n) => !dream || n.type === "dream").map((n) => `<div class="row-link" style="align-items:flex-start;padding:14px 18px">
        <span class="grow"><span class="hint">${esc(n.type === "dream" ? "Dream" : n.refLabel || "Note")} · ${new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span><span style="font-size:15.5px;line-height:24px;white-space:pre-wrap">${esc(n.text)}</span>
        ${n.refKey && /^(bible:)?[a-z0-9-]+:\d+(:\d+)?$/.test(n.refKey) ? `<a href="#/bible/${n.refKey.replace(/^bible:/, "").split(":").join("/")}" class="small" style="font-weight:600;text-decoration:none;margin-top:4px">Open ${esc(n.refLabel || "")}</a>` : ""}</span>
        <button class="icon-btn" data-del="${n.id}" aria-label="Delete">${icon("trash", "sm")}</button></div>`).join("")}</div>` : `<div class="empty">${dream ? "No dreams written down yet." : "Notes you write on verses and studies appear here."}</div>`}</div>`;
    W.$("#nn").onclick = () => W.sheet(`<div class="sheet-head"><h2>${dream ? "Write down a dream" : "New note"}</h2><button class="btn sm soft" data-close>Cancel</button></div>
      <label class="sr" for="jt">Entry</label><textarea class="field" id="jt" placeholder="${dream ? "What did you see? How did you feel when you woke?" : "What is on your heart?"}"></textarea>
      ${dream ? `<p class="small muted">Then pray: “Father, I hand this dream to You. Let only Your counsel stand.”</p>` : ""}
      <button class="btn lg block" id="js">Save</button>`, (el) => {
      W.$("#js", el).onclick = () => { const v = W.$("#jt", el).value.trim(); if (!v) return; W.S.addNote(dream ? "dream" : "journal", null, dream ? "Dream" : "Journal", v); W.closeSheet(); W.route(); };
    });
    W.$$("[data-del]", main).forEach((b) => b.onclick = () => { W.ask("Delete this entry?", "Delete", () => { W.S.deleteNote(b.dataset.del); W.route(); }); });
  });
})();

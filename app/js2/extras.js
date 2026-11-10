// WFN App 2.0 — Invite (QR + scanner), Give, The Story of Jesus, Word Climb.
(function () {
  "use strict";
  const W = window.WFN2;
  const { esc, icon } = W;
  const SITE = "https://wfnglobal.org/app/";
  const CONTACT = "wordandfaithnetwork@gmail.com";

  // ---------- Invite ----------
  function inviteLink() {
    const p = W.profile();
    const who = W.slugify(p.name || "") || "friend";
    return SITE + "?invite=" + encodeURIComponent(who);
  }
  function qrSvg(text) {
    const q = window.qrcode(0, "Q");
    q.addData(text); q.make();
    const n = q.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges" role="img" aria-label="QR code that opens WFN with your invite"><path d="${d}" fill="#1F1D1B"/></svg>`;
  }
  function seg(active) {
    return `<div class="seg" role="tablist" aria-label="Invite"><a role="tab" href="#/invite" aria-selected="${active === "code"}">My code</a><a role="tab" href="#/scan" aria-selected="${active === "scan"}">Scan</a></div>`;
  }
  W.view("invite", function (main) {
    const p = W.profile();
    const link = inviteLink();
    main.innerHTML = `<div class="dark-screen">
      <header class="topbar"><a class="icon-btn on-hero" href="#/you" data-back aria-label="Back">${icon("back")}</a><h1>Invite friends</h1><span class="spacer44"></span></header>
      ${seg("code")}
      <section class="qr-card" aria-label="Your invite code">
        ${W.avatar()}
        <span style="display:flex;flex-direction:column;align-items:center;gap:2px"><span class="serif" style="font-size:22px;line-height:28px">${esc(p.name || "Word and Faith Network")}</span><span class="small" style="color:#6E6A63">wfnglobal.org/app</span></span>
        <div class="qr-box">${qrSvg(link)}<span class="mark">${W.emblem(32)}</span></div>
        <p style="text-align:center;font-size:14.5px;line-height:21px;color:#55514B">Scan to join me on WFN. The Word, prayer and faith, every day, free.</p>
      </section>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 24px">
        <button class="btn lg light" id="sh">${icon("share", "sm")}Share invite</button>
        <button class="btn lg outline-light" id="cp">${icon("link", "sm")}Copy link</button>
      </div>
      <p style="margin:0 32px;text-align:center;font-size:13px;line-height:19px;color:#9FBDBA">Sends by WhatsApp, SMS, email or any app on your phone.${p.name ? "" : ' <a href="#/you" style="color:#F6F3EC">Add your name</a> so friends know it’s you.'}</p>
    </div>`;
    const msg = (p.name ? p.name.split(" ")[0] + " invited you to" : "Join me on") + " WFN: the Word, prayer and faith, every day, free.";
    W.$("#sh").onclick = () => W.shareOrCopy({ title: "Word and Faith Network", text: msg, url: link });
    W.$("#cp").onclick = () => W.copyText(link);
  });

  // ---------- Scan ----------
  let stream = null, raf = 0;
  function stopCam() { cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; }
  window.addEventListener("hashchange", () => { if (!/^#\/scan/.test(location.hash)) stopCam(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopCam(); });
  let jsqrLoading = null;
  function loadJsQR() {
    if (window.jsQR) return Promise.resolve();
    if (!jsqrLoading) jsqrLoading = new Promise((res, rej) => { const s = document.createElement("script"); s.src = (document.querySelector('script[src*="qrcode.js"]').src).replace("qrcode.js", "jsQR.js"); s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    return jsqrLoading;
  }
  async function detector() {
    if ("BarcodeDetector" in window) {
      try { const f = await window.BarcodeDetector.getSupportedFormats(); if (f.includes("qr_code")) { const d = new window.BarcodeDetector({ formats: ["qr_code"] }); return async (src) => { const r = await d.detect(src); return r[0] ? r[0].rawValue : null; }; } } catch (e) {}
    }
    await loadJsQR();
    const c = document.createElement("canvas"), ctx = c.getContext("2d", { willReadFrequently: true });
    return async (src) => {
      const w = src.videoWidth || src.naturalWidth || src.width, h = src.videoHeight || src.naturalHeight || src.height;
      if (!w || !h) return null;
      const k = Math.min(1, 720 / Math.max(w, h)); c.width = Math.round(w * k); c.height = Math.round(h * k);
      ctx.drawImage(src, 0, 0, c.width, c.height);
      const img = ctx.getImageData(0, 0, c.width, c.height);
      const r = window.jsQR(img.data, c.width, c.height, { inversionAttempts: "dontInvert" });
      return r ? r.data : null;
    };
  }
  function handleCode(text) {
    stopCam();
    if (navigator.vibrate) navigator.vibrate(30);
    let url = null; try { url = new URL(text); } catch (e) {}
    const ours = url && /(^|\.)wfnglobal\.org$/.test(url.hostname);
    const who = ours && url.searchParams.get("invite");
    W.sheet(`<div class="sheet-head"><h2>${ours ? "A WFN invite" : "Code scanned"}</h2><button class="btn sm soft" data-close>Close</button></div>
      ${ours ? `<p class="ink2" style="font-size:15.5px;line-height:24px">${who && who !== "friend" ? esc(who.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())) + " shared Word and Faith Network with you." : "This code opens Word and Faith Network."} Share the app with someone else the same way from your own code.</p>
        <a class="btn lg block" href="#/invite" data-close>Show my code</a>`
      : `<p class="ink2" style="font-size:15px;line-height:23px;word-break:break-all">${esc(text)}</p>
        ${url && /^https?:$/.test(url.protocol) ? `<p class="small muted">This link isn’t from WFN. Only open it if you trust where it came from.</p><a class="btn lg block ghost" href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">Open link</a>` : `<button class="btn lg block ghost" id="cpS">Copy text</button>`}`}
      <button class="btn block soft" id="again">Scan another</button>`, (el) => {
      const c = W.$("#cpS", el); if (c) c.onclick = () => W.copyText(text);
      W.$("#again", el).onclick = () => { W.closeSheet(); W.route(); };
    });
  }
  W.view("scan", function (main) {
    main.innerHTML = `<div class="dark-screen" style="background:radial-gradient(80% 50% at 50% 45%, #22312F 0%, #0C1514 75%)">
      <header class="topbar"><a class="icon-btn on-hero" href="#/you" data-back aria-label="Back">${icon("back")}</a><h1>Scan a code</h1><button class="icon-btn on-hero" id="torch" aria-label="Torch" aria-pressed="false" hidden>${icon("torch")}</button><span class="spacer44" id="tsp"></span></header>
      ${seg("scan")}
      <div class="scan-wrap"><video id="vid" playsinline muted></video><span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span><span class="beam" id="beam" hidden></span></div>
      <p id="msg" style="margin:0 40px;text-align:center;font-size:15px;line-height:22px;color:#DCE7E4">Point your camera at a friend’s WFN code to open their invite.</p>
      <span style="flex-grow:1"></span>
      <div style="display:flex;flex-direction:column;gap:12px;padding:0 24px">
        <button class="btn lg light" id="cam">${icon("camera", "sm")}Allow camera</button>
        <p style="text-align:center;font-size:13px;line-height:19px;color:#9FBDBA">WFN only uses the camera while this screen is open. Nothing is recorded or saved.</p>
        <label for="pic" style="align-self:center;font-size:14px;font-weight:600;color:var(--hero-ink);text-decoration:underline;cursor:pointer">Scan from a photo instead</label><input type="file" id="pic" accept="image/*" class="sr">
      </div>
    </div>`;
    const vid = W.$("#vid"), msg = W.$("#msg");
    async function startCam() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = "This browser can’t open the camera. Use “Scan from a photo” instead."; return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      } catch (e) {
        msg.textContent = e && e.name === "NotAllowedError" ? "Camera access is off. Turn it on for this site in your browser settings, or scan from a photo." : "Couldn’t open the camera. Try scanning from a photo.";
        return;
      }
      W.$("#cam").hidden = true; W.$("#beam").hidden = false;
      vid.srcObject = stream; await vid.play().catch(() => {});
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities ? track.getCapabilities() : {};
      if (caps.torch) { const t = W.$("#torch"); t.hidden = false; W.$("#tsp").hidden = true; let on = false; t.onclick = () => { on = !on; track.applyConstraints({ advanced: [{ torch: on }] }); t.setAttribute("aria-pressed", on); }; }
      const detect = await detector();
      let last = 0;
      const tick = async (ts) => {
        if (!stream) return;
        if (ts - last > 220 && vid.readyState >= 2) { last = ts; try { const r = await detect(vid); if (r) return handleCode(r); } catch (e) {} }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    W.$("#cam").onclick = startCam;
    if (navigator.permissions && navigator.permissions.query) navigator.permissions.query({ name: "camera" }).then((s) => { if (s.state === "granted") startCam(); }).catch(() => {});
    W.$("#pic").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const img = new Image(); img.src = URL.createObjectURL(f);
      await img.decode().catch(() => {});
      const detect = await detector();
      const r = await detect(img).catch(() => null);
      if (r) handleCode(r); else msg.textContent = "No QR code found in that photo. Try a clearer picture.";
    };
  });

  // Arriving from someone's invite link.
  (function () {
    try {
      const u = new URL(location.href);
      const who = u.searchParams.get("invite");
      if (who) {
        W.write("wfn2-invited-by", who);
        u.searchParams.delete("invite"); history.replaceState(null, "", u.pathname + u.search + u.hash);
        if (who !== "friend") setTimeout(() => W.toast("Welcome! " + who.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) + " invited you."), 600);
      }
    } catch (e) {}
  })();

  // ---------- Give ----------
  // Payment links for go-live. Each is a hosted checkout page from the
  // provider (Stripe Payment Link, PayPal Donate, Paystack page). Empty
  // means that method isn't connected yet and the app says so honestly.
  const GIVING = window.WFN_GIVING || { stripe: "", paypal: "", paystack: "", interac: "" };
  const CUR = {
    CAD: { sym: "$", name: "Canadian dollar", quick: [10, 25, 50, 100] },
    USD: { sym: "$", name: "US dollar", quick: [10, 25, 50, 100] },
    GBP: { sym: "£", name: "British pound", quick: [10, 25, 50, 100] },
    NGN: { sym: "₦", name: "Nigerian naira", quick: [5000, 10000, 25000, 50000] },
  };
  const FUNDS = [
    { id: "most", name: "Where it’s needed most", text: "Keeps WFN free every day and lets the ministry put your gift where it will do the most good right now.", ic: "shield", c: "c-slate" },
    { id: "word", name: "Spread the Word", text: "Sermons, Bible studies, films, books and translations that carry the gospel to new people and new nations.", ic: "bible", c: "c-amber" },
    { id: "needy", name: "Care for the needy", text: "Food, school fees, medical help and practical care for families and communities in hardship, given in Jesus’ name.", ic: "hand", c: "c-spruce" },
  ];
  const METHODS = [
    { id: "applepay", name: "Apple Pay", hint: "Face ID or Touch ID", mark: "Pay", bg: "#1F1D1B", ink: "#fff", via: "stripe", cur: ["CAD", "USD", "GBP"] },
    { id: "googlepay", name: "Google Pay", hint: "Cards saved to your Google account", mark: "G Pay", bg: "#fff", ink: "#1F1D1B", via: "stripe", cur: ["CAD", "USD", "GBP"] },
    { id: "card", name: "Credit or debit card", hint: "Visa, Mastercard, Amex", mark: "CARD", bg: "#E4E8F0", ink: "#435C82", via: "stripe", cur: ["CAD", "USD", "GBP"] },
    { id: "paypal", name: "PayPal", hint: "Your PayPal balance or linked card", mark: "PP", bg: "#E4E8F0", ink: "#435C82", via: "paypal", cur: ["CAD", "USD", "GBP"] },
    { id: "interac", name: "Interac e-Transfer", hint: "Canada · from your bank app", mark: "e-T", bg: "#F5EAD9", ink: "#985F1E", via: "interac", cur: ["CAD"] },
    { id: "paystack", name: "Naira card or bank transfer", hint: "Nigeria · via Paystack", mark: "₦", bg: "#DFEAE6", ink: "#2A6766", via: "paystack", cur: ["NGN"] },
  ];
  function gs() { return W.settings().give; }
  function setG(patch) { W.setSetting("give", Object.assign({}, gs(), patch)); }
  function fmt(n, cur) { return CUR[cur].sym + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }); }

  W.view("give", function (main) {
    const g = gs();
    if (!CUR[g.currency]) g.currency = "CAD";
    const methods = METHODS.filter((m) => m.cur.includes(g.currency));
    if (!methods.find((m) => m.id === g.method)) { g.method = methods[0].id; setG({ method: g.method }); }
    const fund = FUNDS.find((f) => f.id === g.fund) || FUNDS[0];
    const today = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });
    main.innerHTML = W.topbar("Give", { back: "#/you" }) + `
    <div class="page" style="gap:26px;padding-top:8px">
      <section class="card" style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:26px 18px 20px;border-radius:28px" aria-label="Gift amount">
        <span class="tile-ic lg c-amber" style="width:52px;height:52px;border-radius:18px">${icon("hand")}</span>
        <div class="amount-wrap"><span class="cur-sym" aria-hidden="true">${CUR[g.currency].sym}</span>
          <label class="sr" for="amt">Amount in ${CUR[g.currency].name}s</label>
          <input class="amount" id="amt" inputmode="numeric" pattern="[0-9]*" value="${g.amount}" style="width:${String(g.amount).length + 0.6}ch">
          <button class="chip" id="curB" aria-label="Currency, ${CUR[g.currency].name}">${g.currency} ${icon("down", "xs")}</button></div>
        <div class="chips" style="justify-content:center" role="group" aria-label="Quick amounts">${CUR[g.currency].quick.map((a) => `<button class="chip ${+g.amount === a ? "on" : ""}" data-q="${a}" style="min-width:56px;justify-content:center;font-variant-numeric:tabular-nums;${+g.amount === a ? "" : "background:var(--card);box-shadow:inset 0 0 0 1px var(--line)"}">${fmt(a, g.currency)}</button>`).join("")}</div>
        <button class="row-link" id="fundB" style="border-radius:18px;background:var(--bg);min-height:52px;padding:0 16px"><span class="small muted">To</span><span class="grow"><span class="label" style="font-weight:600;font-size:15px">${esc(fund.name)}</span></span><span class="chev">${icon("down", "xs")}</span></button>
      </section>

      <section class="card list" aria-label="Schedule">
        <label class="row-link" style="min-height:64px"><span class="grow"><span class="label" style="font-weight:600">Give monthly</span><span class="hint">Same gift on this date each month. Change or stop anytime.</span></span><span class="switch"><input type="checkbox" id="mon" ${g.monthly ? "checked" : ""}><span></span></span></label>
        <div class="row-link" style="cursor:default"><span class="grow"><span class="label">Date</span></span><span class="ink2" style="font-size:14.5px">Today, ${esc(today)}</span></div>
      </section>

      <section class="section" aria-labelledby="payH">
        <h2 id="payH" class="eyebrow" style="padding:0 4px">Pay with</h2>
        <div class="card list" role="radiogroup" aria-labelledby="payH">${methods.map((m) => `<button class="row-link" role="radio" aria-checked="${g.method === m.id}" data-m="${m.id}" style="min-height:62px">
          <span class="pay-mark" style="background:${m.bg};color:${m.ink}">${m.mark}</span>
          <span class="grow"><span class="label" style="font-weight:600;font-size:15px">${m.name}</span><span class="hint">${m.hint}</span></span><span class="radio-dot" aria-hidden="true"></span></button>`).join("")}</div>
      </section>

      <div style="display:flex;flex-direction:column;gap:12px">
        <button class="btn lg dark block" id="giveB" style="height:56px">${icon("hand", "sm")}<span id="giveL">Give ${fmt(g.amount, g.currency)} ${g.currency}${g.monthly ? " monthly" : ""}</span></button>
        <p class="small muted" style="display:flex;gap:8px;padding:0 8px">${icon("lock", "xs")}<span>Payments are handled by secure, trusted processors. WFN never sees or stores your card number. A receipt is sent to your email.</span></p>
      </div>

      <section class="section" aria-labelledby="whyH" style="gap:16px;padding-top:10px">
        <span class="eyebrow amber" style="padding:0 4px">Why give to WFN</span>
        <h2 id="whyH" style="margin:0;padding:0 4px;font:400 28px/35px var(--serif);letter-spacing:-0.01em">Help the Word go further, and reach the people who need it most.</h2>
        <p class="serif" style="padding:0 4px;font-size:17px;line-height:28px;color:var(--ink-2)">Word and Faith Network exists so that anyone, anywhere, can open the Bible, pray with confidence and grow in faith. Every verse, sermon, prayer and study in this app is free, with no ads, and it will stay that way. That is only possible because people like you choose to sow into it.</p>
        ${[["Spread the Word", "Your gift keeps the daily sermons, declarations and Bible studies coming, and carries the gospel further: films, books, translations, and outreach into new nations and languages.", "bible", "c-amber"],
          ["Help needy communities", "Faith that works shows up in practical ways. Gifts to Care for the needy go to food, school fees, medical help, and support for widows, orphans and families in hardship, given in Jesus’ name.", "hand", "c-spruce"],
          ["Keep it free for everyone", "No paywall and no ads, ever. A student in Lagos and a nurse in Toronto open the same app and receive the same Word, because someone gave.", "shield", "c-slate"]].map(([t, x, ic, c]) =>
          `<div class="card" style="display:flex;gap:14px;padding:18px"><span class="tile-ic lg ${c}">${icon(ic)}</span><span style="display:flex;flex-direction:column;gap:4px"><span style="font:600 16px var(--sans)">${t}</span><span class="ink2" style="font-size:14px;line-height:21px">${x}</span></span></div>`).join("")}
        <blockquote class="band" style="margin:6px 0 0;display:flex;flex-direction:column;gap:10px"><p class="serif" style="font-size:18px;line-height:29px">“Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.”</p><cite class="small" style="font-style:normal;font-weight:600;color:var(--amber)">2 Corinthians 9:7 · KJV</cite></blockquote>
        <p class="small muted" style="padding:0 4px">Want to give another way, or partner with WFN as a church or business? <a href="mailto:${CONTACT}?subject=${encodeURIComponent("Partnering with WFN")}" style="font-weight:600">Talk to us</a>.</p>
      </section>
    </div>`;

    const amt = W.$("#amt");
    const label = () => { const g2 = gs(); W.$("#giveL").textContent = "Give " + fmt(g2.amount, g2.currency) + " " + g2.currency + (g2.monthly ? " monthly" : ""); };
    amt.oninput = () => { const v = amt.value.replace(/\D/g, "").slice(0, 7); amt.value = v; amt.style.width = (v.length || 1) + 0.6 + "ch"; setG({ amount: +v || 0 }); label();
      W.$$("[data-q]", main).forEach((b) => { const on = +b.dataset.q === +v; b.classList.toggle("on", on); b.style.background = on ? "" : "var(--card)"; b.style.boxShadow = on ? "" : "inset 0 0 0 1px var(--line)"; }); };
    W.$$("[data-q]", main).forEach((b) => b.onclick = () => { setG({ amount: +b.dataset.q }); W.route(); });
    W.$("#mon").onchange = (e) => { setG({ monthly: e.target.checked }); label(); };
    W.$$("[data-m]", main).forEach((b) => b.onclick = () => { setG({ method: b.dataset.m }); W.$$("[data-m]", main).forEach((x) => x.setAttribute("aria-checked", x === b)); });
    W.$("#curB").onclick = () => W.sheet(`<div class="sheet-head"><h2>Currency</h2><button class="btn sm soft" data-close>Done</button></div>
      <div class="card list" role="radiogroup" style="box-shadow:none">${Object.entries(CUR).map(([k, c]) => `<button class="row-link" role="radio" aria-checked="${gs().currency === k}" data-cur="${k}"><span class="pay-mark" style="background:var(--sunk);color:var(--ink);box-shadow:none">${c.sym}</span><span class="grow"><span class="label" style="font-weight:600">${k}</span><span class="hint">${c.name}</span></span><span class="radio-dot" aria-hidden="true"></span></button>`).join("")}</div>`, (el) => {
      W.$$("[data-cur]", el).forEach((b) => b.onclick = () => { const k = b.dataset.cur; setG({ currency: k, amount: CUR[k].quick[1] * (k === "NGN" ? 1 : 2) }); W.closeSheet(); W.route(); });
    });
    W.$("#fundB").onclick = () => W.sheet(`<div class="sheet-head"><h2>Give to</h2><button class="btn sm soft" data-close>Done</button></div>
      <div role="radiogroup" aria-label="Fund" style="display:flex;flex-direction:column;gap:10px">${FUNDS.map((f) => `<button role="radio" aria-checked="${gs().fund === f.id}" data-fund="${f.id}" style="display:flex;gap:14px;padding:16px;border-radius:22px;text-align:left;background:${gs().fund === f.id ? "var(--bg)" : "var(--card)"};border:${gs().fund === f.id ? "2px solid var(--spruce)" : "1px solid var(--line)"}">
        <span class="tile-ic lg ${f.c}">${icon(f.ic)}</span><span style="display:flex;flex-direction:column;gap:4px;flex-grow:1"><span style="font:600 16px var(--sans)">${f.name}</span><span class="ink2" style="font-size:13.5px;line-height:20px">${f.text}</span></span><span class="radio-dot" aria-hidden="true"></span></button>`).join("")}</div>`, (el) => {
      W.$$("[data-fund]", el).forEach((b) => b.onclick = () => { setG({ fund: b.dataset.fund }); W.closeSheet(); W.route(); });
    });
    W.$("#giveB").onclick = () => {
      const g2 = gs();
      if (!(g2.amount > 0)) { amt.focus(); return W.toast("Enter an amount"); }
      const m = METHODS.find((x) => x.id === g2.method);
      const f = FUNDS.find((x) => x.id === g2.fund) || FUNDS[0];
      const link = GIVING[m.via];
      const summary = `${fmt(g2.amount, g2.currency)} ${g2.currency}${g2.monthly ? " every month" : ""} to ${f.name}, by ${m.name}`;
      if (link) {
        const u = new URL(link);
        if (m.via === "interac") return W.sheet(`<div class="sheet-head"><h2>Interac e-Transfer</h2><button class="btn sm soft" data-close>Done</button></div><p class="ink2">In your bank app, send ${fmt(g2.amount, "CAD")} to <b>${esc(link)}</b> with the message “${esc(f.name)}”.</p><button class="btn lg block" id="cpI">Copy email</button>`, (el) => { W.$("#cpI", el).onclick = () => W.copyText(link); });
        u.searchParams.set("client_reference_id", g2.fund);
        window.open(u.href, "_blank", "noopener");
        return;
      }
      W.sheet(`<div class="sheet-head"><h2>Thank you</h2><button class="btn sm soft" data-close>Close</button></div>
        <p class="serif" style="font-size:18px;line-height:28px">${esc(summary)}.</p>
        <p class="ink2" style="font-size:15px;line-height:23px">Online giving is being connected and opens soon. Until then, email the ministry and we’ll send you the details to complete your gift.</p>
        <a class="btn lg block" href="mailto:${CONTACT}?subject=${encodeURIComponent("I’d like to give to WFN")}&body=${encodeURIComponent("Hello WFN,\n\nI'd like to give " + summary + ".\n\nThank you.")}">Email WFN</a>`);
    };
  });

  // ---------- The Story of Jesus ----------
  // Paintings: original scenes made for WFN (redesign/museum-source), one per gallery.
  const ART = ["01-prophecy", "02-bethlehem", "03-nazareth", "04-jordan", "05-galilee", "06-jerusalem", "07-upper-room", "08-gethsemane", "09-via-dolorosa", "10-golgotha", "11-garden-tomb", "12-mount-of-olives"];
  const ART_TITLES = ["The Prophet’s Lamp", "Glory in the Stable", "The Carpenter’s Shop", "The Heavens Opened", "Dawn on the Lake", "Hosanna in the Road", "The Bread and the Cup", "The Garden at Night", "The Narrow Street", "It Is Finished", "The Stone Rolled Away", "Into the Cloud"];
  const artSrc = (i) => W.BASE + "app/img/museum/" + ART[i] + ".jpg";
  const GALLERIES = [
    { n: "I", place: "Prophecy", title: "Written Centuries Before", refs: [["Isaiah 53:5", "isaiah/53/5"], ["Micah 5:2", "micah/5/2"]], text: "Hundreds of years before Bethlehem, the prophets wrote of a child born in David’s town, a servant wounded for our transgressions, a King riding on a donkey. The story of Jesus begins in promises." , tone: ["#2B2A4A", "#121126"] },
    { n: "II", place: "Bethlehem", title: "The Nativity", refs: [["Luke 2:1–20", "luke/2"], ["Matthew 2:1–12", "matthew/2"]], text: "No room in the inn, a manger for a cradle, shepherds at night and wise men from the east. God came near in the smallest way, and heaven sang about it.", tone: ["#3B2A1A", "#140D07"] },
    { n: "III", place: "Nazareth", title: "The Hidden Years", refs: [["Luke 2:40–52", "luke/2/40"]], text: "A carpenter’s son in a small town. At twelve He sat among the teachers in the temple, asking and answering. For thirty years He grew in wisdom and stature, and in favour with God and man.", tone: ["#3A3322", "#14110A"] },
    { n: "IV", place: "The Jordan", title: "The Baptism", refs: [["Matthew 3:13–17", "matthew/3/13"]], text: "John hesitated, but Jesus went down into the water. The heavens opened, the Spirit descended like a dove, and the Father spoke: This is my beloved Son, in whom I am well pleased.", tone: ["#1E3A3E", "#0A1719"] },
    { n: "V", place: "Galilee", title: "Teaching and Miracles", refs: [["Matthew 5:1–12", "matthew/5"], ["Mark 4:35–41", "mark/4/35"]], text: "On a hillside He taught the Beatitudes. On the lake He told the storm to be still. The blind saw, the lame walked, and the crowds followed Him from town to town.", tone: ["#20374A", "#0B141C"] },
    { n: "VI", place: "Jerusalem", title: "The King Rides In", refs: [["John 12:12–19", "john/12/12"]], text: "Palm branches and garments on the road. Hosanna, blessed is the King of Israel that cometh in the name of the Lord. He came not on a war horse, but on a young donkey, just as Zechariah wrote.", tone: ["#4A3A1E", "#1A1309"] },
    { n: "VII", place: "The Upper Room", title: "The Last Supper", refs: [["Luke 22:7–20", "luke/22/7"], ["John 13:1–17", "john/13"]], text: "He washed His disciples’ feet. He broke bread and said, This is my body which is given for you. The cup was the new testament in His blood.", tone: ["#43261E", "#170C09"] },
    { n: "VIII", place: "Gethsemane", title: "Not My Will", refs: [["Matthew 26:36–46", "matthew/26/36"], ["Luke 22:39–46", "luke/22/39"]], text: "In the olive garden He prayed until His sweat was as great drops of blood. Nevertheless not my will, but thine, be done. Then He rose to meet the soldiers.", tone: ["#1F2E22", "#0A110B"] },
    { n: "IX", place: "Via Dolorosa", title: "The Trial and the Way", refs: [["John 18:28–19:16", "john/18/28"], ["Luke 23:26–32", "luke/23/26"]], text: "Before Pilate He said, My kingdom is not of this world. Scourged and crowned with thorns, He carried the cross through the streets until Simon of Cyrene was made to bear it.", tone: ["#3E2A20", "#150E0A"] },
    { n: "X", place: "Golgotha", title: "The Cross", refs: [["Luke 23:33–46", "luke/23/33"], ["John 19:17–30", "john/19/17"]], text: "At the place of the skull they crucified Him between two thieves. Darkness covered the land. He bore our sins in His own body on the tree, and cried with a loud voice, It is finished.", tone: ["#2C1414", "#0E0606"], sayings: [["Father, forgive them; for they know not what they do.", "Luke 23:34"], ["To day shalt thou be with me in paradise.", "Luke 23:43"], ["Woman, behold thy son! … Behold thy mother!", "John 19:26–27"], ["My God, my God, why hast thou forsaken me?", "Matthew 27:46"], ["I thirst.", "John 19:28"], ["It is finished.", "John 19:30"], ["Father, into thy hands I commend my spirit.", "Luke 23:46"]] },
    { n: "XI", place: "The Garden Tomb", title: "He Is Risen", refs: [["Matthew 28:1–10", "matthew/28"], ["John 20:1–18", "john/20"]], text: "Early on the first day of the week the stone was rolled away. He is not here: for he is risen, as he said. Mary heard Him call her name in the garden.", tone: ["#2E4038", "#101814"] },
    { n: "XII", place: "Mount of Olives", title: "Ascension and Promise", refs: [["Acts 1:1–11", "acts/1"]], text: "Ye shall receive power, after that the Holy Ghost is come upon you. He was taken up, and a cloud received Him out of their sight. This same Jesus shall so come in like manner.", tone: ["#2A3A52", "#0D131C"] },
  ];
  W.view("jesus", function (main, parts) {
    const visited = W.read("wfn2-museum", []);
    if (parts[0]) return gallery(main, Math.max(1, Math.min(12, +parts[0])));
    const next = (visited.length ? Math.max(...visited) : 0) + 1;
    main.innerHTML = `
    <header class="hero-head museum-hero" style="background-image:linear-gradient(180deg, rgba(20,16,9,0.55) 0%, rgba(20,16,9,0.35) 35%, rgba(20,16,9,0.92) 100%), url('${artSrc(9)}');padding-bottom:30px">
      <a class="icon-btn on-hero" href="#/" data-back aria-label="Back" style="margin-left:-12px">${icon("back")}</a>
      <span class="eyebrow" style="color:#E9B872">A walk through the Gospels</span>
      <h1 style="font-size:36px;line-height:42px">The Story of Jesus</h1>
      <p style="color:#D9C8AE">Twelve galleries, from the prophets to the Mount of Olives. Walk them in order, read the Scripture in each room, and stand a while at the cross.</p>
      <div style="display:flex;gap:22px;padding-top:6px">${[["12", "Galleries"], ["4", "Gospels"], [String(visited.length), "Visited"]].map(([a, b]) => `<span style="display:flex;flex-direction:column"><b style="font:600 22px var(--sans)">${a}</b><span style="font-size:12.5px;color:#D9C8AE">${b}</span></span>`).join("")}</div>
      <a class="btn light" href="#/jesus/${Math.min(12, next)}" style="align-self:flex-start;margin-top:4px">${visited.length ? (next > 12 ? "Walk it again" : "Continue to Gallery " + GALLERIES[next - 1].n) : "Enter the first gallery"}</a>
    </header>
    <div class="page">
      <ol class="gallery-list">${GALLERIES.map((g, i) => { const done = visited.includes(i + 1); return `<li><span class="rail"><i class="${i && visited.includes(i) ? "done" : ""}" style="${i ? "" : "visibility:hidden"}"></i><span class="dot ${done ? "done" : ""}">${g.n}</span><i class="${done && visited.includes(i + 2) ? "done" : ""}" style="${i === 11 ? "visibility:hidden" : ""}"></i></span>
        <a href="#/jesus/${i + 1}" class="gl-item"><img class="gl-thumb" src="${artSrc(i)}" alt="" loading="lazy"><span class="gl-txt"><span class="place">${g.place}</span><span class="title">${g.title}</span><span class="meta">${g.refs.map((r) => r[0]).join(" · ")}${done ? " · visited" : ""}</span></span></a></li>`; }).join("")}</ol>
      <section class="section"><h2 class="h2" style="padding:0 4px">From the collection</h2>
        <a class="card pad" href="https://www.jesusfilm.org/watch/jesus.html/english.html" target="_blank" rel="noopener" style="display:flex;gap:14px;text-decoration:none;color:var(--ink)"><span class="tile-ic lg c-ink">${icon("play")}</span><span><span style="font:600 15.5px var(--sans)">The JESUS Film</span><br><span class="small ink2">The Gospel of Luke on film, free to watch in hundreds of languages. Opens jesusfilm.org.</span></span></a>
      </section>
    </div>`;
  });
  async function gallery(main, n) {
    const g = GALLERIES[n - 1];
    const v = W.read("wfn2-museum", []); if (!v.includes(n)) { v.push(n); W.write("wfn2-museum", v); }
    const golgotha = !!g.sayings;
    main.innerHTML = `
    <header class="hero-head museum-art" style="background-image:linear-gradient(180deg, rgba(10,8,6,0.45) 0%, rgba(10,8,6,0) 22%, rgba(10,8,6,0) 52%, rgba(10,8,6,0.88) 100%), url('${artSrc(n - 1)}')">
      <div style="display:flex;align-items:center;margin:0 -6px auto -12px"><a class="icon-btn on-hero" href="#/jesus" aria-label="All galleries">${icon("back")}</a><span style="flex-grow:1;text-align:center;font:600 13px var(--sans);color:rgba(246,243,236,0.85)">Gallery ${g.n} of XII</span><button class="icon-btn on-hero" id="gl" aria-label="Listen" aria-pressed="false">${icon("listen")}</button></div>
      <span class="eyebrow" style="color:#E9B872">${g.place}</span>
      <h1 style="font-size:34px;line-height:40px">${g.title}</h1>
    </header>
    <div class="page">
      <p class="museum-plaque"><b>${esc(ART_TITLES[n - 1])}</b><span>Gallery ${g.n} · ${esc(g.place)} · Original painting, Word and Faith Network collection</span></p>
      <div style="display:flex;justify-content:flex-end">${W.translateBtn("#gtext")}</div><p class="serif" id="gtext" style="font-size:19px;line-height:31px;padding:0 4px"><span data-tr>${esc(g.text)}</span></p>
      <div id="psg" class="stack"></div>
      ${golgotha ? `<section class="section"><h2 class="h2" style="padding:0 4px">The seven sayings from the cross</h2>
        <ol class="card points">${g.sayings.map((s, i) => `<li><span class="n" style="background:var(--amber-soft);color:var(--amber);font-size:11px">${["I", "II", "III", "IV", "V", "VI", "VII"][i]}</span><p>${esc(s[0])}<br><span class="small" style="font-family:var(--sans);font-weight:600;color:var(--amber)">${s[1]}</span></p></li>`).join("")}</ol></section>
        <div class="band" style="display:flex;flex-direction:column;gap:10px"><span class="eyebrow">Stand here a while</span><p class="serif" style="font-size:18px;line-height:29px">Lord Jesus, You were wounded for my transgressions and bruised for my iniquities. The chastisement of my peace was upon You, and by Your stripes I am healed. Thank You for the cross. Amen.</p></div>` : ""}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${n > 1 ? `<a class="btn ghost" href="#/jesus/${n - 1}">${icon("back", "sm")}${GALLERIES[n - 2].place}</a>` : `<a class="btn ghost" href="#/jesus">Entrance</a>`}
        ${n < 12 ? `<a class="btn" href="#/jesus/${n + 1}">${GALLERIES[n].place}${icon("chev", "sm")}</a>` : `<a class="btn" href="#/jesus">Finish the walk</a>`}
      </div>
    </div>`;
    W.$("#gl").onclick = (e) => W.speak([g.title + "."].concat(W.$$("#gtext [data-tr], #psg p").map((x) => x.textContent)), e.currentTarget);
    // Show the first passage of each reference in full, from the offline Bible.
    const box = W.$("#psg");
    for (const [label, path] of g.refs) {
      const [slug, ch, vs] = path.split("/");
      try {
        const b = await W.book(slug);
        const verses = b.chapters[+ch - 1];
        const m = label.match(/:(\d+)[–-](\d+)/);
        const from = vs ? +vs : 1, to = m ? Math.min(verses.length, +m[2]) : vs ? +vs : Math.min(verses.length, from + 5);
        const txt = verses.slice(from - 1, to).map((t) => W.plain(t)).join(" ");
        box.insertAdjacentHTML("beforeend", `<a class="scripture-box" href="#/bible/${slug}/${ch}/${from}" style="text-decoration:none;color:var(--ink)"><p>${esc(txt.length > 700 ? txt.slice(0, 700) + "…" : txt)}</p><cite>${esc(label)} · KJV · read in the Bible</cite></a>`);
      } catch (e) {}
    }
  }

  // The Word Climb lives in app/js2/climb.js.
})();

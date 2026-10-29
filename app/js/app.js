(function () {
  "use strict";

  const viewEl = document.getElementById("view");
  const titleEl = document.getElementById("headerTitle");
  const backEl = document.getElementById("appBack");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const sheetEl = document.getElementById("sheet");
  const sheetScrimEl = document.getElementById("sheetScrim");
  const sheetBodyEl = document.getElementById("sheetBody");

  // ---------------------------------------------------------------------
  // Bottom sheet: generic modal used for verse actions, notes, profile edit
  // ---------------------------------------------------------------------

  function openSheet(html) {
    sheetBodyEl.innerHTML = html;
    sheetEl.hidden = false;
    sheetScrimEl.hidden = false;
    requestAnimationFrame(() => {
      sheetEl.classList.add("show");
      sheetScrimEl.classList.add("show");
    });
  }
  function closeSheet() {
    sheetEl.classList.remove("show");
    sheetScrimEl.classList.remove("show");
    setTimeout(() => {
      sheetEl.hidden = true;
      sheetScrimEl.hidden = true;
      sheetBodyEl.innerHTML = "";
    }, 200);
  }
  sheetScrimEl.addEventListener("click", closeSheet);

  // ---------------------------------------------------------------------
  // Content that mirrors wfnglobal.org (kept as small static lists here so
  // the app works fully offline; update alongside the website).
  // ---------------------------------------------------------------------

  // VERSES[0] is always TODAY's verse, shown as the Home screen's "Verse of
  // the Day" — update it (and DECLARATION below) whenever the day's content
  // changes, the same way SERMONS[0] is kept current. The rest of the array
  // is an evergreen backup pool, kept for continuity.
  const VERSES = [
    { text: "He has delivered us from the power of darkness and conveyed us into the kingdom of the Son of His love,", ref: "Colossians 1:13 NKJV" },
    { text: "Praying always with all prayer and supplication in the Spirit, and watching thereunto with all perseverance and supplication for all saints;", ref: "Ephesians 6:18 KJV" },
    { text: "Blessed is the man who endures temptation; for when he has been approved, he will receive the crown of life which the Lord has promised to those who love Him.", ref: "James 1:12 NKJV" },
    { text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.", ref: "Isaiah 41:10" },
    { text: "The heavens declare the glory of God; and the firmament sheweth his handywork.", ref: "Psalm 19:1" },
    { text: "Let nothing be done through strife or vainglory; but in lowliness of mind let each esteem other better than themselves.", ref: "Philippians 2:3" },
    { text: "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.", ref: "Psalm 23:1-2" },
    { text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", ref: "Jeremiah 29:11" },
    { text: "Pray without ceasing. Continue earnestly in prayer, being vigilant in it with thanksgiving.", ref: "1 Thessalonians 5:17; Colossians 4:2" },
    { text: "Blessed be the Lord, who daily loadeth us with benefits, even the God of our salvation.", ref: "Psalm 68:19" },
    { text: "For the word of God is living and powerful, and sharper than any two-edged sword, piercing even to the division of soul and spirit, and of joints and marrow, and is a discerner of the thoughts and intents of the heart.", ref: "Hebrews 4:12" },
    { text: "For God is not unrighteous to forget your work and labour of love, which ye have shewed toward his name, in that ye have ministered to the saints, and do minister.", ref: "Hebrews 6:10" },
    { text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.", ref: "James 1:5" },
    { text: "For the Son of man is not come to destroy men's lives, but to save them.", ref: "Luke 9:56" },
    { text: "Commit thy works unto the LORD, and thy thoughts shall be established.", ref: "Proverbs 16:3" }
  ];

  // Today's Declaration, shown on the Prayer page — kept current the same
  // way as VERSES[0] and SERMONS[0].
  // Short, punchy declaration lines — written to be read aloud, shared, and
  // saved to a phone, not read as one long paragraph. An empty string is a
  // stanza break (a blank line in the layout), not a line of its own.
  const DECLARATION = {
    lines: [
      "Father, You did not leave me in darkness to fight my way out — You delivered me! Past tense. Finished business. Already done!",
      "I was not upgraded. I was relocated — out of the kingdom of darkness and into the Kingdom of the Son of Your love!",
      "So today, darkness has no claim on my mind, no vote in my decisions, and no lease on my future!",
      "",
      "I declare: the power that used to own me does not get to boss me around anymore — I changed addresses, and I am not going back!",
      "Every fear that tries to talk to me like I still live in the old kingdom has the wrong house — I don't live there anymore!",
      "I am not fighting for deliverance today. I am walking in one that is already paid for, signed, and sealed by the Son of His love!",
      "",
      "So I will not carry today like a captive — I will carry it like royalty, because that is what citizens of this Kingdom are!",
      "If darkness is pressing on you right now — hear this: Somebody already came and got you out. You just have to walk like it's true!",
      "Save this. Say it before the day convinces you otherwise. You were delivered. You were conveyed. You belong to the Kingdom of the Son of His love. In Jesus' name, amen!"
    ],
    ref: "Colossians 1:13"
  };

  const SERMONS = [
    { slug: "not-that-kind-of-fire", title: "Not That Kind of Fire", ref: "Luke 9:51-55", date: "October 29, 2026", excerpt: "James and John wanted lightning for a village that said no. Jesus wanted mercy. What you ask God to burn down says more about your spirit than theirs." },
    { slug: "potential-in-the-holy-ghost", title: "Potential in the Holy Ghost", ref: "Acts 1:8", date: "October 28, 2026", excerpt: "You are not waiting on power. Power moved in the day you got saved and has been waiting on you to act like it." },
    { slug: "the-crown-on-the-other-side", title: "The Crown on the Other Side", ref: "James 1:12", date: "October 28, 2026", excerpt: "Endurance isn't what you survive before the blessing — it's what qualifies you for it. The crown of life was never promised to the untested." },
    { slug: "grace-gets-the-last-word", title: "Grace Gets the Last Word", ref: "Romans 5:19-21", date: "October 27, 2026", excerpt: "One man's fall wrote sin into the human story in permanent ink. One Man's obedience picked up the same pen — and wrote something stronger over it." },
    { slug: "wise-as-serpents-harmless-as-doves", title: "Wise as Serpents, Harmless as Doves", ref: "Matthew 10:16", date: "October 26, 2026", excerpt: "Jesus never promised you a safe world. He promised you a sharp mind, a soft heart, and a Sender who goes into the room first." },
    { slug: "consider-the-work-of-god", title: "Consider the Work of God", ref: "Ecclesiastes 7:11-14", date: "October 25, 2026", excerpt: "Wisdom is a defence on a good day. But what do you do on a crooked one? Solomon's answer isn't to fix it — it's to consider it." },
    { slug: "trust-in-the-lord-with-all-thine-heart", title: "Trust in the Lord With All Thine Heart", ref: "Proverbs 3:5-6", date: "October 24, 2026", excerpt: "Why surrendering your own understanding isn't a leap in the dark — it's the one condition guaranteed to make your path straight." },
    { slug: "his-mercies-are-new-every-morning", title: "His Mercies Are New Every Morning", ref: "Lamentations 2 & 3", date: "October 23, 2026", excerpt: "The same prophet who wept over the ruins of Zion also wrote, \"Great is thy faithfulness\" — a study on how hope survives the worst chapter." },
    { slug: "when-you-pray-why-worry", title: "When You Pray, Why Do You Still Worry?", ref: "Philippians 4", date: "October 22, 2026", excerpt: "Prayer and anxiety can't occupy the same heart for long — one of them has to go." },
    { slug: "show-up-for-your-people", title: "Show Up for Your People", ref: "Ruth 1", date: "October 22, 2026", excerpt: "Ruth didn't just say the words. She stayed — a study on what it means to actually show up." },
    { slug: "ye-ask-amiss", title: "Ye Ask, and Receive Not", ref: "James 4", date: "October 21, 2026", excerpt: "Not every unanswered prayer is a closed door. Some are a mirror — a study on asking amiss." },
    { slug: "the-word-is-living-and-powerful", title: "The Word Is Living and Powerful", ref: "Hebrews 4", date: "October 20, 2026", excerpt: "Sharper than any two-edged sword — it does not just inform you. It divides, exposes, and discerns." },
    { slug: "come-boldly-to-the-throne-of-grace", title: "Come Boldly to the Throne of Grace", ref: "Hebrews 4", date: "October 19, 2026", excerpt: "You were never meant to approach God with fear. A study on mercy, grace, and the boldness we have in Christ." },
    { slug: "remember-the-sabbath", title: "Remember the Sabbath Day, to Keep It Holy", ref: "Exodus 20", date: "October 18, 2026", excerpt: "Six days you labor and do all your work, but the seventh belongs to the Lord." },
    { slug: "what-shall-we-say-then", title: "What Shall We Say Then?", ref: "Romans 6", date: "October 17, 2026", excerpt: "Shall we continue in sin, that grace may abound? God forbid." },
    { slug: "the-word-faith-and-prayer", title: "The Word, Faith, and Prayer", ref: "Foundational", date: "October 16, 2026", excerpt: "Our founding teaching — why Word and Faith Network exists." }
  ];

  const PRAYER_POINTS = [
    "Thank God for His faithfulness over your life, your family, and this new day.",
    "Declare Romans 10:17 over your faith — that it is rising as you hear the Word.",
    "Bring the specific need weighing on you right now to God in prayer, by name.",
    "Pray for someone else today — a family member, a friend, a need you know of.",
    "Ask for wisdom for every decision in front of you this week (James 1:5).",
    "Thank God in advance for the answer, believing it is already done (Mark 11:24)."
  ];

  // ---------------------------------------------------------------------
  // Translate: free, no-key machine translation for the Verse of the Day
  // and today's Prayer declaration/points. Yorùbá, Igbo, and Hausa route
  // through Google's public translation endpoint. Pidgin has no
  // mainstream machine-translation engine behind it at all — Google,
  // Microsoft, and the rest simply don't carry it — so the fixed verses,
  // declaration, and prayer points below are translated once by hand and
  // shipped with the app: no network call, never fails, works offline.
  // Anything not in that hand list (longer or future content) still
  // tries a community translation-memory lookup as a best effort.
  // Every successful live translation is cached on-device so the same
  // sentence is never fetched twice, and every live call gets one retry
  // before giving up — both aimed at the "worked once, then failed"
  // pattern free translation endpoints are prone to.
  // ---------------------------------------------------------------------
  const TRANSLATE_LANGS = [
    { code: "en", name: "English" },
    { code: "yo", name: "Yorùbá" },
    { code: "ig", name: "Igbo" },
    { code: "ha", name: "Hausa" },
    { code: "pcm", name: "Pidgin" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "pt", name: "Português" }
  ];
  const TRANSLATE_TIMEOUT_MS = 7000;
  const NO_MT_LANGS = { pcm: true }; // languages with no mainstream MT engine

  // Hand-translated Nigerian Pidgin for the fixed Home/Prayer content —
  // keyed by the exact English source text. This is the content shown on
  // the Home screen's Verse of the Day and the Prayer page every day, so
  // it is worth shipping as real text instead of a live API call.
  const PIDGIN_STATIC = {
    "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.":
      "No fear; because I dey with you: no let your mind cut; because na your God be dis: I go strengthen you; yes, I go help you; yes, I go hold you up with the right hand wey dey show say I dey do wetin correct.",
    "Father, I receive Your word over today: fear has no final say — You do!":
      "Father, I receive Your word over today: fear no get final say — na You get am!",
    "You said, ‘Fear not, for I am with you’ — so I will not be shaken by what I see or hear!":
      "You talk say, ‘No fear, because I dey with you’ — so wetin I see or hear no go shake me!",
    "You said, ‘Be not dismayed, for I am your God’ — so my heart will not sink, no matter the news!":
      "You talk say, ‘No let your heart cast down, because na your God I be’ — so my heart no go sink, whatever news I hear!",
    "I will not fight today's battles in my own strength — You said You would strengthen me!":
      "I no go fight today battle with my own strength — You talk say You go strengthen me!",
    "I will not wait for help that never comes — You said You would help me!":
      "I no go wait for help wey no dey come — You talk say You go helep me!",
    "I will not hold myself together by my own hands — Your righteous right hand is holding me up!":
      "I no go hold myself together with my own hand — Your righteous right hand dey hold me up!",
    "So I declare: this day is covered, this burden is not mine alone, and fear has no home in me!":
      "So I dey declare: dis day don cover, dis load no be mine alone, and fear no get house for inside me!",
    "If you're reading this and your heart is heavy — God is saying the same word to you right now: I am with you!":
      "If na you dey read dis one and your heart heavy — na di same word God dey talk to you right now: I dey with you!",
    "Save this. Share it with someone carrying a heavy load today. Pray it out loud. In Jesus' name, amen!":
      "Save dis one. Share am give person wey carry heavy load today. Pray am out loud. For Jesus name, amen!",
    "The heavens declare the glory of God; and the firmament sheweth his handywork.":
      "Di heaven dey show God glory; and di sky dey show di work wey im hand do.",
    "Let nothing be done through strife or vainglory; but in lowliness of mind let each esteem other better than themselves.":
      "No let anything happen through quarrel or empty pride; but make una dey humble well-well, make everyone see others pass themselves.",
    "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.":
      "The LORD na my shepherd; I no go want for anything. E dey make me lie down for green pasture: e dey lead me go beside still water.",
    "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.":
      "For I sabi the thoughts wey I dey think about you, na so The LORD talk, thoughts of peace, no be evil, to give you the future wey you dey expect.",
    "Pray without ceasing. Continue earnestly in prayer, being vigilant in it with thanksgiving.":
      "Dey pray without stop. Continue well-well for prayer, dey alert for am with thanksgiving.",
    "Blessed be the Lord, who daily loadeth us with benefits, even the God of our salvation.":
      "Blessed be The Lord, wey dey load us with benefit everyday, even the God wey save us.",
    "For the word of God is living and powerful, and sharper than any two-edged sword, piercing even to the division of soul and spirit, and of joints and marrow, and is a discerner of the thoughts and intents of the heart.":
      "For the word of God dey alive and e get power, e sharp pass any sword wey get two edge, e dey pierce reach where soul and spirit dey separate, and joint and marrow, and e sabi the thoughts and intention wey dey inside heart.",
    "For God is not unrighteous to forget your work and labour of love, which ye have shewed toward his name, in that ye have ministered to the saints, and do minister.":
      "God no be person wey go forget your work and the labour of love wey you don show for im name, as you don serve the saints, and you still dey serve dem.",
    "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.":
      "If wisdom dey lack for any one of una, make e ask God, wey dey give everybody well-well without insult; and dem go give am.",
    "For the Son of man is not come to destroy men's lives, but to save them.":
      "For the Son of man no come to destroy people life, but to save dem.",
    "Commit thy works unto the LORD, and thy thoughts shall be established.":
      "Hand over your works to The LORD, and your thoughts go stand strong.",
    "Father, today is Your Sabbath, and I enter it in rest, not in striving. I lay down every work of my own hands and trust the work of Yours. Where my path has been crooked, I will not fight to straighten it myself — I consider it, and I trust the Hand that bent it to also be the Hand that restores it. In this day of whatever kind You have assigned me — prosperity or adversity — I receive it from You, and I will not find fault with You after it. Where I am tempted to strive, to compare, or to think more highly of myself than I ought, I choose lowliness of mind; I esteem others better than myself, as Your Word commands. Let me rest in who You are today, not in what I can produce. Restore my soul the way only a true Sabbath can. Let wisdom, not anxiety, be my defence, and let it give life to everything I set my hand to this week. In Jesus' name, amen.":
      "Father, today na Your Sabbath, and I dey enter am for rest, no be for struggle. I drop every work wey my hand dey do and I trust the work wey na Your hand dey do. Where my road don crooked, I no go fight to straighten am myself — I go consider am, and I trust say the Hand wey bend am na im go also straighten am. For dis day, whatever kind You don assign me — prosperity or adversity — I dey receive am from You, and I no go find fault with You after am. Where I wan strive, compare myself, or think say I pass pass, I dey choose to dey humble; I go see others pass myself, as Your Word talk. Make I rest for who You be today, no be for wetin I fit produce. Restore my soul the way only real Sabbath fit do. Make wisdom, no be worry, be my defence, and make e give life to everything my hand go touch dis week. For Jesus name, amen.",
    "Thank God for His faithfulness over your life, your family, and this new day.":
      "Thank God for how E dey faithful over your life, your family, and dis new day.",
    "Declare Romans 10:17 over your faith — that it is rising as you hear the Word.":
      "Declare Romans 10:17 over your faith — say e dey rise as you dey hear the Word.",
    "Bring the specific need weighing on you right now to God in prayer, by name.":
      "Carry the exact need wey dey worry you right now go God for prayer, call am by name.",
    "Pray for someone else today — a family member, a friend, a need you know of.":
      "Pray for another person today — your family member, your friend, or any need wey you sabi.",
    "Ask for wisdom for every decision in front of you this week (James 1:5).":
      "Ask for wisdom for every decision wey dey front you dis week (James 1:5).",
    "Thank God in advance for the answer, believing it is already done (Mark 11:24).":
      "Thank God before the time for the answer, believe say e don already happen (Mark 11:24)."
  };

  function fetchWithTimeout(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
  }

  // On-device cache for live-translated text, so the same sentence is
  // never fetched twice from the free endpoint and still works offline
  // once seen.
  function cacheKey(text, langCode) {
    let h = 0;
    for (let i = 0; i < text.length; i++) { h = (h * 31 + text.charCodeAt(i)) | 0; }
    return `wfn-translate-cache:${langCode}:${h}`;
  }
  function getCached(text, langCode) {
    try { return localStorage.getItem(cacheKey(text, langCode)); } catch (e) { return null; }
  }
  function setCached(text, langCode, translated) {
    try { localStorage.setItem(cacheKey(text, langCode), translated); } catch (e) {}
  }

  function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  async function fetchGoogleTranslate(text, langCode) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetchWithTimeout(url, TRANSLATE_TIMEOUT_MS);
    const json = await res.json();
    const out = (json && json[0] ? json[0].map((seg) => seg[0]).join("") : "") || "";
    return out.trim() || null;
  }

  // MyMemory's free endpoint returns its error messages as ordinary
  // "translatedText" — e.g. "QUERY LENGTH LIMIT EXCEEDED. MAX ALLOWED
  // QUERY: 500 CHARS" for anything over 500 characters, or an "AMBIGUOUS"/
  // "INVALID SOURCE LANGUAGE" notice — with nothing in the response marking
  // it as an error. Left unfiltered, that error text gets treated as a
  // real translation and shown to readers as today's declaration. Catch
  // the common error shapes (short, all-caps, English, admin-sounding)
  // before accepting anything from this engine.
  function looksLikeMtError(out) {
    if (!out) return true;
    const t = out.trim();
    if (/query length limit|invalid (source|target)|is not supported|please select|no translations? found|mymemory warning|ambiguous/i.test(t)) return true;
    // A short, all-caps, non-accented response for a long/mixed-case
    // request is almost certainly a system message, not a translation.
    if (t.length < 80 && t === t.toUpperCase() && /^[A-Z0-9 .:,'"-]+$/.test(t)) return true;
    return false;
  }

  async function fetchMyMemory(text, langCode) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${langCode}`;
    const res = await fetchWithTimeout(url, TRANSLATE_TIMEOUT_MS);
    const json = await res.json();
    const out = json && json.responseData && json.responseData.translatedText;
    const looksReal = out && out.trim() && out.trim().toLowerCase() !== text.trim().toLowerCase() && !looksLikeMtError(out);
    return looksReal ? out.trim() : null;
  }

  // Two independent free engines, tried in sequence with short backoffs
  // between attempts. Neither one has an SLA, and both occasionally throttle
  // or drop a request without warning (worse during peak hours on a shared
  // IP), so relying on a single attempt against a single engine is why
  // translation used to work inconsistently. Trying Google twice, then
  // MyMemory twice, before giving up gives each request four real chances
  // across two different providers.
  async function translateOne(text, langCode) {
    if (langCode === "en") return text;
    if (langCode === "pcm" && PIDGIN_STATIC[text]) return PIDGIN_STATIC[text];

    // Self-heals devices that already cached one of MyMemory's error
    // messages as if it were a real translation (see looksLikeMtError) —
    // ignore a bad cached value instead of returning it forever.
    const cached = getCached(text, langCode);
    if (cached && !looksLikeMtError(cached)) return cached;

    // MyMemory's free tier hard-rejects anything over ~500 characters with
    // an error message (see looksLikeMtError), so for longer passages
    // (the daily declaration, prayer points combined, library chapters)
    // it would never succeed — skip straight to Google, with extra
    // retries in its place, rather than wasting an attempt on a request
    // that's guaranteed to fail.
    const myMemoryUsable = text.length <= 480;

    const attempts = [];
    if (!NO_MT_LANGS[langCode]) {
      attempts.push(() => fetchGoogleTranslate(text, langCode));
      attempts.push(() => fetchGoogleTranslate(text, langCode));
      if (!myMemoryUsable) attempts.push(() => fetchGoogleTranslate(text, langCode));
    }
    if (myMemoryUsable) {
      attempts.push(() => fetchMyMemory(text, langCode));
      attempts.push(() => fetchMyMemory(text, langCode));
    }

    for (let i = 0; i < attempts.length; i++) {
      try {
        const out = await attempts[i]();
        if (out) { setCached(text, langCode, out); return out; }
      } catch (err) { /* try the next engine/attempt */ }
      if (i < attempts.length - 1) await sleep(350 + i * 250);
    }
    return null;
  }

  // Runs translateOne over a list of texts with at most a few requests in
  // flight at once. Firing every request in a page at the same instant
  // (Promise.all with no limit) is what made translation flaky — a burst of
  // simultaneous requests gets a free, unauthenticated endpoint to silently
  // drop or throttle some of them, which looked like "only works
  // sometimes." A small, steady concurrency limit avoids that burst.
  async function translateTextsLimited(texts, langCode) {
    const results = new Array(texts.length);
    let next = 0;
    async function worker() {
      while (next < texts.length) {
        const i = next++;
        results[i] = await translateOne(texts[i], langCode);
      }
    }
    const workers = [];
    for (let w = 0; w < Math.min(4, texts.length); w++) workers.push(worker());
    await Promise.all(workers);
    return results;
  }

  // Shared helper: translate a batch of English texts into langCode and
  // write each result into the matching DOM element's text. Reused by the
  // Home verse of the day and the Prayer page (declaration + prayer
  // points). Every element always ends up with real text in it — the
  // original English with a small italic note when a translation
  // couldn't be produced — never a "Translating…" label stuck forever.
  async function translateInto(pairs, langCode, noteEl) {
    if (noteEl) noteEl.hidden = true;
    if (!langCode || langCode === "en") {
      pairs.forEach((p) => { p.el.textContent = p.original; });
      return;
    }
    pairs.forEach((p) => { p.el.textContent = "Translating…"; });
    const outs = await translateTextsLimited(pairs.map((p) => p.original), langCode);
    let anyFailed = false;
    pairs.forEach((p, i) => {
      if (outs[i]) {
        p.el.textContent = outs[i];
      } else {
        p.el.textContent = p.original;
        anyFailed = true;
      }
    });
    if (noteEl) {
      if (anyFailed && NO_MT_LANGS[langCode]) {
        noteEl.hidden = false;
        noteEl.textContent = "Pidgin translation isn't available for this text yet — no major translation engine fully supports it, so this is shown in English for now.";
      } else if (anyFailed) {
        noteEl.hidden = false;
        noteEl.textContent = "Translation is temporarily unavailable — showing the original English.";
      }
    }
  }

  function translateLangOptions() {
    return `<option value="">Translate…</option>` + TRANSLATE_LANGS.map((l) => `<option value="${l.code}">${esc(l.name)}</option>`).join("");
  }

  function dayIndex(len) {
    const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return doy % len;
  }

  // ---------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------

  function esc(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Small verified/checkmark badge, shown beside the author name on the
  // Prayer card header — same visual language as social-app verified badges.
  function verifiedBadgeSvg() {
    return '<svg class="verified-badge" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="11" fill="#3897F0"></circle>' +
      '<path d="M8 12.3l2.6 2.6L16.2 9" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"></path>' +
      '</svg>';
  }

  function setHeader(title, showBack) {
    titleEl.textContent = title;
    backEl.hidden = !showBack;
    document.getElementById("headerLogo").style.display = showBack ? "none" : "";
  }

  function setActiveTab(name) {
    tabBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  }

  function lastBiblePosition() {
    try {
      const raw = localStorage.getItem("wfn-app-bible-last");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function saveBiblePosition(slug, name, chapter) {
    try {
      localStorage.setItem("wfn-app-bible-last", JSON.stringify({ slug, name, chapter, at: Date.now() }));
    } catch (e) {}
  }

  // Reading text size for the Bible — a few steps, remembered on this device,
  // so anyone who needs larger type (or just prefers it) only has to set it once.
  const READER_SIZES = [19, 21, 24, 27, 31, 35];
  function getReaderSizeIndex() {
    try {
      const raw = parseInt(localStorage.getItem("wfn-app-reader-size-idx"), 10);
      return isNaN(raw) ? 1 : Math.min(Math.max(raw, 0), READER_SIZES.length - 1);
    } catch (e) {
      return 1;
    }
  }
  function applyReaderSize(idx) {
    document.documentElement.style.setProperty("--verse-font-size", READER_SIZES[idx] + "px");
    try { localStorage.setItem("wfn-app-reader-size-idx", String(idx)); } catch (e) {}
  }

  // Reading font — a short, deliberate list including an accessibility-first face.
  const READER_FONTS = [
    { key: "sans", label: "Sans", stack: "'Inter', -apple-system, system-ui, sans-serif" },
    { key: "serif", label: "Serif", stack: "'Fraunces', Georgia, serif" },
    { key: "accessible", label: "Accessible", stack: "'Atkinson Hyperlegible', Arial, sans-serif" }
  ];
  function getReaderFont() {
    try { return localStorage.getItem("wfn-app-reader-font") || "serif"; } catch (e) { return "serif"; }
  }
  function applyReaderFont(key) {
    const f = READER_FONTS.find((x) => x.key === key) || READER_FONTS[0];
    document.documentElement.style.setProperty("--verse-font-family", f.stack);
    try { localStorage.setItem("wfn-app-reader-font", f.key); } catch (e) {}
  }

  // Reading background — photos behind the verse text, with a soft wash over them
  // so the text stays readable regardless of the image. All ten are free-license
  // (Unsplash License) photos; "Default" leaves the plain reading surface.
  const READER_BACKGROUNDS = [
    { key: "none", label: "Default" },
    { key: "sea", label: "Golden Hour Sea", url: "https://images.unsplash.com/photo-1567875278694-887f235162eb" },
    { key: "candle", label: "Candlelight", url: "https://images.unsplash.com/photo-1660985759158-76fc3fbc296f" },
    { key: "scripture", label: "Open Scripture", url: "https://images.unsplash.com/photo-1710921156556-9e2ae23f0164" },
    { key: "harvest", label: "Harvest Field", url: "https://images.unsplash.com/photo-1758573728869-d25eb4bafb67" },
    { key: "bokeh", label: "Warm Bokeh", url: "https://images.unsplash.com/photo-1749631931307-eb896adfa1e2" },
    { key: "glory", label: "Rays of Glory", url: "https://images.unsplash.com/photo-1780047053902-9bcf0f8af9fb" },
    { key: "dawn", label: "Misty Dawn", url: "https://images.unsplash.com/photo-1768069853451-4f6ad57d6917" },
    { key: "stars", label: "Starlit Sky", url: "https://images.unsplash.com/photo-1762474610289-baef9ce2f68e" },
    { key: "sky", label: "Open Sky", url: "https://images.unsplash.com/photo-1768667521251-e1ac74d831cd" },
    { key: "meadow", label: "Sunlit Meadow", url: "https://images.unsplash.com/photo-1480289873380-1797d1670768" }
  ];
  function getReaderBg() {
    try { return localStorage.getItem("wfn-app-reader-bg") || "none"; } catch (e) { return "none"; }
  }
  function applyReaderBg(key) {
    const b = READER_BACKGROUNDS.find((x) => x.key === key) || READER_BACKGROUNDS[0];
    try { localStorage.setItem("wfn-app-reader-bg", b.key); } catch (e) {}
    const el = document.getElementById("readerSurface");
    if (!el) return;
    if (!b.url) {
      el.style.background = "";
      el.removeAttribute("data-bg");
      return;
    }
    // The wash has to match the current theme, or dark-mode text (now light)
    // sits on a near-white wash and disappears — match it to --bg instead of
    // a hardcoded cream value.
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    const wash = dark ? "21,18,12" : "251,248,241";
    const washOpacity = dark ? 0.84 : 0.88;
    el.style.background =
      `linear-gradient(rgba(${wash},${washOpacity}), rgba(${wash},${washOpacity})), url('` + b.url + "?w=1200&q=70&fm=jpg&auto=format&fit=crop') center/cover no-repeat";
    el.setAttribute("data-bg", b.key);
  }

  applyReaderSize(getReaderSizeIndex()); // apply immediately on app load, before any chapter renders
  applyReaderFont(getReaderFont());

  // ---- Appearance: Light / Dark / Auto theme, rotating card backgrounds,
  // and a Reduce Motion switch — all on-device, remembered per device. ----
  const THEME_KEY = "wfn-app-theme";
  const ROTATE_KEY = "wfn-app-rotate-bg";
  const MOTION_KEY = "wfn-app-reduce-motion";

  function getThemePref() {
    try { return localStorage.getItem(THEME_KEY) || "light"; } catch (e) { return "light"; }
  }
  function resolveTheme(pref) {
    if (pref === "auto") {
      try { return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; } catch (e) { return "light"; }
    }
    return pref === "dark" ? "dark" : "light";
  }
  function applyTheme(pref) {
    try { localStorage.setItem(THEME_KEY, pref); } catch (e) {}
    const resolved = resolveTheme(pref);
    document.documentElement.setAttribute("data-theme", resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#15120C" : "#1D1810");
    if (document.getElementById("readerSurface")) applyReaderBg(getReaderBg());
  }
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (getThemePref() === "auto") applyTheme("auto");
    });
  } catch (e) {}

  function getRotatePref() {
    try { return localStorage.getItem(ROTATE_KEY) !== "0"; } catch (e) { return true; }
  }
  function setRotatePref(on) {
    try { localStorage.setItem(ROTATE_KEY, on ? "1" : "0"); } catch (e) {}
    document.documentElement.setAttribute("data-rotate", on ? "on" : "off");
  }
  function getMotionPref() {
    try { return localStorage.getItem(MOTION_KEY) === "1"; } catch (e) { return false; }
  }
  function setMotionPref(reduced) {
    try { localStorage.setItem(MOTION_KEY, reduced ? "1" : "0"); } catch (e) {}
    document.documentElement.setAttribute("data-motion", reduced ? "reduced" : "normal");
  }

  applyTheme(getThemePref());
  document.documentElement.setAttribute("data-rotate", getRotatePref() ? "on" : "off");
  document.documentElement.setAttribute("data-motion", getMotionPref() ? "reduced" : "normal");

  // Calm, free-license (Unsplash License) nature photography used behind the
  // Verse of the Day and Today's Declaration cards — cross-fading slowly in
  // pure CSS (see .bg-scene), each one lingering for several minutes so the
  // change is restful, not distracting. Nothing to tear down between views.
  const SCENE_SECONDS = 240; // ~4 minutes per photo
  const BG_PHOTOS = [
    "https://images.unsplash.com/photo-1768069853451-4f6ad57d6917", // Misty Dawn
    "https://images.unsplash.com/photo-1567875278694-887f235162eb", // Golden Hour Sea
    "https://images.unsplash.com/photo-1758573728869-d25eb4bafb67", // Harvest Field
    "https://images.unsplash.com/photo-1768667521251-e1ac74d831cd", // Open Sky
    "https://images.unsplash.com/photo-1480289873380-1797d1670768", // Sunlit Meadow
    "https://images.unsplash.com/photo-1780047053902-9bcf0f8af9fb"  // Rays of Glory
  ];
  function bgScenesHtml() {
    const cycle = BG_PHOTOS.length * SCENE_SECONDS;
    return BG_PHOTOS.map((url, i) => {
      const bg = `url('${url}?w=900&q=70&fm=jpg&auto=format&fit=crop') center/cover no-repeat`;
      const delay = (i * SCENE_SECONDS).toFixed(1);
      return `<div class="bg-scene" style="background:${bg}; animation:bgSceneCycle ${cycle}s infinite; animation-delay:${delay}s;"></div>`;
    }).join("");
  }

  // Verse of the Day "cover": a vibrant, multi-color radiating illustration
  // (not a photo) that stands in front of the actual verse until the reader
  // taps it — a small moment of discovery instead of the text just sitting
  // there. Rays cycle through the app's warm palette plus a few extra hues
  // so it reads as colorful rather than the single-tone gold used elsewhere.
  const VOD_RAY_COLORS = ["#E7CE94", "#D98C73", "#8E92D6", "#6FBFA8", "#E7CE94", "#D98C73", "#8E92D6", "#6FBFA8"];
  // Each ray now starts a short distance out from the center — not at the
  // exact center point — and carries a small arrowhead at that inner end,
  // pointing in toward the Bible badge, so the rays visibly flow into it
  // rather than just converging somewhere behind it. The outer end of each
  // ray carries a small standing-figure icon (the "church without walls"
  // motif — people connected to the Word at the center), each in its own
  // color from the palette, always upright regardless of its position
  // around the circle.
  // The figure is drawn so its *base* (not its mid-body) is the anchor
  // point — the ray's line always ends exactly at (cx,cy), and the figure
  // stands upright on top of that point, the same way for every ray
  // regardless of the angle it approaches from. The body outline is also
  // closed (Z) so there's no gap for the line to show through.
  function vodPersonIconSvg(cx, cy, color) {
    const x = cx.toFixed(1), y = (cy - 8.9).toFixed(1);
    return (
      `<g transform="translate(${x},${y})" opacity="0.97">` +
      `<circle cx="0" cy="8.9" r="2.3" fill="${color}" opacity="0.95"/>` +
      `<circle cx="0" cy="-7" r="4.4" fill="none" stroke="${color}" stroke-width="1.9"/>` +
      `<path d="M -7.3 8.9 Q -7.3 -1.6 0 -1.6 Q 7.3 -1.6 7.3 8.9 Z" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
      `</g>`
    );
  }
  // Three soft concentric rings sit behind the Bible badge at the exact
  // center — the "church without walls" halo — in a blend of the same
  // palette the rays use, instead of one flat tone.
  const VOD_CX = 160, VOD_CY = 130;
  function vodRingsHtml() {
    const rings = [
      { r: 86, color: "#8E92D6", opacity: 0.2 },
      { r: 62, color: "#D98C73", opacity: 0.27 },
      { r: 40, color: "#E7CE94", opacity: 0.36 },
    ];
    return rings
      .map((r) => `<circle cx="${VOD_CX}" cy="${VOD_CY}" r="${r.r}" fill="none" stroke="${r.color}" stroke-width="1.4" opacity="${r.opacity}"/>`)
      .join("");
  }
  // Every ray runs from the center rings out to a small standing figure —
  // each a different color from the palette — so the whole shape reads as
  // people connected to the Word at the center, flowing together. The
  // figure never rotates to match its ray's angle, so a ray that arrives
  // on the diagonal used to meet the body at an awkward slanted "kink"
  // right where they joined — the 4 cardinal rays (straight up/down/left/
  // right) looked fine, the 4 diagonals didn't. Every ray now bends into
  // a short straight-up stub for its last stretch, so every figure, at
  // every angle, is always met by a clean vertical approach into its feet.
  function vodCoverRaysHtml() {
    const n = VOD_RAY_COLORS.length;
    const innerR = 26, outerR = 108, stub = 16;
    const rays = VOD_RAY_COLORS.map((color, i) => {
      const angle = (i / n) * Math.PI * 2;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const ix = VOD_CX + cos * innerR, iy = VOD_CY + sin * innerR;
      const ox = VOD_CX + cos * outerR, oy = VOD_CY + sin * outerR;
      const elbowY = oy - stub;
      return (
        `<path d="M ${ix.toFixed(1)} ${iy.toFixed(1)} L ${ox.toFixed(1)} ${elbowY.toFixed(1)} L ${ox.toFixed(1)} ${oy.toFixed(1)}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" opacity="0.68"/>` +
        vodPersonIconSvg(ox, oy, color)
      );
    }).join("");
    return `<svg class="vod-rays" viewBox="0 0 320 260" aria-hidden="true"><g>${vodRingsHtml()}${rays}</g></svg>`;
  }

  // Other Bible versions and translation are fetched live (all public-domain
  // versions, free APIs) — the bundled KJV above is what keeps the app's core
  // reading experience working fully offline.
  const BIBLE_API = "https://bible-api.com/";
  const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/";

  const BIBLE_VERSIONS = [
    { code: "kjv", name: "King James Version (offline)" },
    { code: "web", name: "World English Bible" },
    { code: "asv", name: "American Standard Version" },
    { code: "bbe", name: "Bible in Basic English" },
    { code: "darby", name: "Darby Translation" },
    { code: "ylt", name: "Young's Literal Translation" },
    { code: "dra", name: "Douay-Rheims" },
    { code: "webbe", name: "World English Bible, British Edition" },
    { code: "oeb-us", name: "Open English Bible, US" },
    { code: "clementine", name: "Clementine Vulgate (Latin)" },
    // There is no public-domain, professionally published Yorùbá, Igbo, or
    // Hausa Bible available through a free API — every modern translation
    // in these languages is still in copyright with the Bible societies
    // that produced it. So these three run the KJV text for the current
    // chapter through the app's own translate engine (the same one behind
    // "Translate…" elsewhere) instead of fetching a published version —
    // labelled plainly as machine-translated, not a substitute for a real
    // published Yorùbá/Igbo/Hausa Bible.
    { code: "yo-mt", name: "Yorùbá (machine-translated)", mt: true, mtLang: "yo" },
    { code: "ig-mt", name: "Igbo (machine-translated)", mt: true, mtLang: "ig" },
    { code: "ha-mt", name: "Hausa (machine-translated)", mt: true, mtLang: "ha" }
  ];

  // Small fallback glossary for common KJV archaic forms a general dictionary
  // won't have (checked before the live dictionary lookup).
  const ARCHAIC_WORDS = {
    thee: "you (object form, archaic)", thou: "you (subject form, archaic)",
    thy: "your (archaic)", thine: "yours / your (archaic)", ye: "you (plural, archaic)",
    hath: "has", doth: "does", shalt: "shall (archaic second person)",
    wilt: "will (archaic second person)", art: "are (archaic second person singular)",
    unto: "to", whosoever: "whoever", whomsoever: "whomever",
    verily: "truly, certainly", behold: "look; pay attention",
    saith: "says", cometh: "comes", goeth: "goes", knowest: "know (archaic second person)",
    wherefore: "for what reason; so, therefore", giveth: "gives", maketh: "makes",
    leadeth: "leads", restoreth: "restores", walketh: "walks", abideth: "remains, stays",
    suffereth: "allows, endures", worketh: "works", loveth: "loves", liveth: "lives",
    bringeth: "brings", seeketh: "seeks", findeth: "finds", asketh: "asks",
    nigh: "near", betwixt: "between", peradventure: "perhaps", howbeit: "nevertheless",
    forasmuch: "seeing that, since", henceforth: "from now on"
  };

  // Walks the rendered verse paragraphs and wraps each word in a tappable
  // button (for the definition popover), leaving existing markup — red-letter
  // spans, italics, verse numbers — untouched.
  function wrapWordsForDefine(root) {
    function walk(node) {
      if (node.nodeType === 3) {
        const text = node.nodeValue;
        if (!/[A-Za-z]/.test(text)) return;
        const frag = document.createDocumentFragment();
        const re = /[A-Za-z']+/g;
        let last = 0, m;
        while ((m = re.exec(text))) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "w";
          btn.textContent = m[0];
          frag.appendChild(btn);
          last = re.lastIndex;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        if (node.classList && (node.classList.contains("vnum") || node.classList.contains("saved-dot") || node.classList.contains("w"))) return;
        Array.from(node.childNodes).forEach(walk);
      }
    }
    Array.from(root.querySelectorAll(".v")).forEach((p) => {
      Array.from(p.childNodes).forEach(walk);
    });
  }

  // Bible names/terms dictionary — ~5,970 entries compiled from Easton's
  // Bible Dictionary (1897) and Smith's Bible Dictionary (1863), both
  // public domain. This is what actually covers the Hebrew/Greek-derived
  // proper names, places, tribes, and theological terms the KJV is full
  // of — a general English dictionary never has these, since they aren't
  // English words. Loaded once, lazily, on first word tap.
  let bibleDictPromise = null;
  function getBibleDict() {
    if (!bibleDictPromise) {
      bibleDictPromise = fetch("/app/data/bible-dictionary.json")
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => (json && json.entries) || {})
        .catch(() => ({}));
    }
    return bibleDictPromise;
  }

  // A tapped word may be inflected (plural, possessive) in a way the
  // dictionary's base form isn't. Try the exact key first, then a couple
  // of cheap, safe fallbacks before giving up.
  function lookupBibleDict(dict, key) {
    if (dict[key]) return dict[key];
    if (key.endsWith("'s") && dict[key.slice(0, -2)]) return dict[key.slice(0, -2)];
    if (key.endsWith("s") && dict[key.slice(0, -1)]) return dict[key.slice(0, -1)];
    if (key.endsWith("es") && dict[key.slice(0, -2)]) return dict[key.slice(0, -2)];
    return null;
  }

  function showWordPopover(btn) {
    const word = btn.textContent;
    const clean = word.replace(/[^A-Za-z']/g, "");
    const key = clean.toLowerCase();
    let pop = document.getElementById("wordPop");
    if (!pop) {
      pop = document.createElement("div");
      pop.id = "wordPop";
      pop.className = "word-pop";
      pop.setAttribute("role", "status");
      document.body.appendChild(pop);
    }
    function place() {
      const r = btn.getBoundingClientRect();
      pop.style.left = Math.max(12, Math.min(window.innerWidth - 272, r.left)) + "px";
      pop.style.top = r.bottom + 10 + "px";
    }
    const archaic = ARCHAIC_WORDS[key];
    pop.innerHTML = `<b>${esc(clean)}</b>${archaic ? esc(archaic) : "Looking up…"}`;
    place();
    pop.classList.add("show");
    if (archaic) return;

    getBibleDict().then((dict) => {
      // The popover may have moved on to a different word (or closed) by
      // the time this resolves — only act if it's still showing this one.
      if (!pop.classList.contains("show") || pop.dataset.word !== key) return;
      const hit = lookupBibleDict(dict, key);
      if (hit) {
        pop.innerHTML = `<b>${esc(clean)}</b>${esc(hit)}`;
        place();
        return;
      }
      // Not a biblical name/term — try it as an ordinary English word.
      fetch(DICTIONARY_API + encodeURIComponent(key))
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((json) => {
          const meaning = json[0] && json[0].meanings && json[0].meanings[0];
          const def = meaning && meaning.definitions && meaning.definitions[0] && meaning.definitions[0].definition;
          if (!pop.classList.contains("show") || pop.dataset.word !== key) return;
          pop.innerHTML = `<b>${esc(clean)}</b>${def ? esc(def) : "No definition found for this word."}`;
          place();
        })
        .catch(() => {
          if (!pop.classList.contains("show") || pop.dataset.word !== key) return;
          pop.innerHTML = `<b>${esc(clean)}</b>No definition found for this word.`;
          place();
        });
    });
    pop.dataset.word = key;
  }

  document.addEventListener("click", (e) => {
    const wbtn = e.target.closest(".w");
    if (wbtn) { showWordPopover(wbtn); return; }
    const pop = document.getElementById("wordPop");
    if (pop && !e.target.closest("#wordPop")) pop.classList.remove("show");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const pop = document.getElementById("wordPop");
      if (pop) pop.classList.remove("show");
    }
  });

  function openReaderSettingsSheet() {
    const curFont = getReaderFont();
    const curBg = getReaderBg();
    const fontPills = READER_FONTS.map(
      (f) => `<button class="font-pill" data-font="${f.key}" data-active="${f.key === curFont ? 1 : 0}" type="button">${esc(f.label)}</button>`
    ).join("");
    const bgSwatches = READER_BACKGROUNDS.map((b) => {
      const style = b.url ? `background-image:url('${b.url}?w=200&q=40&fm=jpg&auto=format&fit=crop')` : "background:var(--surface-2)";
      return `<div><button class="bg-swatch" data-bg="${b.key}" data-active="${b.key === curBg ? 1 : 0}" type="button" style="${style}" aria-label="${esc(b.label)}"></button><span class="bg-swatch-label">${esc(b.label)}</span></div>`;
    }).join("");

    openSheet(`
      <h3>Reading Settings</h3>
      <div class="settings-group" style="margin-top:18px;">
        <div class="settings-label">Text Size</div>
        <div class="settings-size-row">
          <button class="text-size-btn" id="stSizeDown" aria-label="Smaller text">A</button>
          <span class="settings-size-val" id="stSizeVal">${READER_SIZES[getReaderSizeIndex()]}px</span>
          <button class="text-size-btn" id="stSizeUp" aria-label="Larger text">A</button>
        </div>
      </div>
      <div class="settings-group">
        <div class="settings-label">Font</div>
        <div class="font-pills" id="stFontPills">${fontPills}</div>
      </div>
      <div class="settings-group">
        <div class="settings-label">Background</div>
        <div class="bg-swatch-grid" id="stBgGrid">${bgSwatches}</div>
      </div>
    `);

    const sizeVal = document.getElementById("stSizeVal");
    const refreshSize = () => { sizeVal.textContent = READER_SIZES[getReaderSizeIndex()] + "px"; };
    document.getElementById("stSizeDown").addEventListener("click", () => { applyReaderSize(Math.max(0, getReaderSizeIndex() - 1)); refreshSize(); });
    document.getElementById("stSizeUp").addEventListener("click", () => { applyReaderSize(Math.min(READER_SIZES.length - 1, getReaderSizeIndex() + 1)); refreshSize(); });

    document.getElementById("stFontPills").addEventListener("click", (e) => {
      const btn = e.target.closest(".font-pill");
      if (!btn) return;
      applyReaderFont(btn.dataset.font);
      sheetBodyEl.querySelectorAll(".font-pill").forEach((p) => (p.dataset.active = p === btn ? 1 : 0));
    });
    document.getElementById("stBgGrid").addEventListener("click", (e) => {
      const btn = e.target.closest(".bg-swatch");
      if (!btn) return;
      applyReaderBg(btn.dataset.bg);
      sheetBodyEl.querySelectorAll(".bg-swatch").forEach((s) => (s.dataset.active = s === btn ? 1 : 0));
    });
  }

  function openJumpToVerseSheet(bookName, chapter, verseCount, onPick) {
    const nums = Array.from({ length: verseCount }, (_, i) => i + 1)
      .map((n) => `<button class="jump-num" data-verse="${n}" type="button">${n}</button>`)
      .join("");
    openSheet(`
      <h3>Jump to a Verse</h3>
      <div class="sheet-ref">${esc(bookName)} ${chapter} &middot; ${verseCount} verses</div>
      <div class="jump-grid">${nums}</div>
    `);
    sheetBodyEl.querySelector(".jump-grid").addEventListener("click", (e) => {
      const btn = e.target.closest(".jump-num");
      if (!btn) return;
      const vi = parseInt(btn.dataset.verse, 10);
      closeSheet();
      setTimeout(() => onPick(vi), 210); // let the sheet finish closing before scrolling
    });
  }

  // Plain-English "what did I just read" summary for the current chapter —
  // for readers who read the Bible but don't always follow what it means.
  function openChapterSummarySheet(slug, bookName, chapter) {
    openSheet(`
      <h3>Chapter Summary</h3>
      <div class="sheet-ref">${esc(bookName)} ${chapter}</div>
      <div class="summary-body" id="summaryBody"><p class="skeleton-note">Loading summary…</p></div>
    `);
    WFNBible.getChapterSummary(slug, chapter).then((text) => {
      const body = sheetBodyEl.querySelector("#summaryBody");
      if (!body) return; // sheet was closed before this resolved
      if (text) {
        body.innerHTML = `<p>${esc(text)}</p>`;
      } else {
        body.innerHTML = `<p class="skeleton-note">A plain-English summary for ${esc(bookName)} ${chapter} isn't available yet — we're adding them chapter by chapter across the whole Bible.</p>`;
      }
    });
  }

  // ---------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------

  function viewHome() {
    setHeader("Word & Faith Network", false);
    setActiveTab("home");
    const verse = VERSES[0];
    const sermon = SERMONS[0];
    const last = lastBiblePosition();
    const bibleRowBody = last
      ? `<p>Continue in ${esc(last.name)} ${last.chapter}</p>`
      : `<p>Start with Genesis, or any book you choose</p>`;
    const bibleRowHref = last ? `#/bible/${last.slug}/${last.chapter}` : `#/bible`;

    viewEl.innerHTML = `
      <div class="hello">
        <h1>Welcome</h1>
        <p>Your daily Word, sermon, and prayer — all in one place.</p>
      </div>

      <div class="verse-of-day" id="vodCard">
        <button class="vod-cover" id="vodCover" type="button" aria-label="Tap to reveal today's Bible verse">
          <div class="vod-constellation">
            ${vodCoverRaysHtml()}
            <span class="vod-reveal-badge">
              <span class="vod-reveal-glow"></span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="1.6" fill="rgba(255,253,248,0.16)" stroke="#FFFDF8" stroke-width="1.6"/><line x1="12" y1="3.4" x2="12" y2="20.6" stroke="#FFFDF8" stroke-width="1" opacity="0.45"/><path d="M12 8.2v7M8.7 11.7h6.6" stroke="#E7CE94" stroke-width="1.8" stroke-linecap="round"/></svg>
            </span>
          </div>
          <div class="vod-cover-label">Verse of the Day</div>
          <div class="vod-cover-sub">Tap to reveal today's Word</div>
        </button>
        <div class="verse-of-day-overlay"></div>
        <div class="verse-of-day-content">
          <div class="verse-of-day-label">Verse of the Day</div>
          <div class="verse-of-day-ref">${esc(verse.ref)} KJV</div>
          <div class="verse-of-day-text" id="vodText">${esc(verse.text)}</div>
          <select class="vod-translate" id="vodTranslate" aria-label="Translate the verse of the day">${translateLangOptions()}</select>
        </div>
      </div>
      <p class="translate-note" id="vodTranslateNote" hidden></p>

      <div class="stack">
        <a class="home-row" href="/jesus.html">
          <div class="ico ico-jesus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M6 8h12"/></svg></div>
          <div class="body"><h3>Jesus</h3><p>His whole story, start to finish</p></div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
        <a class="home-row" href="#/sermons/${sermon.slug}">
          <div class="ico ico-sermon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h11a1 1 0 0 1 1 1v13l-4-2-4 2-4-2V5a1 1 0 0 1 1-1z"/></svg></div>
          <div class="body"><h3>Today's Sermon</h3><p>${esc(sermon.title)}</p></div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
        <a class="home-row" href="${bibleRowHref}">
          <div class="ico ico-bible"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6a5 5 0 0 0-5-3H3v15h4a5 5 0 0 1 5 3"/><path d="M12 6a5 5 0 0 1 5-3h4v15h-4a5 5 0 0 0-5 3"/></svg></div>
          <div class="body"><h3>Read the Bible</h3>${bibleRowBody}</div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
        <a class="home-row" href="#/prayer">
          <div class="ico ico-prayer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9z"/></svg></div>
          <div class="body"><h3>Today's Declaration</h3><p>Pray with us</p></div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
        <a class="home-row" href="#/library">
          <div class="ico ico-library"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 3v18M8 8h8M8 12h8"/></svg></div>
          <div class="body"><h3>The Library</h3><p>Ask Boldly — Book One</p></div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
        <a class="home-row" href="#/game">
          <div class="ico ico-climb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20L12 4"/><path d="M17 20L12 4"/><path d="M8.6 15h6.8M9.8 10.5h4.4"/></svg></div>
          <div class="body"><h3>The Word Climb</h3><p>Play the Scripture quiz — five levels to the Sealed Scroll</p></div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
      </div>

      <div id="installHint" style="margin-top:18px;"></div>
    `;
    renderInstallHint(document.getElementById("installHint"));
    document.getElementById("vodTranslate").addEventListener("change", (e) => {
      translateInto([{ el: document.getElementById("vodText"), original: verse.text }], e.target.value, document.getElementById("vodTranslateNote"));
    });
    document.getElementById("vodCover").addEventListener("click", () => {
      document.getElementById("vodCard").classList.add("revealed");
    });
  }

  function viewGame() {
    setHeader("The Word Climb", true);
    setActiveTab("home");
    setGameFullscreen(true);
    viewEl.innerHTML = '<div id="wcRoot"></div>';
    if (window.WFNGame) window.WFNGame.mount(document.getElementById("wcRoot"));
  }

  function renderInstallHint(el) {
    if (!el) return;
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      return; // already installed
    }
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const msg = isIOS
      ? "<strong>Add to Home Screen:</strong> tap the Share icon in Safari, then “Add to Home Screen,” to install WFN as an app on your iPhone or iPad."
      : "<strong>Install this app:</strong> tap your browser menu and choose “Add to Home screen” or “Install app” to use WFN like a native app — with the full Bible available offline.";
    el.innerHTML = `<div class="install-hint">${msg}</div>`;
  }

  // ---------------------------------------------------------------------
  // Section gates: a closed cover that flips, unrolls, swings, or slides
  // open — one per section (Bible, Sermons, Prayer, Library) — to make the
  // same point in a different motion each time: reading, listening, and
  // praying through a screen carries the same weight it always has.
  // ---------------------------------------------------------------------

  function gateSkipped(key) {
    try { return localStorage.getItem("wfn-app-gate-skip-" + key) === "1"; } catch (e) { return false; }
  }
  function setGateSkip(key, on) {
    try { localStorage.setItem("wfn-app-gate-skip-" + key, on ? "1" : "0"); } catch (e) {}
  }
  function wireGate(skipKey) {
    const stage = viewEl.querySelector(".gate-stage");
    if (!stage) return;
    function open() {
      stage.classList.add("is-open");
      stage.querySelectorAll("[data-gate-trigger]").forEach((el) => el.setAttribute("aria-expanded", "true"));
    }
    function close() {
      stage.classList.remove("is-open");
      stage.querySelectorAll("[data-gate-trigger]").forEach((el) => el.setAttribute("aria-expanded", "false"));
    }
    stage.querySelectorAll("[data-gate-trigger]").forEach((el) => {
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
    const closeBtn = viewEl.querySelector("[data-gate-close]");
    if (closeBtn) closeBtn.addEventListener("click", close);
    const skipChk = viewEl.querySelector("[data-gate-skip]");
    if (skipChk) {
      skipChk.checked = gateSkipped(skipKey);
      skipChk.addEventListener("change", (e) => setGateSkip(skipKey, e.target.checked));
    }
  }
  function gateEmblemRing(inner) {
    return `<svg class="gate-front-emblem" viewBox="0 0 120 120" width="78" height="78" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="none" stroke="#F3EADA" stroke-width="1.3" opacity="0.8"/>
      <circle cx="60" cy="60" r="44" fill="none" stroke="#F3EADA" stroke-width="1" opacity="0.5"/>
      ${inner}
    </svg>`;
  }

  function viewBibleIntro() {
    setHeader("The Bible", true);
    setActiveTab("bible");
    const skip = gateSkipped("bible");
    viewEl.innerHTML = `
      <div class="gate-stage">
        <div class="gate-inner">
          <div class="gate-back">
            <div class="gate-back-top">
              <button class="gate-back-close" data-gate-close type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
                Close
              </button>
            </div>
            <div class="gate-back-body">
              <div class="gate-kicker" style="color:var(--gold);">You Are On Holy Ground</div>
              <h2 class="gate-back-headline">The screen changes. His Word does not.</h2>
              <p class="gate-back-text">Reading Scripture here is still reading Scripture — only the method has changed, not the weight it carries. Come with the same reverence, the same quiet heart, and the same prayer you'd bring to a printed page.</p>
            </div>
            <div class="gate-preview-card" style="background:linear-gradient(165deg,#FBF3DF 0%,#F3E3BC 100%); border:1px solid rgba(156,122,52,0.26);">
              <svg class="gate-preview-watermark" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="75" fill="none" stroke="#9C7A34" stroke-width="1.4"/><circle cx="80" cy="80" r="50" fill="none" stroke="#9C7A34" stroke-width="1.4"/></svg>
              <span class="gate-preview-badge" style="color:#7A5E24;">Today</span>
              <h3 class="gate-preview-title">Genesis 1</h3>
              <p class="gate-preview-text" style="color:#4C3F26; font-style:italic;">&ldquo;In the beginning God created the heaven and the earth.&rdquo;</p>
              <a class="gate-preview-cta" style="background:#9C7A34;" href="#/bible/books">Continue Reading <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
            </div>
            <p class="gate-footnote">&ldquo;My doctrine shall drop as the rain.&rdquo; &mdash; Deuteronomy 32:2</p>
          </div>

          <div class="gate-front gate-front--flip" data-gate-trigger role="button" tabindex="0" aria-expanded="false" aria-label="Tap to open the Word" style="background:linear-gradient(155deg,#B88B3C 0%,#9C7A34 46%,#7A5E24 100%);">
            <div class="gate-spine-l"></div><div class="gate-spine-r"></div>
            ${gateEmblemRing(`
              <path d="M34 78 V40 a4 4 0 0 1 4 -4 h18 a4 4 0 0 1 4 4 v38" fill="none" stroke="#FDFBF5" stroke-width="2.2" stroke-linejoin="round"/>
              <path d="M86 78 V40 a4 4 0 0 0 -4 -4 H64 a4 4 0 0 0 -4 4 v38" fill="none" stroke="#FDFBF5" stroke-width="2.2" stroke-linejoin="round"/>
              <line x1="60" y1="36" x2="60" y2="78" stroke="#FDFBF5" stroke-width="2"/>
            `)}
            <div class="gate-front-eyebrow">Holy Scripture — Electronic Edition</div>
            <h1 class="gate-front-title">The Word</h1>
            <div class="gate-front-rule"></div>
            <p class="gate-front-text">A screen is simply a different way of meeting the same Word that has always been on paper. Approach it with the same caution and respect — a quiet heart, a praying spirit, and attention undivided.</p>
            <p class="gate-front-text italic">Read with the Holy Spirit as your guide, not your own understanding alone.</p>
            <p class="gate-front-verse">&ldquo;All scripture is given by inspiration of God, and is profitable for doctrine.&rdquo; &mdash; 2 Timothy 3:16</p>
            <div class="gate-front-cta">
              <span>Tap to Open the Word</span>
              <svg class="gate-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M12 19l-6-6M12 19l6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="bible-intro-callout">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6l-5 3.6 1.9-5.8L4 8.8h6.1z"/></svg></div>
        <div>
          <h3>An Electronic Bible Is Still the Bible</h3>
          <p>A phone, tablet, or app is only the vessel — glass and light instead of leather and paper. What's carried in it is exactly the same: the living, inspired Word of God. It deserves the same reverence, the same attention, and the same freedom from distraction you'd give an open Bible on your lap.</p>
          <p>Don't let the convenience of a screen make the reading casual. Approach it the way you would walk into a sanctuary — aware of Whose presence you're stepping into.</p>
        </div>
      </div>

      <div class="bible-intro-rules">
        <h3>How to Read It Well</h3>
        <ol>
          <li><span class="num">1</span><span class="txt"><strong>Pray before you tap.</strong> Ask the Holy Spirit to open your understanding before you open a chapter — Scripture is discerned by the Spirit, not decoded like a search result (1 Corinthians 2:10–14).</span></li>
          <li><span class="num">2</span><span class="txt"><strong>Let it interrupt you.</strong> If a verse stops you, stay there. Don't scroll past conviction the way you'd scroll past an ad.</span></li>
          <li><span class="num">3</span><span class="txt"><strong>Use the tools to understand, not to argue.</strong> Word meanings, other versions, and translations are here to deepen your grasp of the text — not to win a debate or justify a conclusion you already wanted.</span></li>
          <li><span class="num">4</span><span class="txt"><strong>Return daily, not just in emergencies.</strong> The Word is bread for every day, not a reference book you reach for only in a crisis.</span></li>
          <li><span class="num">5</span><span class="txt"><strong>Guard the moment.</strong> Silence notifications where you can. Give this the same quiet you'd give a closed room with an open Bible on the table.</span></li>
        </ol>
      </div>

      <div class="bible-intro-verse">
        <p>&ldquo;For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit... and is a discerner of the thoughts and intents of the heart.&rdquo;</p>
        <span>Hebrews 4:12, KJV</span>
      </div>

      <a class="btn btn-block" id="bibleIntroEnter" href="#/bible/books">Enter the Word</a>
      <label class="gate-skip">
        <input type="checkbox" data-gate-skip ${skip ? "checked" : ""}>
        Don't show this page again
      </label>
    `;
    wireGate("bible");
  }

  async function viewBibleBooks() {
    setHeader("The Bible", true);
    setActiveTab("bible");
    viewEl.innerHTML = `
      <div class="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input id="bibleSearchInput" type="search" placeholder="Search the whole Bible…" autocomplete="off">
      </div>
      <div id="bibleBooksList"><div class="search-status">Loading books…</div></div>
    `;
    document.getElementById("bibleSearchInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim().length >= 3) {
        location.hash = "#/bible/search/" + encodeURIComponent(e.target.value.trim());
      }
    });
    const books = await WFNBible.getIndex();
    const old = books.filter((b) => b.testament === "old");
    const neu = books.filter((b) => b.testament === "new");
    const grid = (list) =>
      `<div class="book-grid">${list.map((b) => `<a class="book-btn" href="#/bible/${b.slug}">${esc(b.name)}</a>`).join("")}</div>`;
    document.getElementById("bibleBooksList").innerHTML = `
      <div class="testament-label">Old Testament</div>${grid(old)}
      <div class="testament-label">New Testament</div>${grid(neu)}
    `;
  }

  async function viewBibleChapters(slug) {
    setHeader("The Bible", true);
    setActiveTab("bible");
    viewEl.innerHTML = `<div class="search-status">Loading…</div>`;
    const data = await WFNBible.getBook(slug);
    setHeader(data.name, true);
    const n = data.chapters.length;
    let html = `<div class="chapter-grid">`;
    for (let i = 1; i <= n; i++) {
      html += `<a class="chapter-btn" href="#/bible/${slug}/${i}">${i}</a>`;
    }
    html += `</div>`;
    viewEl.innerHTML = html;
  }

  async function viewBibleReader(slug, chapter) {
    chapter = parseInt(chapter, 10);
    viewEl.innerHTML = `<div class="search-status">Loading…</div>`;
    const data = await WFNBible.getBook(slug);
    setHeader(data.name, true);
    setActiveTab("bible");
    if (chapter < 1 || chapter > data.chapters.length) chapter = 1;
    saveBiblePosition(slug, data.name, chapter);

    const kjvVerses = data.chapters[chapter - 1];
    let activePlainTexts = kjvVerses.map((v) => WFNBible.plain(v));
    let activeVersionCode = "kjv";

    const prevDisabled = chapter <= 1 ? "disabled" : "";
    const nextDisabled = chapter >= data.chapters.length ? "disabled" : "";
    const prevHref = chapter > 1 ? `#/bible/${slug}/${chapter - 1}` : "#";
    const nextHref = chapter < data.chapters.length ? `#/bible/${slug}/${chapter + 1}` : "#";

    const versionOptions = BIBLE_VERSIONS.map((v) => `<option value="${v.code}">${esc(v.name)}</option>`).join("");

    viewEl.innerHTML = `
      <div class="reader-nav">
        <a class="reader-title" href="#/bible/${slug}">${esc(data.name)} ${chapter}</a>
      </div>
      <div class="reader-chapter-fab-prev">
        <button class="rcf-btn" id="prevCh" ${prevDisabled} data-href="${prevHref}" aria-label="Previous chapter">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>
      <div class="reader-chapter-fab-next">
        <button class="rcf-btn" id="nextCh" ${nextDisabled} data-href="${nextHref}" aria-label="Next chapter">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>
      <div class="reader-toolbar">
        <select class="reader-select" id="versionSelect" aria-label="Bible version">${versionOptions}</select>
        <button class="reader-jump-btn" id="readerJumpBtn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 6h16M4 12h10M4 18h7"/></svg>
          Jump
        </button>
        <button class="reader-summarize-btn" id="readerSummarizeBtn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.4.3.6.8.6 1.3V16h5.8v-.8c0-.5.2-1 .6-1.3A6 6 0 0 0 12 3z"/></svg>
          Summarize
        </button>
        <button class="reader-settings-btn" id="readerSettingsBtn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h11M19 7h1M4 17h1M9 17h11M4 12h7M15 12h5"/><circle cx="18" cy="7" r="2.2"/><circle cx="7" cy="17" r="2.2"/><circle cx="11" cy="12" r="2.2"/></svg>
          Settings
        </button>
      </div>
      <p class="hint-row" id="defineHint">Tap any word for its meaning.</p>
      <div class="reader-surface" id="readerSurface">
        <div class="version-label" id="versionLabel"></div>
        ${data.titles && data.titles[chapter - 1] ? `<p class="chapter-title-sup">${data.titles[chapter - 1]}</p>` : ""}
        <div class="verse-list" id="verseList"></div>
        <div class="compare-versions" id="compareVersions"></div>
        <button class="btn btn-outline btn-block add-version-btn" id="addVersionBtn" type="button">+ Add Version to Compare</button>
      </div>
    `;
    viewEl.scrollTo(0, 0);
    window.scrollTo(0, 0);
    applyReaderBg(getReaderBg());

    ["prevCh", "nextCh"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn && !btn.disabled) {
        btn.addEventListener("click", () => { location.hash = btn.dataset.href; });
      }
    });
    updateChapterFabPosition();

    const verseListEl = document.getElementById("verseList");
    verseListEl.addEventListener("click", (e) => {
      if (e.target.closest(".w")) return; // word tap is handled by the global popover listener
      const p = e.target.closest(".v");
      if (!p) return;
      const vi = parseInt(p.dataset.verse, 10);
      openVerseSheet(slug, data.name, chapter, vi, activePlainTexts[vi - 1] || "");
    });

    const versionLabelEl = document.getElementById("versionLabel");
    const compareContainerEl = document.getElementById("compareVersions");
    const comparisonCodes = new Set();

    function versionDisplayName(code) {
      if (code === "kjv") return "King James Version (offline)";
      const v = BIBLE_VERSIONS.find((v) => v.code === code);
      return (v || {}).name || code;
    }

    // Fetches a version's verses for this chapter without touching the
    // main reading surface — shared by the top version switcher and by
    // each "Add Version to Compare" block below it.
    async function fetchVersionTexts(code) {
      if (code === "kjv") {
        return { name: versionDisplayName("kjv"), texts: kjvVerses.map((v, i) => ({ verse: i + 1, text: WFNBible.plain(v) })) };
      }
      const version = BIBLE_VERSIONS.find((v) => v.code === code);
      const versionName = (version || {}).name || code;
      if (version && version.mt) {
        const plainVerses = kjvVerses.map((v) => WFNBible.plain(v));
        const outs = await translateTextsLimited(plainVerses, version.mtLang);
        return {
          name: versionName,
          texts: outs.map((o, i) => ({ verse: i + 1, text: o || plainVerses[i] })),
          note: `Machine-translated from the KJV text, not an official published ${versionName.replace(" (machine-translated)", "")} Bible — meaning helps, but it isn't a substitute for a professional translation.${outs.some((o) => !o) ? " A few verses couldn't be translated right now and are shown in English." : ""}`
        };
      }
      const ref = encodeURIComponent(`${data.name} ${chapter}`).replace(/%20/g, "+");
      const res = await fetch(`${BIBLE_API}${ref}?translation=${code}`);
      if (!res.ok) throw new Error("bad response");
      const json = await res.json();
      if (!json.verses || !json.verses.length) throw new Error("no verses");
      return { name: versionName, texts: json.verses.map((v) => ({ verse: v.verse, text: v.text.trim() })) };
    }

    function renderKJV() {
      const marks = WFNStore.getMarks();
      const markFor = (vi) => marks.find((m) => m.bookSlug === slug && m.chapter === chapter && m.verse === vi + 1);
      verseListEl.innerHTML = kjvVerses
        .map((v, i) => {
          const m = markFor(i);
          const colorAttr = m && m.color ? ` data-color="${m.color}"` : "";
          const savedDot = m && m.saved ? `<span class="saved-dot"></span>` : "";
          return `<p class="v" data-verse="${i + 1}"${colorAttr}><span class="vnum">${i + 1}</span>${v}${savedDot}</p>`;
        })
        .join("");
      activePlainTexts = kjvVerses.map((v) => WFNBible.plain(v));
      activeVersionCode = "kjv";
      if (versionLabelEl) versionLabelEl.textContent = versionDisplayName("kjv");
      wrapWordsForDefine(verseListEl);
    }

    async function loadVersion(code) {
      if (code === "kjv") { renderKJV(); return; }
      const versionName = versionDisplayName(code);
      verseListEl.innerHTML = `<div class="search-status">Loading ${esc(versionName)}…</div>`;
      try {
        const result = await fetchVersionTexts(code);
        verseListEl.innerHTML =
          (result.note ? `<div class="skeleton-note" style="margin-bottom:14px;">${esc(result.note)}</div>` : "") +
          result.texts.map((t) => `<p class="v" data-verse="${t.verse}"><span class="vnum">${t.verse}</span>${esc(t.text)}</p>`).join("");
        activePlainTexts = result.texts.map((t) => t.text);
        activeVersionCode = code;
        if (versionLabelEl) versionLabelEl.textContent = result.name;
        wrapWordsForDefine(verseListEl);
      } catch (err) {
        verseListEl.innerHTML = `<div class="skeleton-note">Couldn't load ${esc(versionName)} right now &mdash; check your connection, or <button class="link-btn" id="backToKjv" type="button">switch back to KJV</button>.</div>`;
        const b = document.getElementById("backToKjv");
        if (b) b.addEventListener("click", () => { document.getElementById("versionSelect").value = "kjv"; renderKJV(); });
      }
    }

    // ---- Compare: add another version alongside the one at the top,
    // instead of replacing it. Each added block fetches independently and
    // can be removed on its own. ----
    async function addComparisonVersion(code) {
      if (code === activeVersionCode || comparisonCodes.has(code)) return;
      comparisonCodes.add(code);
      const block = document.createElement("div");
      block.className = "compare-block";
      block.innerHTML = `
        <div class="compare-head">
          <span class="compare-name">Loading…</span>
          <button type="button" class="compare-remove" aria-label="Remove this version">&times;</button>
        </div>
        <div class="compare-verses"></div>
      `;
      compareContainerEl.appendChild(block);
      block.querySelector(".compare-remove").addEventListener("click", () => {
        comparisonCodes.delete(code);
        block.remove();
      });
      try {
        const result = await fetchVersionTexts(code);
        block.querySelector(".compare-name").textContent = result.name;
        block.querySelector(".compare-verses").innerHTML =
          (result.note ? `<div class="skeleton-note" style="margin-bottom:12px;">${esc(result.note)}</div>` : "") +
          result.texts.map((t) => `<p class="v cv" data-verse="${t.verse}"><span class="vnum">${t.verse}</span>${esc(t.text)}</p>`).join("");
      } catch (err) {
        block.querySelector(".compare-name").textContent = versionDisplayName(code);
        block.querySelector(".compare-verses").innerHTML = `<div class="skeleton-note">Couldn't load this version right now.</div>`;
      }
    }

    function openAddVersionSheet() {
      const available = BIBLE_VERSIONS.filter((v) => v.code !== activeVersionCode && !comparisonCodes.has(v.code));
      if (!available.length) {
        openSheet(`<h3>Add a Version</h3><p style="font-size:14px; color:var(--ink-2);">Every available version is already shown.</p>`);
        return;
      }
      openSheet(`
        <h3>Add a Version to Compare</h3>
        <p style="font-size:13.5px; color:var(--ink-3); margin-bottom:12px;">Shown alongside ${esc(versionDisplayName(activeVersionCode))}, not in place of it.</p>
        <div class="stack">
          ${available.map((v) => `<button class="btn btn-outline btn-block add-version-opt" data-code="${v.code}" type="button" style="margin-bottom:8px; text-align:left;">${esc(v.name)}</button>`).join("")}
        </div>
      `);
      sheetBodyEl.querySelectorAll(".add-version-opt").forEach((btn) => {
        btn.addEventListener("click", () => {
          closeSheet();
          addComparisonVersion(btn.dataset.code);
        });
      });
    }

    document.getElementById("versionSelect").addEventListener("change", (e) => {
      loadVersion(e.target.value);
    });
    document.getElementById("addVersionBtn").addEventListener("click", openAddVersionSheet);
    document.getElementById("readerSettingsBtn").addEventListener("click", openReaderSettingsSheet);
    document.getElementById("readerJumpBtn").addEventListener("click", () => {
      openJumpToVerseSheet(data.name, chapter, kjvVerses.length, (vi) => jumpToVerse(vi));
    });
    document.getElementById("readerSummarizeBtn").addEventListener("click", () => {
      openChapterSummarySheet(slug, data.name, chapter);
    });

    function jumpToVerse(vi) {
      const target = verseListEl.querySelector(`.v[data-verse="${vi}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.remove("flash");
      // restart the animation even if the same verse is tapped twice in a row
      void target.offsetWidth;
      target.classList.add("flash");
      setTimeout(() => target.classList.remove("flash"), 1700);
    }

    renderKJV();
    showNoteFab(() => openNoteSheet("bible", `bible:${slug}:${chapter}`, `${data.name} ${chapter}`));
    setReadable(() => [
      `${data.name}, chapter ${chapter}.`,
      ...(data.titles && data.titles[chapter - 1] ? [WFNBible.plain(data.titles[chapter - 1])] : []),
      ...activePlainTexts
    ]);
  }

  function showNoteFab(onClick) {
    let fab = document.getElementById("noteFab");
    if (fab) fab.remove();
    fab = document.createElement("button");
    fab.id = "noteFab";
    fab.className = "note-fab";
    fab.setAttribute("aria-label", "Add a note");
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`;
    fab.addEventListener("click", onClick);
    document.getElementById("app").appendChild(fab);
  }
  function hideNoteFab() {
    const fab = document.getElementById("noteFab");
    if (fab) fab.remove();
  }

  // ---------------------------------------------------------------------
  // Listen & Tolu: one persistent voice control, mounted once in the app
  // shell so it's available on every screen, not just a couple of views.
  // "Listen" reads whatever the current screen registers via
  // setReadable(getItems); "Tolu" takes a spoken or typed request,
  // navigates, and reads the result. Both run on window.WFNTTS, the
  // shared text-to-speech engine (app/js/wfn-tts.js) also used on the
  // website's sermon and library pages.
  // ---------------------------------------------------------------------

  let currentGetItems = null;
  let pendingAutoRead = false;
  let pendingAutoReadTimer = null;
  // Last ambiguous search Tolu ran, so a quick follow-up ("open the
  // sermon", "open that verse") can resolve without repeating the query.
  let lastSearch = null;

  function setReadable(getItems) {
    currentGetItems = getItems || null;
    if (pendingAutoRead && currentGetItems) {
      pendingAutoRead = false;
      if (pendingAutoReadTimer) { clearTimeout(pendingAutoReadTimer); pendingAutoReadTimer = null; }
      startReading();
    }
  }

  function armPendingAutoRead() {
    pendingAutoRead = true;
    if (pendingAutoReadTimer) clearTimeout(pendingAutoReadTimer);
    // Safety net: if nothing registers readable content shortly after a
    // Tolu-triggered navigation, don't let a stale request fire later.
    pendingAutoReadTimer = setTimeout(() => { pendingAutoRead = false; }, 4000);
  }

  function startReading() {
    if (!window.WFNTTS || !window.WFNTTS.supported) return;
    const items = (currentGetItems || genericReadable)();
    if (items.length) window.WFNTTS.speak(items);
  }

  // Generic "read anywhere" fallback: most screens register their own
  // getItems() via setReadable() so Listen can read a clean, speech-shaped
  // version of what's there (e.g. the Bible reader reads its actual verse
  // text, not UI chrome). For every screen that doesn't — Home, the Bible
  // search results, the sermons/library landing and list pages, the
  // profile pages — Listen still has something to read: it scrapes the
  // currently-rendered screen's own headings and paragraphs, skipping the
  // voice control itself and any form controls, so "Listen" works on any
  // screen in the app without every view needing its own wiring.
  function genericReadable() {
    if (!viewEl) return [];
    const nodes = viewEl.querySelectorAll(
      "h1, h2, h3, h4, p, li, .result-ref, .result-text, .gate-back-headline, .gate-back-text, .gate-preview-title, .gate-preview-text"
    );
    const seen = new Set();
    const out = [];
    nodes.forEach((el) => {
      if (el.closest("#voiceStack, select, button")) return;
      const t = el.textContent.replace(/\s+/g, " ").trim();
      if (t.length > 1 && !seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    });
    return out;
  }

  function mountVoiceControls() {
    if (!window.WFNTTS || !window.WFNTTS.supported) return;
    if (document.getElementById("voiceStack")) return;

    const stack = document.createElement("div");
    stack.className = "voice-stack";
    stack.id = "voiceStack";
    stack.innerHTML = `
      <div class="voice-tray" id="voiceTray">
        <button class="voice-btn voice-btn-tolu" id="voiceToluBtn" type="button" aria-label="Ask Tolu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a7 7 0 0 1-14 0M12 19v3"/></svg>
          Ask Tolu
        </button>
        <button class="voice-btn voice-btn-listen" id="voiceListenBtn" type="button" aria-label="Listen to this page">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"/></svg>
          Listen
        </button>
      </div>
      <button class="voice-toggle" id="voiceToggle" type="button" aria-label="Show voice controls">
        <svg class="icon-collapsed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10v4M10 6v12M14 9v6M18 7v10"/></svg>
        <svg class="icon-expanded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
    `;
    document.getElementById("app").appendChild(stack);

    const toggle = document.getElementById("voiceToggle");
    const COLLAPSE_KEY = "wfn-voice-fab-collapsed";
    const HINT_KEY = "wfn-voice-hint-seen";

    function setCollapsed(on) {
      stack.classList.toggle("collapsed", on);
      toggle.setAttribute("aria-label", on ? "Show voice controls" : "Hide voice controls");
      try { localStorage.setItem(COLLAPSE_KEY, on ? "1" : "0"); } catch (e) {}
    }
    function dismissHint() {
      const hintEl = toggle.querySelector(".voice-hint");
      if (hintEl) hintEl.remove();
      toggle.classList.remove("hint-pulse");
      try { localStorage.setItem(HINT_KEY, "1"); } catch (e) {}
    }

    let storedCollapse = null, hintSeen = false;
    try {
      storedCollapse = localStorage.getItem(COLLAPSE_KEY);
      hintSeen = localStorage.getItem(HINT_KEY) === "1";
    } catch (e) {}
    const startCollapsed = storedCollapse === null ? true : storedCollapse === "1";
    setCollapsed(startCollapsed);

    if (startCollapsed && !hintSeen) {
      toggle.classList.add("hint-pulse");
      const hintEl = document.createElement("span");
      hintEl.className = "voice-hint";
      hintEl.textContent = "Listen & Tolu";
      toggle.appendChild(hintEl);
      setTimeout(dismissHint, 4200);
    }

    toggle.addEventListener("click", () => {
      dismissHint();
      setCollapsed(!stack.classList.contains("collapsed"));
    });

    document.getElementById("voiceListenBtn").addEventListener("click", openListenSheet);
    document.getElementById("voiceToluBtn").addEventListener("click", openToluSheet);
  }

  function openListenSheet() {
    if (!window.WFNTTS || !window.WFNTTS.supported) {
      openSheet(`<h3>Listen</h3><p style="font-size:14.5px; color:var(--ink-2); line-height:1.6;">Your browser doesn't support reading text aloud. Try the latest Chrome, Safari, or Edge.</p>`);
      return;
    }
    const items = currentGetItems || genericReadable;
    if (!items().length) {
      openSheet(`<h3>Listen</h3><p style="font-size:14.5px; color:var(--ink-2); line-height:1.6;">There's nothing to read on this screen yet.</p>`);
      return;
    }
    openSheet(`
      <h3>Listen</h3>
      <p style="font-size:13.5px; color:var(--ink-3); margin-bottom:4px;">Have this read aloud, in your choice of voice.</p>
      <div class="sheet-row" style="padding-bottom:6px;">
        <div class="sheet-row-label" style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--gold); flex:none;">Voice</div>
        <select class="reader-select" id="listenVoiceSelect" style="flex:1; max-width:none;"></select>
      </div>
      <div class="sheet-row" style="padding-top:6px;">
        <div class="sheet-row-label" style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--gold); flex:none;">Speed</div>
        <select class="reader-select" id="listenRateSelect" style="flex:1; max-width:none;"></select>
      </div>
      <div style="display:flex; gap:10px; margin-top:14px;">
        <button class="btn btn-block" id="listenPlayBtn" type="button">Play</button>
        <button class="btn btn-outline btn-block" id="listenStopBtn" type="button">Stop</button>
      </div>
    `);
    const voiceSel = document.getElementById("listenVoiceSelect");
    const rateSel = document.getElementById("listenRateSelect");
    const playBtn = document.getElementById("listenPlayBtn");
    const stopBtn = document.getElementById("listenStopBtn");

    window.WFNTTS.getVoiceSlots((slots) => {
      voiceSel.innerHTML = slots.length
        ? slots.map((s) => `<option value="${s.index}">${esc(s.label)}</option>`).join("")
        : `<option value="0">Default Voice</option>`;
      voiceSel.value = String(window.WFNTTS.getPrefIndex());
    });
    window.WFNTTS.rateOptions.forEach((r) => {
      const o = document.createElement("option");
      o.value = r;
      o.textContent = `${r}x${r === 1 ? " (Normal)" : ""}`;
      rateSel.appendChild(o);
    });
    rateSel.value = String(window.WFNTTS.getRate());

    // "Pidgin (translated)" isn't a real device voice — no mainstream engine
    // has one — so it reads this screen's text after running it through the
    // same Pidgin translation used on the website, falling back sentence by
    // sentence to English where no Pidgin translation exists.
    async function speakSelected() {
      const idx = parseInt(voiceSel.value, 10) || 0;
      if (!window.WFNTTS.isPidginIndex(idx)) {
        window.WFNTTS.speak(items());
        return;
      }
      playBtn.textContent = "Translating…";
      const source = items();
      const pidginItems = await Promise.all(source.map(async (t) => (await translateOne(t, "pcm")) || t));
      window.WFNTTS.speak(pidginItems);
    }

    voiceSel.addEventListener("change", () => {
      window.WFNTTS.setPrefIndex(parseInt(voiceSel.value, 10) || 0);
      if (window.WFNTTS.getState() !== "idle") speakSelected();
    });
    rateSel.addEventListener("change", () => {
      window.WFNTTS.setRate(parseFloat(rateSel.value) || 1);
      if (window.WFNTTS.getState() !== "idle") speakSelected();
    });
    playBtn.addEventListener("click", () => {
      const st = window.WFNTTS.getState();
      if (st === "playing") { window.WFNTTS.pause(); return; }
      if (st === "paused") { window.WFNTTS.resume(); return; }
      speakSelected();
    });
    stopBtn.addEventListener("click", () => window.WFNTTS.stop());

    const unsubscribe = window.WFNTTS.onState((st) => {
      playBtn.textContent = st === "playing" ? "Pause" : st === "paused" ? "Resume" : "Play";
    });
    playBtn.textContent = window.WFNTTS.getState() === "playing" ? "Pause" : window.WFNTTS.getState() === "paused" ? "Resume" : "Play";
    sheetScrimEl.addEventListener("click", unsubscribe, { once: true });
  }

  // ---- Tolu: voice-command assistant ---------------------------------

  const TOLU_EXAMPLES = [
    "Hi Tolu",
    "Search for faith",
    "Open the book of Luke chapter 2 verse 5",
    "Open today's prayer",
    "Stop reading"
  ];

  function openToluSheet() {
    openSheet(`
      <h3>Tolu</h3>
      <p style="font-size:13.5px; color:var(--ink-3); margin-bottom:10px;">Tap the mic once, then just talk — say "Hi Tolu" any time, followed by what you'd like to open or hear. Ask for a sermon, a Bible verse, the library, today's prayer, or say "search for" any word or topic and Tolu will search all of it. No need to tap again between requests.</p>
      <div class="tolu-mic-wrap">
        <button class="tolu-mic" id="toluMicBtn" type="button" aria-label="Tap to speak">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a7 7 0 0 1-14 0M12 19v3"/></svg>
        </button>
        <div class="tolu-status" id="toluStatus">Tap to speak to Tolu</div>
        <div class="tolu-transcript" id="toluTranscript"></div>
      </div>
      <div class="tolu-fallback">
        <input type="text" id="toluInput" placeholder="Or type a request…">
        <button id="toluSendBtn" type="button">Send</button>
      </div>
      <div class="tolu-examples">
        <div class="label">Try saying or typing</div>
        <div class="tolu-chip-row">
          ${TOLU_EXAMPLES.map((ex) => `<button class="tolu-chip" data-cmd="${esc(ex)}" type="button">"${esc(ex)}"</button>`).join("")}
        </div>
      </div>
      <div class="tolu-reply" id="toluReply"></div>
    `);

    const micBtn = document.getElementById("toluMicBtn");
    const statusEl = document.getElementById("toluStatus");
    const transcriptEl = document.getElementById("toluTranscript");
    const replyEl = document.getElementById("toluReply");
    const input = document.getElementById("toluInput");

    let busy = false;
    async function handle(text) {
      if (busy) return;
      busy = true;
      transcriptEl.textContent = `“${text}”`;
      statusEl.textContent = "Thinking…";
      let reply;
      try {
        reply = await runToluCommand(text);
      } catch (e) {
        reply = "Something went wrong on my end — try that again.";
      }
      replyEl.innerHTML = `<strong>Tolu:</strong> ${esc(reply)}`;
      replyEl.classList.add("show");
      // Note: the mic itself is left running here — see the recognition
      // setup below for why it's never stopped/restarted between turns.
      // Tolu's own voice is kept from being picked up as a new command by
      // ignoring results (suppressResults), not by tearing the session down.
      // Speak the reply aloud, Siri-style — unless real content is about
      // to start reading itself a moment later (that would talk over it).
      if (window.WFNTTS && !/reading it now/i.test(reply)) {
        try { window.WFNTTS.speak([reply]); } catch (e) {}
      }
      if (/^stop listening\b/i.test(text.trim()) && typeof stopListening === "function") {
        stopListening();
        return;
      }
      statusEl.textContent = listeningActive ? "Listening — say “Hi Tolu” or a command" : "Tap to speak to Tolu";
      busy = false;
    }

    document.querySelectorAll(".tolu-chip").forEach((chip) => {
      chip.addEventListener("click", () => handle(chip.dataset.cmd));
    });
    document.getElementById("toluSendBtn").addEventListener("click", () => {
      if (!input.value.trim()) return;
      handle(input.value.trim());
      input.value = "";
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("toluSendBtn").click();
    });

    // Voice recognition: one long-lived session for as long as listening
    // is active, instead of destroying and recreating the Recognition
    // object between every turn. That per-turn recreate was the actual
    // bug behind "Tolu answers once, then 'Hi Tolu' does nothing" —
    // restarting speech recognition from a setTimeout callback (not a
    // direct tap) is silently refused on some mobile browsers, most
    // notably iOS Safari, which only grants the microphone again inside a
    // real user gesture. So now the same session just keeps running:
    // while Tolu is thinking or talking, incoming results are ignored
    // (suppressResults) rather than the mic being stopped and restarted,
    // so Tolu's own voice is never mistaken for a new command but the
    // session itself never has to be re-granted. Recreation only happens
    // if the browser ends the session on its own (an inactivity timeout),
    // which is the one case it can't be avoided — and even that restart
    // can be refused on iOS, in which case the status text below goes
    // stale and a fresh tap is needed, same as any browser limitation.
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let listeningActive = false;
    let suppressResults = false;
    let recog = null;
    let restartTimer = null;
    let unsubscribeTTS = null;

    function stopListening() {
      listeningActive = false;
      if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
      if (unsubscribeTTS) { unsubscribeTTS(); unsubscribeTTS = null; }
      if (recog) { try { recog.onend = null; recog.stop(); } catch (e) {} recog = null; }
      micBtn.classList.remove("listening");
      statusEl.textContent = "Tap to speak to Tolu";
    }

    function createRecog() {
      const r = new Recognition();
      r.lang = "en-US";
      r.interimResults = false;
      r.continuous = true;
      r.maxAlternatives = 1;
      r.onstart = () => {
        micBtn.classList.add("listening");
        statusEl.textContent = "Listening — say “Hi Tolu” or a command";
      };
      r.onresult = (e) => {
        if (suppressResults) return; // Tolu is thinking/talking — ignore, don't stop
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) handle(e.results[i][0].transcript);
        }
      };
      r.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return; // expected in a long-running session
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          stopListening();
          statusEl.textContent = "Microphone access is blocked — allow it in your browser, or type below.";
        }
      };
      r.onend = () => {
        micBtn.classList.remove("listening");
        recog = null;
        if (listeningActive) {
          restartTimer = setTimeout(() => {
            try { startListening(); } catch (e) { stopListening(); }
          }, 250);
        }
      };
      return r;
    }

    function startListening() {
      if (!listeningActive) return;
      recog = createRecog();
      try { recog.start(); } catch (e) { /* a start-while-starting race; onend will retry */ }
    }

    if (Recognition) {
      micBtn.addEventListener("click", () => {
        if (listeningActive) { stopListening(); return; }
        listeningActive = true;
        // Mic stays "live" the whole session; only ignore what it hears
        // while Tolu itself is speaking, tracked via the TTS engine's own
        // state rather than polling window.speechSynthesis directly.
        suppressResults = window.WFNTTS ? window.WFNTTS.getState() === "playing" : false;
        unsubscribeTTS = window.WFNTTS
          ? window.WFNTTS.onState((st) => { suppressResults = st === "playing"; })
          : null;
        startListening();
      });
      sheetScrimEl.addEventListener("click", stopListening, { once: true });
    } else {
      statusEl.textContent = "Voice input isn't supported in this browser — type a request below.";
      micBtn.disabled = true;
      micBtn.style.opacity = "0.5";
    }
  }

  let bibleIndexPromise = null;
  function getBibleIndex() {
    if (!bibleIndexPromise) bibleIndexPromise = window.WFNBible.getIndex();
    return bibleIndexPromise;
  }

  const ORDINAL_WORDS = { first: "1", second: "2", third: "3", "1st": "1", "2nd": "2", "3rd": "3" };
  function normalizeBookPhrase(s) {
    s = s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    s = s.replace(/^(the\s+)?book\s+of\s+/, "");
    s = s.replace(/^(first|second|third|1st|2nd|3rd)\s+/, (m, w) => (ORDINAL_WORDS[w] || w) + " ");
    return s.trim();
  }
  function findBook(phraseRaw, index) {
    const phrase = normalizeBookPhrase(phraseRaw);
    if (!phrase) return null;
    const slugGuess = phrase.replace(/\s+/g, "-");
    return (
      index.find((b) => b.slug === slugGuess) ||
      index.find((b) => b.name.toLowerCase() === phrase) ||
      index.find((b) => b.name.toLowerCase().startsWith(phrase)) ||
      index.find((b) => phrase.startsWith(b.name.toLowerCase())) ||
      null
    );
  }

  // ---- Search: look across every sermon, library book, today's prayer,
  // and the whole Bible for a word or phrase. This is what lets Tolu
  // answer "search for X" / "find X" / "do you have anything on X" —
  // not just fixed, pre-named commands.
  function searchSermons(q) {
    const ql = q.toLowerCase();
    return SERMONS.filter(
      (s) => s.title.toLowerCase().includes(ql) || s.ref.toLowerCase().includes(ql) || s.excerpt.toLowerCase().includes(ql)
    );
  }
  function searchLibrary(q) {
    const ql = q.toLowerCase();
    return LIBRARY_BOOKS.filter((b) => b.title.toLowerCase().includes(ql) || b.desc.toLowerCase().includes(ql));
  }
  function searchPrayerContent(q) {
    const ql = q.toLowerCase();
    const hits = [];
    if (DECLARATION.ref.toLowerCase().includes(ql) || DECLARATION.lines.join(" ").toLowerCase().includes(ql)) {
      hits.push("declaration");
    }
    if (PRAYER_POINTS.some((p) => p.toLowerCase().includes(ql))) hits.push("points");
    return hits;
  }

  async function runSearchAcrossApp(qRaw) {
    const q = qRaw.trim();
    if (q.length < 2) return "Tell me a word or phrase to search for.";

    const sermonHits = searchSermons(q);
    const libraryHits = searchLibrary(q);
    const prayerHits = searchPrayerContent(q);
    let bibleHits = [];
    try { bibleHits = await WFNBible.search(q, 5); } catch (e) {}

    const total = sermonHits.length + libraryHits.length + prayerHits.length + bibleHits.length;
    if (!total) {
      lastSearch = null;
      return `I searched sermons, the library, today's prayer, and the whole Bible for "${qRaw}" and came up empty. Try a different word.`;
    }

    // A single, unambiguous hit: just open it and read it.
    if (sermonHits.length === 1 && !libraryHits.length && !bibleHits.length && !prayerHits.length) {
      lastSearch = null;
      const s = sermonHits[0];
      location.href = "/articles/" + s.slug + ".html#autoread";
      return `Found it — the sermon "${s.title}" on ${s.ref}. Opening and reading it now.`;
    }
    if (libraryHits.length === 1 && !sermonHits.length && !bibleHits.length && !prayerHits.length) {
      lastSearch = null;
      const b = libraryHits[0];
      location.href = "/library/" + b.slug + ".html#autoread";
      return `Found it — "${b.title}" in the library. Opening it now.`;
    }
    if (bibleHits.length && !sermonHits.length && !libraryHits.length && !prayerHits.length) {
      lastSearch = null;
      const r = bibleHits[0];
      armPendingAutoRead();
      location.hash = `#/bible/${r.slug}/${r.chapter}`;
      const more = bibleHits.length > 1 ? ` I found ${bibleHits.length} matching verses — starting with this one.` : "";
      return `Found "${qRaw}" in ${r.book} ${r.chapter}:${r.verse}.${more} Opening and reading that chapter now.`;
    }
    if (prayerHits.length && !sermonHits.length && !libraryHits.length && !bibleHits.length) {
      lastSearch = null;
      armPendingAutoRead();
      location.hash = "#/prayer/list";
      return "Found it in today's prayer. Opening and reading it now.";
    }

    // Several different kinds of matches — list what's there and let a
    // short follow-up ("open the sermon", "open that verse") pick one,
    // rather than guessing.
    lastSearch = { sermonHits, libraryHits, bibleHits, prayerHits, query: qRaw };
    const parts = [];
    if (sermonHits.length) parts.push(`${sermonHits.length} sermon${sermonHits.length > 1 ? "s" : ""} — including "${sermonHits[0].title}"`);
    if (bibleHits.length) parts.push(`${bibleHits.length} Bible verse${bibleHits.length > 1 ? "s" : ""} — starting with ${bibleHits[0].book} ${bibleHits[0].chapter}:${bibleHits[0].verse}`);
    if (libraryHits.length) parts.push(`${libraryHits.length} library book${libraryHits.length > 1 ? "s" : ""} — including "${libraryHits[0].title}"`);
    if (prayerHits.length) parts.push(`today's prayer`);
    return `For "${qRaw}" I found ${parts.join(", and ")}. Say "open the sermon", "open that verse", "open the library", or "open the prayer" to go there.`;
  }

  async function runToluCommand(textRaw) {
    const stripped = textRaw.replace(/^\s*(hi|hey|hello|ok|okay)?\s*tolu[,:]?\s*/i, "").trim();
    const body = (stripped || textRaw).toLowerCase().trim();
    const wantsRead = /\b(read|listen|out loud|aloud)\b/.test(body);

    // A bare wake phrase — "Hi Tolu", "Hey Tolu", just "Tolu" — with
    // nothing else said yet. Greet back instead of treating silence as a
    // failed command, the way Siri answers "I'm here" to its own name.
    if (!stripped && /\btolu\b/i.test(textRaw)) {
      return "Hi! I'm listening — try a sermon, a Bible verse, today's prayer, the library, or say \"search for\" anything in the app.";
    }

    if (/\bstop\b.*\b(reading|talking)\b/.test(body) || /^(stop|pause)\b/.test(body) || /^stop listening\b/.test(body)) {
      if (window.WFNTTS) window.WFNTTS.stop();
      return "Stopped.";
    }
    if (/^resume\b/.test(body)) {
      if (window.WFNTTS) window.WFNTTS.resume();
      return "Resuming.";
    }

    // A short follow-up to an ambiguous search a moment ago — "open the
    // sermon", "play that verse", "open the library one". Checked before
    // the plain always-open-today's-sermon/prayer/library intents below,
    // which would otherwise swallow it and open the wrong thing.
    if (lastSearch && body.length < 40) {
      if (/\bsermon\b/.test(body) && lastSearch.sermonHits.length) {
        const s = lastSearch.sermonHits[0];
        lastSearch = null;
        location.href = "/articles/" + s.slug + ".html#autoread";
        return `Opening the sermon "${s.title}". Reading it now.`;
      }
      if (/\b(verse|scripture|bible)\b/.test(body) && lastSearch.bibleHits.length) {
        const r = lastSearch.bibleHits[0];
        lastSearch = null;
        armPendingAutoRead();
        location.hash = `#/bible/${r.slug}/${r.chapter}`;
        return `Opening ${r.book} ${r.chapter}. Reading it now.`;
      }
      if (/\blibrary\b/.test(body) && lastSearch.libraryHits.length) {
        const b = lastSearch.libraryHits[0];
        lastSearch = null;
        location.href = "/library/" + b.slug + ".html#autoread";
        return `Opening "${b.title}" from the library.`;
      }
      if (/\bprayer\b/.test(body) && lastSearch.prayerHits.length) {
        lastSearch = null;
        armPendingAutoRead();
        location.hash = "#/prayer/list";
        return "Opening today's prayer. Reading it now.";
      }
    }

    // Explicit search — "search for X", "find X", "look up X" — checked
    // before the fixed intents below so "find the sermon about trust"
    // searches by keyword instead of just opening today's sermon.
    const searchMatch = body.match(/^(?:search(?: for)?|find|look up|look for|do you have (?:anything|something) (?:on|about))\s+(.+)$/);
    if (searchMatch) {
      return await runSearchAcrossApp(searchMatch[1].trim());
    }

    if (/\bsermon\b/.test(body)) {
      const s = SERMONS[0];
      location.href = "/articles/" + s.slug + ".html" + (wantsRead !== false ? "#autoread" : "");
      return `Opening today's sermon — ${s.title}. Reading it now.`;
    }
    if (/\bprayer\b/.test(body) && !/\bbook of\b/.test(body)) {
      armPendingAutoRead();
      location.hash = "#/prayer/list";
      return "Opening today's prayer, and reading it now.";
    }
    if (/\blibrary\b/.test(body)) {
      location.hash = "#/library/list";
      return "Opening the library.";
    }
    if (/\b(the story of jesus|jesus'?s? story|who is jesus|tell me about jesus|about jesus)\b/.test(body)) {
      location.href = "/jesus.html";
      return "Opening the story of Jesus.";
    }
    if (/\bhome\b/.test(body)) {
      location.hash = "#/home";
      return "Opening home.";
    }
    if (/^(read|listen to)\s+(this|it|the page)\b/.test(body)) {
      const hasContent = (currentGetItems || genericReadable)().length > 0;
      startReading();
      return hasContent ? "Reading this page now." : "There's nothing to read on this screen yet.";
    }

    // Bible book / chapter / verse, e.g. "open the book of luke chapter 2 verse 5"
    const bibleMatch = body.match(
      /(?:open|go to|read|show me)?\s*(?:the\s+)?(?:book\s+of\s+)?([a-z]+(?:\s+[a-z]+)?|\d\s+[a-z]+(?:\s+[a-z]+)?)\s*(?:chapter\s*)?(\d+)?\s*(?:(?:verse|:)\s*(\d+))?/i
    );
    if (bibleMatch && bibleMatch[1] && bibleMatch[1].trim().length > 1) {
      const bookPhrase = bibleMatch[1].trim();
      const chapterNum = bibleMatch[2] ? parseInt(bibleMatch[2], 10) : 1;
      const verseNum = bibleMatch[3] ? parseInt(bibleMatch[3], 10) : null;
      const index = await getBibleIndex();
      const book = findBook(bookPhrase, index);
      if (book) {
        const safeChapter = Math.min(Math.max(chapterNum, 1), book.chapters);
        armPendingAutoRead();
        location.hash = `#/bible/${book.slug}/${safeChapter}`;
        return `Opening ${book.name}, chapter ${safeChapter}${verseNum ? ", verse " + verseNum : ""}. Reading it now.`;
      }
      // Not a recognizable book name — fall through to a general search
      // instead of a dead end, in case it's a topic rather than a book.
    }

    // Nothing above matched — treat whatever was said as a search across
    // the whole app instead of giving up.
    return await runSearchAcrossApp(stripped || textRaw);
  }

  function openVerseSheet(bookSlug, bookName, chapter, verse, text) {
    const mark = WFNStore.getMark(bookSlug, chapter, verse) || { color: null, saved: false };
    const colors = ["gold", "green", "blue", "pink"];
    const swatches = colors
      .map((c) => `<button class="swatch swatch-${c}" data-color="${c}" data-active="${mark.color === c ? 1 : 0}" aria-label="Highlight ${c}"></button>`)
      .join("");
    openSheet(`
      <div class="sheet-ref">${esc(bookName)} ${chapter}:${verse}</div>
      <div class="sheet-verse-text">&ldquo;${esc(text)}&rdquo;</div>
      <div class="sheet-row">
        <div class="sheet-row-label">Highlight</div>
        <div class="swatches">${swatches}</div>
      </div>
      <div class="sheet-row">
        <div class="sheet-row-label">Save to My Verses</div>
        <button class="sheet-toggle" id="savedToggle" data-on="${mark.saved ? 1 : 0}"></button>
      </div>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button class="btn btn-outline btn-block" id="copyVerseBtn" type="button">Copy</button>
        <button class="btn btn-outline btn-block" id="shareVerseBtn" type="button">Share</button>
        <button class="btn btn-outline btn-block" id="prayVerseBtn" type="button">Pray</button>
      </div>
      <a class="btn btn-outline btn-block" style="margin-top:10px;" id="addVerseNoteBtn">Add a Note on This Verse</a>
    `);
    const verseRef = `${bookName} ${chapter}:${verse}`;
    const verseShareText = `"${text}" — ${verseRef}`;
    document.getElementById("copyVerseBtn").addEventListener("click", () => {
      if (window.WFNShare) window.WFNShare.copy(verseShareText);
    });
    document.getElementById("shareVerseBtn").addEventListener("click", () => {
      if (window.WFNShare) window.WFNShare.share(verseShareText);
    });
    document.getElementById("prayVerseBtn").addEventListener("click", () => {
      closeSheet();
      if (window.WFNShare) window.WFNShare.pray(text, verseRef);
    });
    sheetBodyEl.querySelectorAll(".swatch").forEach((sw) => {
      sw.addEventListener("click", () => {
        const current = sw.dataset.active === "1";
        const next = current ? null : sw.dataset.color;
        WFNStore.setHighlight(bookSlug, bookName, chapter, verse, text, next);
        sheetBodyEl.querySelectorAll(".swatch").forEach((s) => (s.dataset.active = s === sw && next ? 1 : 0));
        const p = document.querySelector(`#verseList .v[data-verse="${verse}"]`);
        if (p) { if (next) p.dataset.color = next; else delete p.dataset.color; }
      });
    });
    const savedBtn = document.getElementById("savedToggle");
    savedBtn.addEventListener("click", () => {
      const m = WFNStore.toggleSaved(bookSlug, bookName, chapter, verse, text);
      savedBtn.dataset.on = m && m.saved ? 1 : 0;
      const p = document.querySelector(`#verseList .v[data-verse="${verse}"]`);
      if (p) {
        let dot = p.querySelector(".saved-dot");
        if (m && m.saved && !dot) {
          p.insertAdjacentHTML("beforeend", '<span class="saved-dot"></span>');
        } else if ((!m || !m.saved) && dot) {
          dot.remove();
        }
      }
    });
    document.getElementById("addVerseNoteBtn").addEventListener("click", () => {
      openNoteSheet("bible", `bible:${bookSlug}:${chapter}:${verse}`, `${bookName} ${chapter}:${verse}`);
    });
  }

  function openNoteSheet(type, refKey, refLabel, onSaved) {
    openSheet(`
      <h3>Note</h3>
      <div class="sheet-ref">${esc(refLabel)}</div>
      <textarea id="noteText" placeholder="Write what this means to you, what stood out, or a prayer it brings to mind…"></textarea>
      <button class="btn btn-block" id="saveNoteBtn">Save Note</button>
    `);
    const ta = document.getElementById("noteText");
    ta.focus();
    document.getElementById("saveNoteBtn").addEventListener("click", () => {
      if (WFNStore.addNote(type, refKey, refLabel, ta.value)) {
        closeSheet();
        if (onSaved) onSaved();
      }
    });
  }

  async function viewBibleSearch(query) {
    setHeader("Search", true);
    setActiveTab("bible");
    query = decodeURIComponent(query || "");
    viewEl.innerHTML = `
      <div class="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input id="bibleSearchInput2" type="search" placeholder="Search the whole Bible…" autocomplete="off" value="${esc(query)}">
      </div>
      <div class="search-status" id="searchStatus">Searching the full King James Bible…</div>
      <div class="search-results" id="searchResults"></div>
    `;
    const input = document.getElementById("bibleSearchInput2");
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim().length >= 3) {
        location.hash = "#/bible/search/" + encodeURIComponent(e.target.value.trim());
      }
    });
    if (query.trim().length < 3) {
      document.getElementById("searchStatus").textContent = "Type at least 3 characters to search.";
      return;
    }
    const results = await WFNBible.search(query, 80);
    const statusEl = document.getElementById("searchStatus");
    const resultsEl = document.getElementById("searchResults");
    if (!results.length) {
      statusEl.textContent = `No verses found for “${query}”.`;
      return;
    }
    statusEl.textContent = `${results.length}${results.length === 80 ? "+" : ""} result${results.length === 1 ? "" : "s"} for “${query}”`;
    const re = new RegExp("(" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    resultsEl.innerHTML = results
      .map((r) => {
        const highlighted = esc(r.text).replace(re, "<mark>$1</mark>");
        return `<a class="result" href="#/bible/${r.slug}/${r.chapter}">
          <div class="result-ref">${esc(r.book)} ${r.chapter}:${r.verse}</div>
          <div class="result-text">${highlighted}</div>
        </a>`;
      })
      .join("");
  }

  function viewSermonsIntro() {
    setHeader("Sermons", true);
    setActiveTab("sermons");
    const skip = gateSkipped("sermons");
    const s = SERMONS[0];
    viewEl.innerHTML = `
      <div class="gate-stage">
        <div class="gate-inner">
          <div class="gate-back">
            <div class="gate-back-top">
              <button class="gate-back-close" data-gate-close type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
                Close
              </button>
            </div>
            <div class="gate-back-body">
              <div class="gate-kicker" style="color:var(--blue);">You're About to Hear the Word Preached</div>
              <h2 class="gate-back-headline">A recording still carries the voice.</h2>
              <p class="gate-back-text">Listen the way you would in the room — attentive, unhurried, testing what you hear against Scripture. Let the Holy Spirit, not the speaker alone, be the One who settles it in your heart.</p>
            </div>
            <div class="gate-preview-card" style="background:linear-gradient(165deg,#E9F0F4 0%,#D3E1E9 100%); border:1px solid rgba(94,124,148,0.28);">
              <svg class="gate-preview-watermark" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="75" fill="none" stroke="#5E7C94" stroke-width="1.4"/><circle cx="80" cy="80" r="50" fill="none" stroke="#5E7C94" stroke-width="1.4"/></svg>
              <span class="gate-preview-badge" style="color:#3E586D;">${esc(s.ref)}</span>
              <h3 class="gate-preview-title">${esc(s.title)}</h3>
              <p class="gate-preview-text" style="color:#3E4A52;">${esc(s.excerpt)}</p>
              <a class="gate-preview-cta" style="background:#5E7C94;" href="/articles/${s.slug}.html">Watch the Message <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
            </div>
            <p class="gate-footnote">&ldquo;Prove all things; hold fast that which is good.&rdquo; &mdash; 1 Thessalonians 5:21</p>
          </div>

          <div class="gate-front gate-front--unroll" data-gate-trigger role="button" tabindex="0" aria-expanded="false" aria-label="Tap to unroll the message" style="background:linear-gradient(155deg,#7E9BB0 0%,#5E7C94 46%,#45617A 100%);">
            <div class="gate-spine-l" style="background:linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0)); left:0; right:0; top:0; bottom:auto; height:30px; width:auto;"></div>
            ${gateEmblemRing(`
              <rect x="51" y="34" width="18" height="30" rx="9" fill="none" stroke="#FDFBF5" stroke-width="2.2"/>
              <path d="M42 58 a18 18 0 0 0 36 0" fill="none" stroke="#FDFBF5" stroke-width="2.2" stroke-linecap="round"/>
              <line x1="60" y1="76" x2="60" y2="86" stroke="#FDFBF5" stroke-width="2.2" stroke-linecap="round"/>
              <line x1="50" y1="86" x2="70" y2="86" stroke="#FDFBF5" stroke-width="2.2" stroke-linecap="round"/>
            `)}
            <div class="gate-front-eyebrow">Recorded Messages</div>
            <h1 class="gate-front-title">Sermons</h1>
            <div class="gate-front-rule"></div>
            <p class="gate-front-text">A sermon on a screen is still a sermon preached. The same discernment, the same open Bible beside you, the same test of Scripture applies here as it would from a pew.</p>
            <p class="gate-front-text italic">Ask the Holy Spirit to confirm every word before you carry it with you.</p>
            <p class="gate-front-verse">&ldquo;Faith cometh by hearing, and hearing by the word of God.&rdquo; &mdash; Romans 10:17</p>
            <div class="gate-front-cta">
              <span>Tap to Unroll the Message</span>
              <svg class="gate-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M12 19l-6-6M12 19l6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="bible-intro-callout">
        <div class="ico" style="background:var(--blue);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6l-5 3.6 1.9-5.8L4 8.8h6.1z"/></svg></div>
        <div>
          <h3>A Recorded Message Is Still a Sermon</h3>
          <p>Hearing a sermon through a speaker doesn't make it less preached. The anointing on a message isn't bound to a stage — it travels with the words, however they reach you.</p>
          <p>Keep an open Bible beside you as you listen, and let what you hear send you back to Scripture rather than replace it.</p>
        </div>
      </div>

      <a class="btn btn-block" id="sermonsIntroEnter" href="#/sermons/list">Listen to Sermons</a>
      <label class="gate-skip">
        <input type="checkbox" data-gate-skip ${skip ? "checked" : ""}>
        Don't show this page again
      </label>
    `;
    wireGate("sermons");
  }

  function viewSermonsList() {
    setHeader("Sermons", true);
    setActiveTab("sermons");
    hideNoteFab();
    const notes = WFNStore.getNotes();
    const noteCount = (slug) => notes.filter((n) => n.refKey === `sermon:${slug}`).length;
    viewEl.innerHTML = SERMONS.map((s) => {
      const nc = noteCount(s.slug);
      return `
      <div class="entry" style="padding-bottom:12px;">
        <a href="/articles/${s.slug}.html" style="display:block;">
          <div class="entry-top">
            <span class="entry-badge">${esc(s.ref)}</span>
            <span class="entry-date">${esc(s.date)}</span>
          </div>
          <h2 class="entry-title">${esc(s.title)}</h2>
          <p class="entry-excerpt">${esc(s.excerpt)}</p>
        </a>
        <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border); display:flex; justify-content:flex-end;">
          <button class="sermon-note-btn" data-slug="${s.slug}" data-title="${esc(s.title)}" style="background:none; border:none; display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:var(--gold); padding:0;">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            ${nc ? `${nc} Note${nc === 1 ? "" : "s"}` : "Add Note"}
          </button>
        </div>
      </div>`;
    }).join("");
    viewEl.querySelectorAll(".sermon-note-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        openNoteSheet("sermon", `sermon:${btn.dataset.slug}`, btn.dataset.title, viewSermonsList);
      });
    });
  }

  function viewPrayerIntro() {
    setHeader("Prayer", true);
    setActiveTab("prayer");
    const skip = gateSkipped("prayer");
    viewEl.innerHTML = `
      <div class="gate-stage">
        <div class="gate-inner">
          <div class="gate-back">
            <div class="gate-door-glow"></div>
            <div class="gate-back-top">
              <button class="gate-back-close" data-gate-close type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
                Close
              </button>
            </div>
            <div class="gate-back-body">
              <div class="gate-kicker" style="color:#AD7A7A;">You Are In the Secret Place</div>
              <h2 class="gate-back-headline">The door is shut. He sees you here.</h2>
              <p class="gate-back-text">Wherever you are, let this be your closet — put away distraction, quiet your heart, and pray in secret to the Father who sees in secret. Let the Spirit pray through you where words run out.</p>
            </div>
            <div class="gate-preview-card" style="background:linear-gradient(165deg,#F3E7E6 0%,#E8D2D0 100%); border:1px solid rgba(173,122,122,0.28);">
              <svg class="gate-preview-watermark" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="75" fill="none" stroke="#AD7A7A" stroke-width="1.4"/><circle cx="80" cy="80" r="50" fill="none" stroke="#AD7A7A" stroke-width="1.4"/></svg>
              <span class="gate-preview-badge" style="color:#7A4F4F;">Today's Declaration</span>
              <p class="gate-preview-text" style="color:#4C3330; font-style:italic;">&ldquo;Father, You did not leave me in darkness to fight my way out — You delivered me&hellip;&rdquo;</p>
              <a class="gate-preview-cta" style="background:#AD7A7A;" href="#/prayer/list">Continue in Prayer <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
            </div>
            <p class="gate-footnote">&ldquo;When thou prayest, enter into thy closet, and when thou hast shut thy door, pray to thy Father.&rdquo; &mdash; Matthew 6:6</p>
          </div>

          <div class="gate-front gate-front--door" data-gate-trigger role="button" tabindex="0" aria-expanded="false" aria-label="Tap to enter the prayer closet" style="background:linear-gradient(155deg,#C79992 0%,#AD7A7A 46%,#875D5D 100%);">
            <div class="gate-spine-l"></div><div class="gate-spine-r"></div>
            <div class="gate-door-panel"></div>
            <div class="gate-door-handle"></div>
            ${gateEmblemRing(`
              <path d="M60 84s-20-13-27-25a16 16 0 0 1 27-17 16 16 0 0 1 27 17c-7 12-27 25-27 25z" fill="none" stroke="#FDFBF5" stroke-width="2.2" stroke-linejoin="round"/>
            `)}
            <div class="gate-front-eyebrow">Enter the Secret Place</div>
            <h1 class="gate-front-title">Prayer</h1>
            <div class="gate-front-rule"></div>
            <p class="gate-front-text">A prayer prayed through a screen is still a prayer prayed. Shut out the noise around you the way you would behind a closet door, and come with an undivided heart.</p>
            <p class="gate-front-text italic">The Spirit Himself intercedes for us with groanings words cannot utter.</p>
            <p class="gate-front-verse">&ldquo;The effectual fervent prayer of a righteous man availeth much.&rdquo; &mdash; James 5:16</p>
            <div class="gate-front-cta">
              <span>Tap to Enter</span>
              <svg class="gate-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M12 19l-6-6M12 19l6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="bible-intro-callout">
        <div class="ico" style="background:#AD7A7A;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6l-5 3.6 1.9-5.8L4 8.8h6.1z"/></svg></div>
        <div>
          <h3>Shut the Door, Even on a Screen</h3>
          <p>Jesus didn't ask for a building — He asked for a shut door and an undivided heart. Wherever you tap "Enter," let that moment become your closet: phone on silent, heart unguarded before God.</p>
          <p>Prayer here is not less real for being typed, read, or declared alone in a room. Heaven still hears it the same.</p>
        </div>
      </div>

      <a class="btn btn-block" id="prayerIntroEnter" href="#/prayer/list">Enter Prayer</a>
      <label class="gate-skip">
        <input type="checkbox" data-gate-skip ${skip ? "checked" : ""}>
        Don't show this page again
      </label>
    `;
    wireGate("prayer");
  }

  function viewPrayer() {
    setHeader("Prayer", true);
    setActiveTab("prayer");
    const declarationPlain = DECLARATION.lines.filter((l) => l).join(" ");
    const declarationLinesHtml = DECLARATION.lines
      .map((l, i) => (l ? `<p class="decl-line" id="declarationLine-${i}">${esc(l)}</p>` : `<div class="decl-break"></div>`))
      .join("");
    const pointsHtml = PRAYER_POINTS.map(
      (p, i) => `<div class="prayer-item"><div class="num">${i + 1}</div><p id="prayerPointText-${i}">${esc(p)}</p></div>`
    ).join("");
    viewEl.innerHTML = `
      <div class="declaration-box">
        ${bgScenesHtml()}
        <div class="declaration-overlay"></div>
        <div class="declaration-content">
          <div class="declaration-header">
            <img class="declaration-avatar" src="/assets/oladapo-portrait.jpg" alt="Oladapo Olaleye">
            <span class="declaration-name">Oladapo Olaleye ${verifiedBadgeSvg()}</span>
          </div>
          <div class="declaration-label">Today's Declaration</div>
          <div class="declaration-text" id="declarationText">${declarationLinesHtml}</div>
          <div class="declaration-ref">${esc(DECLARATION.ref)}</div>
          <div style="display:flex; gap:10px; margin-top:14px;">
            <select class="vod-translate" id="prayerTranslate" aria-label="Translate the declaration and prayer points">${translateLangOptions()}</select>
            <button class="vod-translate" id="shareDeclarationBtn" type="button" style="font-weight:700;">Share</button>
          </div>
        </div>
      </div>
      <p class="translate-note" id="prayerTranslateNote" hidden></p>

      <div class="section-label">Pray This With Us</div>
      <div class="card" style="margin-bottom:20px;" id="prayerPointsCard">${pointsHtml}</div>

      <div class="section-label">Prayer &amp; Bible Study</div>
      <div class="card stack" style="margin-bottom:20px;">
        <p style="font-size:13.5px; color:var(--ink-2); line-height:1.6;">Join a daily WhatsApp group for prayer requests, Bible study, and encouragement with the WFN family.</p>
        <a class="btn btn-block" href="https://chat.whatsapp.com/J0JkLpylQiVKTHKcJkaKEs?s=cl&amp;p=i&amp;mlu=4&amp;ilr=4&amp;iam=0" target="_blank" rel="noopener">Join on WhatsApp</a>
      </div>

      <div class="section-label">The Prayer Circle</div>
      <div class="card stack" style="margin-bottom:16px;">
        <p style="font-size:13.5px; color:var(--ink-2); line-height:1.6;">A live, corporate prayer call &mdash; built on scripture, led in declaration. Tuesdays, 1:00&ndash;2:00 AM ET (Toronto) / 6:00&ndash;7:00 AM WAT (Lagos), via X Spaces.</p>
        <a class="btn btn-outline btn-block" href="https://x.com/wfnglobal" target="_blank" rel="noopener">Join the Circle on X</a>
      </div>
    `;
    setReadable(() => [
      "Today's Declaration.",
      declarationPlain,
      "Pray this with us.",
      ...PRAYER_POINTS
    ]);
    document.getElementById("prayerTranslate").addEventListener("change", (e) => {
      const pairs = [];
      DECLARATION.lines.forEach((l, i) => {
        if (!l) return;
        const el = document.getElementById(`declarationLine-${i}`);
        if (el) pairs.push({ el, original: l });
      });
      PRAYER_POINTS.forEach((p, i) => {
        pairs.push({ el: document.getElementById(`prayerPointText-${i}`), original: p });
      });
      translateInto(pairs, e.target.value, document.getElementById("prayerTranslateNote"));
    });
    document.getElementById("shareDeclarationBtn").addEventListener("click", () => {
      if (window.WFNShare) window.WFNShare.share(`${declarationPlain} — ${DECLARATION.ref}`);
    });
  }

  var LIBRARY_BOOKS = [
    {
      badge: "Book Three", slug: "not-consumed",
      top: "NOT", bottom: "CONSUMED",
      bg0: "#3B1740", bg1: "#1D0C22", bg2: "#0A0509",
      gold0: "#F6E8BE", gold1: "#C9A968",
      title: "Not Consumed",
      desc: "Sin took the covering. Mercy would not let go — what sin costs us, and the faithfulness of Christ that keeps us from being consumed."
    },
    {
      badge: "Book Two", slug: "look-back-look-forward",
      top: "LOOK BACK,", bottom: "LOOK FORWARD",
      bg0: "#2A3F2E", bg1: "#162419", bg2: "#0A120B",
      gold0: "#F6E8BE", gold1: "#C9A968",
      title: "Look Back, Look Forward",
      desc: "Thank God for the past. Trust Him for what's next — eight chapters on remembering rightly and stepping forward without fear."
    },
    {
      badge: "Book One", slug: "ask-boldly",
      top: "ASK", bottom: "BOLDLY",
      bg0: "#332B1C", bg1: "#1D1810", bg2: "#100C08",
      gold0: "#F6E8BE", gold1: "#C9A968",
      title: "Ask Boldly",
      desc: "Why some prayers move Heaven and others don't — eight chapters on boldness, honest motive, and faith that doesn't faint."
    }
  ];

  function viewLibraryIntro() {
    setHeader("Library", true);
    setActiveTab("library");
    const skip = gateSkipped("library");
    const b = LIBRARY_BOOKS[0];
    viewEl.innerHTML = `
      <div class="gate-stage">
        <div class="gate-inner">
          <div class="gate-back">
            <div class="gate-back-top">
              <button class="gate-back-close" data-gate-close type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
                Close
              </button>
            </div>
            <div class="gate-back-body">
              <div class="gate-kicker" style="color:#6E8A5C;">Welcome to the Archive</div>
              <h2 class="gate-back-headline">A book on glass is still a book to study.</h2>
              <p class="gate-back-text">Read here the way the Bereans read — searching the Scriptures daily, weighing every page against what God has already said, slow and unhurried, with the Spirit as your teacher.</p>
            </div>
            <div class="gate-preview-card" style="background:linear-gradient(165deg,#EBF0E6 0%,#D9E4D1 100%); border:1px solid rgba(110,138,92,0.28);">
              <svg class="gate-preview-watermark" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="75" fill="none" stroke="#6E8A5C" stroke-width="1.4"/><circle cx="80" cy="80" r="50" fill="none" stroke="#6E8A5C" stroke-width="1.4"/></svg>
              <span class="gate-preview-badge" style="color:#4C6340;">${esc(b.badge)}</span>
              <h3 class="gate-preview-title">${esc(b.title)}</h3>
              <p class="gate-preview-text" style="color:#394C30;">${esc(b.desc)}</p>
              <a class="gate-preview-cta" style="background:#6E8A5C;" href="/library/${b.slug}.html">Open the Library <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
            </div>
            <p class="gate-footnote">&ldquo;They searched the scriptures daily, whether those things were so.&rdquo; &mdash; Acts 17:11</p>
          </div>

          <div class="gate-door-left" data-gate-trigger role="button" tabindex="0" aria-expanded="false" aria-label="Tap to unlock the archive" style="background:repeating-linear-gradient(180deg, #7F9A6E 0px, #7F9A6E 26px, #6E8A5C 26px, #6E8A5C 52px); box-shadow:0 22px 50px -20px rgba(0,0,0,0.4);">
            <div style="position:absolute; inset:0; background:linear-gradient(90deg, rgba(0,0,0,0.12), rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.3));"></div>
          </div>
          <div class="gate-door-right" data-gate-trigger role="button" tabindex="0" aria-hidden="true" style="background:repeating-linear-gradient(180deg, #7F9A6E 0px, #7F9A6E 26px, #6E8A5C 26px, #6E8A5C 52px); box-shadow:0 22px 50px -20px rgba(0,0,0,0.4);">
            <div style="position:absolute; inset:0; background:linear-gradient(90deg, rgba(0,0,0,0.3), rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.12));"></div>
          </div>

          <div class="gate-slide-copy" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; padding:30px 24px 24px; pointer-events:none; color:#FFFDF8; text-align:center;">
            ${gateEmblemRing(`
              <rect x="36" y="38" width="14" height="42" rx="1.5" fill="none" stroke="#FDFBF5" stroke-width="2"/>
              <rect x="53" y="34" width="14" height="46" rx="1.5" fill="none" stroke="#FDFBF5" stroke-width="2"/>
              <rect x="70" y="40" width="14" height="40" rx="1.5" fill="none" stroke="#FDFBF5" stroke-width="2"/>
            `)}
            <div class="gate-front-eyebrow">Full Books, Free to Read</div>
            <h1 class="gate-front-title">Library</h1>
            <div class="gate-front-rule"></div>
            <p class="gate-front-text">These shelves hold whole books, not just verses. Give them the same unhurried study you'd give a printed volume — and the same reverence, knowing what you're reading is still His Word at work.</p>
            <p class="gate-front-text italic">Let the Spirit, not curiosity alone, lead you through each page.</p>
            <p class="gate-front-verse">&ldquo;Thy word is a lamp unto my feet, and a light unto my path.&rdquo; &mdash; Psalm 119:105</p>
            <div class="gate-front-cta">
              <span>Tap to Unlock the Archive</span>
              <svg class="gate-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M12 19l-6-6M12 19l6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="bible-intro-callout">
        <div class="ico" style="background:#6E8A5C;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6l-5 3.6 1.9-5.8L4 8.8h6.1z"/></svg></div>
        <div>
          <h3>Be a Berean With These Pages Too</h3>
          <p>The Bereans were praised not for believing quickly but for checking carefully — searching the Scriptures to see if what they'd heard was so. Read every book here the same way.</p>
          <p>Take your time. A chapter finished in a sitting isn't the goal; a truth settled in your spirit is.</p>
        </div>
      </div>

      <a class="btn btn-block" id="libraryIntroEnter" href="#/library/list">Open the Library</a>
      <label class="gate-skip">
        <input type="checkbox" data-gate-skip ${skip ? "checked" : ""}>
        Don't show this page again
      </label>
    `;
    wireGate("library");
  }

  function viewLibrary() {
    setHeader("Library", true);
    setActiveTab("library");
    viewEl.innerHTML = LIBRARY_BOOKS.map(function(b, i){
      var gradId = "libBg" + i, textId = "libGold" + i;
      var topSize = b.top.length > 8 ? 46 : 78;
      var bottomSize = b.bottom.length > 8 ? 46 : 78;
      return `
      <div class="section-label">${esc(b.badge)}</div>
      <div class="library-row">
        <div class="library-cover">
          <svg viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
            <defs>
              <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${b.bg0}"/><stop offset="50%" stop-color="${b.bg1}"/><stop offset="100%" stop-color="${b.bg2}"/>
              </linearGradient>
              <linearGradient id="${textId}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="${b.gold0}"/><stop offset="100%" stop-color="${b.gold1}"/>
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill="url(#${gradId})"/>
            <text x="300" y="460" text-anchor="middle" font-family="Georgia, serif" font-size="${topSize}" font-weight="900" fill="url(#${textId})">${esc(b.top)}</text>
            <text x="300" y="548" text-anchor="middle" font-family="Georgia, serif" font-size="${bottomSize}" font-weight="900" fill="url(#${textId})">${esc(b.bottom)}</text>
            <text x="300" y="800" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2" fill="#F0DFAE">OLADAPO OLALEYE</text>
          </svg>
        </div>
        <div class="body">
          <h3>${esc(b.title)}</h3>
          <div class="author">By Oladapo Olaleye &middot; Word and Faith Network</div>
          <p>${esc(b.desc)}</p>
          <div class="library-actions">
            <a class="btn btn-sm" href="/library/${b.slug}.html">Read</a>
            <a class="btn btn-outline btn-sm" href="/assets/library/${b.slug}.pdf" download>Download PDF</a>
          </div>
        </div>
      </div>
      `;
    }).join("") + `
      <a class="home-row" href="/library/" style="margin-top:4px;">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/></svg></div>
        <div class="body"><h3>Browse the Library</h3><p>All titles on wfnglobal.org</p></div>
        <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
      </a>
    `;
  }

  // ---------------------------------------------------------------------
  // Profile: name/avatar, notes, highlights, saved verses, personal prayer list
  // ---------------------------------------------------------------------

  function dateLabel(ts) {
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function viewProfile() {
    const profile = WFNStore.getProfile();
    setHeader("Profile", true);
    setActiveTab("profile");

    if (!profile) {
      viewEl.innerHTML = `
        <div class="card profile-setup-card">
          <h2>Set Up Your Profile</h2>
          <p>Your name is kept on this device only — there's no account or sign-in.</p>
          <input type="text" id="profileNameInput" placeholder="Your name" style="width:100%; border:1px solid var(--border); border-radius:12px; padding:12px 14px; font-size:15px; margin-bottom:14px; text-align:center;">
          <button class="btn btn-block" id="profileSaveBtn">Save Profile</button>
        </div>
      `;
      document.getElementById("profileSaveBtn").addEventListener("click", () => {
        const input = document.getElementById("profileNameInput");
        if (WFNStore.saveProfile(input.value)) viewProfile();
      });
      return;
    }

    const notes = WFNStore.getNotes();
    const marks = WFNStore.getMarks();
    const highlights = marks.filter((m) => m.color);
    const savedVerses = marks.filter((m) => m.saved);
    const prayers = WFNStore.getPrayers();
    const streak = WFNStore.getStreak();
    const daysThisYear = WFNStore.getDaysActiveThisYear();

    viewEl.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${esc(profile.initial)}</div>
        <div>
          <h2 class="profile-name">${esc(profile.name)}</h2>
          <a class="profile-edit-link" href="#/profile/edit">Edit Profile</a>
        </div>
      </div>

      <div class="activity-card">
        <div class="activity-stat">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#C9A968" stroke-width="1.7"><path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-1-2-1-2 2 1 3 4 3 6a6 6 0 0 1-12 0c0-4 2-5 2-7 0-1.5-.5-2.5-1-4 1 .3 2.5 1 3 0z"/></svg></div>
          <div class="activity-num">${streak}</div>
          <div class="activity-label">Day${streak === 1 ? "" : "s"} Streak</div>
        </div>
        <div class="activity-stat">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#C9A968" stroke-width="1.7"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg></div>
          <div class="activity-num">${daysThisYear}</div>
          <div class="activity-label">Days in ${new Date().getFullYear()}</div>
        </div>
      </div>

      <a class="menu-row" href="#/profile/notes">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v13l-4 3-4-3-4 3-4-3V4z"/></svg></div>
        <div class="label">Notes</div>
        <div class="count">${notes.length}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </a>
      <a class="menu-row" href="#/profile/highlights">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20l4-1 10-10-3-3L5 16l-1 4z"/></svg></div>
        <div class="label">Highlights</div>
        <div class="count">${highlights.length}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </a>
      <a class="menu-row" href="#/profile/verses">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg></div>
        <div class="label">Saved Verses</div>
        <div class="count">${savedVerses.length}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </a>
      <a class="menu-row" href="#/profile/prayer">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9z"/></svg></div>
        <div class="label">My Prayer List</div>
        <div class="count">${prayers.length}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </a>
      <a class="menu-row" href="#/profile/appearance">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg></div>
        <div class="label">Appearance</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </a>
      <a class="menu-row" href="#/profile/about">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/></svg></div>
        <div class="label">About &amp; Credits</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </a>
    `;
  }

  function viewProfileAbout() {
    setHeader("About & Credits", true);
    setActiveTab("profile");
    viewEl.innerHTML = `
      <div class="card" style="padding:22px 20px;">
        <h3 style="font-family:var(--font-display); font-size:1.15rem; margin-bottom:10px;">Scripture Text</h3>
        <p style="color:var(--ink-2); font-size:14.5px; line-height:1.7; margin-bottom:20px;">The Bible reader's default text is the King James Version (KJV), public domain. Other versions available in the version picker are fetched from their own free, public-domain or openly licensed sources.</p>
        <h3 style="font-family:var(--font-display); font-size:1.15rem; margin-bottom:10px;">Word &amp; Chapter Definitions</h3>
        <p style="color:var(--ink-2); font-size:14.5px; line-height:1.7; margin-bottom:20px;">Tap-a-word definitions for Biblical names, places, and terms are compiled from <em>Easton's Bible Dictionary</em> (M.G. Easton, 1897) and <em>Smith's Bible Dictionary</em> (William Smith, 1863), both public domain, via the open <strong>bible-dictionary-dataset</strong> project (CC BY 4.0). Ordinary modern English words are looked up from a free public dictionary API. Chapter summaries are original content written for Word &amp; Faith Network.</p>
        <h3 style="font-family:var(--font-display); font-size:1.15rem; margin-bottom:10px;">Word &amp; Faith Network</h3>
        <p style="color:var(--ink-2); font-size:14.5px; line-height:1.7;">Daily prayer, sermons, Bible studies, and this reader are published by Word &amp; Faith Network at <a href="https://wfnglobal.org" style="color:var(--gold);">wfnglobal.org</a>.</p>
      </div>
    `;
  }

  function viewProfileAppearance() {
    setHeader("Appearance", true);
    setActiveTab("profile");
    const pref = getThemePref();
    const rotate = getRotatePref();
    const reduceMotion = getMotionPref();

    const themeOpts = [
      { mode: "light", label: "Light", icon: `<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>` },
      { mode: "dark", label: "Dark", icon: `<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>` },
      { mode: "auto", label: "Auto", icon: `<path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/><circle cx="12" cy="12" r="9"/>` }
    ].map((o) => `
      <button class="theme-opt" data-mode="${o.mode}" data-active="${pref === o.mode ? 1 : 0}" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${o.icon}</svg>
        ${o.label}
      </button>
    `).join("");

    viewEl.innerHTML = `
      <div class="section-label">Appearance</div>
      <div class="card" style="margin-bottom:20px;">
        <p style="font-size:13px; color:var(--ink-2); margin:0 0 14px; line-height:1.55;">Choose how Word &amp; Faith looks on this device.</p>
        <div class="theme-row">${themeOpts}</div>
      </div>

      <div class="card" style="margin-bottom:20px; padding:0;">
        <div style="display:flex; align-items:center; gap:14px; padding:17px 18px; border-bottom:1px solid var(--border);">
          <div style="flex:1;">
            <h3 style="font-size:14.5px; margin:0 0 3px;">Rotating Backgrounds</h3>
            <p style="font-size:12.5px; color:var(--ink-2); line-height:1.5; margin:0;">The Verse of the Day and Today's Declaration cards cycle through vibrant color.</p>
          </div>
          <button class="sheet-toggle" id="rotateToggle" data-on="${rotate ? 1 : 0}" type="button" aria-label="Toggle rotating backgrounds"></button>
        </div>
        <div style="display:flex; align-items:center; gap:14px; padding:17px 18px;">
          <div style="flex:1;">
            <h3 style="font-size:14.5px; margin:0 0 3px;">Reduce Motion</h3>
            <p style="font-size:12.5px; color:var(--ink-2); line-height:1.5; margin:0;">Turn off background transitions and animation.</p>
          </div>
          <button class="sheet-toggle" id="motionToggle" data-on="${reduceMotion ? 1 : 0}" type="button" aria-label="Toggle reduce motion"></button>
        </div>
      </div>

      <div class="section-label">Reading</div>
      <button class="menu-row" id="appearanceReaderSettingsBtn" type="button" style="width:100%; text-align:left; border:1px solid var(--border);">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h11M19 7h1M4 17h1M9 17h11M4 12h7M15 12h5"/><circle cx="18" cy="7" r="2.2"/><circle cx="7" cy="17" r="2.2"/><circle cx="11" cy="12" r="2.2"/></svg></div>
        <div class="label">Text Size &amp; Fonts</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </button>
    `;

    viewEl.querySelectorAll(".theme-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyTheme(btn.dataset.mode);
        viewProfileAppearance();
      });
    });
    document.getElementById("rotateToggle").addEventListener("click", () => {
      setRotatePref(!rotate);
      viewProfileAppearance();
    });
    document.getElementById("motionToggle").addEventListener("click", () => {
      setMotionPref(!reduceMotion);
      viewProfileAppearance();
    });
    document.getElementById("appearanceReaderSettingsBtn").addEventListener("click", openReaderSettingsSheet);
  }

  function viewProfileEdit() {
    const profile = WFNStore.getProfile();
    setHeader("Edit Profile", true);
    setActiveTab("profile");
    viewEl.innerHTML = `
      <div class="card">
        <input type="text" id="profileNameInput" value="${esc(profile ? profile.name : "")}" placeholder="Your name" style="width:100%; border:1px solid var(--border); border-radius:12px; padding:12px 14px; font-size:15px; margin-bottom:14px;">
        <button class="btn btn-block" id="profileSaveBtn">Save</button>
      </div>
    `;
    document.getElementById("profileSaveBtn").addEventListener("click", () => {
      const input = document.getElementById("profileNameInput");
      WFNStore.saveProfile(input.value);
      location.hash = "#/profile";
    });
  }

  function emptyState(msg) {
    return `<div class="empty-state">${esc(msg)}</div>`;
  }

  function viewProfileNotes() {
    setHeader("Notes", true);
    setActiveTab("profile");
    const notes = WFNStore.getNotes();
    if (!notes.length) { viewEl.innerHTML = emptyState("No notes yet. Add one from any sermon or Bible chapter."); return; }
    viewEl.innerHTML = notes.map((n) => `
      <div class="list-item" data-id="${n.id}">
        <div class="list-item-top">
          <span class="list-item-ref">${esc(n.refLabel)}</span>
          <span class="list-item-date">${dateLabel(n.createdAt)}</span>
        </div>
        <p class="list-item-text">${esc(n.text)}</p>
        <div class="list-item-actions">
          <button class="danger" data-action="delete">Delete</button>
        </div>
      </div>`).join("");
    wireListDeletes(viewEl, (id) => { WFNStore.deleteNote(id); viewProfileNotes(); });
  }

  function viewProfileHighlights() {
    setHeader("Highlights", true);
    setActiveTab("profile");
    const highlights = WFNStore.getMarks().filter((m) => m.color);
    if (!highlights.length) { viewEl.innerHTML = emptyState("No highlighted verses yet. Tap any verse in the Bible to highlight it."); return; }
    viewEl.innerHTML = highlights.map((m) => `
      <a class="list-item" data-id="${m.id}" href="#/bible/${m.bookSlug}/${m.chapter}" data-color="${m.color}" style="display:block; border-left:4px solid var(--gold-light);">
        <div class="list-item-top">
          <span class="list-item-ref">${esc(m.bookName)} ${m.chapter}:${m.verse}</span>
          <span class="list-item-date">${dateLabel(m.createdAt)}</span>
        </div>
        <p class="list-item-text">${esc(m.text)}</p>
      </a>`).join("");
  }

  function viewProfileVerses() {
    setHeader("Saved Verses", true);
    setActiveTab("profile");
    const saved = WFNStore.getMarks().filter((m) => m.saved);
    if (!saved.length) { viewEl.innerHTML = emptyState("No saved verses yet. Tap any verse in the Bible to save it."); return; }
    viewEl.innerHTML = saved.map((m) => `
      <a class="list-item" data-id="${m.id}" href="#/bible/${m.bookSlug}/${m.chapter}" style="display:block;">
        <div class="list-item-top">
          <span class="list-item-ref">${esc(m.bookName)} ${m.chapter}:${m.verse}</span>
          <span class="list-item-date">${dateLabel(m.createdAt)}</span>
        </div>
        <p class="list-item-text">${esc(m.text)}</p>
      </a>`).join("");
  }

  function viewProfilePrayer() {
    setHeader("My Prayer List", true);
    setActiveTab("profile");
    hideNoteFab();
    const prayers = WFNStore.getPrayers();
    const list = prayers.length
      ? prayers.map((p) => `
        <div class="list-item ${p.answered ? "answered" : ""}" data-id="${p.id}">
          <p class="list-item-text">${esc(p.text)}</p>
          <div class="list-item-actions">
            <button data-action="answered">${p.answered ? "Mark Unanswered" : "Mark Answered"}</button>
            <button class="danger" data-action="delete">Delete</button>
          </div>
        </div>`).join("")
      : emptyState("Nothing here yet. Add a prayer request below.");
    viewEl.innerHTML = `
      <div class="card" style="margin-bottom:20px; display:flex; gap:10px;">
        <input type="text" id="prayerInput" placeholder="Add a prayer request…" style="flex:1; border:1px solid var(--border); border-radius:12px; padding:11px 14px; font-size:14px;">
        <button class="btn" id="prayerAddBtn">Add</button>
      </div>
      ${list}
    `;
    document.getElementById("prayerAddBtn").addEventListener("click", () => {
      const input = document.getElementById("prayerInput");
      if (WFNStore.addPrayer(input.value)) viewProfilePrayer();
    });
    viewEl.querySelectorAll('[data-action="answered"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        WFNStore.togglePrayerAnswered(btn.closest(".list-item").dataset.id);
        viewProfilePrayer();
      });
    });
    wireListDeletes(viewEl, (id) => { WFNStore.deletePrayer(id); viewProfilePrayer(); });
  }

  function wireListDeletes(container, onDelete) {
    container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        onDelete(btn.closest(".list-item").dataset.id);
      });
    });
  }

  // ---------------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------------

  function route() {
    hideNoteFab();
    setReadable(null);
    if (window.WFNTTS) window.WFNTTS.stop();
    const hash = location.hash.replace(/^#\/?/, "");
    const parts = hash.split("/").filter(Boolean);

    if (parts[0] !== "game") {
      if (window.WFNGame) window.WFNGame.unmount();
      setGameFullscreen(false);
    }

    if (parts.length === 0 || parts[0] === "home") return viewHome();
    if (parts[0] === "game") return viewGame();
    if (parts[0] === "bible") {
      if (parts.length === 1) {
        if (gateSkipped("bible")) { location.replace("#/bible/books"); return; }
        return viewBibleIntro();
      }
      if (parts[1] === "books") return viewBibleBooks();
      if (parts[1] === "search") return viewBibleSearch(parts[2]);
      if (parts.length === 2) return viewBibleChapters(parts[1]);
      if (parts.length >= 3) return viewBibleReader(parts[1], parts[2]);
    }
    if (parts[0] === "sermons") {
      if (parts.length >= 2) {
        if (parts[1] === "list") return viewSermonsList();
        // Deep link straight out to the full sermon page on the main site.
        location.href = "/articles/" + parts[1] + ".html";
        return;
      }
      if (gateSkipped("sermons")) { location.replace("#/sermons/list"); return; }
      return viewSermonsIntro();
    }
    if (parts[0] === "prayer") {
      if (parts.length >= 2 && parts[1] === "list") return viewPrayer();
      if (gateSkipped("prayer")) { location.replace("#/prayer/list"); return; }
      return viewPrayerIntro();
    }
    if (parts[0] === "library") {
      if (parts.length >= 2 && parts[1] === "list") return viewLibrary();
      if (gateSkipped("library")) { location.replace("#/library/list"); return; }
      return viewLibraryIntro();
    }
    if (parts[0] === "profile") {
      if (parts.length === 1) return viewProfile();
      if (parts[1] === "edit") return viewProfileEdit();
      if (parts[1] === "notes") return viewProfileNotes();
      if (parts[1] === "highlights") return viewProfileHighlights();
      if (parts[1] === "verses") return viewProfileVerses();
      if (parts[1] === "prayer") return viewProfilePrayer();
      if (parts[1] === "appearance") return viewProfileAppearance();
      if (parts[1] === "about") return viewProfileAbout();
      return viewProfile();
    }

    return viewHome();
  }

  // ---------------------------------------------------------------------
  // Back navigation: a real in-app history stack, so the header's back
  // arrow returns to wherever the person actually came from (e.g. the
  // chapter list after reading a chapter) instead of always jumping Home.
  // ---------------------------------------------------------------------

  let backStack = [];
  let isBackNav = false;

  backEl.addEventListener("click", (e) => {
    e.preventDefault();
    if (backStack.length) {
      isBackNav = true;
      location.hash = backStack.pop();
    } else {
      location.hash = "#/home";
    }
  });

  window.addEventListener("hashchange", (e) => {
    if (!isBackNav) {
      const oldHash = (() => {
        try { return new URL(e.oldURL).hash || "#/home"; } catch (err) { return "#/home"; }
      })();
      backStack.push(oldHash);
    }
    isBackNav = false;
    route();
  });

  // Chapter prev/next fabs: float at a vertical position that tracks how
  // far down the chapter the reader has scrolled (near the top of the
  // screen early in a chapter, drifting down toward the middle of the
  // screen as they approach the end) instead of sitting frozen at one
  // spot — so they feel anchored to where you're actually reading.
  // Harmless no-op on any view that doesn't have them.
  const RCF_TOP_MIN = 20, RCF_TOP_MAX = 72;
  function updateChapterFabPosition() {
    const prev = document.querySelector(".reader-chapter-fab-prev");
    const next = document.querySelector(".reader-chapter-fab-next");
    if (!prev && !next) return;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    const top = (RCF_TOP_MIN + progress * (RCF_TOP_MAX - RCF_TOP_MIN)).toFixed(1) + "%";
    if (prev) prev.style.top = top;
    if (next) next.style.top = top;
  }

  // Bottom tab bar auto-hide: fades out of the way while reading (the
  // page scrolling down) and comes back on its own — immediately on
  // scrolling up, or after a short pause even if the page never scrolls
  // back up, so it's never more than a moment away. One global listener,
  // not per-view, since every screen shares the same tab bar.
  // While The Word Climb is open, the bottom tab bar (Home/Bible/Sermons/
  // Prayer/Library/Profile) stays fully hidden rather than just auto-hiding
  // on scroll, so the game reads as its own full-screen experience. The
  // header's back arrow is still how you leave it.
  let gameFullscreen = false;
  function setGameFullscreen(on) {
    gameFullscreen = on;
    const tabbar = document.querySelector(".app-tabbar");
    if (tabbar) tabbar.classList.toggle("tabbar-hidden", on);
    const appEl = document.getElementById("app");
    if (appEl) appEl.classList.toggle("game-fullscreen", on);
  }

  function setupTabbarAutoHide() {
    const tabbar = document.querySelector(".app-tabbar");
    let lastY = window.scrollY;
    let idleTimer = null;
    const IDLE_MS = 1200;
    const THRESHOLD = 6;
    const TOP_ZONE = 40;
    // The chapter prev/next fabs are re-rendered per view (only present in
    // the Bible reader), so they're looked up fresh each time rather than
    // cached once — they fade and slide out of the way together with the
    // tab bar, instead of sitting frozen on screen while someone reads.
    function show() {
      if (gameFullscreen) return;
      if (tabbar) tabbar.classList.remove("tabbar-hidden");
      document.querySelectorAll(".reader-chapter-fab-prev, .reader-chapter-fab-next").forEach((el) => el.classList.remove("rcf-hidden"));
    }
    function hide() {
      if (tabbar) tabbar.classList.add("tabbar-hidden");
      document.querySelectorAll(".reader-chapter-fab-prev, .reader-chapter-fab-next").forEach((el) => el.classList.add("rcf-hidden"));
    }
    function scheduleIdleShow() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(show, IDLE_MS);
    }
    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        const delta = y - lastY;
        if (y < TOP_ZONE) show();
        else if (delta > THRESHOLD) hide();
        else if (delta < -THRESHOLD) show();
        lastY = y;
        scheduleIdleShow();
        updateChapterFabPosition();
      },
      { passive: true }
    );
  }

  window.addEventListener("DOMContentLoaded", () => {
    WFNStore.recordActivityToday();
    mountVoiceControls();
    setupTabbarAutoHide();
    route();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/app/sw.js").catch(() => {});
    }
  });
})();

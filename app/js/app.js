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

  const VERSES = [
    { text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary.", ref: "Isaiah 40:31" },
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

  const SERMONS = [
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
  applyReaderSize(getReaderSizeIndex()); // apply immediately on app load, before any chapter renders

  // ---------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------

  function viewHome() {
    setHeader("Word & Faith Network", false);
    setActiveTab("home");
    const verse = VERSES[dayIndex(VERSES.length)];
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

      <div class="verse-of-day">
        <div class="verse-of-day-label">Verse of the Day</div>
        <div class="verse-of-day-text">&ldquo;${esc(verse.text)}&rdquo;</div>
        <div class="verse-of-day-ref">${esc(verse.ref)} KJV</div>
      </div>

      <div class="stack">
        <a class="home-row" href="#/sermons/${sermon.slug}">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h11a1 1 0 0 1 1 1v13l-4-2-4 2-4-2V5a1 1 0 0 1 1-1z"/></svg></div>
          <div class="body"><h3>Today's Sermon</h3><p>${esc(sermon.title)}</p></div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
        <a class="home-row" href="${bibleRowHref}">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6a5 5 0 0 0-5-3H3v15h4a5 5 0 0 1 5 3"/><path d="M12 6a5 5 0 0 1 5-3h4v15h-4a5 5 0 0 0-5 3"/></svg></div>
          <div class="body"><h3>Read the Bible</h3>${bibleRowBody}</div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
        <a class="home-row" href="#/prayer">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9z"/></svg></div>
          <div class="body"><h3>Today's Declaration</h3><p>Pray with us</p></div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
        <a class="home-row" href="#/library">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 3v18M8 8h8M8 12h8"/></svg></div>
          <div class="body"><h3>The Library</h3><p>Ask Boldly — Book One</p></div>
          <div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
        </a>
      </div>

      <div id="installHint" style="margin-top:18px;"></div>
    `;
    renderInstallHint(document.getElementById("installHint"));
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

    const verses = data.chapters[chapter - 1];
    const marks = WFNStore.getMarks();
    const markFor = (vi) => marks.find((m) => m.bookSlug === slug && m.chapter === chapter && m.verse === vi + 1);
    const verseHtml = verses
      .map((v, i) => {
        const m = markFor(i);
        const colorAttr = m && m.color ? ` data-color="${m.color}"` : "";
        const savedDot = m && m.saved ? `<span class="saved-dot"></span>` : "";
        return `<p class="v" data-verse="${i + 1}"${colorAttr}><span class="vnum">${i + 1}</span>${v}${savedDot}</p>`;
      })
      .join("");

    const prevDisabled = chapter <= 1 ? "disabled" : "";
    const nextDisabled = chapter >= data.chapters.length ? "disabled" : "";
    const prevHref = chapter > 1 ? `#/bible/${slug}/${chapter - 1}` : "#";
    const nextHref = chapter < data.chapters.length ? `#/bible/${slug}/${chapter + 1}` : "#";

    viewEl.innerHTML = `
      <div class="reader-nav">
        <button class="reader-nav-btn" id="prevCh" ${prevDisabled} data-href="${prevHref}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg> Prev
        </button>
        <a class="reader-title" href="#/bible/${slug}">${esc(data.name)} ${chapter}</a>
        <button class="reader-nav-btn" id="nextCh" ${nextDisabled} data-href="${nextHref}">
          Next <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>
      <div class="text-size-row">
        <span class="text-size-label">Text Size</span>
        <button class="text-size-btn" id="textSizeDown" aria-label="Smaller text">A</button>
        <button class="text-size-btn" id="textSizeUp" aria-label="Larger text">A</button>
      </div>
      <div class="verse-list" id="verseList">${verseHtml}</div>
    `;
    viewEl.scrollTo(0, 0);
    window.scrollTo(0, 0);
    ["prevCh", "nextCh"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn && !btn.disabled) {
        btn.addEventListener("click", () => { location.hash = btn.dataset.href; });
      }
    });

    const downBtn = document.getElementById("textSizeDown");
    const upBtn = document.getElementById("textSizeUp");
    const refreshSizeBtns = () => {
      const idx = getReaderSizeIndex();
      downBtn.disabled = idx <= 0;
      upBtn.disabled = idx >= READER_SIZES.length - 1;
    };
    refreshSizeBtns();
    downBtn.addEventListener("click", () => { applyReaderSize(Math.max(0, getReaderSizeIndex() - 1)); refreshSizeBtns(); });
    upBtn.addEventListener("click", () => { applyReaderSize(Math.min(READER_SIZES.length - 1, getReaderSizeIndex() + 1)); refreshSizeBtns(); });

    document.getElementById("verseList").addEventListener("click", (e) => {
      const p = e.target.closest(".v");
      if (!p) return;
      const vi = parseInt(p.dataset.verse, 10);
      openVerseSheet(slug, data.name, chapter, vi, WFNBible.plain(verses[vi - 1]));
    });

    showNoteFab(() => openNoteSheet("bible", `bible:${slug}:${chapter}`, `${data.name} ${chapter}`));
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
      <a class="btn btn-outline btn-block" style="margin-top:10px;" id="addVerseNoteBtn">Add a Note on This Verse</a>
    `);
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

  function viewPrayer() {
    setHeader("Prayer", true);
    setActiveTab("prayer");
    const pointsHtml = PRAYER_POINTS.map(
      (p, i) => `<div class="prayer-item"><div class="num">${i + 1}</div><p>${esc(p)}</p></div>`
    ).join("");
    viewEl.innerHTML = `
      <div class="declaration-box">
        <div class="declaration-label">Today's Declaration</div>
        <div class="declaration-text">&ldquo;Father, I enter this Friday under an open heaven. What You have spoken over my life will not return empty. This day is covered, ordered, and aligned with Your purpose. I declare that Friday is a day of advancement. What was delayed is moving. What was blocked is opening. What was hidden is being revealed. I rise above every limitation assigned to this season. Mercy goes before me, and favor follows me. I speak life over my mind, my body, my household, and every assignment in my hands. Confusion is silenced. Fear has no voice. Delay is broken. The work of my hands is established, and I will not labor in vain. I receive grace for this day. I walk in peace, not pressure. I move with confidence, knowing heaven has already gone ahead of me. Let it be evident by evening that Your hand was upon me. In Jesus' name, amen.&rdquo;</div>
        <div class="declaration-ref">Isaiah 55:11 &middot; Psalm 90:17</div>
      </div>

      <div class="section-label">Pray This With Us</div>
      <div class="card" style="margin-bottom:20px;">${pointsHtml}</div>

      <div class="section-label">The Prayer Circle</div>
      <div class="card stack" style="margin-bottom:16px;">
        <p style="font-size:13.5px; color:var(--ink-2); line-height:1.6;">A live, corporate prayer call &mdash; built on scripture, led in declaration. Tuesdays, 1:00&ndash;2:00 AM ET (Toronto) / 6:00&ndash;7:00 AM WAT (Lagos), via X Spaces.</p>
        <a class="btn btn-outline btn-block" href="https://x.com/wfnglobal" target="_blank" rel="noopener">Join the Circle on X</a>
      </div>
    `;
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

    viewEl.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${esc(profile.initial)}</div>
        <div>
          <h2 class="profile-name">${esc(profile.name)}</h2>
          <a class="profile-edit-link" href="#/profile/edit">Edit Profile</a>
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
    `;
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
    const hash = location.hash.replace(/^#\/?/, "");
    const parts = hash.split("/").filter(Boolean);

    if (parts.length === 0 || parts[0] === "home") return viewHome();
    if (parts[0] === "bible") {
      if (parts.length === 1) return viewBibleBooks();
      if (parts[1] === "search") return viewBibleSearch(parts[2]);
      if (parts.length === 2) return viewBibleChapters(parts[1]);
      if (parts.length >= 3) return viewBibleReader(parts[1], parts[2]);
    }
    if (parts[0] === "sermons") {
      if (parts.length >= 2) {
        // Deep link straight out to the full sermon page on the main site.
        location.href = "/articles/" + parts[1] + ".html";
        return;
      }
      return viewSermonsList();
    }
    if (parts[0] === "prayer") return viewPrayer();
    if (parts[0] === "library") return viewLibrary();
    if (parts[0] === "profile") {
      if (parts.length === 1) return viewProfile();
      if (parts[1] === "edit") return viewProfileEdit();
      if (parts[1] === "notes") return viewProfileNotes();
      if (parts[1] === "highlights") return viewProfileHighlights();
      if (parts[1] === "verses") return viewProfileVerses();
      if (parts[1] === "prayer") return viewProfilePrayer();
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

  window.addEventListener("DOMContentLoaded", () => {
    route();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/app/sw.js").catch(() => {});
    }
  });
})();

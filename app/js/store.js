// Word and Faith Network — on-device personal data store.
// Everything here lives in localStorage on this device only (no account, no sync).

window.WFNStore = (function () {
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  const PROFILE_KEY = "wfn-app-profile";
  const NOTES_KEY = "wfn-app-notes";
  const MARKS_KEY = "wfn-app-marks"; // highlights + saved verses, one entry per verse
  const PRAYERS_KEY = "wfn-app-prayers";

  // ---- Profile ----
  function getProfile() {
    return read(PROFILE_KEY, null);
  }
  function saveProfile(name) {
    name = (name || "").trim();
    if (!name) return getProfile();
    const initial = name.trim().charAt(0).toUpperCase();
    const profile = { name, initial, updatedAt: Date.now() };
    write(PROFILE_KEY, profile);
    return profile;
  }

  // ---- Notes ----
  function getNotes() {
    return read(NOTES_KEY, []);
  }
  function addNote(type, refKey, refLabel, text) {
    text = (text || "").trim();
    if (!text) return null;
    const notes = getNotes();
    const note = { id: uid(), type, refKey, refLabel, text, createdAt: Date.now() };
    notes.unshift(note);
    write(NOTES_KEY, notes);
    return note;
  }
  function deleteNote(id) {
    write(NOTES_KEY, getNotes().filter((n) => n.id !== id));
  }

  // ---- Highlights / saved verses (shared per-verse record) ----
  function markKey(bookSlug, chapter, verse) {
    return `${bookSlug}:${chapter}:${verse}`;
  }
  function getMarks() {
    return read(MARKS_KEY, []);
  }
  function getMark(bookSlug, chapter, verse) {
    const key = markKey(bookSlug, chapter, verse);
    return getMarks().find((m) => markKey(m.bookSlug, m.chapter, m.verse) === key) || null;
  }
  function upsertMark(bookSlug, bookName, chapter, verse, text, patch) {
    const marks = getMarks();
    const key = markKey(bookSlug, chapter, verse);
    let m = marks.find((x) => markKey(x.bookSlug, x.chapter, x.verse) === key);
    if (!m) {
      m = { id: uid(), bookSlug, bookName, chapter, verse, text, color: null, saved: false, createdAt: Date.now() };
      marks.unshift(m);
    }
    Object.assign(m, patch, { text });
    // Drop the record entirely once it carries nothing worth keeping.
    const kept = marks.filter((x) => x.color || x.saved);
    write(MARKS_KEY, kept);
    return kept.find((x) => markKey(x.bookSlug, x.chapter, x.verse) === key) || null;
  }
  function setHighlight(bookSlug, bookName, chapter, verse, text, color) {
    return upsertMark(bookSlug, bookName, chapter, verse, text, { color });
  }
  function toggleSaved(bookSlug, bookName, chapter, verse, text) {
    const existing = getMark(bookSlug, chapter, verse);
    const nextSaved = !(existing && existing.saved);
    return upsertMark(bookSlug, bookName, chapter, verse, text, { saved: nextSaved });
  }
  function deleteMark(id) {
    write(MARKS_KEY, getMarks().filter((m) => m.id !== id));
  }

  // ---- Personal prayer list ----
  function getPrayers() {
    return read(PRAYERS_KEY, []);
  }
  function addPrayer(text) {
    text = (text || "").trim();
    if (!text) return null;
    const prayers = getPrayers();
    const p = { id: uid(), text, answered: false, createdAt: Date.now(), answeredAt: null };
    prayers.unshift(p);
    write(PRAYERS_KEY, prayers);
    return p;
  }
  function togglePrayerAnswered(id) {
    const prayers = getPrayers();
    const p = prayers.find((x) => x.id === id);
    if (p) {
      p.answered = !p.answered;
      p.answeredAt = p.answered ? Date.now() : null;
      write(PRAYERS_KEY, prayers);
    }
    return p;
  }
  function deletePrayer(id) {
    write(PRAYERS_KEY, getPrayers().filter((p) => p.id !== id));
  }

  return {
    getProfile, saveProfile,
    getNotes, addNote, deleteNote,
    getMarks, getMark, setHighlight, toggleSaved, deleteMark,
    getPrayers, addPrayer, togglePrayerAnswered, deletePrayer,
  };
})();

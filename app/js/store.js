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
  const PLANS_KEY = "wfn-app-plans"; // { "<planSlug>": { completedDays: [1,2,...], startedAt, lastDayAt } }

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

  // ---- Activity: which calendar days (on this device) the app was opened,
  // used for the streak and "days this year" counters on the Profile page.
  const ACTIVITY_KEY = "wfn-app-activity"; // { "YYYY-MM-DD": true, ... }

  function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function getActivity() {
    return read(ACTIVITY_KEY, {});
  }
  function recordActivityToday() {
    const activity = getActivity();
    const key = dateKey(new Date());
    if (!activity[key]) {
      activity[key] = true;
      write(ACTIVITY_KEY, activity);
    }
    return activity;
  }
  function getStreak() {
    const activity = getActivity();
    let streak = 0;
    const d = new Date();
    // A streak counts back from today; if today hasn't been recorded yet
    // (shouldn't normally happen — the app records on launch) it falls back
    // to checking from yesterday, so a streak in progress isn't shown as 0
    // before today's visit has been written.
    if (!activity[dateKey(d)]) d.setDate(d.getDate() - 1);
    while (activity[dateKey(d)]) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }
  function getDaysActiveThisYear() {
    const activity = getActivity();
    const year = String(new Date().getFullYear()) + "-";
    return Object.keys(activity).filter((k) => k.indexOf(year) === 0).length;
  }

  // ---- Reading plan progress (per-device; one record per plan slug) ----
  function getAllPlanProgress() {
    return read(PLANS_KEY, {});
  }
  function getPlanProgress(slug) {
    const all = getAllPlanProgress();
    return all[slug] || { completedDays: [], startedAt: null, lastDayAt: null };
  }
  function markPlanDayComplete(slug, day) {
    const all = getAllPlanProgress();
    const p = all[slug] || { completedDays: [], startedAt: Date.now(), lastDayAt: null };
    if (!p.startedAt) p.startedAt = Date.now();
    if (!p.completedDays.includes(day)) p.completedDays.push(day);
    p.lastDayAt = Date.now();
    all[slug] = p;
    write(PLANS_KEY, all);
    return p;
  }
  function markPlanDayIncomplete(slug, day) {
    const all = getAllPlanProgress();
    const p = all[slug] || { completedDays: [], startedAt: null, lastDayAt: null };
    p.completedDays = p.completedDays.filter((d) => d !== day);
    all[slug] = p;
    write(PLANS_KEY, all);
    return p;
  }
  function resetPlan(slug) {
    const all = getAllPlanProgress();
    delete all[slug];
    write(PLANS_KEY, all);
  }

  return {
    getProfile, saveProfile,
    getNotes, addNote, deleteNote,
    getMarks, getMark, setHighlight, toggleSaved, deleteMark,
    getPrayers, addPrayer, togglePrayerAnswered, deletePrayer,
    recordActivityToday, getStreak, getDaysActiveThisYear,
    getPlanProgress, markPlanDayComplete, markPlanDayIncomplete, resetPlan,
  };
})();

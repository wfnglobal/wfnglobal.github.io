/* WFN shared translate helper — used on pages outside /app/ (the Library)
 * that want the same free, no-key machine translation the app uses for
 * the Verse of the Day and Prayer page: English, Yorùbá, Igbo, Hausa,
 * Pidgin, Español, Français, Português.
 *
 * Pidgin has no mainstream machine-translation engine behind it — so for
 * book-length original prose (which has no hand-translated version on
 * file, unlike the app's fixed Home/Prayer text) it is attempted on a
 * best-effort community translation memory and, when that comes back
 * empty, shown with an honest note rather than breaking or hanging.
 *
 * Successful live translations are cached in localStorage (shared with
 * the app's own cache, same key scheme) so the same sentence is never
 * fetched twice, and requests are limited to a handful in flight at once
 * so a long chapter doesn't fire 60 requests at the same moment.
 */
(function (global) {
  "use strict";

  var TRANSLATE_LANGS = [
    { code: "en", name: "English" },
    { code: "yo", name: "Yorùbá" },
    { code: "ig", name: "Igbo" },
    { code: "ha", name: "Hausa" },
    { code: "pcm", name: "Pidgin" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "pt", name: "Português" }
  ];
  var TRANSLATE_TIMEOUT_MS = 7000;
  var NO_MT_LANGS = { pcm: true };
  var MAX_CONCURRENT = 4;

  function fetchWithTimeout(url, ms) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, ms);
    return fetch(url, { signal: controller.signal }).finally(function () { clearTimeout(timer); });
  }

  function cacheKey(text, langCode) {
    var h = 0;
    for (var i = 0; i < text.length; i++) { h = (h * 31 + text.charCodeAt(i)) | 0; }
    return "wfn-translate-cache:" + langCode + ":" + h;
  }
  function getCached(text, langCode) {
    try { return localStorage.getItem(cacheKey(text, langCode)); } catch (e) { return null; }
  }
  function setCached(text, langCode, translated) {
    try { localStorage.setItem(cacheKey(text, langCode), translated); } catch (e) {}
  }

  function fetchGoogleTranslate(text, langCode) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" + langCode + "&dt=t&q=" + encodeURIComponent(text);
    return fetchWithTimeout(url, TRANSLATE_TIMEOUT_MS)
      .then(function (res) { return res.json(); })
      .then(function (json) {
        var out = (json && json[0]) ? json[0].map(function (seg) { return seg[0]; }).join("") : "";
        return out && out.trim() ? out.trim() : null;
      });
  }

  function fetchMyMemoryPidgin(text) {
    var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=en|pcm";
    return fetchWithTimeout(url, TRANSLATE_TIMEOUT_MS)
      .then(function (res) { return res.json(); })
      .then(function (json) {
        var out = json && json.responseData && json.responseData.translatedText;
        var looksReal = out && out.trim() && out.trim().toLowerCase() !== text.trim().toLowerCase() && !/^MYMEMORY WARNING/i.test(out);
        return looksReal ? out.trim() : null;
      });
  }

  function translateOne(text, langCode) {
    if (!langCode || langCode === "en") return Promise.resolve(text);

    var cached = getCached(text, langCode);
    if (cached) return Promise.resolve(cached);

    if (!NO_MT_LANGS[langCode]) {
      // One retry before giving up — these free endpoints sometimes drop
      // a single request rather than being truly down.
      return fetchGoogleTranslate(text, langCode).catch(function () { return null; })
        .then(function (out) {
          if (out) { setCached(text, langCode, out); return out; }
          return fetchGoogleTranslate(text, langCode).catch(function () { return null; })
            .then(function (out2) {
              if (out2) setCached(text, langCode, out2);
              return out2;
            });
        });
    }
    return fetchMyMemoryPidgin(text).catch(function () { return null; })
      .then(function (out) {
        if (out) setCached(text, langCode, out);
        return out;
      });
  }

  // Runs translateOne over every pair with at most MAX_CONCURRENT in
  // flight at a time, so a 50-paragraph chapter doesn't fire 50 requests
  // in the same instant.
  function translateAllLimited(pairs, langCode) {
    var i = 0;
    var results = new Array(pairs.length);
    function next() {
      var idx = i++;
      if (idx >= pairs.length) return Promise.resolve();
      return translateOne(pairs[idx].original, langCode).then(function (out) {
        results[idx] = out;
        return next();
      });
    }
    var workers = [];
    for (var w = 0; w < Math.min(MAX_CONCURRENT, pairs.length); w++) workers.push(next());
    return Promise.all(workers).then(function () { return results; });
  }

  // Translates a batch of {el, original} pairs into langCode, writing
  // each result straight into the element. Always leaves real text
  // behind — original English with a note when a translation couldn't
  // be produced — never a stuck "Translating…" label.
  function translateInto(pairs, langCode, noteEl) {
    if (noteEl) noteEl.hidden = true;
    if (!langCode || langCode === "en") {
      pairs.forEach(function (p) { p.el.textContent = p.original; });
      return Promise.resolve();
    }
    pairs.forEach(function (p) { p.el.textContent = "Translating…"; });
    return translateAllLimited(pairs, langCode).then(function (outs) {
      var anyFailed = false;
      pairs.forEach(function (p, idx) {
        if (outs[idx]) { p.el.textContent = outs[idx]; }
        else { p.el.textContent = p.original; anyFailed = true; }
      });
      if (noteEl) {
        if (anyFailed && NO_MT_LANGS[langCode]) {
          noteEl.hidden = false;
          noteEl.textContent = "Pidgin translation isn't available for every passage yet — no major translation engine fully supports it, so some of this book is still shown in English.";
        } else if (anyFailed) {
          noteEl.hidden = false;
          noteEl.textContent = "Translation is temporarily unavailable for part of this page — showing the original English there.";
        }
      }
    });
  }

  function translateLangOptions() {
    return '<option value="">Translate…</option>' + TRANSLATE_LANGS.map(function (l) {
      return '<option value="' + l.code + '">' + l.name + "</option>";
    }).join("");
  }

  // Wires a <select> + optional note element to translate every element
  // matched by `selector` inside `scopeEl` (defaults to the whole
  // document). Captures each element's original English text once, up
  // front, so switching back to English is instant and never re-fetched.
  function mount(selectEl, noteEl, scopeEl, selector) {
    if (!selectEl) return;
    selectEl.innerHTML = translateLangOptions();
    var root = scopeEl || document;
    var pairs = Array.prototype.slice.call(root.querySelectorAll(selector)).map(function (el) {
      return { el: el, original: el.textContent };
    });
    selectEl.addEventListener("change", function () {
      translateInto(pairs, selectEl.value, noteEl);
    });
  }

  global.WFNTranslate = {
    TRANSLATE_LANGS: TRANSLATE_LANGS,
    translateOne: translateOne,
    translateInto: translateInto,
    translateLangOptions: translateLangOptions,
    mount: mount
  };
})(window);

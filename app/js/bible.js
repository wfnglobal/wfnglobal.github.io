// Word and Faith Network — Bible data layer
// Loads the KJV index + per-book JSON (served from /app/data/bible/, cached offline by the service worker).

window.WFNBible = (function () {
  const DATA_BASE = "/app/data/bible/";
  const SUMMARY_BASE = "/app/data/summaries/";
  let indexPromise = null;
  const bookCache = new Map(); // slug -> { name, slug, chapters: [...] }
  const summaryCache = new Map(); // slug -> { name, slug, chapters: { "1": "...", ... } } | null (none available)

  function getIndex() {
    if (!indexPromise) {
      indexPromise = fetch(DATA_BASE + "index.json").then((r) => r.json());
    }
    return indexPromise;
  }

  function getBook(slug) {
    if (bookCache.has(slug)) return Promise.resolve(bookCache.get(slug));
    return fetch(DATA_BASE + slug + ".json")
      .then((r) => r.json())
      .then((data) => {
        bookCache.set(slug, data);
        return data;
      });
  }

  // Plain-English "what does this chapter say" summary, for readers who read
  // the text but want help understanding it. Returns null (not a rejected
  // promise) when no summary file exists for that book yet or that specific
  // chapter isn't covered, so callers can show a plain "not available" state
  // instead of an error.
  function getChapterSummary(slug, chapter) {
    if (summaryCache.has(slug)) {
      const cached = summaryCache.get(slug);
      return Promise.resolve(cached && cached.chapters ? cached.chapters[String(chapter)] || null : null);
    }
    return fetch(SUMMARY_BASE + slug + ".json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => {
        summaryCache.set(slug, data);
        return data && data.chapters ? data.chapters[String(chapter)] || null : null;
      });
  }

  // Very small plain-text extraction (for search snippets), stripping our HTML markup.
  function plain(verseHtml) {
    return verseHtml.replace(/<[^>]*>/g, "");
  }

  // Searches every book (loading + caching any not yet fetched). Returns up to `limit` matches.
  async function search(query, limit) {
    limit = limit || 80;
    const q = query.trim().toLowerCase();
    if (q.length < 3) return [];
    const books = await getIndex();
    const results = [];
    for (const b of books) {
      const data = await getBook(b.slug);
      for (let ci = 0; ci < data.chapters.length; ci++) {
        const chapter = data.chapters[ci];
        for (let vi = 0; vi < chapter.length; vi++) {
          const text = plain(chapter[vi]);
          if (text.toLowerCase().indexOf(q) !== -1) {
            results.push({
              book: data.name,
              slug: data.slug,
              chapter: ci + 1,
              verse: vi + 1,
              text: text,
            });
            if (results.length >= limit) return results;
          }
        }
      }
    }
    return results;
  }

  return { getIndex, getBook, plain, search, getChapterSummary };
})();

// Word and Faith Network — Bible data layer
// Loads the KJV index + per-book JSON (served from /app/data/bible/, cached offline by the service worker).

window.WFNBible = (function () {
  const DATA_BASE = "/app/data/bible/";
  let indexPromise = null;
  const bookCache = new Map(); // slug -> { name, slug, chapters: [...] }

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

  return { getIndex, getBook, plain, search };
})();

#!/usr/bin/env node
/*
 * Instagram cards, v2 (Nov 15, 2026): few words, big type, 1080x1350 (4:5).
 * The full prayer / sermon take lives in the CAPTION, not on the card.
 *
 * Usage: node social/generate-card.js prayer|sermon <content.json> <out.png>
 *
 * prayer content.json:
 *   { "kicker": "For what you've stopped praying over",   // 3-7 words
 *     "truth": "One relatable line, 8-16 words",           // the big headline
 *     "accent": "a phrase inside truth to set in gold italic (optional)",
 *     "prayer": "A short prayer, 25-45 words, ending In Jesus' name, amen.",
 *     "verse": { "text": "short KJV verse or clause", "ref": "Book C:V" },
 *     "save": "Save this · Share it with someone (optional, vary it)" }
 * sermon content.json:
 *   { "ref": "Ezekiel 37:3-5", "title": "Can These Bones\nLive?",
 *     "quote": "One pull-quote from the sermon, 15-28 words" }
 */
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
(async () => {
  const [kind, json, out] = process.argv.slice(2);
  if (!["prayer", "sermon"].includes(kind) || !json || !out) {
    console.error("usage: generate-card.js prayer|sermon <content.json> <out.png>"); process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(json, "utf8"));
  const tpl = path.join(__dirname, "templates", `${kind}-card.html`);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await p.addInitScript(c => { window.CONTENT = c; }, content);
  await p.goto("file://" + tpl);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const fit = await p.evaluate(() => document.body.dataset.fit);
  await p.screenshot({ path: path.resolve(out) });
  await b.close();
  console.log("WROTE: " + path.resolve(out) + (fit === "ok" ? "" : "  (WARNING: text overflows; shorten it)"));
})();

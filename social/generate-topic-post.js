#!/usr/bin/env node
/*
 * Generates the "Daily Word" / trending-topic Instagram card — a third
 * recurring series alongside the Prayer and Sermon cards, built to be a
 * scroll-stopper: one big punchy headline statement, a short grounding
 * line, and a verse reference. Deep emerald card so it reads as its own
 * distinct series in the feed (white = prayer, navy = sermon, emerald =
 * daily word), while sharing the same gold/cream brand language.
 *
 * Usage: node social/generate-topic-post.js '<path-to-content.json>' '<out.png>'
 *
 * content.json shape:
 * {
 *   "kicker": "ON ANXIETY",                 // short topic label, all caps works well
 *   "headline": "Your mind is\nnot your master.",  // \n = manual line break
 *   "sub": "A short 1-2 sentence punchy expansion of the headline.",
 *   "verseText": "“For God has not given us a spirit of fear...”",
 *   "verseRef": "2 Timothy 1:7",
 *   "handle": "wfnglobal.org"               // optional, footer pill
 * }
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const START = { headline: 92, sub: 26, subLh: 1.55 };
const FLOOR = { headline: 58, sub: 21, subLh: 1.4 };

async function main() {
  const [, , contentPath, outPath] = process.argv;
  if (!contentPath || !outPath) {
    console.error("Usage: node generate-topic-post.js <content.json> <out.png>");
    process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const templatePath = path.join(__dirname, "templates", "topic-post.html");
  const headlineHtml = escHtml(content.headline || "").split("\n").join("<br>");

  let html = fs.readFileSync(templatePath, "utf8")
    .replace("{{KICKER}}", escHtml(content.kicker || "Daily Word"))
    .replace("{{HEADLINE_HTML}}", headlineHtml)
    .replace("{{SUB_HTML}}", escHtml(content.sub || ""))
    .replace("{{VERSE_TEXT}}", escHtml(content.verseText || ""))
    .replace("{{VERSE_REF}}", escHtml(content.verseRef || ""))
    .replace("{{HANDLE}}", escHtml(content.handle || "wfnglobal.org"));

  const tmpHtmlPath = outPath.replace(/\.png$/i, "") + ".render.html";
  fs.writeFileSync(tmpHtmlPath, html);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.goto("file://" + tmpHtmlPath);
  await page.waitForTimeout(250);

  // Auto-fit with a readable floor — a longer headline/sub shrinks
  // modestly rather than overflowing or going microscopic.
  await page.evaluate(
    ({ START, FLOOR }) => {
      const frame = document.querySelector(".frame");
      const headlineEl = document.querySelector(".headline");
      const subEl = document.querySelector(".sub");
      let headlineSize = START.headline,
        subSize = START.sub,
        subLh = START.subLh;
      const fits = () => frame.scrollHeight <= frame.clientHeight;
      const apply = () => {
        headlineEl.style.fontSize = headlineSize + "px";
        subEl.style.fontSize = subSize + "px";
        subEl.style.lineHeight = subLh;
      };
      apply();
      while (!fits() && (headlineSize > FLOOR.headline || subSize > FLOOR.sub)) {
        if (headlineSize > FLOOR.headline) headlineSize -= 3;
        if (subSize > FLOOR.sub) subSize -= 0.5;
        subLh = Math.max(FLOOR.subLh, subLh - 0.01);
        apply();
      }
    },
    { START, FLOOR }
  );

  await page.screenshot({ path: outPath });
  await browser.close();
  fs.unlinkSync(tmpHtmlPath);
  console.log("Wrote " + outPath);
}

function escHtml(s) {
  return String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

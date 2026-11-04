#!/usr/bin/env node
/*
 * Generates a 6-card Instagram carousel for a "hot topic" prayer/word
 * series (finances, health, heartbreak, marriage, betrayal, divorce,
 * etc.) — cards 1-5 are numbered points (a short italic hook, a prayer
 * or declaration, and a pulled scripture), card 6 is a quiet, premium
 * follow/CTA card (follow, website, X, app).
 *
 * Design intent: restrained and editorial, not template-y — generous
 * negative space, a ghost outline numeral instead of a loud badge, one
 * idea per card, serif/sans pairing matching the rest of WFN's brand.
 * 1080x1350 (4:5 portrait) — more room for text than the square posts.
 *
 * Usage: node social/generate-topic-series.js '<content.json>' '<out-prefix>'
 *   e.g. node social/generate-topic-series.js series.json social/posts/series-finances-2026-11-10
 *   writes <out-prefix>-1.png ... <out-prefix>-6.png
 *
 * content.json shape:
 * {
 *   "kicker": "A PRAYER SERIES ON FINANCES",   // shown on cards 1-5
 *   "points": [                                 // exactly 5 entries
 *     {
 *       "numeral": "01",
 *       "hook": "Lord, teach me to steward what You trust me with.",
 *       "paragraphs": ["Prayer or declaration text, 2-4 sentences..."],
 *       "verseText": "“...”",
 *       "verseRef": "Luke 16:10"
 *     },
 *     ... 4 more
 *   ],
 *   "cta": {
 *     "closingLine": "If this spoke to you, let's stay connected.",
 *     "handle": "@wordfaithnetwork",
 *     "website": "wfnglobal.org",
 *     "xHandle": "@wordfaithnetwork",
 *     "appNote": "Link in bio",
 *     "footNote": "New series every week"
 *   }
 * }
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const START = { hook: 52, body: 24, bodyLh: 1.68, verse: 22 };
const FLOOR = { hook: 38, body: 19, bodyLh: 1.45, verse: 18 };

async function main() {
  const [, , contentPath, outPrefix] = process.argv;
  if (!contentPath || !outPrefix) {
    console.error("Usage: node generate-topic-series.js <content.json> <out-prefix>");
    process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const points = content.points || [];
  if (points.length !== 5) {
    console.error("content.points must have exactly 5 entries (got " + points.length + ")");
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });

  const written = [];

  // Cards 1-5
  const cardTemplatePath = path.join(__dirname, "templates", "topic-series-card.html");
  const cardBaseHtml = fs.readFileSync(cardTemplatePath, "utf8");
  for (let i = 0; i < 5; i++) {
    const pt = points[i];
    const html = cardBaseHtml
      .replace("{{NUMERAL}}", escHtml(pt.numeral || String(i + 1).padStart(2, "0")))
      .replace("{{KICKER}}", escHtml(content.kicker || "A Prayer Series"))
      .replace("{{PROGRESS}}", `${i + 1} / 6`)
      .replace("{{HOOK_HTML}}", escHtml(pt.hook || ""))
      .replace("{{BODY_HTML}}", (pt.paragraphs || []).map((p) => `<p>${escHtml(p)}</p>`).join("\n"))
      .replace("{{VERSE_TEXT}}", escHtml(pt.verseText || ""))
      .replace("{{VERSE_REF}}", escHtml(pt.verseRef || ""));

    const tmpPath = `${outPrefix}-${i + 1}.render.html`;
    fs.writeFileSync(tmpPath, html);
    await page.goto("file://" + tmpPath);
    await page.waitForTimeout(220);

    await page.evaluate(
      ({ START, FLOOR }) => {
        const frame = document.querySelector(".frame");
        const hookEl = document.querySelector(".hook");
        const bodyEl = document.querySelector(".body");
        const verseEl = document.querySelector(".verse-text");
        let hookSize = START.hook, bodySize = START.body, bodyLh = START.bodyLh, verseSize = START.verse;
        const fits = () => frame.scrollHeight <= frame.clientHeight;
        const apply = () => {
          hookEl.style.fontSize = hookSize + "px";
          bodyEl.style.fontSize = bodySize + "px";
          bodyEl.style.lineHeight = bodyLh;
          verseEl.style.fontSize = verseSize + "px";
        };
        apply();
        while (!fits() && (hookSize > FLOOR.hook || bodySize > FLOOR.body || verseSize > FLOOR.verse)) {
          if (hookSize > FLOOR.hook) hookSize -= 2;
          if (bodySize > FLOOR.body) bodySize -= 0.5;
          if (verseSize > FLOOR.verse) verseSize -= 0.5;
          bodyLh = Math.max(FLOOR.bodyLh, bodyLh - 0.015);
          apply();
        }
      },
      { START, FLOOR }
    );

    const outPath = `${outPrefix}-${i + 1}.png`;
    await page.screenshot({ path: outPath });
    fs.unlinkSync(tmpPath);
    written.push(outPath);
  }

  // Card 6 — CTA
  const cta = content.cta || {};
  const ctaTemplatePath = path.join(__dirname, "templates", "topic-series-cta.html");
  const ctaHtml = fs.readFileSync(ctaTemplatePath, "utf8")
    .replace("{{PROGRESS}}", "6 / 6")
    .replace("{{CLOSING_LINE}}", escHtml(cta.closingLine || "If this spoke to you, let's stay connected."))
    .replace("{{HANDLE}}", escHtml(cta.handle || "@wordfaithnetwork"))
    .replace("{{WEBSITE}}", escHtml(cta.website || "wfnglobal.org"))
    .replace("{{X_HANDLE}}", escHtml(cta.xHandle || "@wordfaithnetwork"))
    .replace("{{APP_NOTE}}", escHtml(cta.appNote || "Link in bio"))
    .replace("{{FOOT_NOTE}}", escHtml(cta.footNote || ""));

  const ctaTmpPath = `${outPrefix}-6.render.html`;
  fs.writeFileSync(ctaTmpPath, ctaHtml);
  await page.goto("file://" + ctaTmpPath);
  await page.waitForTimeout(220);
  const ctaOutPath = `${outPrefix}-6.png`;
  await page.screenshot({ path: ctaOutPath });
  fs.unlinkSync(ctaTmpPath);
  written.push(ctaOutPath);

  await browser.close();
  written.forEach((w) => console.log("WROTE: " + w));
}

function escHtml(s) {
  return String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

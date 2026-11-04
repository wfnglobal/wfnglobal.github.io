#!/usr/bin/env node
/*
 * Generates a 7-card Instagram carousel for a "hot topic" prayer/word
 * series (finances, health, heartbreak, marriage, betrayal, divorce,
 * etc.): an elegant cover card announcing the series, 5 numbered point
 * cards, and a follow/CTA card.
 *
 * Design intent: this matches wfnglobal.org's actual design system —
 * cream background, Newsreader/Inter type, bronze/gold/sage/terracotta —
 * and reuses the site's own "Global reach" radiating-network motif as a
 * real signature illustration (full-size on the cover/CTA, a quiet corner
 * echo on each point card), recolored per card by accenting a different
 * one of its 12 spokes. Each card is meant to stand alone as something
 * worth saving, not just a slide in a sequence.
 *
 * 1080x1350 (4:5 portrait).
 *
 * Usage: node social/generate-topic-series.js '<content.json>' '<out-prefix>'
 *   writes <out-prefix>-1.png (cover) ... <out-prefix>-7.png (CTA)
 *
 * content.json shape:
 * {
 *   "eyebrow": "A PRAYER SERIES ON FINANCES",
 *   "coverTitle": "Five Prayers\nFor When Money\nFeels Heavy",   // \n = line break
 *   "coverDek": "A short 1-2 sentence promise of what this series offers.",
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
const { buildNetworkArt, accentColor } = require("./lib/network-art");

const START = { hook: 64, body: 25.5, bodyLh: 1.6 };
const FLOOR = { hook: 46, body: 20, bodyLh: 1.42 };

const TOTAL_CARDS = 7; // cover + 5 points + cta

function dotsHtml(activeIndex, total = TOTAL_CARDS) {
  let out = "";
  for (let i = 0; i < total; i++) {
    out += `<span class="${i === activeIndex ? "active" : ""}"></span>`;
  }
  return out;
}

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

  // --- Card 1: cover ---
  const coverTemplate = fs.readFileSync(path.join(__dirname, "templates", "topic-series-cover.html"), "utf8");
  const coverAccent = accentColor(0);
  const coverArt = buildNetworkArt({ size: 580, accentIndex: 0, uid: "cover", glow: true });
  const coverTitleHtml = escHtml(content.coverTitle || "").split("\n").join("<br>");
  const coverHtml = coverTemplate
    .replace(/\{\{ACCENT\}\}/g, coverAccent)
    .replace("{{ART_SVG}}", coverArt)
    .replace("{{EYEBROW}}", escHtml(content.eyebrow || "A Prayer Series"))
    .replace("{{TITLE_HTML}}", coverTitleHtml)
    .replace("{{DEK}}", escHtml(content.coverDek || ""))
    .replace("{{DOTS}}", dotsHtml(0));
  written.push(await renderPage(page, coverHtml, `${outPrefix}-1`));

  // --- Cards 2-6: points ---
  const pointTemplate = fs.readFileSync(path.join(__dirname, "templates", "topic-series-point.html"), "utf8");
  for (let i = 0; i < 5; i++) {
    const pt = points[i];
    const spoke = i * 2 + 1;
    const accent = accentColor(spoke);
    const cornerArt = buildNetworkArt({ size: 460, accentIndex: spoke, uid: `pt${i}` });
    const html = pointTemplate
      .replace(/\{\{ACCENT\}\}/g, accent)
      .replace("{{CORNER_ART_SVG}}", cornerArt)
      .replace("{{EYEBROW}}", escHtml(content.eyebrow || "A Prayer Series"))
      .replace("{{DOTS}}", dotsHtml(i + 1))
      .replace(/\{\{NUMERAL\}\}/g, escHtml(pt.numeral || String(i + 1).padStart(2, "0")))
      .replace("{{HOOK_HTML}}", escHtml(pt.hook || ""))
      .replace("{{BODY_HTML}}", (pt.paragraphs || []).map((p) => `<p>${escHtml(p)}</p>`).join("\n"))
      .replace("{{VERSE_TEXT}}", escHtml(pt.verseText || ""))
      .replace("{{VERSE_REF}}", escHtml(pt.verseRef || ""));

    written.push(
      await renderPage(page, html, `${outPrefix}-${i + 2}`, async () => {
        await page.evaluate(
          ({ START, FLOOR }) => {
            const frame = document.querySelector(".frame");
            const hookEl = document.querySelector(".hook");
            const bodyEl = document.querySelector(".body");
            let hookSize = START.hook, bodySize = START.body, bodyLh = START.bodyLh;
            const fits = () => frame.scrollHeight <= frame.clientHeight;
            const apply = () => {
              hookEl.style.fontSize = hookSize + "px";
              bodyEl.style.fontSize = bodySize + "px";
              bodyEl.style.lineHeight = bodyLh;
            };
            apply();
            while (!fits() && (hookSize > FLOOR.hook || bodySize > FLOOR.body)) {
              if (hookSize > FLOOR.hook) hookSize -= 2;
              if (bodySize > FLOOR.body) bodySize -= 0.5;
              bodyLh = Math.max(FLOOR.bodyLh, bodyLh - 0.015);
              apply();
            }
          },
          { START, FLOOR }
        );
      })
    );
  }

  // --- Card 7: CTA ---
  const cta = content.cta || {};
  const ctaTemplate = fs.readFileSync(path.join(__dirname, "templates", "topic-series-cta.html"), "utf8");
  const ctaAccent = accentColor(11);
  const ctaArt = buildNetworkArt({ size: 380, accentIndex: 11, uid: "cta", glow: true });
  const ctaHtml = ctaTemplate
    .replace(/\{\{ACCENT\}\}/g, ctaAccent)
    .replace("{{ART_SVG}}", ctaArt)
    .replace("{{DOTS}}", dotsHtml(6))
    .replace("{{CLOSING_LINE}}", escHtml(cta.closingLine || "If this spoke to you, let's stay connected."))
    .replace("{{HANDLE}}", escHtml(cta.handle || "@wordfaithnetwork"))
    .replace("{{WEBSITE}}", escHtml(cta.website || "wfnglobal.org"))
    .replace("{{X_HANDLE}}", escHtml(cta.xHandle || "@wordfaithnetwork"))
    .replace("{{APP_NOTE}}", escHtml(cta.appNote || "Link in bio"))
    .replace("{{FOOT_NOTE}}", escHtml(cta.footNote || ""));
  written.push(await renderPage(page, ctaHtml, `${outPrefix}-7`));

  await browser.close();
  written.forEach((w) => console.log("WROTE: " + w));
}

async function renderPage(page, html, outBase, beforeScreenshot) {
  const tmpPath = `${outBase}.render.html`;
  fs.writeFileSync(tmpPath, html);
  await page.goto("file://" + path.resolve(tmpPath));
  await page.waitForTimeout(220);
  if (beforeScreenshot) await beforeScreenshot();
  const outPath = `${outBase}.png`;
  await page.screenshot({ path: outPath });
  fs.unlinkSync(tmpPath);
  return outPath;
}

function escHtml(s) {
  return String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

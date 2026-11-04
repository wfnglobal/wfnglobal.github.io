#!/usr/bin/env node
/*
 * Generates today's Instagram "Today's Sermon" post from the reusable
 * template at social/templates/sermon-post.html (the dark navy/purple
 * card design approved 2026-11-02) — one or MORE 1080x1080 PNG cards,
 * depending on how long the sermon text is.
 *
 * Design rule: text size only shrinks a little from the default before
 * hitting a readable floor. If the content still doesn't fit at that
 * floor size, the remaining paragraphs spill onto a new card (shown as
 * "Part 2 of 2" etc. in the kicker, title shown only on the first card)
 * instead of crushing the font down to something squinty. Multiple
 * cards are meant to be posted together as an Instagram carousel —
 * post-to-instagram.js handles that.
 *
 * Usage: node social/generate-sermon-post.js '<path-to-content.json>' '<out.png>'
 *
 * content.json shape:
 * {
 *   "ref": "Ecclesiastes 7:7-9",
 *   "title": "Patient in Spirit,\nNot Proud in Spirit",   // \n = manual line break in the title
 *   "paragraphs": ["First paragraph (2-3 sentences)...", "Second paragraph..."],
 *   "kicker": "Today's Sermon",     // optional, defaults below
 *   "handle": "Link in bio"         // optional, shown as the footer pill
 * }
 *
 * Output: if the sermon fits on one card, writes exactly <out.png> (same
 * as before). If it needs more than one card, writes <out.png> for card
 * 1 and <out-without-ext>-2.png, -3.png, ... for the rest, and prints
 * every path written, one per line, prefixed "WROTE: ".
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const START = { title: 56, body: 23, bodyLh: 1.68 };
const FLOOR = { title: 42, body: 19, bodyLh: 1.5 };

async function main() {
  const [, , contentPath, outPath] = process.argv;
  if (!contentPath || !outPath) {
    console.error("Usage: node generate-sermon-post.js <content.json> <out.png>");
    process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const templatePath = path.join(__dirname, "templates", "sermon-post.html");
  const baseHtml = fs.readFileSync(templatePath, "utf8")
    .replace("{{KICKER}}", "")
    .replace("{{REF}}", escHtml(content.ref || ""))
    .replace("{{TITLE_HTML}}", "")
    .replace("{{BODY_HTML}}", "")
    .replace("{{HANDLE}}", escHtml(content.handle || "Link in bio"));

  const tmpHtmlPath = outPath.replace(/\.png$/i, "") + ".render.html";
  fs.writeFileSync(tmpHtmlPath, baseHtml);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.goto("file://" + tmpHtmlPath);
  await page.waitForTimeout(250);

  const titleHtml = escHtml(content.title || "").split("\n").join("<br>");
  const paragraphHtmls = (content.paragraphs || []).map((p) => escHtml(p));

  const pages = [];
  let current = [];
  for (let i = 0; i < paragraphHtmls.length; i++) {
    const trial = current.concat([paragraphHtmls[i]]);
    const isFirstPage = pages.length === 0;
    await setSermonContent(page, isFirstPage ? titleHtml : "", trial, "Today's Sermon");
    const fits = await shrinkToFloorAndCheckFits(page);
    if (fits || trial.length === 1) {
      current = trial;
    } else {
      pages.push(current);
      current = [paragraphHtmls[i]];
    }
  }
  if (current.length) pages.push(current);
  if (pages.length === 0) pages.push([]);

  const outBase = outPath.replace(/\.png$/i, "");
  const written = [];
  for (let i = 0; i < pages.length; i++) {
    const isFirst = i === 0;
    const kickerBase = content.kicker || "Today's Sermon";
    const kicker = pages.length > 1 ? `${kickerBase} — Part ${i + 1} of ${pages.length}` : kickerBase;
    await setSermonContent(page, isFirst ? titleHtml : "", pages[i], kicker);
    await shrinkToFloorAndCheckFits(page);
    const thisOut = i === 0 ? outPath : `${outBase}-${i + 1}.png`;
    await page.screenshot({ path: thisOut });
    written.push(thisOut);
  }

  await browser.close();
  fs.unlinkSync(tmpHtmlPath);
  written.forEach((w) => console.log("WROTE: " + w));
}

function escHtml(s) {
  return String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

async function setSermonContent(page, titleHtml, paragraphHtmls, kickerText) {
  await page.evaluate(
    ({ titleHtml, paragraphHtmls, kickerText, START }) => {
      document.querySelector(".kicker").textContent = kickerText;
      const titleEl = document.querySelector(".title");
      if (titleHtml) {
        titleEl.style.display = "";
        titleEl.innerHTML = titleHtml;
      } else {
        titleEl.style.display = "none";
        titleEl.innerHTML = "";
      }
      const bodyEl = document.querySelector(".body");
      bodyEl.innerHTML = "";
      paragraphHtmls.forEach((h) => {
        const p = document.createElement("p");
        p.innerHTML = h;
        bodyEl.appendChild(p);
      });
      titleEl.style.fontSize = START.title + "px";
      bodyEl.style.fontSize = START.body + "px";
      bodyEl.style.lineHeight = START.bodyLh;
    },
    { titleHtml, paragraphHtmls, kickerText, START }
  );
}

async function shrinkToFloorAndCheckFits(page) {
  return page.evaluate(
    ({ START, FLOOR }) => {
      const frame = document.querySelector(".frame");
      const titleEl = document.querySelector(".title");
      const bodyEl = document.querySelector(".body");
      let titleSize = START.title,
        bodySize = START.body,
        bodyLh = START.bodyLh;
      const fits = () => frame.scrollHeight <= frame.clientHeight;
      const apply = () => {
        titleEl.style.fontSize = titleSize + "px";
        bodyEl.style.fontSize = bodySize + "px";
        bodyEl.style.lineHeight = bodyLh;
      };
      apply();
      while (!fits() && (titleSize > FLOOR.title || bodySize > FLOOR.body)) {
        if (titleSize > FLOOR.title) titleSize -= 2;
        if (bodySize > FLOOR.body) bodySize -= 0.5;
        bodyLh = Math.max(FLOOR.bodyLh, bodyLh - 0.015);
        apply();
      }
      return fits();
    },
    { START, FLOOR }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

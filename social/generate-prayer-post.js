#!/usr/bin/env node
/*
 * Generates today's Instagram "Daily Prayer" post from the reusable
 * template at social/templates/prayer-post.html — one or MORE 1080x1080
 * PNG cards, depending on how long the prayer is.
 *
 * Design rule: text size only shrinks a little from the default before
 * hitting a readable floor. If the prayer still doesn't fit at that
 * floor size, the remaining paragraphs spill onto a new card (shown as
 * "Part 2 of 2" etc. in the kicker) instead of crushing the font down
 * to something squinty. Multiple cards are meant to be posted together
 * as an Instagram carousel — post-to-instagram.js handles that.
 *
 * This is the Instagram-only design (approved 2026-11-02): a full,
 * clean white card — NOT the app/website's short declarative-stanza
 * style, and no photo or personal name on the card. The prayer itself
 * should be a full, profound, original prayer (a few flowing
 * paragraphs) written to speak to what an everyday reader is going
 * through — worth saving and sharing, not a one-liner.
 *
 * Usage: node social/generate-prayer-post.js '<path-to-content.json>' '<out.png>'
 *
 * content.json shape:
 * {
 *   "opener": "Father, tonight I'm not pretending I have it all together.",
 *   "paragraphs": ["First paragraph of the prayer...", "Second paragraph..."],
 *   "bold": "an exact phrase from inside the paragraphs to emphasize in gold-brown bold (optional)",
 *   "kicker": "Tonight's Prayer",            // optional, defaults below
 *   "brandSub": "Daily Prayer",              // optional, small label under the ministry name
 *   "footerNote": "Save this & share it with someone who needs it", // optional
 *   "handle": "wfnglobal.org"                // optional
 * }
 *
 * Output: if the prayer fits on one card, writes exactly <out.png> (same
 * as before). If it needs more than one card, writes <out.png> for card
 * 1 and <out-without-ext>-2.png, -3.png, ... for the rest, and prints
 * every path written, one per line, prefixed "WROTE: ".
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const START = { size: 34, lh: 1.56, openerSize: 27 };
const FLOOR = { size: 27, lh: 1.42, openerSize: 22 };

async function main() {
  const [, , contentPath, outPath] = process.argv;
  if (!contentPath || !outPath) {
    console.error("Usage: node generate-prayer-post.js <content.json> <out.png>");
    process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const templatePath = path.join(__dirname, "templates", "prayer-post.html");
  const baseHtml = fs.readFileSync(templatePath, "utf8")
    .replace("{{OPENER}}", "")
    .replace("{{BODY_HTML}}", "")
    .replace("{{KICKER}}", "")
    .replace("{{BRAND_SUB}}", escHtml(content.brandSub || "Daily Prayer"))
    .replace("{{FOOTER_NOTE}}", escHtml(content.footerNote || "Save this & share it with someone who needs it"))
    .replace("{{HANDLE}}", escHtml(content.handle || "wfnglobal.org"));

  const tmpHtmlPath = outPath.replace(/\.png$/i, "") + ".render.html";
  fs.writeFileSync(tmpHtmlPath, baseHtml);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.goto("file://" + tmpHtmlPath);
  await page.waitForTimeout(250); // let web fonts settle

  const paragraphHtmls = (content.paragraphs || []).map((p) => boldWrap(p, content.bold));

  // Decide pagination by actually rendering trial content and measuring
  // overflow in the real browser, rather than guessing from character
  // counts — this is what guarantees the result is never squinty.
  const pages = [];
  let current = [];
  for (let i = 0; i < paragraphHtmls.length; i++) {
    const trial = current.concat([paragraphHtmls[i]]);
    const isFirstPage = pages.length === 0;
    await setPrayerContent(page, isFirstPage ? content.opener : "", trial, "Today's Prayer");
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
    const kickerBase = content.kicker || "Today's Prayer";
    const kicker = pages.length > 1 ? `${kickerBase} — Part ${i + 1} of ${pages.length}` : kickerBase;
    await setPrayerContent(page, isFirst ? content.opener : "", pages[i], kicker);
    await shrinkToFloorAndCheckFits(page); // final fit pass at this page's own content
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

function boldWrap(text, bold) {
  const escaped = escHtml(text);
  if (!bold) return escaped;
  const escBold = escHtml(bold);
  return escaped.split(escBold).join(`<b>${escBold}</b>`);
}

async function setPrayerContent(page, openerText, paragraphHtmls, kickerText) {
  await page.evaluate(
    ({ openerText, paragraphHtmls, kickerText, START }) => {
      document.querySelector(".kicker").textContent = kickerText;
      const textEl = document.querySelector(".prayer-text");
      const openerEl = textEl.querySelector(".opener");
      if (openerText) {
        openerEl.style.display = "";
        openerEl.textContent = openerText;
      } else {
        openerEl.style.display = "none";
        openerEl.textContent = "";
      }
      textEl.querySelectorAll("p").forEach((p) => p.remove());
      paragraphHtmls.forEach((h) => {
        const p = document.createElement("p");
        p.innerHTML = h;
        textEl.appendChild(p);
      });
      textEl.querySelectorAll("p, .opener").forEach((el) => {
        el.style.fontSize = (el.classList.contains("opener") ? START.openerSize : START.size) + "px";
        el.style.lineHeight = START.lh;
      });
    },
    { openerText, paragraphHtmls, kickerText, START }
  );
}

async function shrinkToFloorAndCheckFits(page) {
  return page.evaluate(
    ({ START, FLOOR }) => {
      const textEl = document.querySelector(".prayer-text");
      const post = document.querySelector(".post");
      let size = START.size,
        lh = START.lh,
        openerSize = START.openerSize;
      const fits = () => post.scrollHeight <= post.clientHeight;
      const apply = () => {
        textEl.querySelectorAll("p, .opener").forEach((el) => {
          el.style.fontSize = (el.classList.contains("opener") ? openerSize : size) + "px";
          el.style.lineHeight = lh;
        });
      };
      apply();
      while (!fits() && size > FLOOR.size) {
        size -= 1;
        lh = Math.max(FLOOR.lh, lh - 0.01);
        if (openerSize > FLOOR.openerSize) openerSize -= 1;
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

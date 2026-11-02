#!/usr/bin/env node
/*
 * Generates today's Instagram "Daily Prayer" post (1080x1080 PNG) from the
 * reusable template at social/templates/prayer-post.html.
 *
 * This is the Instagram-only design (approved 2026-11-02): a full, clean
 * white card — NOT the app/website's short declarative-stanza style, and
 * no photo or personal name on the card. The prayer itself should be a
 * full, profound, original prayer (a few flowing paragraphs) written to
 * speak to what an everyday reader is going through — worth saving and
 * sharing, not a one-liner.
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
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

async function main() {
  const [, , contentPath, outPath] = process.argv;
  if (!contentPath || !outPath) {
    console.error("Usage: node generate-prayer-post.js <content.json> <out.png>");
    process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const templatePath = path.join(__dirname, "templates", "prayer-post.html");
  let html = fs.readFileSync(templatePath, "utf8");

  const esc = (s) => String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  const boldWrap = (text) => {
    const escaped = esc(text);
    if (!content.bold) return escaped;
    const escBold = esc(content.bold);
    return escaped.split(escBold).join(`<b>${escBold}</b>`);
  };

  const bodyHtml = (content.paragraphs || [])
    .map((p) => `<p>${boldWrap(p)}</p>`)
    .join("\n        ");

  html = html
    .replace("{{OPENER}}", esc(content.opener || ""))
    .replace("{{BODY_HTML}}", bodyHtml)
    .replace("{{KICKER}}", esc(content.kicker || "Today's Prayer"))
    .replace("{{BRAND_SUB}}", esc(content.brandSub || "Daily Prayer"))
    .replace("{{FOOTER_NOTE}}", esc(content.footerNote || "Save this & share it with someone who needs it"))
    .replace("{{HANDLE}}", esc(content.handle || "wfnglobal.org"));

  const tmpHtmlPath = outPath.replace(/\.png$/i, "") + ".render.html";
  fs.writeFileSync(tmpHtmlPath, html);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.goto("file://" + tmpHtmlPath);
  await page.waitForTimeout(250); // let web fonts settle

  // Auto-fit: the prayer's length varies day to day, so shrink the text
  // step by step until the opener + paragraphs fit inside the fixed
  // 1080x1080 frame without clipping into the header/footer.
  await page.evaluate(() => {
    const textEl = document.querySelector(".prayer-text");
    const post = document.querySelector(".post");
    let size = 40, lh = 1.42, openerSize = 30;
    const fits = () => post.scrollHeight <= post.clientHeight;
    for (let i = 0; i < 24 && !fits(); i++) {
      size -= 1.4; lh -= 0.01; openerSize -= 1;
      textEl.querySelectorAll("p, .opener").forEach((el) => {
        el.style.fontSize = (el.classList.contains("opener") ? openerSize : size) + "px";
        el.style.lineHeight = lh;
      });
    }
  });

  await page.screenshot({ path: outPath });
  await browser.close();
  fs.unlinkSync(tmpHtmlPath);
  console.log("Wrote " + outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

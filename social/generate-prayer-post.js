#!/usr/bin/env node
/*
 * Generates today's "Daily Prayer" Instagram post (1080x1080 PNG) from the
 * reusable template at social/templates/prayer-post.html, using the same
 * punchy, stanza-broken declaration content and avatar/name header as the
 * app and homepage "Today's Declaration" card.
 *
 * Usage: node social/generate-prayer-post.js '<path-to-content.json>' '<out.png>'
 *
 * content.json shape:
 * {
 *   "lines": ["line 1", "line 2", "", "line 3", ...],   // "" = stanza break
 *   "ref": "Isaiah 41:10",
 *   "kicker": "Today's Declaration"                      // optional, defaults below
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

  const avatarPath = path.join(__dirname, "..", "assets", "oladapo-portrait.jpg");
  const avatarData = "data:image/jpeg;base64," + fs.readFileSync(avatarPath).toString("base64");

  const esc = (s) => String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  const linesHtml = content.lines
    .map((l) => (l ? `<div class="line">${esc(l)}</div>` : `<div class="break"></div>`))
    .join("\n      ");

  html = html
    .replace("{{AVATAR_SRC}}", avatarData)
    .replace("{{NAME}}", esc(content.name || "Oladapo Olaleye"))
    .replace("{{HANDLE}}", esc(content.handle || "@wordfaithnetwork"))
    .replace("{{KICKER}}", esc(content.kicker || "Today's Declaration"))
    .replace("{{LINES_HTML}}", linesHtml)
    .replace("{{REF}}", esc(content.ref || ""));

  const tmpHtmlPath = outPath.replace(/\.png$/i, "") + ".render.html";
  fs.writeFileSync(tmpHtmlPath, html);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.goto("file://" + tmpHtmlPath);
  await page.waitForTimeout(250); // let web fonts settle

  // Auto-fit: the number of declaration lines varies day to day, so shrink
  // the line font-size/line-height/gap step by step until everything (header,
  // lines, footer) fits inside the fixed 1080x1080 frame without clipping.
  await page.evaluate(() => {
    const linesEl = document.querySelector(".lines");
    const post = document.querySelector(".post");
    let size = 38, lh = 1.32, gap = 14;
    const fits = () => post.scrollHeight <= post.clientHeight;
    for (let i = 0; i < 20 && !fits(); i++) {
      size -= 1.5; lh -= 0.01; gap -= 0.6;
      document.querySelectorAll(".line").forEach((el) => {
        el.style.fontSize = size + "px";
        el.style.lineHeight = lh;
      });
      linesEl.style.gap = Math.max(gap, 4) + "px";
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

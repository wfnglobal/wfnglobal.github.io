#!/usr/bin/env node
/*
 * Generates today's Instagram "Today's Sermon" post (1080x1080 PNG) from
 * the reusable template at social/templates/sermon-post.html — the dark
 * navy/purple card design approved 2026-11-02.
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
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

async function main() {
  const [, , contentPath, outPath] = process.argv;
  if (!contentPath || !outPath) {
    console.error("Usage: node generate-sermon-post.js <content.json> <out.png>");
    process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const templatePath = path.join(__dirname, "templates", "sermon-post.html");
  let html = fs.readFileSync(templatePath, "utf8");

  const esc = (s) => String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  const titleHtml = esc(content.title || "").split("\n").join("<br>");
  const bodyHtml = (content.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("\n    ");

  html = html
    .replace("{{KICKER}}", esc(content.kicker || "Today's Sermon"))
    .replace("{{REF}}", esc(content.ref || ""))
    .replace("{{TITLE_HTML}}", titleHtml)
    .replace("{{BODY_HTML}}", bodyHtml)
    .replace("{{HANDLE}}", esc(content.handle || "Link in bio"));

  const tmpHtmlPath = outPath.replace(/\.png$/i, "") + ".render.html";
  fs.writeFileSync(tmpHtmlPath, html);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.goto("file://" + tmpHtmlPath);
  await page.waitForTimeout(250);

  // Auto-fit: shrink the title/body step by step if a longer title or a
  // longer pair of paragraphs would otherwise overflow the fixed frame.
  await page.evaluate(() => {
    const frame = document.querySelector(".frame");
    const titleEl = document.querySelector(".title");
    const bodyEl = document.querySelector(".body");
    let titleSize = 56, bodySize = 23, bodyLh = 1.68;
    const fits = () => frame.scrollHeight <= frame.clientHeight;
    for (let i = 0; i < 20 && !fits(); i++) {
      titleSize -= 2; bodySize -= 0.6; bodyLh -= 0.015;
      titleEl.style.fontSize = titleSize + "px";
      bodyEl.style.fontSize = bodySize + "px";
      bodyEl.style.lineHeight = bodyLh;
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

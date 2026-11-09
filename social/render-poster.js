#!/usr/bin/env node
/*
 * Renders a 1080x1350 (4:5) HTML poster to a high-resolution PNG
 * (2160x2700) for X / Instagram.
 * Usage: node social/render-poster.js <poster.html> <out.png> [scale=2]
 * Fonts load from social/fonts/ (bundled woff2, no network needed), so
 * a poster in social/x/ or social/templates/ should reference ../fonts/.
 */
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const [, , html, out, scale] = process.argv;
  if (!html || !out) { console.error("Usage: node social/render-poster.js <poster.html> <out.png> [scale]"); process.exit(1); }
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: +(scale || 2) });
  await p.goto("file://" + path.resolve(html));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  await p.screenshot({ path: out });
  await b.close();
  console.log("WROTE: " + out);
})();

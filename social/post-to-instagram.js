#!/usr/bin/env node
/*
 * Publishes a single already-committed image to Instagram via the Graph
 * API (Instagram API with Instagram Login — graph.instagram.com, direct
 * to the Instagram Business account, no Facebook Page needed).
 *
 * Usage: node social/post-to-instagram.js <path/to/image.png>
 *
 * The image must already be pushed to GitHub (this script references it
 * by its raw.githubusercontent.com URL at the current commit SHA, which
 * is publicly fetchable the instant the push lands — no GitHub Pages
 * deploy wait needed).
 *
 * Caption: looked up from a sibling file with the same basename and a
 * .caption.txt extension (e.g. prayer.png -> prayer.caption.txt). If
 * that file doesn't exist, the post goes out with no caption.
 *
 * Required env vars (set as GitHub Actions repo secrets):
 *   IG_ACCESS_TOKEN  - long-lived Instagram access token
 *   IG_USER_ID       - the Instagram account's numeric ID
 */
const fs = require("fs");

const GRAPH_VERSION = "v21.0";

async function main() {
  const [, , pngPath] = process.argv;
  if (!pngPath) {
    console.error("Usage: node social/post-to-instagram.js <path/to/image.png>");
    process.exit(1);
  }
  if (!fs.existsSync(pngPath)) {
    console.error("File not found: " + pngPath);
    process.exit(1);
  }

  const token = process.env.IG_ACCESS_TOKEN;
  const igUserId = process.env.IG_USER_ID;
  if (!token || !igUserId) {
    console.error("Missing IG_ACCESS_TOKEN or IG_USER_ID environment variables.");
    process.exit(1);
  }

  const captionPath = pngPath.replace(/\.png$/i, ".caption.txt");
  const caption = fs.existsSync(captionPath) ? fs.readFileSync(captionPath, "utf8").trim() : "";

  const repo = process.env.GITHUB_REPOSITORY || "wfnglobal/wfnglobal.github.io";
  const sha = process.env.GITHUB_SHA || "main";
  const imageUrl = "https://raw.githubusercontent.com/" + repo + "/" + sha + "/" + pngPath;

  console.log("Image URL: " + imageUrl);
  console.log("Caption length: " + caption.length + " chars");
  console.log("Token length: " + token.length + " chars, starts '" + token.slice(0, 6) + "', ends '" + token.slice(-6) + "'");

  // Step 1: create a media container.
  const createRes = await fetch("https://graph.instagram.com/" + GRAPH_VERSION + "/" + igUserId + "/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption: caption, access_token: token })
  });
  const createJson = await createRes.json();
  if (!createRes.ok || !createJson.id) {
    console.error("Failed to create media container: " + JSON.stringify(createJson));
    process.exit(1);
  }
  console.log("Media container created: " + createJson.id);

  // Step 2: publish it. Instagram sometimes needs a moment to finish
  // fetching/processing the image before publish succeeds — retry a few
  // times with a short backoff rather than failing on the first miss.
  let publishJson = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const publishRes = await fetch("https://graph.instagram.com/" + GRAPH_VERSION + "/" + igUserId + "/media_publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: createJson.id, access_token: token })
    });
    publishJson = await publishRes.json();
    if (publishRes.ok && publishJson.id) break;
    console.log("Publish attempt " + attempt + " not ready yet: " + JSON.stringify(publishJson));
    if (attempt < 5) await new Promise((r) => setTimeout(r, attempt * 4000));
  }

  if (!publishJson || !publishJson.id) {
    console.error("Failed to publish after retries: " + JSON.stringify(publishJson));
    process.exit(1);
  }

  console.log("Published! Media ID: " + publishJson.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

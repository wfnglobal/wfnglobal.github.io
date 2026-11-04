#!/usr/bin/env node
/*
 * Publishes one or more already-committed images to Instagram via the
 * Graph API, as a single image post (one path given) or a carousel
 * (multiple paths given — e.g. a long prayer/sermon that spilled onto
 * more than one card).
 *
 * Usage:
 *   node social/post-to-instagram.js <path/to/image.png> [more.png ...]
 *
 * Each image must already be pushed to GitHub (this script references
 * it by its raw.githubusercontent.com URL at the current commit SHA,
 * which is publicly fetchable the instant the push lands — no GitHub
 * Pages deploy wait needed).
 *
 * Caption: looked up from a sibling file with the same basename and a
 * .caption.txt extension (e.g. prayer-2026-11-04.png ->
 * prayer-2026-11-04.caption.txt). For a multi-part day, every part
 * shares ONE caption file named after the base (without the "-2",
 * "-3", ... suffix the generator adds to later parts) — this script
 * finds it automatically. If no caption file exists, the post goes out
 * with no caption.
 *
 * Required env vars (set as GitHub Actions repo secrets):
 *   IG_ACCESS_TOKEN  - long-lived Instagram/Graph API access token
 *   IG_USER_ID       - the Instagram account's numeric ID
 */
const fs = require("fs");

const GRAPH_VERSION = "v21.0";
const GRAPH_HOST = process.env.IG_GRAPH_HOST || "graph.instagram.com";

async function main() {
  const pngPaths = process.argv.slice(2);
  if (pngPaths.length === 0) {
    console.error("Usage: node social/post-to-instagram.js <path/to/image.png> [more.png ...]");
    process.exit(1);
  }
  for (const p of pngPaths) {
    if (!fs.existsSync(p)) {
      console.error("File not found: " + p);
      process.exit(1);
    }
  }

  const token = process.env.IG_ACCESS_TOKEN;
  const igUserId = process.env.IG_USER_ID;
  if (!token || !igUserId) {
    console.error("Missing IG_ACCESS_TOKEN or IG_USER_ID environment variables.");
    process.exit(1);
  }

  if (process.env.IG_DEBUG === "1") {
    const meRes = await fetch("https://" + GRAPH_HOST + "/" + GRAPH_VERSION + "/me?fields=id,name&access_token=" + encodeURIComponent(token));
    console.log("GET /me ->", JSON.stringify(await meRes.json()));

    const pagesRes = await fetch("https://" + GRAPH_HOST + "/" + GRAPH_VERSION + "/me/accounts?fields=id,name,instagram_business_account&access_token=" + encodeURIComponent(token));
    console.log("GET /me/accounts ->", JSON.stringify(await pagesRes.json()));
    return;
  }

  const caption = safeReadCaption(pngPaths[0]);

  const repo = process.env.GITHUB_REPOSITORY || "wfnglobal/wfnglobal.github.io";
  const sha = process.env.GITHUB_SHA || "main";
  const imageUrls = pngPaths.map((p) => "https://raw.githubusercontent.com/" + repo + "/" + sha + "/" + p);

  console.log("Images (" + imageUrls.length + "): " + imageUrls.join(", "));
  console.log("Caption length: " + caption.length + " chars");
  console.log("Token length: " + token.length + " chars, starts '" + token.slice(0, 6) + "', ends '" + token.slice(-6) + "'");

  let creationId;
  if (imageUrls.length === 1) {
    creationId = await createSingleMediaContainer(igUserId, token, imageUrls[0], caption);
  } else {
    creationId = await createCarouselContainer(igUserId, token, imageUrls, caption);
  }

  console.log("Media container created: " + creationId);
  const publishedId = await publishWithRetry(igUserId, token, creationId);
  console.log("Published! Media ID: " + publishedId);
}

function safeReadCaption(firstPngPath) {
  const p = resolveCaptionPath(firstPngPath);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8").trim() : "";
}

// A multi-part day's later cards are named <base>-2.png, <base>-3.png,
// ... but they all share ONE caption file named after <base>.caption.txt
// (the same name the first part uses). Try the direct sibling file
// first (covers the common single-card case and part 1 of a multi-part
// day), and only strip a trailing "-<N>" if that doesn't exist.
function resolveCaptionPath(pngPath) {
  const direct = pngPath.replace(/\.png$/i, ".caption.txt");
  if (fs.existsSync(direct)) return direct;
  const strippedBase = pngPath.replace(/-(\d+)\.png$/i, ".png");
  return strippedBase.replace(/\.png$/i, ".caption.txt");
}

async function createSingleMediaContainer(igUserId, token, imageUrl, caption) {
  const res = await fetch("https://" + GRAPH_HOST + "/" + GRAPH_VERSION + "/" + igUserId + "/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption: caption, access_token: token }),
  });
  const json = await res.json();
  if (!res.ok || !json.id) {
    console.error("Failed to create media container: " + JSON.stringify(json));
    process.exit(1);
  }
  return json.id;
}

async function createCarouselContainer(igUserId, token, imageUrls, caption) {
  const childIds = [];
  for (const imageUrl of imageUrls) {
    const res = await fetch("https://" + GRAPH_HOST + "/" + GRAPH_VERSION + "/" + igUserId + "/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, is_carousel_item: true, access_token: token }),
    });
    const json = await res.json();
    if (!res.ok || !json.id) {
      console.error("Failed to create carousel child container for " + imageUrl + ": " + JSON.stringify(json));
      process.exit(1);
    }
    console.log("Carousel child created for " + imageUrl + ": " + json.id);
    childIds.push(json.id);
  }

  const res = await fetch("https://" + GRAPH_HOST + "/" + GRAPH_VERSION + "/" + igUserId + "/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "CAROUSEL", children: childIds.join(","), caption: caption, access_token: token }),
  });
  const json = await res.json();
  if (!res.ok || !json.id) {
    console.error("Failed to create carousel container: " + JSON.stringify(json));
    process.exit(1);
  }
  return json.id;
}

// Instagram sometimes needs a moment to finish fetching/processing the
// image(s) before publish succeeds — retry a few times with a short
// backoff rather than failing on the first miss.
async function publishWithRetry(igUserId, token, creationId) {
  let publishJson = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const publishRes = await fetch("https://" + GRAPH_HOST + "/" + GRAPH_VERSION + "/" + igUserId + "/media_publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: creationId, access_token: token }),
    });
    publishJson = await publishRes.json();
    if (publishRes.ok && publishJson.id) return publishJson.id;
    console.log("Publish attempt " + attempt + " not ready yet: " + JSON.stringify(publishJson));
    if (attempt < 5) await new Promise((r) => setTimeout(r, attempt * 4000));
  }
  console.error("Failed to publish after retries: " + JSON.stringify(publishJson));
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

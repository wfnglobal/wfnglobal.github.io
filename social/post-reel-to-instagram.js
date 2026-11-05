#!/usr/bin/env node
/*
 * Publishes an already-committed vertical video as an Instagram Reel
 * via the Graph API. Separate from post-to-instagram.js (which only
 * handles image/carousel posts) because Reels use a different media
 * type and a slower, poll-based processing step before they can be
 * published.
 *
 * Usage:
 *   node social/post-reel-to-instagram.js <path/to/reel.mp4> [path/to/cover.png]
 *
 * The video (and cover image, if given) must already be pushed to
 * GitHub - this script references them by their raw.githubusercontent.com
 * URL at the current commit SHA, which is publicly fetchable the
 * instant the push lands.
 *
 * Caption: looked up from a sibling file with the same basename and a
 * .caption.txt extension, same convention as post-to-instagram.js.
 *
 * Required env vars (set as GitHub Actions repo secrets):
 *   IG_ACCESS_TOKEN  - long-lived Instagram/Graph API access token
 *   IG_USER_ID       - the Instagram account's numeric ID
 */
const fs = require("fs");

const GRAPH_VERSION = "v21.0";
const GRAPH_HOST = process.env.IG_GRAPH_HOST || "graph.instagram.com";

async function main() {
  const [, , videoPath, coverPath] = process.argv;
  if (!videoPath) {
    console.error("Usage: node social/post-reel-to-instagram.js <path/to/reel.mp4> [path/to/cover.png]");
    process.exit(1);
  }
  if (!fs.existsSync(videoPath)) {
    console.error("File not found: " + videoPath);
    process.exit(1);
  }
  if (coverPath && !fs.existsSync(coverPath)) {
    console.error("Cover file not found: " + coverPath);
    process.exit(1);
  }

  const token = process.env.IG_ACCESS_TOKEN;
  const igUserId = process.env.IG_USER_ID;
  if (!token || !igUserId) {
    console.error("Missing IG_ACCESS_TOKEN or IG_USER_ID environment variables.");
    process.exit(1);
  }

  const caption = safeReadCaption(videoPath);
  const repo = process.env.GITHUB_REPOSITORY || "wfnglobal/wfnglobal.github.io";
  const sha = process.env.GITHUB_SHA || "main";
  const videoUrl = "https://raw.githubusercontent.com/" + repo + "/" + sha + "/" + videoPath;
  const coverUrl = coverPath ? "https://raw.githubusercontent.com/" + repo + "/" + sha + "/" + coverPath : null;

  console.log("Video: " + videoUrl);
  if (coverUrl) console.log("Cover: " + coverUrl);
  console.log("Caption length: " + caption.length + " chars");

  const creationId = await createReelContainer(igUserId, token, videoUrl, coverUrl, caption);
  console.log("Reel container created: " + creationId);

  await waitUntilReady(igUserId, token, creationId);

  const publishedId = await publishWithRetry(igUserId, token, creationId);
  console.log("Published! Media ID: " + publishedId);
}

function safeReadCaption(videoPath) {
  const p = videoPath.replace(/\.mp4$/i, ".caption.txt");
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8").trim() : "";
}

async function createReelContainer(igUserId, token, videoUrl, coverUrl, caption) {
  const body = {
    media_type: "REELS",
    video_url: videoUrl,
    caption: caption,
    share_to_feed: true,
    access_token: token,
  };
  if (coverUrl) body.cover_url = coverUrl;

  const res = await fetch("https://" + GRAPH_HOST + "/" + GRAPH_VERSION + "/" + igUserId + "/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.id) {
    console.error("Failed to create Reel container: " + JSON.stringify(json));
    process.exit(1);
  }
  return json.id;
}

// Reels (unlike image posts) need real server-side processing time
// before they can be published - poll status_code until it reports
// FINISHED, rather than assuming it's instantly ready like an image
// container is.
async function waitUntilReady(igUserId, token, creationId) {
  const maxAttempts = 20; // up to ~5 minutes total with the backoff below
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(
      "https://" + GRAPH_HOST + "/" + GRAPH_VERSION + "/" + creationId + "?fields=status_code,status&access_token=" + encodeURIComponent(token)
    );
    const json = await res.json();
    if (!res.ok) {
      console.error("Status check failed: " + JSON.stringify(json));
      process.exit(1);
    }
    console.log("Processing status (attempt " + attempt + "): " + json.status_code + (json.status ? " - " + json.status : ""));
    if (json.status_code === "FINISHED") return;
    if (json.status_code === "ERROR" || json.status_code === "EXPIRED") {
      console.error("Reel processing failed: " + JSON.stringify(json));
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, Math.min(15000, 3000 + attempt * 1500)));
  }
  console.error("Reel never finished processing after " + maxAttempts + " checks - giving up.");
  process.exit(1);
}

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

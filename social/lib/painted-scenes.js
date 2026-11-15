// Painted scenes for the "scenes" / "action" reel templates.
//
// Any line in a reel's content.json can carry a painted picture instead of
// (or as well as) one of the illustrated SVG scenes:
//
//   { "text": "Arise and eat.", "image": "social/reel-images/2026-11-16/elijah-asleep.jpg",
//     "kb": "push", "focus": "50% 62%" }
//
//   image  - path from the repo root (or absolute). Best as a 9:16 portrait
//            JPG at least 1080x1920 with NO text in it; other shapes are
//            cropped to fill the frame (object-fit: cover).
//   kb     - optional camera move: push | pull | panl | panr | rise
//            (defaults rotate through these so consecutive shots differ).
//   focus  - optional "x% y%" the camera pushes toward / crops around
//            (default "50% 50%"). Put it on the face or the key object.
//
// Consecutive lines with the same image share one shot. Lines without an
// image keep their usual "visual" key, so painted and illustrated scenes
// can be mixed in one reel. Each painted shot gets a slow camera move,
// a caption-safe grade, a soft vignette and drifting dust, all from
// reel-scenes.html's existing machinery.
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const MOVES = ["push", "panl", "pull", "panr", "rise"];

function applyPaintedScenes(content, repoRoot) {
  const lines = Array.isArray(content.lines) ? content.lines : [];
  const shots = []; // { key, src, kb, focus }
  let prevImage = null, prevKey = null;
  lines.forEach((line) => {
    if (!line || typeof line !== "object" || !line.image) { prevImage = null; return; }
    const abs = path.isAbsolute(line.image) ? line.image : path.join(repoRoot, line.image);
    if (!fs.existsSync(abs)) {
      if (line.visual) {
        console.warn("Painted image not found, falling back to visual \"" + line.visual + "\": " + line.image);
        return;
      }
      throw new Error("Painted image not found (and no fallback \"visual\" on the line): " + line.image);
    }
    if (line.image === prevImage && prevKey) { line.visual = prevKey; return; }
    const key = "painted-" + (shots.length + 1);
    const focus = /^\d{1,3}% \d{1,3}%$/.test(line.focus || "") ? line.focus : "50% 50%";
    const kb = MOVES.includes(line.kb) ? line.kb : MOVES[shots.length % MOVES.length];
    shots.push({ key, src: pathToFileURL(abs).href, kb, focus });
    line.visual = key;
    prevImage = line.image; prevKey = key;
  });
  return shots;
}

function paintedSectionsHtml(shots) {
  return shots.map((s) => {
    const [ox, oy] = s.focus.split(" ");
    return `  <section class="scene painted" data-scene="${s.key}" data-kb="${s.kb}" style="--ox:${ox}; --oy:${oy};">
    <div class="layer l-back"><img class="painted-img" src="${s.src}" alt="" style="object-position:${ox} ${oy};"></div>
    <div class="painted-grade"></div>
    <div class="fx" data-type="dust" data-n="34" data-color="255,214,160"></div>
  </section>\n`;
  }).join("");
}

// Inserts the painted <section>s at the top of #stage in a template's HTML.
function injectPaintedScenes(html, shots) {
  if (!shots.length) return html;
  // reel-action.html nests its scenes inside #cam > #shake; reel-scenes.html directly in #stage.
  const marker = html.includes('<div id="shake">') ? '<div id="shake">' : '<div id="stage">';
  if (!html.includes(marker)) throw new Error("Template has no #stage to add painted scenes to.");
  return html.replace(marker, marker + "\n" + paintedSectionsHtml(shots));
}

module.exports = { applyPaintedScenes, injectPaintedScenes };

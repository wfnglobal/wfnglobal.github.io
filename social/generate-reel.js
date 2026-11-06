#!/usr/bin/env node
/*
 * Generates a vertical (1080x1920) voiced Reel video from
 * social/templates/reel-prayer.html, for posting as an Instagram Reel.
 *
 * Pipeline:
 *  1. Call ElevenLabs text-to-speech for the full spoken text (opener +
 *     lines joined) -> an mp3.
 *  2. Measure the real audio duration (ffprobe) and distribute it
 *     across the prayer lines proportional to each line's character
 *     count, so each line's on-screen reveal lines up with when it's
 *     actually spoken.
 *  3. Render the HTML template with Playwright, recording a silent
 *     video for the full timeline (intro + voiced lines + end card).
 *  4. Mux the generated audio onto the video with ffmpeg, delayed to
 *     start exactly when the intro ends.
 *
 * Requires ELEVENLABS_API_KEY in the environment (a GitHub Actions
 * repo secret - see .github/workflows/reel-post.yml, which is where
 * this actually runs; it is NOT available in an ordinary scheduled
 * Claude session, only inside that Action). Optionally set
 * ELEVENLABS_VOICE_ID to use a different voice than the default below
 * - check your ElevenLabs voice library for the ID you want.
 *
 * Usage:
 *   node social/generate-reel.js <content.json> <outBase>
 * Writes <outBase>.mp4 and <outBase>.cover.png (a still frame partway
 * into the first line, usable as the Instagram Reel cover image).
 *
 * content.json shape (classic - social/templates/reel-prayer.html):
 * {
 *   "opener": "Father, I come to You exhausted...",  // optional, styled as an italic opener line
 *   "lines": ["I release every outcome...", "..."],  // required, at least one
 *   "bold": "fill the gap with Yours",                // optional - exact phrase to bold, matched against lines
 *   "kicker": "Today's Prayer",                       // optional
 *   "brandSub": "Daily Prayer",                        // optional
 *   "ctaLine": "Save this. Share this. ...",           // optional, shown on the end card
 *   "handle": "@wordfaithnetwork",                     // optional
 *   "site": "wfnglobal.org"                            // optional
 * }
 *
 * content.json shape (cinematic - social/templates/reel-cinematic.html,
 * selected by "template": "cinematic"): a restrained, muted-grade
 * motion-graphics treatment (no "card" background, no bold brand
 * header) for a short-film-style piece. Each line names which visual
 * "phase" is on screen while it's spoken, so the background crossfades
 * between a small set of abstract scenes instead of staying static:
 * {
 *   "template": "cinematic",
 *   "mood": "light",                              // optional - "dark" (default) or "light" (warm paper/cream grade instead of near-black; the opening "global reach" intro is unaffected either way)
 *   "lines": [
 *     { "text": "You already said the words.", "visual": "hands" },
 *     { "text": "...", "visual": "room" },        // "hands" | "room" | "breath" | "rest"
 *     ...
 *   ],
 *   "bold": "lay the debt down",                 // optional - exact phrase to bold, matched against lines
 *   "title": "Word and Faith Network",            // shown on the closing title card
 *   "subtitle": "Release the debt. Keep the boundary.",
 *   "handle": "@wordfaithnetwork",
 *   "site": "wfnglobal.org"
 * }
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const INTRO_DURATION = 4.0; // seconds - MUST match templates/reel-prayer.html's .intro animation-delay
const END_HOLD = 1.0; // pause after the last spoken line before the end card appears
const END_CARD_DURATION = 3.0; // how long the end card stays on screen
const CINEMATIC_END_CARD_DURATION = 4.0; // the restrained title card gets a bit longer to breathe
const FADE_UP_DURATION = 0.9; // seconds - matches the fadeUp keyframes' duration we set via JS below
const VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB"; // "Adam" - a standard ElevenLabs premade voice; override with ELEVENLABS_VOICE_ID if a different one fits better

async function main() {
  const [, , contentPath, outBase] = process.argv;
  if (!contentPath || !outBase) {
    console.error("Usage: node generate-reel.js <content.json> <outBase>");
    process.exit(1);
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("Missing ELEVENLABS_API_KEY environment variable.");
    process.exit(1);
  }

  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const isCinematic = content.template === "cinematic";
  const lines = buildLines(content, isCinematic);
  if (lines.length === 0) {
    console.error("content.json must have at least one line (opener and/or lines[]).");
    process.exit(1);
  }

  const workDir = path.dirname(outBase) || ".";
  fs.mkdirSync(workDir, { recursive: true });
  const audioPath = outBase + ".audio.mp3";
  const rawVideoDir = outBase + ".video-raw";
  const renderHtmlPath = outBase + ".render.html";

  console.log("Generating voiceover (" + lines.length + " lines)...");
  const speechText = lines.map((l) => l.text).join(isCinematic ? " " : ". ");
  await synthesizeSpeech(speechText, apiKey, audioPath, isCinematic);

  const audioDuration = getAudioDuration(audioPath);
  console.log("Audio duration: " + audioDuration.toFixed(2) + "s");

  const timedLines = distributeTiming(lines, audioDuration);
  const endCardDuration = isCinematic ? CINEMATIC_END_CARD_DURATION : END_CARD_DURATION;
  const totalDuration = INTRO_DURATION + audioDuration + END_HOLD + endCardDuration;
  console.log("Total video duration: " + totalDuration.toFixed(2) + "s");

  console.log("Rendering frames...");
  fs.rmSync(rawVideoDir, { recursive: true, force: true });
  fs.mkdirSync(rawVideoDir, { recursive: true });

  const templatePath = path.join(__dirname, "templates", isCinematic ? "reel-cinematic.html" : "reel-prayer.html");
  fs.copyFileSync(templatePath, renderHtmlPath);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    recordVideo: { dir: rawVideoDir, size: { width: 1080, height: 1920 } },
  });
  const page = await context.newPage();
  await page.goto("file://" + path.resolve(renderHtmlPath));
  await page.waitForTimeout(250); // let web fonts settle before injecting content/timing

  if (isCinematic) {
    await page.evaluate(
      ({ content, timedLines, introDuration, endCardDelay }) => {
        const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
        if (content.mood === "light") document.body.classList.add("theme-light");
        const capLine = document.getElementById("capLine");
        const phaseEls = {
          hands: document.getElementById("phaseHands"),
          room: document.getElementById("phaseRoom"),
          breath: document.getElementById("phaseBreath"),
          rest: document.getElementById("phaseRest"),
        };

        // Plain setTimeout + transition scheduling, rather than
        // pre-baked CSS @keyframes/animation-delay like the classic
        // template - simpler to drive one caption div's content and a
        // handful of background "phase" layers through a real
        // timeline. Browser timers keep running in real time while
        // Playwright's page.waitForTimeout holds the page open for
        // the full video length below, so this lines up with the
        // actual recording.
        function showPhase(key) {
          Object.values(phaseEls).forEach((el) => { if (el) el.style.opacity = "0"; });
          const el = phaseEls[key];
          if (!el) return;
          el.style.transition = "opacity 1.6s " + EASE;
          requestAnimationFrame(() => { el.style.opacity = "1"; });
        }

        function showCaption(html) {
          capLine.style.transition = "none";
          capLine.style.opacity = "0";
          capLine.style.filter = "blur(12px)";
          capLine.style.transform = "translateY(26px) scale(0.97)";
          capLine.innerHTML = html;
          void capLine.offsetWidth; // force reflow so the transition below actually animates
          capLine.style.transition = "opacity 0.8s " + EASE + ", filter 0.8s " + EASE + ", transform 0.8s " + EASE;
          requestAnimationFrame(() => {
            capLine.style.opacity = "1";
            capLine.style.filter = "blur(0px)";
            capLine.style.transform = "translateY(0) scale(1)";
          });
        }

        function hideCaption() {
          capLine.style.transition = "opacity 0.5s ease";
          capLine.style.opacity = "0";
        }

        let lastVisual = null;
        timedLines.forEach((line, i) => {
          const startMs = (introDuration + line.start) * 1000;
          const nextStartMs = i + 1 < timedLines.length ? (introDuration + timedLines[i + 1].start) * 1000 : startMs + 3000;
          setTimeout(() => showCaption(line.html), Math.max(0, startMs));
          setTimeout(() => hideCaption(), Math.max(startMs + 500, nextStartMs - 500));
          if (line.visual && line.visual !== lastVisual) {
            setTimeout(() => showPhase(line.visual), Math.max(0, startMs - 600));
            lastVisual = line.visual;
          }
        });

        document.getElementById("titleBrand").textContent = content.title || "Word & Faith Network";
        document.getElementById("titleTagline").textContent = content.subtitle || "";
        document.getElementById("titleMeta").textContent =
          (content.handle || "@wordfaithnetwork") + "  ·  " + (content.site || "wfnglobal.org");

        setTimeout(() => {
          hideCaption();
          const tc = document.getElementById("titleCard");
          tc.style.transition = "opacity 1.2s " + EASE;
          requestAnimationFrame(() => { tc.style.opacity = "1"; });
        }, endCardDelay * 1000);

        setTimeout(() => {
          const b = document.getElementById("blackout");
          b.style.transition = "opacity 1.2s ease";
          requestAnimationFrame(() => { b.style.opacity = "1"; });
        }, (endCardDelay + 3.0) * 1000);
      },
      {
        content,
        timedLines,
        introDuration: INTRO_DURATION,
        endCardDelay: totalDuration - endCardDuration,
      }
    );
  } else {
    await page.evaluate(
      ({ content, timedLines, introDuration, fadeUpDuration, endCardDelay }) => {
        const CINEMA_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

        const setFadeUp = (el, delaySeconds) => {
          el.style.animationName = "fadeUp";
          el.style.animationDuration = fadeUpDuration + "s";
          el.style.animationTimingFunction = CINEMA_EASE;
          el.style.animationDelay = delaySeconds + "s";
          el.style.animationFillMode = "forwards";
        };

        document.getElementById("kicker").textContent = content.kicker || "Today's Prayer";
        document.getElementById("brandSub").textContent = content.brandSub || "Daily Prayer";
        document.getElementById("ctaLine").textContent =
          content.ctaLine || "Save this. Share this. Someone you know needs it today.";
        document.getElementById("handle").textContent = content.handle || "@wordfaithnetwork";
        document.getElementById("site").textContent = content.site || "wfnglobal.org";

        const container = document.getElementById("prayerLines");
        container.innerHTML = "";
        timedLines.forEach((line) => {
          const div = document.createElement("div");
          div.className = "line" + (line.isOpener ? " opener" : "");
          div.innerHTML = line.html;
          container.appendChild(div);
          setFadeUp(div, introDuration + line.start);
        });

        setFadeUp(document.querySelector(".head"), introDuration);

        const kicker = document.querySelector(".kicker");
        kicker.style.animationName = "kickerPop";
        kicker.style.animationDuration = "0.8s";
        kicker.style.animationTimingFunction = CINEMA_EASE;
        kicker.style.animationDelay = introDuration + 0.4 + "s";
        kicker.style.animationFillMode = "forwards";

        const endcard = document.querySelector(".endcard");
        endcard.style.animationName = "fadeIn";
        endcard.style.animationDuration = "1s";
        endcard.style.animationTimingFunction = CINEMA_EASE;
        endcard.style.animationDelay = endCardDelay + "s";
        endcard.style.animationFillMode = "forwards";
      },
      {
        content,
        timedLines,
        introDuration: INTRO_DURATION,
        fadeUpDuration: FADE_UP_DURATION,
        endCardDelay: totalDuration - endCardDuration,
      }
    );
  }

  await page.waitForTimeout(Math.ceil(totalDuration * 1000) + 300);
  await context.close();
  await browser.close();

  const rawVideoFile = fs.readdirSync(rawVideoDir).find((f) => f.endsWith(".webm"));
  if (!rawVideoFile) {
    console.error("Playwright did not produce a video file.");
    process.exit(1);
  }
  const rawVideoPath = path.join(rawVideoDir, rawVideoFile);

  console.log("Encoding + muxing audio...");
  const finalMp4 = outBase + ".mp4";
  const coverPng = outBase + ".cover.png";

  // Delay the audio by INTRO_DURATION so it starts exactly when the
  // intro fades out and the spoken content begins. -t caps the output
  // at the intended total length regardless of either track's exact
  // native length.
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i", rawVideoPath,
      "-i", audioPath,
      "-filter_complex", `[1:a]adelay=${Math.round(INTRO_DURATION * 1000)}|${Math.round(INTRO_DURATION * 1000)}[a]`,
      "-map", "0:v",
      "-map", "[a]",
      "-t", String(totalDuration),
      "-vf", "fps=30,format=yuv420p",
      "-c:v", "libx264",
      "-crf", "20",
      "-preset", "medium",
      "-c:a", "aac",
      "-b:a", "160k",
      "-movflags", "+faststart",
      finalMp4,
    ],
    { stdio: "inherit" }
  );

  // A still frame partway into the first spoken line, for use as the
  // Instagram Reel cover image.
  execFileSync(
    "ffmpeg",
    ["-y", "-ss", String(INTRO_DURATION + 1.5), "-i", finalMp4, "-frames:v", "1", "-update", "1", coverPng],
    { stdio: "inherit" }
  );

  fs.rmSync(rawVideoDir, { recursive: true, force: true });
  fs.rmSync(renderHtmlPath, { force: true });
  fs.rmSync(audioPath, { force: true });

  console.log("WROTE: " + finalMp4);
  console.log("WROTE: " + coverPng);
}

function buildLines(content, isCinematic) {
  const lines = [];
  if (isCinematic) {
    (content.lines || []).forEach((l) => {
      lines.push({ text: l.text, html: boldWrap(l.text, content.bold), isOpener: false, visual: l.visual });
    });
    return lines;
  }
  if (content.opener) lines.push({ text: content.opener, html: escHtml(content.opener), isOpener: true });
  (content.lines || []).forEach((t) => {
    lines.push({ text: t, html: boldWrap(t, content.bold), isOpener: false });
  });
  return lines;
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

// Spread the measured audio duration across lines proportional to each
// line's character count (a reasonable proxy for how long it takes to
// say), with a small gap reserved between lines so the fade-in doesn't
// visually lag behind the voice.
function distributeTiming(lines, audioDuration) {
  const totalChars = lines.reduce((sum, l) => sum + l.text.length, 0) || 1;
  const gap = Math.min(0.5, audioDuration / (lines.length * 6));
  const usableDuration = Math.max(0.1, audioDuration - gap * (lines.length - 1));
  let cursor = 0;
  return lines.map((l) => {
    const share = (l.text.length / totalChars) * usableDuration;
    const start = cursor;
    cursor += share + gap;
    return { html: l.html, isOpener: l.isOpener, visual: l.visual, start };
  });
}

function getAudioDuration(audioPath) {
  const out = execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    audioPath,
  ])
    .toString()
    .trim();
  const d = parseFloat(out);
  if (!d || Number.isNaN(d)) throw new Error("Could not read audio duration from ffprobe output: " + out);
  return d;
}

async function synthesizeSpeech(text, apiKey, outPath, isCinematic) {
  // The cinematic piece asks for a calm, steady, almost-private-prayer
  // delivery - higher stability and lower "style" exaggeration than
  // the more expressive default used for the daily card-style reels.
  const voiceSettings = isCinematic
    ? { stability: 0.75, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true }
    : { stability: 0.55, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true };
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: voiceSettings,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS request failed (${res.status}): ${errText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

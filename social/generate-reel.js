#!/usr/bin/env node
/*
 * Generates a vertical voiced Reel video from social/templates/reel-prayer.html
 * (or reel-cinematic.html), for posting as an Instagram Reel. Templates are
 * laid out and recorded at their native 1080x1920 CSS pixels (see the
 * browser.newContext() call below for why NOT to try deviceScaleFactor
 * here), then Lanczos-upscaled to 2160x3840 ("4K" vertical) during the
 * ffmpeg encode step for delivery.
 *
 * Pipeline:
 *  1. Call a text-to-speech provider for the full spoken text (opener +
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
 * TEXT-TO-SPEECH PROVIDER: two are supported - Azure Speech and
 * ElevenLabs - selected by pickProvider() above synthesizeSpeech().
 * Azure is preferred automatically whenever AZURE_SPEECH_KEY and
 * AZURE_SPEECH_REGION are both set (its free tier's 500k
 * characters/month comfortably covers daily rendering, unlike this
 * project's capped ElevenLabs quota); otherwise it falls back to
 * ElevenLabs, and if an Azure render fails for any reason mid-run it
 * falls back to ElevenLabs for that one render too (as long as
 * ELEVENLABS_API_KEY is also set). Force one or the other with
 * TTS_PROVIDER=azure|elevenlabs. All of these are GitHub Actions repo
 * secrets/vars - see .github/workflows/reel-post.yml, which is where
 * this actually runs; they are NOT available in an ordinary scheduled
 * Claude session, only inside that Action.
 *
 * Azure: voice alternates male/female by date via pickAzureVoice()
 * (content.json's "voice": "male"/"female" overrides this per piece),
 * defaulting to the "Multilingual" neural voices
 * en-US-AndrewMultilingualNeural / en-US-AvaMultilingualNeural -
 * override with AZURE_SPEECH_VOICE_MALE / AZURE_SPEECH_VOICE_FEMALE,
 * or force one specific voice for every render with AZURE_SPEECH_VOICE.
 *
 * ElevenLabs: two premade voices are used - a man's and a woman's -
 * alternating by date the same way (see pickVoiceId() below). Override
 * either default with ELEVENLABS_VOICE_ID_MALE /
 * ELEVENLABS_VOICE_ID_FEMALE, or force one specific voice for every
 * render with ELEVENLABS_VOICE_ID (wins over everything) - check your
 * ElevenLabs voice library for the ID you want. ELEVENLABS_MODEL_ID
 * tries a different ElevenLabs model (defaults to "eleven_v4"). Voice
 * naturalness is driven by both the voice itself and the
 * voice_settings tuned in synthesizeSpeech() below - see the comment
 * there.
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
 *   "mood": "light",                              // optional - "dark" (default, near-black), "light" (warm paper/cream), "dusk" (deep indigo/plum), "sepia" (warm amber/brown), or "slate" (cool blue-grey). Vary this reel to reel rather than repeating one - the opening "global reach" intro is unaffected by mood either way.
 *   "lines": [
 *     { "text": "You already said the words.", "visual": "hands" },
 *     { "text": "...", "visual": "room" },
 *     ...
 *   ],
 *   // "visual" is one of: "hands" (a thread wound tight, one end loose),
 *   // "room" (a quiet room, a doorway, a chair), "breath" (soft
 *   // concentric rings releasing from a center point), "rest" (the
 *   // thread fully unwound, a loose horizontal ribbon-wave), "dawn"
 *   // (a horizon line, sun, rising rays), "path" (two converging lines
 *   // with waypoint dots - a road receding), "seed" (a stem breaking
 *   // ground with two opening leaves), "anchor" (an anchor resting over
 *   // slow horizontal water lines). Pick whichever subset of these fits
 *   // a given piece's theme and mood - do not default to the same two
 *   // or three every time; the template is built to support real
 *   // variety across reels (see social/templates/reel-cinematic.html's
 *   // ".p-dawn / .p-path / .p-seed / .p-anchor" block for the motif
 *   // library, and add new ones there following the same pattern
 *   // rather than reusing one motif for every mood).
 *   "bold": "lay the debt down",                 // optional - exact phrase to bold, matched against lines
 *   "title": "Word and Faith Network",            // shown on the closing title card
 *   "subtitle": "Release the debt. Keep the boundary.",
 *   "handle": "@wordfaithnetwork",
 *   "site": "wfnglobal.org",
 *   "voice": "female",                            // optional - "male" | "female"; omit to alternate by date
 *   "story": "A single thread wound tight..."      // optional - a short (1-3 sentence) plain-English art-
 *                                                  // direction note on the piece's visual concept. Not shown
 *                                                  // in the video itself; carried through to the published
 *                                                  // videos/manifest.json entry as its public "description",
 *                                                  // so write it as something a visitor would actually want
 *                                                  // to read, not an internal production note.
 * }
 *
 * Every rendered piece - cinematic or classic - should also be added to
 * the public video archive at videos/manifest.json (newest entries can
 * go anywhere in the array; the page sorts by date) so it shows up on
 * wfnglobal.org/videos/ and stays in the permanent archive there, not
 * just in the Instagram caption. See an existing entry in that file for
 * the exact shape (id, date, title, description, mood, videoUrl,
 * posterUrl) - "description" should normally just be the "story" field
 * above, lightly tidied if needed.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const BASE_INTRO_DURATION = 4.0; // seconds - MUST match templates/reel-prayer.html's .intro animation-delay
// reel-scenes.html plays the same WFN "global reach" intro (0-4s) and then
// the film's own title card (4-7s) before narration starts.
const SCENES_INTRO_DURATION = 7.0;
let INTRO_DURATION = BASE_INTRO_DURATION;
const END_HOLD = 1.0; // pause after the last spoken line before the end card appears
const END_CARD_DURATION = 3.0; // how long the end card stays on screen
const CINEMATIC_END_CARD_DURATION = 4.0; // the restrained title card gets a bit longer to breathe
const FADE_UP_DURATION = 0.9; // seconds - matches the fadeUp keyframes' duration we set via JS below
// Two premade ElevenLabs voices - a man's and a woman's - so reels don't
// always sound like the same narrator. Pick explicitly with
// content.json's "voice": "male" | "female", or with ELEVENLABS_VOICE_ID
// (full override, wins over everything). With neither set, the daily
// pipeline alternates by date so consecutive days don't repeat.
const VOICE_ID_MALE = process.env.ELEVENLABS_VOICE_ID_MALE || "pNInz6obpgDQGcFmaJgB"; // "Adam"
const VOICE_ID_FEMALE = process.env.ELEVENLABS_VOICE_ID_FEMALE || "21m00Tcm4TlvDq8ikWAM"; // "Rachel"

// Azure's current (2026) "Multilingual" neural voices - a newer generation
// than the plain en-US-*Neural voices, generally rated more natural and
// expressive, closer to what ElevenLabs produces. Used when
// AZURE_SPEECH_KEY is configured - see pickProvider() below. Default to
// Azure's newest "HD" (Dragon HD) voices, generally considered its most
// natural/human-sounding tier as of 2026 - real step up in warmth and
// prosody over the older plain neural voices, GA in East US as of this
// writing. If an HD voice ever fails for this account/region (younger
// voices sometimes aren't enabled on every free-tier resource yet),
// synthesizeSpeechAzure() falls back automatically to the Multilingual
// neural voices below, which are solidly natural and definitely
// supported everywhere Azure Speech is.
const AZURE_VOICE_MALE = process.env.AZURE_SPEECH_VOICE_MALE || "en-US-Andrew:DragonHDLatestNeural";
const AZURE_VOICE_FEMALE = process.env.AZURE_SPEECH_VOICE_FEMALE || "en-US-Ava:DragonHDLatestNeural";
const AZURE_VOICE_MALE_FALLBACK = process.env.AZURE_SPEECH_VOICE_MALE_FALLBACK || "en-US-AndrewMultilingualNeural";
const AZURE_VOICE_FEMALE_FALLBACK = process.env.AZURE_SPEECH_VOICE_FEMALE_FALLBACK || "en-US-AvaMultilingualNeural";

// Shared by both providers: alternate narrator by day-of-year so
// back-to-back daily reels don't repeat the same voice, without needing
// any state tracked between runs. content.voice, when set, always wins.
function pickGender(content) {
  if (content.voice === "female" || content.voice === "male") return content.voice;
  const dayOfYear = Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 86400000);
  return dayOfYear % 2 === 0 ? "female" : "male";
}

function pickVoiceId(content) {
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  return pickGender(content) === "female" ? VOICE_ID_FEMALE : VOICE_ID_MALE;
}

function pickAzureVoice(content) {
  if (process.env.AZURE_SPEECH_VOICE) return process.env.AZURE_SPEECH_VOICE;
  return pickGender(content) === "female" ? AZURE_VOICE_FEMALE : AZURE_VOICE_MALE;
}

function pickAzureVoiceFallback(content) {
  return pickGender(content) === "female" ? AZURE_VOICE_FEMALE_FALLBACK : AZURE_VOICE_MALE_FALLBACK;
}

// Azure Speech is the preferred provider whenever it's configured: as of
// this writing the ElevenLabs account on this project is capped at a
// small monthly credit quota (see the 402/quota_exceeded handling below),
// while Azure's free F0 tier gives 500,000 characters/month - far more
// than daily reel generation needs. Force a specific provider with
// TTS_PROVIDER=elevenlabs|azure if you ever need to override this.
function pickProvider() {
  const forced = (process.env.TTS_PROVIDER || "").toLowerCase();
  if (forced === "azure" || forced === "elevenlabs" || forced === "silent") return forced;
  if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) return "azure";
  return "elevenlabs";
}

async function main() {
  const [, , contentPath, outBase] = process.argv;
  if (!contentPath || !outBase) {
    console.error("Usage: node generate-reel.js <content.json> <outBase>");
    process.exit(1);
  }
  const provider = pickProvider();
  if (provider === "azure" && !(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION)) {
    console.error("TTS_PROVIDER=azure but AZURE_SPEECH_KEY / AZURE_SPEECH_REGION are not both set.");
    process.exit(1);
  }
  if (provider === "elevenlabs" && !process.env.ELEVENLABS_API_KEY) {
    console.error("Missing ELEVENLABS_API_KEY environment variable (and no Azure credentials configured).");
    process.exit(1);
  }

  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  // "scenes" is the illustrated short-film template (reel-scenes.html):
  // same caption/timeline machinery as "cinematic", but every "visual" key
  // is a full illustrated scene with its own colour grade and camera move.
  const isScenes = content.template === "scenes";
  const isCinematic = content.template === "cinematic" || isScenes;
  if (isScenes) INTRO_DURATION = SCENES_INTRO_DURATION;
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

  const speechText = lines.map((l) => l.text).join(isCinematic ? " " : ". ");
  if (provider === "silent") {
    // Local dry-run only (TTS_PROVIDER=silent): a silent track sized to a
    // typical narration pace, so a template can be previewed end to end
    // without spending TTS credits. Never used by the real workflow.
    const est = speechText.length / 14 + lines.length * 0.5;
    execFileSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", est.toFixed(2), "-c:a", "libmp3lame", "-q:a", "6", audioPath], { stdio: "ignore" });
  } else if (provider === "azure") {
    const azureVoice = pickAzureVoice(content);
    const azureVoiceFallback = pickAzureVoiceFallback(content);
    console.log("Generating voiceover (" + lines.length + " lines, Azure voice " + azureVoice + ")...");
    try {
      await synthesizeSpeechAzure(speechText, process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION, audioPath, isCinematic, azureVoice, azureVoiceFallback, isScenes ? lines.map((l) => l.text) : null);
    } catch (e) {
      if (process.env.ELEVENLABS_API_KEY) {
        console.warn("Azure TTS failed (" + e.message + ") - falling back to ElevenLabs for this render.");
        const voiceId = pickVoiceId(content);
        await synthesizeSpeech(speechText, process.env.ELEVENLABS_API_KEY, audioPath, isCinematic, voiceId);
      } else {
        throw e;
      }
    }
  } else {
    const voiceId = pickVoiceId(content);
    console.log("Generating voiceover (" + lines.length + " lines, voice " + voiceId + ")...");
    await synthesizeSpeech(speechText, process.env.ELEVENLABS_API_KEY, audioPath, isCinematic, voiceId);
  }

  const audioDuration = getAudioDuration(audioPath);
  console.log("Audio duration: " + audioDuration.toFixed(2) + "s");

  const timedLines = distributeTiming(lines, audioDuration);
  const endCardDuration = isCinematic ? CINEMATIC_END_CARD_DURATION : END_CARD_DURATION;
  const totalDuration = INTRO_DURATION + audioDuration + END_HOLD + endCardDuration;
  console.log("Total video duration: " + totalDuration.toFixed(2) + "s");

  console.log("Rendering frames...");
  fs.rmSync(rawVideoDir, { recursive: true, force: true });
  fs.mkdirSync(rawVideoDir, { recursive: true });

  const templateFile = isScenes ? "reel-scenes.html" : isCinematic ? "reel-cinematic.html" : "reel-prayer.html";
  const templatePath = path.join(__dirname, "templates", templateFile);
  fs.copyFileSync(templatePath, renderHtmlPath);

  // Templates are laid out in fixed 1080x1920 CSS pixels. NOTE: an
  // earlier version of this tried deviceScaleFactor:2 + a larger
  // recordVideo.size to get a sharper capture - don't repeat that.
  // Playwright's recordVideo is screencast-based and captures at the
  // viewport's CSS pixel size regardless of deviceScaleFactor; asking
  // for a larger recordVideo.size doesn't upscale that capture; it pads
  // the real (smaller) frame into the top-left corner of a larger
  // canvas and fills the rest with flat grey. (deviceScaleFactor DOES
  // work for page.screenshot(), which is why that looked fine in a
  // local preview check and only showed up as broken in the actual
  // recorded video.) The real upscale to 2160x3840 happens later, in
  // the ffmpeg encode step below, via a proper Lanczos scale filter.
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
      ({ content, timedLines, introDuration, endCardDelay, isScenes }) => {
        const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
        // "dark" (the default near-black grade) needs no class; any other
        // mood just maps straight to a body.theme-<mood> class - see
        // reel-cinematic.html for the full set ("light", "dusk", "sepia",
        // "slate" as of this writing, each a distinct background/accent
        // story so consecutive reels don't keep repeating one look).
        if (content.mood && content.mood !== "dark") document.body.classList.add("theme-" + content.mood);
        const capLine = document.getElementById("capLine");
        // reel-scenes.html marks each scene with data-scene="<key>";
        // reel-cinematic.html uses fixed phase IDs.
        let phaseEls = {};
        const sceneNodes = document.querySelectorAll("section[data-scene]");
        if (sceneNodes.length) {
          sceneNodes.forEach((n) => { phaseEls[n.dataset.scene] = n; });
        } else {
          phaseEls = {
            hands: document.getElementById("phaseHands"),
            room: document.getElementById("phaseRoom"),
            breath: document.getElementById("phaseBreath"),
            rest: document.getElementById("phaseRest"),
            dawn: document.getElementById("phaseDawn"),
            path: document.getElementById("phasePath"),
            seed: document.getElementById("phaseSeed"),
            anchor: document.getElementById("phaseAnchor"),
          };
        }
        const introPresents = document.getElementById("introPresents");
        if (introPresents && content.title) introPresents.firstChild.textContent = content.title;
        const introTitle = document.getElementById("introTitle");
        if (introTitle) introTitle.textContent = content.subtitle || "";

        // Plain setTimeout + transition scheduling, rather than
        // pre-baked CSS @keyframes/animation-delay like the classic
        // template - simpler to drive one caption div's content and a
        // handful of background "phase" layers through a real
        // timeline. Browser timers keep running in real time while
        // Playwright's page.waitForTimeout holds the page open for
        // the full video length below, so this lines up with the
        // actual recording.
        function showPhase(key, durSec) {
          const el = phaseEls[key];
          Object.values(phaseEls).forEach((other) => {
            if (!other || other === el) return;
            other.style.opacity = "0";
            if (isScenes) setTimeout(() => { if (other.style.opacity === "0") other.classList.remove("active", "live"); }, 2600);
          });
          if (!el) return;
          if (isScenes) {
            // Restart this scene's camera move, sized to how long it's on screen.
            el.style.setProperty("--dur", Math.max(6, (durSec || 12) + 3).toFixed(1) + "s");
            el.classList.remove("active");
            void el.offsetWidth;
            el.classList.add("active", "live");
            document.body.dataset.shot = key;
          }
          el.style.transition = "opacity " + (isScenes ? "2.2s" : "1.6s") + " " + EASE;
          requestAnimationFrame(() => { el.style.opacity = "1"; });
        }

        function showChapter(ch) {
          const box = document.getElementById("chapter");
          if (!box || !ch) return;
          document.getElementById("chapterNum").textContent = ch.num ? "Chapter " + ch.num : "";
          document.getElementById("chapterName").textContent = ch.name || "";
          document.getElementById("chapterRef").textContent = ch.ref || "";
          const name = document.getElementById("chapterName");
          box.style.transition = "none";
          box.style.opacity = "0";
          name.style.transition = "none";
          name.style.letterSpacing = "0.14em";
          name.style.filter = "blur(8px)";
          void box.offsetWidth;
          box.style.transition = "opacity 1.4s " + EASE;
          name.style.transition = "letter-spacing 2.4s " + EASE + ", filter 1.6s " + EASE;
          requestAnimationFrame(() => {
            box.style.opacity = "1";
            name.style.letterSpacing = "0.02em";
            name.style.filter = "blur(0px)";
          });
          setTimeout(() => {
            box.style.transition = "opacity 1.4s ease";
            box.style.opacity = "0";
          }, 4600);
        }

        function showCaption(html, isScripture) {
          capLine.classList.toggle("scripture", !!isScripture);
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

        // How long each visual stays on screen (until the next visual
        // change, or until the end card), so scene camera moves can be
        // sized to fit.
        const changeStarts = [];
        let prevVisual = null;
        timedLines.forEach((line) => {
          if (line.visual && line.visual !== prevVisual) { changeStarts.push(line.start); prevVisual = line.visual; }
        });
        const endAt = endCardDelay - introDuration + 4;

        let lastVisual = null;
        let changeIdx = 0;
        timedLines.forEach((line, i) => {
          const startMs = (introDuration + line.start) * 1000;
          const nextStartMs = i + 1 < timedLines.length ? (introDuration + timedLines[i + 1].start) * 1000 : startMs + 3000;
          const capDelay = line.chapter && isScenes ? 900 : 0;
          setTimeout(() => showCaption(line.html, line.scripture), Math.max(0, startMs + capDelay));
          setTimeout(() => hideCaption(), Math.max(startMs + capDelay + 500, nextStartMs - 500));
          if (line.visual && line.visual !== lastVisual) {
            const segEnd = changeIdx + 1 < changeStarts.length ? changeStarts[changeIdx + 1] : endAt;
            const segDur = segEnd - line.start;
            changeIdx++;
            setTimeout(() => showPhase(line.visual, segDur), Math.max(0, startMs - (isScenes ? 1100 : 600)));
            lastVisual = line.visual;
          }
          if (line.chapter && isScenes) setTimeout(() => showChapter(line.chapter), Math.max(0, startMs - 300));
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
        isScenes,
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
  const videoKbps = Math.max(1500, Math.min(12000, Math.floor((88 * 8 * 1000) / totalDuration) - 160));
  console.log("Video bitrate cap: " + videoKbps + " kbps");
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
      // REEL_FAST=1 is for local dry runs only: native size, fast encode.
      "-vf", process.env.REEL_FAST ? "fps=30,format=yuv420p" : "scale=2160:3840:flags=lanczos,fps=30,format=yuv420p",
      "-c:v", "libx264",
      "-crf", process.env.REEL_FAST ? "23" : "18",
      // Cap the video bitrate so the finished file always fits under
      // GitHub's 100 MB per-file limit (~90 MB target incl. audio),
      // whatever the length - short reels still get up to 12 Mbps.
      "-maxrate", videoKbps + "k",
      "-bufsize", videoKbps * 2 + "k",
      "-preset", process.env.REEL_FAST ? "veryfast" : "slow",
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
    ["-y", "-ss", String(INTRO_DURATION + (isScenes ? 4 : 1.5)), "-i", finalMp4, "-frames:v", "1", "-update", "1", coverPng],
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
      lines.push({
        text: l.text,
        html: boldWrap(l.text, content.bold),
        isOpener: false,
        visual: l.visual,
        chapter: l.chapter || null,
        scripture: !!l.scripture,
      });
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
    return { html: l.html, isOpener: l.isOpener, visual: l.visual, chapter: l.chapter || null, scripture: !!l.scripture, start };
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

async function synthesizeSpeech(text, apiKey, outPath, isCinematic, voiceId) {
  // Tuned for natural, human-sounding delivery rather than a flat
  // "computer voice". The ElevenLabs "stability" slider is the main
  // lever here: pushed too high (as this was before, at 0.75 for the
  // cinematic preset) it suppresses the voice's natural pitch/pace
  // variation and reads as robotic; lower stability lets real prosody
  // through at a small cost in take-to-take consistency, which doesn't
  // matter for a single rendered line. "style" is nudged up to restore
  // some of the natural inflection that high stability was flattening.
  // The cinematic piece still reads a little calmer/quieter than the
  // daily card-style reels, so it keeps marginally higher stability,
  // but nowhere near where it was.
  const voiceSettings = isCinematic
    ? { stability: 0.38, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true }
    : { stability: 0.32, similarity_boost: 0.85, style: 0.55, use_speaker_boost: true };
  // eleven_v4 is ElevenLabs' current flagship model and is described
  // (by ElevenLabs, as of late 2026) as their most emotive/natural-
  // sounding option, a real step up from the older v2-era models this
  // was on before. Override with ELEVENLABS_MODEL_ID (e.g. back to
  // "eleven_multilingual_v2", ElevenLabs' most stable long-form model,
  // if v4 ever causes trouble on this account) without a code change.
  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_v4";

  async function request(id) {
    return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: voiceSettings,
      }),
    });
  }

  let res = await request(voiceId);
  if (!res.ok && res.status === 402 && voiceId !== VOICE_ID_MALE) {
    // ElevenLabs can 402 ("Free users cannot use library voices via the
    // API") on a premade voice that hasn't been saved into this
    // account's own voice list, even while another premade voice
    // (VOICE_ID_MALE, apparently already saved there) works fine. Rather
    // than let a plan/voice-library quirk silently break every other
    // day's reel (the date-based alternation would hit this every time
    // it picks the broken voice), fall back once to the known-working
    // male voice and keep going - better one day's narrator skewing
    // male than a failed render. This is a real account-level issue
    // worth fixing properly (save the female voice into the ElevenLabs
    // account's own voice list, or set ELEVENLABS_VOICE_ID_FEMALE to
    // one that's already usable), not something to rely on long-term.
    console.warn(`ElevenLabs voice ${voiceId} returned 402 (plan/library restriction) - falling back to the male voice for this render.`);
    res = await request(VOICE_ID_MALE);
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS request failed (${res.status}): ${errText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

function xmlEscape(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function synthesizeSpeechAzure(text, apiKey, region, outPath, isCinematic, voiceName, fallbackVoiceName, segments) {
  // Azure's neural voices already sound natural at their default rate -
  // a slight slow-down (more for the cinematic template, which wants a
  // calmer, more deliberate read) is enough to avoid the slightly
  // brisk, "read aloud" cadence these voices default to.
  const rate = isCinematic ? "-8%" : "-3%";

  // For the illustrated film template, give each narrated line a short
  // breath after it (a deliberate, documentary-style read), matching the
  // ~0.5s inter-line gap distributeTiming() assumes for the captions.
  const body = segments && segments.length
    ? segments.map((t) => xmlEscape(t)).join('<break time="500ms"/>')
    : xmlEscape(text);

  async function request(name) {
    const ssml =
      `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">` +
      `<voice name="${name}"><prosody rate="${rate}">${body}</prosody></voice>` +
      `</speak>`;
    return fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-48khz-192kbitrate-mono-mp3",
        "User-Agent": "wfnglobal-reel-generator",
      },
      body: ssml,
    });
  }

  let res = await request(voiceName);
  if (!res.ok && fallbackVoiceName && fallbackVoiceName !== voiceName) {
    // HD (DragonHDLatestNeural) voices are newer and not guaranteed to be
    // enabled on every resource/region yet - rather than fail the whole
    // render over it, drop back once to the standard Multilingual neural
    // voice, which is universally supported and still genuinely natural.
    const errText = await res.text().catch(() => "");
    console.warn(`Azure voice ${voiceName} failed (${res.status}: ${errText}) - falling back to ${fallbackVoiceName}.`);
    res = await request(fallbackVoiceName);
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Azure Speech TTS request failed (${res.status}): ${errText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

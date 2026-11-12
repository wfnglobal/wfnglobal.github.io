#!/usr/bin/env node
/*
 * Records today's Listen audio for the WFN app in a natural human voice
 * (Microsoft Azure), so the app's Listen button plays a real voice
 * instead of the phone's built-in reader.
 *
 * Reads app/data/today.json (and the day's sermon page under articles/),
 * then writes MP3s plus audio/listen/manifest.json. The app looks each
 * item up in the manifest by key (verse:<date>, declaration:<date>,
 * sermon:<slug>, study:<slug>) and checks a short text fingerprint, so a
 * translated page or an edited text never plays the wrong recording - it
 * just falls back to the phone voice.
 *
 * Voices: the same Azure voices the WFN videos use (Andrew / Ava HD,
 * falling back to Andrew / Ava Multilingual), alternating by day like
 * the reels. Nothing about the video voices is changed by this script.
 *
 * Budget: Azure's free tier covers 500,000 characters a month, shared
 * with the reels. LISTEN_MONTHLY_BUDGET (default 380,000) caps what this
 * script spends; once it's reached, remaining items that month use the
 * phone voice. Raise it after moving the Speech resource to a paid tier.
 *
 * Env: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION (required; exits quietly
 * without them), AZURE_SPEECH_VOICE_MALE / _FEMALE (+ _FALLBACK),
 * LISTEN_MONTHLY_BUDGET, LISTEN_KEEP_DAYS (default 14).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "audio", "listen");
const MANIFEST = path.join(OUT, "manifest.json");

const KEY = process.env.AZURE_SPEECH_KEY || "";
const REGION = (process.env.AZURE_SPEECH_REGION || "").trim().toLowerCase();
const BUDGET = parseInt(process.env.LISTEN_MONTHLY_BUDGET, 10) || 380000;
const KEEP_DAYS = parseInt(process.env.LISTEN_KEEP_DAYS, 10) || 14;

// Same voices as social/generate-reel.js - kept in step deliberately.
const VOICE = {
  male: process.env.AZURE_SPEECH_VOICE_MALE || "en-US-Andrew:DragonHDLatestNeural",
  female: process.env.AZURE_SPEECH_VOICE_FEMALE || "en-US-Ava:DragonHDLatestNeural",
};
const FALLBACK = {
  male: process.env.AZURE_SPEECH_VOICE_MALE_FALLBACK || "en-US-AndrewMultilingualNeural",
  female: process.env.AZURE_SPEECH_VOICE_FEMALE_FALLBACK || "en-US-AvaMultilingualNeural",
};
const CHUNK_CHARS = 2800; // well under Azure's per-request limits

// Must match fp() in app/js2/core.js.
const fp = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "").slice(0, 48);
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
const xml = (s) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);
const slugify = (k) => k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function genderFor(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  const t = isNaN(d) ? new Date() : d;
  const day = Math.floor((t - Date.UTC(t.getUTCFullYear(), 0, 0)) / 86400000);
  return day % 2 === 0 ? "female" : "male";
}

// The sermon screen in the app reads the article's own page; extract the
// same blocks in the same order (see W.view("sermon") in app/js2/pages.js).
async function sermonItems(slug, browser) {
  const file = path.join(ROOT, "articles", slug + ".html");
  if (!fs.existsSync(file)) return null;
  const page = await browser.newPage();
  try {
    await page.setContent(fs.readFileSync(file, "utf8"), { waitUntil: "domcontentloaded" });
    return await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const out = [];
      const t = q(".article-title"); if (t) out.push(t.textContent.trim());
      const sub = q(".article-sub"); if (sub) out.push(sub.textContent.trim());
      const st = q(".scripture-text"); if (st) out.push(st.textContent.trim());
      const body = q(".article-body");
      if (body) {
        body.querySelectorAll("script, style, .share-bar, button, form, .article-cta").forEach((n) => n.remove());
        Array.from(body.children).forEach((n) => {
          const tag = n.tagName.toLowerCase();
          if (!n.textContent.trim()) return;
          if (n.classList.contains("pull-verse")) { const c = n.querySelector("cite"); if (c) c.remove(); out.push(n.textContent.trim()); }
          else if (tag === "ul" || tag === "ol") n.querySelectorAll("li").forEach((li) => out.push(li.textContent.trim()));
          else out.push(n.textContent.trim());
        });
      }
      return out;
    });
  } finally {
    await page.close();
  }
}

function chunk(items) {
  const parts = [];
  items.forEach((it) => {
    if (it.length <= CHUNK_CHARS) return parts.push(it);
    const sentences = it.match(/[^.!?]+[.!?]+["”’)]?\s*|[^.!?]+$/g) || [it];
    let cur = "";
    sentences.forEach((s) => { if ((cur + s).length > CHUNK_CHARS && cur) { parts.push(cur.trim()); cur = ""; } cur += s; });
    if (cur.trim()) parts.push(cur.trim());
  });
  const chunks = [];
  let cur = [];
  let len = 0;
  parts.forEach((p) => {
    if (len + p.length > CHUNK_CHARS && cur.length) { chunks.push(cur); cur = []; len = 0; }
    cur.push(p); len += p.length;
  });
  if (cur.length) chunks.push(cur);
  return chunks;
}

async function synth(parts, voiceName) {
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">` +
    `<voice name="${voiceName}"><prosody rate="-3%">${parts.map((p) => xml(p)).join('<break time="450ms"/>')}</prosody></voice></speak>`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "wfnglobal-listen-audio",
      },
      body: ssml,
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const err = await res.text().catch(() => "");
    if (res.status === 429 && attempt < 3) { await new Promise((r) => setTimeout(r, attempt * 4000)); continue; }
    const e = new Error(`Azure ${res.status}: ${err.slice(0, 200)}`);
    e.status = res.status;
    throw e;
  }
}

async function record(items, gender) {
  const chunks = chunk(items);
  let voice = VOICE[gender];
  const bufs = [];
  for (const c of chunks) {
    try {
      bufs.push(await synth(c, voice));
    } catch (e) {
      if (voice !== FALLBACK[gender] && e.status !== 429) {
        console.warn(`  ${voice} unavailable (${e.message}) - using ${FALLBACK[gender]} for this recording.`);
        voice = FALLBACK[gender];
        bufs.length = 0;
        for (const c2 of chunks) bufs.push(await synth(c2, voice));
        break;
      }
      throw e;
    }
  }
  return { buf: Buffer.concat(bufs), voice };
}

async function main() {
  if (!KEY || !/^[a-z0-9]+$/.test(REGION)) {
    console.log("AZURE_SPEECH_KEY / AZURE_SPEECH_REGION not set - skipping Listen audio.");
    return;
  }
  const today = JSON.parse(fs.readFileSync(path.join(ROOT, "app", "data", "today.json"), "utf8"));
  const date = today.updated || new Date().toISOString().slice(0, 10);
  const month = date.slice(0, 7);
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : { items: {} };
  manifest.items = manifest.items || {};

  const jobs = [];
  if (today.declaration && (today.declaration.lines || []).filter(Boolean).length)
    jobs.push({ key: "declaration:" + date, items: today.declaration.lines.filter(Boolean) });
  if (today.verse && today.verse.text)
    jobs.push({ key: "verse:" + date, items: [today.verse.text, String(today.verse.ref || "").replace(":", ", verse ")] });

  let browser = null;
  if (today.sermon && today.sermon.slug) {
    const { chromium } = require("playwright");
    browser = await chromium.launch();
    const items = await sermonItems(today.sermon.slug, browser);
    if (items && items.length) jobs.push({ key: "sermon:" + today.sermon.slug, items });
  }
  const st = today.bibleStudy;
  if (st && st.slug)
    jobs.push({ key: "study:" + st.slug, items: [st.title, st.excerpt].concat((st.verses || []).map((v) => v.text), st.body || []) });
  if (browser) await browser.close();

  const gender = genderFor(date);
  let used = Object.values(manifest.items).filter((e) => e.month === month).reduce((n, e) => n + (e.chars || 0), 0);
  console.log(`Month ${month}: ${used.toLocaleString()} of ${BUDGET.toLocaleString()} characters used so far. Narrator today: ${gender}.`);

  let changed = false;
  for (const job of jobs) {
    const items = job.items.map(clean).filter(Boolean);
    const text = items.join(" ");
    const hash = crypto.createHash("sha1").update(text).digest("hex").slice(0, 10);
    const prev = manifest.items[job.key];
    if (prev && prev.hash === hash && fs.existsSync(path.join(OUT, prev.file))) { console.log(`= ${job.key} already recorded`); continue; }
    if (used + text.length > BUDGET) { console.log(`! ${job.key} skipped: monthly budget reached (${text.length} chars needed)`); continue; }
    console.log(`> ${job.key}: ${items.length} parts, ${text.length.toLocaleString()} chars`);
    try {
      const { buf, voice } = await record(items, gender);
      const file = `${slugify(job.key)}-${hash}.mp3`;
      fs.writeFileSync(path.join(OUT, file), buf);
      if (prev && prev.file !== file) { try { fs.unlinkSync(path.join(OUT, prev.file)); } catch (e) {} }
      manifest.items[job.key] = { file, fp: fp(text), hash, chars: text.length, voice, month, date, bytes: buf.length };
      used += text.length;
      changed = true;
      console.log(`  saved ${file} (${(buf.length / 1048576).toFixed(1)} MB, ${voice})`);
    } catch (e) {
      console.warn(`! ${job.key} failed: ${e.message}`);
      if (e.status === 401 || e.status === 403) break;
    }
  }

  // Keep the last KEEP_DAYS days so the site stays light.
  const cutoff = new Date(date + "T12:00:00Z");
  cutoff.setUTCDate(cutoff.getUTCDate() - KEEP_DAYS);
  const cut = cutoff.toISOString().slice(0, 10);
  for (const [k, e] of Object.entries(manifest.items)) {
    if ((e.date || "") < cut) { delete manifest.items[k]; changed = true; }
  }
  const keep = new Set(Object.values(manifest.items).map((e) => e.file));
  fs.readdirSync(OUT).filter((f) => f.endsWith(".mp3") && !keep.has(f)).forEach((f) => { fs.unlinkSync(path.join(OUT, f)); changed = true; });

  if (changed) {
    manifest.updated = new Date().toISOString();
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
  }
  console.log(changed ? "Manifest updated." : "Nothing new to record.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

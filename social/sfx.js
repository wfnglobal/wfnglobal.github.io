/*
 * Sound design for action reels (content.json "template": "action").
 *
 * Builds a full-length stereo WAV under the narration: weather and sea beds
 * that follow each shot, a score (minor drone through the storm, warm major
 * pad after it), taiko drums whose density follows the camera shake, thunder
 * on every lightning flash, a whoosh on every cut, booms on slams, a riser
 * into the climax and a hard cut to silence on the white-out. Everything is
 * synthesised here (no sample files, no licences), and it reads the same
 * per-scene data-shake / data-flash / data-white attributes the template
 * uses, so sound and picture land on the same frame.
 *
 *   const { buildSoundtrack } = require("./sfx");
 *   buildSoundtrack({ total, intro, cuts:[{key,t}], scenes:{key:{shake,flash,white,kb}}, sound }, "out.wav");
 *
 * content.json may carry "sound": { "<scene>": { rain, wind, waves, drone, pad, cabin, city, shimmer } }
 * (0-1 levels) to override the defaults in SCENE_SOUND for its own scenes.
 */
const fs = require("fs");

const SR = 48000;

// Bed levels per scene (0-1). Unknown scenes fall back to "neutral".
const SCENE_SOUND = {
  neutral: { waves: 0.3, wind: 0.2, pad: 0.4 },
  dusk: { waves: 0.45, wind: 0.12, pad: 0.55 },
  setout: { waves: 0.5, wind: 0.2, pad: 0.6 },
  cloudwall: { waves: 0.6, wind: 0.6, rain: 0.35, drone: 0.6 },
  bolt: { waves: 0.8, wind: 0.9, rain: 0.9, drone: 0.8 },
  wave: { waves: 1, wind: 1, rain: 0.9, drone: 0.9 },
  deck: { waves: 0.9, wind: 0.9, rain: 1, drone: 0.95 },
  hands: { waves: 1, wind: 0.8, rain: 1, drone: 0.95 },
  face: { waves: 0.8, wind: 1, rain: 1, drone: 1 },
  sleep: { cabin: 0.9, rain: 0.08, wind: 0.08, waves: 0.15, drone: 0.35 },
  wake: { waves: 0.9, wind: 1, rain: 1, drone: 1 },
  rise: { waves: 0.8, wind: 0.9, rain: 0.9, drone: 1 },
  command: { waves: 0.8, wind: 1, rain: 0.9, drone: 1 },
  calm: { waves: 0.12, pad: 0.75, shimmer: 0.35 },
  awe: { waves: 0.1, pad: 0.85, shimmer: 0.5 },
  car: { city: 0.8, drone: 0.4 },
  carDawn: { city: 0.25, pad: 0.8, shimmer: 0.3 },
  sunrise: { waves: 0.2, pad: 1, shimmer: 0.7 },
};
const BEDS = ["rain", "wind", "waves", "drone", "pad", "cabin", "city", "shimmer"];

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// Chamberlin state-variable filter, fc may change per sample.
function svf() { let low = 0, band = 0; return (x, fc, q) => { const f = Math.min(1.4, 2 * Math.sin(Math.PI * Math.min(fc, SR / 6) / SR)); low += f * band; const high = x - low - q * band; band += f * high; return { low, band, high }; }; }

function buildSoundtrack(opts, outPath) {
  const total = opts.total, N = Math.ceil(total * SR);
  const L = new Float32Array(N), R = new Float32Array(N);
  const rand = rng(20261110);
  const nz = () => rand() * 2 - 1;
  const at = (t) => Math.max(0, Math.min(N - 1, Math.floor(t * SR)));
  const add = (i, l, r) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r === undefined ? l : r; } };

  const cuts = opts.cuts.slice().sort((a, b) => a.t - b.t);
  const scenes = opts.scenes || {};
  const levelsOf = (key) => Object.assign({}, SCENE_SOUND[key] || SCENE_SOUND.neutral, (opts.sound || {})[key] || {});
  const endStory = opts.endCard != null ? opts.endCard : total - 4;

  // ---------- bed envelopes: piecewise per shot, short crossfades ----------
  const env = {}; BEDS.forEach((b) => (env[b] = new Float32Array(N)));
  const segs = [];
  for (let i = 0; i < cuts.length; i++) segs.push({ key: cuts[i].key, t0: cuts[i].t, t1: i + 1 < cuts.length ? cuts[i + 1].t : total });
  segs.forEach((s) => {
    const lv = levelsOf(s.key), sc = scenes[s.key] || {};
    let silentFrom = sc.white != null ? s.t0 + sc.white : null;
    BEDS.forEach((b) => {
      const target = lv[b] || 0, e = env[b];
      const i0 = at(s.t0), i1 = at(s.t1);
      for (let i = i0; i < i1; i++) {
        let v = target;
        const t = i / SR;
        if (silentFrom != null && t >= silentFrom) {
          // the climax: the storm stops dead, then the score blooms back in
          const isStorm = b === "rain" || b === "wind" || b === "waves" || b === "drone";
          v = isStorm ? 0 : target * Math.min(1, Math.max(0, (t - silentFrom - 1.2) / 2.5));
        } else if (silentFrom != null && (b === "pad" || b === "shimmer")) v = 0;
        e[i] = v;
      }
    });
  });
  // fade everything out under the end card, and in from the intro
  BEDS.forEach((b) => {
    const e = env[b];
    // smooth (0.25s one-pole) so cuts don't click - but keep the hard stop at white-outs
    let y = 0; const k = 1 - Math.exp(-1 / (0.12 * SR));
    for (let i = 0; i < N; i++) { const t = i / SR; let target = e[i] * (t < opts.intro ? 0 : 1) * Math.max(0, Math.min(1, (endStory + 2.5 - t) / 2.5)); y += (target - y) * (target < y * 0.2 ? 0.02 : k); e[i] = y; }
  });

  // ---------- beds ----------
  const fRainA = svf(), fRainB = svf(), fWind = svf(), fWind2 = svf(), fWave = svf(), fCab = svf(), fCity = svf(), fPad = svf(), fDr = svf();
  let ph = new Float64Array(16);
  const DRONE = [73.42, 110.0, 146.83, 174.61, 220.0]; // D minor
  const PAD = [146.83, 185.0, 220.0, 293.66, 369.99]; // D major
  let lastPatter = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let l = 0, r = 0;
    const eRain = env.rain[i], eWind = env.wind[i], eWave = env.waves[i], eDr = env.drone[i], ePad = env.pad[i], eCab = env.cabin[i], eCity = env.city[i], eSh = env.shimmer[i];
    if (eRain > 0.001 || eCab > 0.001) {
      const n = nz();
      const hi = fRainA(n, 5200, 0.7).band * 0.9 + fRainB(n, 1400, 0.9).high * 0.25;
      l += hi * eRain * 0.32; r += hi * eRain * 0.32 * (0.85 + 0.15 * Math.sin(t * 0.7));
      const muf = fCab(n, 650, 0.8).low;
      l += muf * eCab * 0.9; r += muf * eCab * 0.9;
    }
    if (eWind > 0.001) {
      const fc = 380 + 260 * Math.sin(t * 0.37) + 180 * Math.sin(t * 1.13 + 1) + 120 * Math.sin(t * 2.9);
      const w = fWind(nz(), fc, 0.18).band, w2 = fWind2(nz(), fc * 2.4, 0.3).band;
      const gust = 0.6 + 0.4 * Math.sin(t * 0.8) * Math.sin(t * 0.23 + 2);
      l += (w * 0.9 + w2 * 0.25) * eWind * gust * 0.5; r += (w * 0.75 + w2 * 0.3) * eWind * gust * 0.5;
    }
    if (eWave > 0.001) {
      const sw = 0.55 + 0.45 * Math.sin(t * 2 * Math.PI * 0.11) * Math.sin(t * 2 * Math.PI * 0.07 + 1);
      const w = fWave(nz(), 320 + 500 * sw, 0.5).low;
      l += w * eWave * sw * 1.4; r += w * eWave * (1.2 - sw * 0.3) * 1.1;
    }
    if (eCity > 0.001) {
      const c = fCity(nz(), 260, 0.6).low;
      l += c * eCity * 1.1; r += c * eCity * 1.0;
      if (rand() < 0.0004 && t - lastPatter > 0.02) lastPatter = t;
    }
    if (eDr > 0.001) {
      let s = 0;
      DRONE.forEach((f, k) => { ph[k] += (f * (1 + 0.0015 * Math.sin(t * 0.3 + k))) / SR; s += ((ph[k] % 1) * 2 - 1) * (k === 0 ? 1 : 0.55); });
      const v = fDr(s, 300 + 250 * eDr + 80 * Math.sin(t * 0.2), 0.6).low;
      l += v * eDr * 0.13; r += v * eDr * 0.13;
    }
    if (ePad > 0.001) {
      let s = 0;
      PAD.forEach((f, k) => { ph[8 + k] += (f * (1 + 0.002 * Math.sin(t * 0.5 + k * 1.7))) / SR; const x = ph[8 + k] % 1; s += (x < 0.5 ? 4 * x - 1 : 3 - 4 * x) * (k === 0 ? 0.9 : 0.6); });
      const v = fPad(s, 900 + 500 * Math.sin(t * 0.15), 0.5).low;
      l += v * ePad * 0.14; r += v * ePad * 0.14 * (0.9 + 0.1 * Math.sin(t * 0.9));
    }
    L[i] += l; R[i] += r;
    void eSh;
  }

  // ---------- one-shots ----------
  function thunder(t0, g) {
    const fl = svf(), fh = svf();
    const crackN = Math.floor(0.25 * SR), rumN = Math.floor(5.5 * SR);
    for (let j = 0; j < crackN; j++) { const e = Math.exp(-j / (0.045 * SR)) * (j < 60 ? j / 60 : 1); const x = fh(nz(), 3800, 0.6).high * e * 1.4 * g; add(at(t0) + j, x, x * 0.9); }
    let amp = 0, target = 1;
    for (let j = 0; j < rumN; j++) {
      if (j % 2400 === 0) target = 0.3 + rand() * 0.9;
      amp += (target - amp) * 0.0008;
      const env = Math.min(1, j / (0.08 * SR)) * Math.exp(-j / (1.9 * SR));
      const x = fl(nz(), 120 - 50 * (j / rumN), 0.5).low * amp * env * 3.2 * g;
      add(at(t0 + 0.05) + j, x, x);
    }
  }
  function boom(t0, g) {
    const n = Math.floor(1.6 * SR); let p = 0; const fl = svf();
    for (let j = 0; j < n; j++) { const f = 30 + 70 * Math.exp(-j / (0.18 * SR)); p += f / SR; const e = Math.exp(-j / (0.45 * SR)) * Math.min(1, j / 40); const x = (Math.sin(2 * Math.PI * p) * 0.9 + fl(nz(), 200, 0.6).low * 0.6 * Math.exp(-j / (0.05 * SR))) * e * g; add(at(t0) + j, x, x); }
  }
  function whoosh(t0, g, dur) {
    const n = Math.floor(dur * SR), f1 = svf();
    for (let j = 0; j < n; j++) { const u = j / n; const fc = 300 + 3000 * Math.sin(Math.PI * u) ** 2; const e = Math.sin(Math.PI * u) ** 2; const x = f1(nz(), fc, 0.35).band * e * g; add(at(t0 - dur * 0.6) + j, x * (1 - u * 0.6), x * (0.4 + u * 0.6)); }
  }
  function riser(t0, t1, g) {
    const n = Math.floor((t1 - t0) * SR), f1 = svf(); let p = 0;
    for (let j = 0; j < n; j++) { const u = j / n; const fc = 200 + 5000 * u * u; p += (80 + 600 * u * u) / SR; const e = u ** 2.2; const x = (f1(nz(), fc, 0.25).band * 0.8 + ((p % 1) * 2 - 1) * 0.12) * e * g; add(at(t0) + j, x, x); }
  }
  function taiko(t0, g) {
    const n = Math.floor(0.7 * SR); let p = 0; const fl = svf();
    for (let j = 0; j < n; j++) { const f = 48 + 40 * Math.exp(-j / (0.03 * SR)); p += f / SR; const e = Math.exp(-j / (0.22 * SR)) * Math.min(1, j / 30); const x = (Math.sin(2 * Math.PI * p) + fl(nz(), 900, 0.7).band * 0.5 * Math.exp(-j / (0.02 * SR))) * e * g; add(at(t0) + j, x, x * 0.95); }
  }
  function bell(t0, f, g, pan) {
    const n = Math.floor(3.2 * SR);
    for (let j = 0; j < n; j++) { const tt = j / SR; const e = Math.exp(-tt / 1.1) * Math.min(1, j / 200); const x = (Math.sin(2 * Math.PI * f * tt) + 0.35 * Math.sin(2 * Math.PI * f * 2.76 * tt) * Math.exp(-tt * 2) + 0.2 * Math.sin(2 * Math.PI * f * 5.4 * tt) * Math.exp(-tt * 4)) * e * g; add(at(t0) + j, x * (1 - pan), x * pan); }
  }

  // intro: a soft swell and a boom as the WFN mark lands, a whoosh into "presents"
  riser(0.6, 2.1, 0.12); boom(2.1, 0.35); bell(2.15, 587.33, 0.06, 0.4); bell(2.3, 880, 0.04, 0.6); whoosh(4.4, 0.25, 0.9); bell(6.6, 440, 0.05, 0.5); bell(6.75, 659.25, 0.04, 0.5);

  // cuts: whoosh on every cut, boom on slams, thunder on flashes
  let climax = null;
  cuts.forEach((c, i) => {
    const sc = scenes[c.key] || {}; const shake = +sc.shake || 0;
    if (i > 0) whoosh(c.t, 0.18 + 0.12 * shake, shake >= 2 ? 0.45 : 0.6);
    if (sc.kb === "slam" && shake >= 1) boom(c.t, 0.35 + 0.15 * shake);
    (sc.flash || []).forEach((ft, k) => thunder(c.t + ft, k === 0 ? 0.8 : 0.6));
    if (sc.white != null) { climax = c.t + sc.white; riser(Math.max(opts.intro, climax - 3), climax, 0.35); boom(climax, 0.9); }
  });

  // drums: density follows the camera shake, stopping dead at the climax
  const bpm = 96, beat = 60 / bpm;
  for (let t = opts.intro; t < endStory; t += beat / 2) {
    if (climax != null && t >= climax - 0.05 && t < climax + 0.1) continue;
    if (climax != null && t > climax) break;
    const seg = segs.filter((s) => t >= s.t0 && t < s.t1)[0]; if (!seg) continue;
    const shake = +((scenes[seg.key] || {}).shake || 0);
    const n = Math.round((t - opts.intro) / (beat / 2)), inBar = n % 8;
    let hit = 0;
    if (shake === 1 && inBar === 0) hit = 0.5;
    if (shake === 2 && (inBar === 0 || inBar === 4 || inBar === 6)) hit = inBar === 0 ? 0.6 : 0.4;
    if (shake >= 3 && inBar % 2 === 0) hit = 0.65;
    if (shake >= 3 && inBar % 2 === 1) hit = 0.25;
    if (hit) taiko(t, hit);
  }

  // shimmer: gentle bells in the bright, calm scenes
  const SH = [587.33, 739.99, 880, 1174.66, 1479.98];
  for (let t = opts.intro; t < endStory + 2; t += 0.35) {
    const i = at(t); const e = env.shimmer[i] || 0;
    if (e > 0.05 && rand() < 0.45 * e) bell(t + rand() * 0.2, SH[Math.floor(rand() * SH.length)] * (rand() < 0.3 ? 0.5 : 1), 0.035 * e, 0.2 + rand() * 0.6);
  }
  // end card: one low resolving tone
  boom(endStory + 0.2, 0.25); bell(endStory + 0.25, 293.66, 0.07, 0.5); bell(endStory + 0.4, 440, 0.05, 0.5);

  // ---------- master: soft clip + normalise to -3 dBFS ----------
  let peak = 0;
  for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 1.2); R[i] = Math.tanh(R[i] * 1.2); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
  const norm = peak > 0 ? 0.708 / peak : 1;
  const buf = Buffer.alloc(44 + N * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4); }
  fs.writeFileSync(outPath, buf);
}

// Reads data-scene / data-kb / data-shake / data-flash / data-white from a template.
function readSceneMeta(html) {
  const out = {};
  const re = /<section[^>]*data-scene="([^"]+)"[^>]*>/g; let m;
  while ((m = re.exec(html))) {
    const tag = m[0], g = (a) => { const x = new RegExp(a + '="([^"]*)"').exec(tag); return x ? x[1] : null; };
    out[m[1]] = { kb: g("data-kb"), shake: +(g("data-shake") || 0), flash: (g("data-flash") || "").split(",").filter(Boolean).map(Number), white: g("data-white") != null ? +g("data-white") : null };
  }
  return out;
}

module.exports = { buildSoundtrack, readSceneMeta, SCENE_SOUND };

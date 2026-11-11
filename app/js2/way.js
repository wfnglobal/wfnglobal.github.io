// WFN App 2.0 — THE WAY: an open-world walk through Galilee.
// Free roam Capernaum, the market, the western hills and the lake; ride a
// donkey, take a fishing boat out; five Gospel missions; twelve scrolls;
// gold Faith stars; minimap and full map with waypoints; day and night;
// cutscenes and "Deed Done"; photo mode; a quiet psalm radio.
// Touch (thumbstick + buttons) or keyboard. Jesus is never shown or played:
// every scene happens around Him, and His words appear as Scripture.
(function () {
  "use strict";
  const W = window.WFN2;
  const { esc, icon } = W;
  const SAVE = "wfn2-way";
  let game = null;

  function loadThree() {
    if (window.THREE) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = W.BASE + "app/vendor/three.min.js";
      s.onload = res; s.onerror = () => rej(new Error("three"));
      document.head.appendChild(s);
    });
  }
  window.addEventListener("hashchange", () => { if (game && !/^#\/way/.test(location.hash)) { game.dispose(); game = null; } });

  W.view("way", async function (main) {
    document.body.classList.add("way-on");
    main.innerHTML = loadingScreen();
    const bar = W.$("#wyBar"), tip = W.$("#wyTip");
    const TIPS = ["Drag the left side to walk. Drag the right side to look around.", "Hold Run to sprint. Find your donkey by the stable to travel faster.", "Gold markers start missions. Scrolls glow gold when you’re close.", "Tap the map to set a waypoint.", "Take the boat from the dock to sail the Sea of Galilee.", "Night falls after a few minutes. Watch the lamps come on in Capernaum."];
    let ti = 0; const tipT = setInterval(() => { tip.textContent = TIPS[++ti % TIPS.length]; }, 3200);
    try { await loadThree(); } catch (e) { clearInterval(tipT); main.innerHTML = W.topbar("The Way", { back: "#/" }) + '<div class="page"><div class="empty">The game couldn’t load. Check your connection and try again.</div></div>'; return; }
    bar.style.width = "20%";
    if (game) { game.dispose(); game = null; }
    game = new Game(main); W._way = game;
    await game.build((p) => { bar.style.width = (20 + p * 75) + "%"; });
    bar.style.width = "100%";
    clearInterval(tipT);
    const go = W.$("#wyGo");
    go.hidden = false; W.$("#wyProg").hidden = true;
    go.focus();
    go.onclick = () => { W.$("#wyLoad").classList.add("out"); setTimeout(() => { const l = W.$("#wyLoad"); if (l) l.remove(); }, 700); game.begin(); };
  });

  function loadingScreen() {
    return `<div class="wy" id="wyRoot">
      <div class="wy-load" id="wyLoad">
        <div class="wy-load-art" style="background-image:url('${W.BASE}app/img/museum/05-galilee.jpg')"></div>
        <div class="wy-load-shade"></div>
        <a class="icon-btn on-hero wy-exit-l" href="#/" aria-label="Back">${icon("back")}</a>
        <div class="wy-load-title"><span class="wy-kicker">WFN presents</span><h1>THE WAY</h1><span class="wy-subt">GALILEE · A.D. 30</span></div>
        <div class="wy-load-foot">
          <div id="wyProg"><div class="wy-prog"><span id="wyBar"></span></div><p id="wyTip" class="wy-tip">Drag the left side to walk. Drag the right side to look around.</p></div>
          <button class="wy-go" id="wyGo" hidden>Tap to begin</button>
        </div>
      </div>
    </div>`;
  }

  // ---------- small math ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const rnd = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  function distSeg(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az; const t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(px - ax - t * dx, pz - az - t * dz); }

  // ---------- the land ----------
  const SIZE = 440;
  const TOWN = [-5, 0];
  const ROADS = [
    [[-5, 0], [-6, 40], [-12, 100], [-20, 168]],
    [[-5, 0], [-50, -14], [-95, -30], [-120, -40]],
    [[-5, 0], [6, -50], [12, -92]],
    [[-5, 0], [30, 8], [50, 10]],
  ];
  function roadDist(x, z) { let d = 1e9; for (const r of ROADS) for (let i = 0; i < r.length - 1; i++) d = Math.min(d, distSeg(x, z, r[i][0], r[i][1], r[i + 1][0], r[i + 1][1])); return d; }
  function shoreX(z) { return 56 + 9 * Math.sin(z * 0.021 + 0.6) + 4 * Math.sin(z * 0.07); }
  function height(x, z) {
    let h = 2.2 * Math.sin(x * 0.031 + 1.3) * Math.cos(z * 0.027) + 1.3 * Math.sin(x * 0.07 + z * 0.05) + 0.5 * Math.sin(x * 0.17) * Math.sin(z * 0.13);
    h += sstep(-55, -170, x) * (20 + 6 * Math.sin(z * 0.024 + 0.5));
    h += sstep(-60, -200, z) * 9 * (1 - sstep(30, 90, x));
    h += sstep(120, 200, z) * 6;
    h = Math.max(h, 0.5 + 0.4 * Math.sin(x * 0.11 + z * 0.07));
    const lake = sstep(-6, 22, x - shoreX(z));
    h = lerp(h, -7, lake);
    const town = 1 - sstep(36, 58, Math.hypot(x - TOWN[0], z - TOWN[1]));
    h = lerp(h, 1.2, town);
    const rd = 1 - sstep(2.5, 7, roadDist(x, z));
    if (lake < 0.5) h = lerp(h, h * 0.75 + 0.6, rd * 0.5);
    return h;
  }
  const WATER_Y = -0.35;
  const DOCK = { x0: 50, x1: 72, z0: 8, z1: 12, y: 0.55 };
  const onDock = (x, z) => x > DOCK.x0 && x < DOCK.x1 && z > DOCK.z0 && z < DOCK.z1;

  // ---------- places ----------
  const P = {
    shepherd: [-96, -28], sheepSpots: [[-152, -70], [-166, 18], [-140, 62]],
    andrew: [12, -94], boy: [-20, -16], crowd: [10, -125],
    simon: [60, 10], boat: [70, 14], deep: [128, -24],
    wounded: [-9, 108], inn: [-20, 172], stable: [-26, 30],
    peter: [15, 25], stairs: [20, 21], market: [-18, -16],
  };
  const SCROLLS = [
    ["The LORD is my shepherd; I shall not want.", "Psalm 23:1", -130, -10],
    ["Thy word is a lamp unto my feet, and a light unto my path.", "Psalm 119:105", -40, -60],
    ["Come unto me, all ye that labour and are heavy laden, and I will give you rest.", "Matthew 11:28", 30, -30],
    ["I am the bread of life: he that cometh to me shall never hunger.", "John 6:35", 22, -118],
    ["Be still, and know that I am God.", "Psalm 46:10", 104, 30],
    ["Peace I leave with you, my peace I give unto you.", "John 14:27", -60, 80],
    ["Ye are the light of the world. A city that is set on an hill cannot be hid.", "Matthew 5:14", -175, -40],
    ["The kingdom of heaven is like unto treasure hid in a field.", "Matthew 13:44", -90, 130],
    ["Follow me, and I will make you fishers of men.", "Matthew 4:19", 66, 40],
    ["With God all things are possible.", "Matthew 19:26", -32, 18],
    ["I am the good shepherd: the good shepherd giveth his life for the sheep.", "John 10:11", -160, 70],
    ["Ask, and it shall be given you; seek, and ye shall find.", "Matthew 7:7", 2, 150],
  ];

  // ---------- missions ----------
  const MISSIONS = [
    { id: "sheep", title: "The Lost Sheep", ref: "Luke 15:4–6", at: P.shepherd, giver: "Eli the shepherd", verse: "Rejoice with me; for I have found my sheep which was lost.", tint: 0xE2A85A },
    { id: "loaves", title: "Five Loaves", ref: "John 6:9–13", at: P.andrew, giver: "Andrew", verse: "Gather up the fragments that remain, that nothing be lost.", tint: 0xE2A85A },
    { id: "nets", title: "Fishers of Men", ref: "Luke 5:4–7", at: P.simon, giver: "Simon", verse: "Master, we have toiled all the night, and have taken nothing: nevertheless at thy word I will let down the net.", tint: 0xE2A85A },
    { id: "samaritan", title: "The Good Samaritan", ref: "Luke 10:33–35", at: P.wounded, giver: "A traveller", verse: "Go, and do thou likewise.", tint: 0xE2A85A },
    { id: "roof", title: "Through the Roof", ref: "Mark 2:3–5", at: P.peter, giver: "Four friends", verse: "Son, thy sins be forgiven thee.", tint: 0xE2A85A },
  ];

  // ---------- audio: wind, water, birds, crickets, a psalm "radio" ----------
  class Sound {
    constructor() { this.ctx = null; this.music = true; }
    start(music) {
      if (this.ctx) return;
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
      const noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const mk = (freq, q, gain) => { const s = c.createBufferSource(); s.buffer = noise; s.loop = true; const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq; f.Q.value = q; const g = c.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); g.connect(this.master); s.start(); return { f, g }; };
      this.wind = mk(420, 0.4, 0.035);
      this.water = mk(700, 0.8, 0);
      this.musicBus = c.createGain(); this.musicBus.gain.value = music ? 0.5 : 0; this.musicBus.connect(this.master);
      this.music = music;
      this.nextNote = 0; this.nextBird = 2;
      const drone = c.createOscillator(); drone.type = "sine"; drone.frequency.value = 73.42; const dg = c.createGain(); dg.gain.value = 0.05; drone.connect(dg); dg.connect(this.musicBus); drone.start();
      const d5 = c.createOscillator(); d5.type = "sine"; d5.frequency.value = 110; const d5g = c.createGain(); d5g.gain.value = 0.025; d5.connect(d5g); d5g.connect(this.musicBus); d5.start();
    }
    pluck(freq, when, vol, bus) {
      const c = this.ctx; if (!c) return;
      const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = "triangle"; o2.type = "sine"; o.frequency.value = freq; o2.frequency.value = freq * 2.01;
      f.type = "lowpass"; f.frequency.setValueAtTime(freq * 6, when); f.frequency.exponentialRampToValueAtTime(freq * 1.5, when + 1.2);
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, when + 2.4);
      o.connect(f); o2.connect(f); f.connect(g); g.connect(bus || this.musicBus);
      o.start(when); o2.start(when); o.stop(when + 2.5); o2.stop(when + 2.5);
    }
    chime(kind) {
      const c = this.ctx; if (!c) return; const t = c.currentTime;
      const seq = kind === "pass" ? [293.66, 369.99, 440, 587.33, 739.99] : kind === "scroll" ? [587.33, 880, 1174.66] : [440, 659.25];
      seq.forEach((f, i) => this.pluck(f, t + i * (kind === "pass" ? 0.16 : 0.09), kind === "pass" ? 0.16 : 0.12, this.master));
    }
    splash() {
      const c = this.ctx; if (!c) return; const t = c.currentTime;
      const s = c.createBufferSource(); const b = c.createBuffer(1, c.sampleRate * 0.6, c.sampleRate); const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      s.buffer = b; const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900; const g = c.createGain(); g.gain.value = 0.5;
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
    }
    setMusic(on) { this.music = on; if (this.musicBus) this.musicBus.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.4); }
    update(dt, env) {
      const c = this.ctx; if (!c) return;
      this.water.g.gain.setTargetAtTime(clamp(1 - env.shoreDist / 40, 0, 1) * 0.06, c.currentTime, 0.5);
      this.wind.g.gain.setTargetAtTime(0.02 + clamp(env.height / 30, 0, 1) * 0.05, c.currentTime, 0.8);
      this.wind.f.frequency.setTargetAtTime(380 + Math.sin(c.currentTime * 0.3) * 120, c.currentTime, 0.5);
      // radio: a slow lyre melody in D dorian
      if (this.music && c.currentTime > this.nextNote) {
        const scale = [293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33];
        const n = scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.25 ? 0.5 : 1);
        this.pluck(n, c.currentTime + 0.02, 0.07);
        if (Math.random() < 0.3) this.pluck(n * 1.5, c.currentTime + 0.32, 0.04);
        this.nextNote = c.currentTime + [0.6, 0.9, 1.2, 1.8][Math.floor(Math.random() * 4)];
      }
      // birds by day, crickets by night
      if (c.currentTime > this.nextBird) {
        const t = c.currentTime;
        if (env.day > 0.35) { const base = 2200 + Math.random() * 1600; for (let i = 0; i < 3; i++) { const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(base, t + i * 0.11); o.frequency.exponentialRampToValueAtTime(base * 1.4, t + i * 0.11 + 0.07); g.gain.setValueAtTime(0.0001, t + i * 0.11); g.gain.exponentialRampToValueAtTime(0.025, t + i * 0.11 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + 0.09); o.connect(g); g.connect(this.master); o.start(t + i * 0.11); o.stop(t + i * 0.11 + 0.1); } }
        else { for (let i = 0; i < 6; i++) { const o = c.createOscillator(), g = c.createGain(); o.type = "square"; o.frequency.value = 4400; g.gain.setValueAtTime(0.0001, t + i * 0.05); g.gain.exponentialRampToValueAtTime(0.006, t + i * 0.05 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.05 + 0.03); o.connect(g); g.connect(this.master); o.start(t + i * 0.05); o.stop(t + i * 0.05 + 0.04); } }
        this.nextBird = t + 2 + Math.random() * 5;
      }
    }
    dispose() { try { this.ctx && this.ctx.close(); } catch (e) {} this.ctx = null; }
  }

  // ---------- the game ----------
  class Game {
    constructor(main) {
      this.main = main;
      this.save = Object.assign({ done: [], scrolls: [], pos: null, time: 0.36, music: true, quality: "auto", seen: false }, W.read(SAVE, {}));
      this.keys = {}; this.joy = { x: 0, y: 0, active: false };
      this.yaw = Math.PI * 0.62; this.pitch = 0.36; this.camDist = 8.5; this.lastLook = -10;
      this.mode = "walk"; // walk | donkey | boat
      this.vy = 0; this.grounded = true;
      this.mission = null; this.cine = false; this.disposed = false;
      this.sound = new Sound();
      this.waypoint = null;
      this.timeOfDay = this.save.time;
      this.clockScale = 1 / 600; // a full day in ten minutes
      this.npcs = []; this.colliders = []; this.pick = [];
    }

    quality() {
      const q = this.save.quality;
      const dpr = window.devicePixelRatio || 1;
      if (q === "battery") return { dpr: 1, shadows: false, map: 1024 };
      if (q === "high") return { dpr: Math.min(dpr, 2.5), shadows: true, map: 2048 };
      return { dpr: Math.min(dpr, 2), shadows: true, map: 1536 };
    }

    async build(progress) {
      const T = THREE;
      const step = () => new Promise((r) => requestAnimationFrame(() => r()));
      const root = W.$("#wyRoot", this.main);
      this.root = root;
      const q = this.quality();
      const r = this.renderer = new T.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      r.setPixelRatio(q.dpr); r.setSize(innerWidth, innerHeight);
      r.shadowMap.enabled = q.shadows; r.shadowMap.type = T.PCFSoftShadowMap;
      r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
      r.domElement.className = "wy-canvas";
      root.prepend(r.domElement);
      const scene = this.scene = new T.Scene();
      scene.fog = new T.Fog(0xcfd8de, 60, 330);
      const cam = this.camera = new T.PerspectiveCamera(58, innerWidth / innerHeight, 0.3, 1400);

      // light
      this.hemi = new T.HemisphereLight(0xcfdcec, 0x5a4a30, 0.55); scene.add(this.hemi);
      const sun = this.sun = new T.DirectionalLight(0xfff1d6, 1.6);
      sun.castShadow = q.shadows; sun.shadow.mapSize.set(q.map, q.map);
      const sc = sun.shadow.camera; sc.left = -55; sc.right = 55; sc.top = 55; sc.bottom = -55; sc.near = 1; sc.far = 260; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
      scene.add(sun); scene.add(sun.target);
      progress(0.08); await step();

      // sky dome
      this.skyMat = new T.ShaderMaterial({
        side: T.BackSide, depthWrite: false, fog: false,
        uniforms: { top: { value: new T.Color(0x3d6ea8) }, horizon: { value: new T.Color(0xe9d8bc) }, sunDir: { value: new T.Vector3(0, 1, 0) }, sunCol: { value: new T.Color(0xfff2d0) }, night: { value: 0 } },
        vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunCol; uniform float night; varying vec3 vP; void main(){ float h = clamp(vP.y, -0.2, 1.0); vec3 c = mix(horizon, top, pow(max(h,0.0), 0.55)); float s = max(dot(vP, normalize(sunDir)), 0.0); c += sunCol * (pow(s, 600.0) * 3.0 + pow(s, 12.0) * 0.35 * (1.0-night)); c = mix(c, horizon*0.9, smoothstep(0.0,-0.2,vP.y)); gl_FragColor = vec4(c, 1.0); }",
      });
      scene.add(new T.Mesh(new T.SphereGeometry(900, 32, 16), this.skyMat));
      // stars
      const sg = new T.BufferGeometry(); const sp = []; const rs = rnd(9);
      for (let i = 0; i < 900; i++) { const th = rs() * Math.PI * 2, ph = Math.acos(rs() * 0.95); sp.push(Math.sin(ph) * Math.cos(th) * 850, Math.cos(ph) * 850, Math.sin(ph) * Math.sin(th) * 850); }
      sg.setAttribute("position", new T.Float32BufferAttribute(sp, 3));
      this.stars = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
      scene.add(this.stars);
      progress(0.15); await step();

      // terrain with painted vertex colours
      const SEG = 176;
      const g = new T.PlaneGeometry(SIZE, SIZE, SEG, SEG); g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position; const cols = []; const rc = rnd(3);
      const cGrass = new T.Color(0x6f7a36), cGrass2 = new T.Color(0x56632a), cDry = new T.Color(0xa08a50), cRock = new T.Color(0x9a8b78), cSand = new T.Color(0xdcc79f), cRoad = new T.Color(0xa88a62), cTown = new T.Color(0xb59d74), cWet = new T.Color(0x8c7a5c);
      const tmp = new T.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i), h = height(x, z); pos.setY(i, h);
        const n = rc();
        tmp.copy(cGrass).lerp(cGrass2, n * 0.6).lerp(cDry, sstep(4, 14, h) * 0.7 + 0.15 * Math.sin(x * 0.05 + z * 0.04));
        tmp.lerp(cRock, sstep(14, 24, h) * 0.85);
        const sx = x - shoreX(z);
        tmp.lerp(cSand, sstep(-14, -3, sx) * (1 - sstep(2, 8, sx)) * 0.95);
        tmp.lerp(cWet, sstep(0, 6, sx));
        const town = 1 - sstep(30, 46, Math.hypot(x - TOWN[0], z - TOWN[1]));
        tmp.lerp(cTown, town * 0.8);
        tmp.lerp(cRoad, (1 - sstep(1.6, 3.6, roadDist(x, z))) * 0.9);
        cols.push(tmp.r, tmp.g, tmp.b);
      }
      g.setAttribute("color", new T.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
      const ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0, flatShading: false }));
      ground.receiveShadow = true; scene.add(ground);
      progress(0.3); await step();

      // water
      this.waterMat = new T.ShaderMaterial({
        transparent: true, fog: false,
        uniforms: { t: { value: 0 }, deep: { value: new T.Color(0x1f5d6e) }, shallow: { value: new T.Color(0x5fa3a6) }, sky: { value: new T.Color(0xcfd8de) }, sunDir: { value: new T.Vector3(0, 1, 0) }, sunCol: { value: new T.Color(0xffffff) }, camPos: { value: new T.Vector3() }, fogCol: { value: new T.Color(0xcfd8de) }, fogNear: { value: 60 }, fogFar: { value: 330 }, dim: { value: 1 } },
        vertexShader: "uniform float t; varying vec3 vW; varying vec3 vN; void main(){ vec3 p = position; float w1 = sin(p.x*0.18 + t*1.3) * 0.12 + sin(p.z*0.23 - t*1.1)*0.1 + sin((p.x+p.z)*0.5 + t*2.0)*0.04; p.y += w1; vec4 wp = modelMatrix * vec4(p,1.0); vW = wp.xyz; float dx = cos(p.x*0.18 + t*1.3)*0.0216 + cos((p.x+p.z)*0.5+t*2.0)*0.02; float dz = -sin(p.z*0.23 - t*1.1)*0.023*-1.0 + cos((p.x+p.z)*0.5+t*2.0)*0.02; vN = normalize(vec3(-dx*6.0, 1.0, -dz*6.0)); gl_Position = projectionMatrix * viewMatrix * wp; }",
        fragmentShader: "uniform vec3 deep; uniform vec3 shallow; uniform vec3 sky; uniform vec3 sunDir; uniform vec3 sunCol; uniform vec3 camPos; uniform vec3 fogCol; uniform float fogNear; uniform float fogFar; uniform float dim; uniform float t; varying vec3 vW; varying vec3 vN; float shoreX(float z){ return 56.0 + 9.0*sin(z*0.021+0.6) + 4.0*sin(z*0.07); } void main(){ vec3 V = normalize(camPos - vW); vec3 N = normalize(vN + vec3(sin(vW.x*1.7+t*3.0)*0.03, 0.0, cos(vW.z*1.9-t*2.6)*0.03)); float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0); float depth = clamp((vW.x - shoreX(vW.z)) / 40.0, 0.0, 1.0); vec3 c = mix(shallow, deep, depth) * dim; c = mix(c, sky, fr * 0.7); vec3 H = normalize(normalize(sunDir) + V); float sp = pow(max(dot(N, H), 0.0), 220.0); c += sunCol * sp * 2.2; float foam = smoothstep(2.5, 0.0, vW.x - shoreX(vW.z) + 6.0) * (0.5 + 0.5*sin(vW.z*0.6 + t*2.0)); c = mix(c, vec3(0.92,0.9,0.85)*dim, foam*0.35); float d = length(camPos - vW); c = mix(c, fogCol, smoothstep(fogNear, fogFar, d)); gl_FragColor = vec4(c, mix(0.86, 0.97, fr)); }",
      });
      const water = new T.Mesh(new T.PlaneGeometry(SIZE * 1.4, SIZE * 1.4, 140, 140).rotateX(-Math.PI / 2), this.waterMat);
      water.position.set(SIZE * 0.35, WATER_Y, 0); scene.add(water);
      // the far shore of the lake: Golan hills across the water
      const far = new T.Mesh(new T.CylinderGeometry(600, 640, 40, 48, 1, true, -0.9, 1.8), new T.MeshBasicMaterial({ color: 0x8b8a9a, side: T.BackSide, fog: true }));
      far.position.set(0, 4, 0); scene.add(far); this.farHills = far;
      progress(0.4); await step();

      // dock and boat
      const wood = new T.MeshStandardMaterial({ color: 0x7a5636, roughness: 0.9 });
      const dock = new T.Mesh(new T.BoxGeometry(DOCK.x1 - DOCK.x0, 0.3, DOCK.z1 - DOCK.z0), wood);
      dock.position.set((DOCK.x0 + DOCK.x1) / 2, DOCK.y - 0.15, (DOCK.z0 + DOCK.z1) / 2); dock.castShadow = dock.receiveShadow = true; scene.add(dock);
      for (let x = DOCK.x0 + 2; x < DOCK.x1; x += 4) for (const z of [DOCK.z0 + 0.3, DOCK.z1 - 0.3]) { const p = new T.Mesh(new T.CylinderGeometry(0.16, 0.18, 3, 6), wood); p.position.set(x, -0.8, z); scene.add(p); }
      this.boat = this.makeBoat(); this.boat.position.set(P.boat[0], WATER_Y, P.boat[1]); this.boat.rotation.y = -Math.PI / 2; scene.add(this.boat);
      progress(0.48); await step();

      // Capernaum
      this.buildTown(); progress(0.62); await step();
      this.buildNature(); progress(0.78); await step();

      // people and animals
      this.player = this.makePerson({ robe: 0x7b4a3a, sash: 0xd9b26a, wrap: 0xe8dcc4, skin: 0x8a5a3c, headcloth: true });
      scene.add(this.player.g);
      this.donkey = this.makeDonkey(); this.donkey.position.set(P.stable[0], height(P.stable[0], P.stable[1]), P.stable[1]); scene.add(this.donkey);
      const rv = rnd(42); const ROBES = [0x6d7f8f, 0x9a6b4a, 0xb9a27a, 0x5e6b4a, 0x8a5070, 0xc7b89a, 0x6a5848, 0x44607a];
      for (let i = 0; i < 18; i++) {
        const p = this.makePerson({ robe: ROBES[i % ROBES.length], sash: ROBES[(i + 3) % ROBES.length], wrap: i % 3 ? 0xe2d5bc : 0x7d6a58, skin: [0x8a5a3c, 0x6e4630, 0xa0704c][i % 3], veil: i % 2 === 0, hair: [0x1e1510, 0x2e1e14, 0x8a8278, 0x14100c][i % 4] });
        const a = rv() * Math.PI * 2, rr = 8 + rv() * 28;
        p.g.position.set(TOWN[0] + Math.cos(a) * rr, 0, TOWN[1] + Math.sin(a) * rr);
        p.target = null; p.wait = rv() * 4; p.speed = 1.1 + rv() * 0.7; p.phase = rv() * 10;
        this.scene.add(p.g); this.npcs.push(p);
      }
      // mission people (shown when relevant)
      this.cast = {};
      const castMk = (key, colors, pos, rot) => { const p = this.makePerson(colors); p.g.position.set(pos[0], height(pos[0], pos[1]), pos[1]); p.g.rotation.y = rot || 0; this.scene.add(p.g); this.cast[key] = p; return p; };
      castMk("shepherd", { robe: 0x6a5a40, sash: 0x3e3226, wrap: 0xd8c8a8, skin: 0x7a4c32, staff: true, hair: 0x9a948a, headcloth: true }, P.shepherd, 1.2);
      castMk("andrew", { robe: 0x4f6f8a, sash: 0xc9a36a, wrap: 0xe6dac2, skin: 0x8a5a3c }, P.andrew, 2.2);
      castMk("boy", { robe: 0xb5764a, sash: 0x5a3a26, wrap: 0x3a2a1e, skin: 0x8a5a3c, scale: 0.72, headcloth: false }, P.boy, 0.5);
      castMk("simon", { robe: 0x5a4a3c, sash: 0x2e5a6a, wrap: 0xe6dac2, skin: 0x7a4c32 }, [P.simon[0], P.simon[1]], -1.6);
      this.cast.simon.g.position.y = DOCK.y;
      castMk("wounded", { robe: 0xcab89a, sash: 0x8a3a2a, wrap: 0xcab89a, skin: 0x8a5a3c }, P.wounded, 0);
      this.cast.wounded.g.rotation.z = Math.PI / 2; this.cast.wounded.g.position.y += 0.3;
      castMk("keeper", { robe: 0x7a6a50, sash: 0xa04a2a, wrap: 0xe6dac2, skin: 0x8a5a3c }, [P.inn[0] + 4, P.inn[1] - 5], 3.0);
      for (let i = 0; i < 4; i++) castMk("friend" + i, { robe: [0x7a5a40, 0x4a6a7a, 0x8a7a5a, 0x6a4a5a][i], sash: 0xd0b070, wrap: 0xe2d5bc, skin: 0x8a5a3c }, [P.peter[0] - 3 + i * 1.6, P.peter[1] + 3], 3.14);
      this.stretcher = new T.Mesh(new T.BoxGeometry(0.8, 0.2, 2.1), new T.MeshStandardMaterial({ color: 0xd8c8a4 }));
      this.stretcher.position.set(P.peter[0] - 0.6, 0.8 + height(P.peter[0], P.peter[1] + 3), P.peter[1] + 3); this.stretcher.castShadow = true; this.scene.add(this.stretcher);
      this.sheep = this.makeSheep(); this.sheep.visible = false; this.scene.add(this.sheep);
      for (let i = 0; i < 6; i++) { const s = this.makeSheep(); s.position.set(P.shepherd[0] - 6 + (i % 3) * 3, 0, P.shepherd[1] + 4 + Math.floor(i / 3) * 2.5); s.position.y = height(s.position.x, s.position.z); s.rotation.y = i; this.scene.add(s); }
      this.crowd = this.makeCrowd(); this.crowd.visible = this.save.done.includes("loaves"); this.scene.add(this.crowd);

      // markers and scrolls
      this.markerGroup = new T.Group(); this.scene.add(this.markerGroup);
      this.objMarker = this.makeMarker(0xffd56b, 2.2); this.objMarker.visible = false; this.scene.add(this.objMarker);
      this.missionMarkers = MISSIONS.map((m) => { const mk = this.makeMarker(0xE2A85A, 1.6); mk.position.set(m.at[0], height(m.at[0], m.at[1]) + (m.id === "nets" ? DOCK.y + 0.3 : 0), m.at[1]); this.markerGroup.add(mk); return mk; });
      this.scrollMeshes = SCROLLS.map((s, i) => {
        const grp = new T.Group();
        const sc = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.9, 12), new T.MeshStandardMaterial({ color: 0xe8d6a8, emissive: 0x6a4a10, emissiveIntensity: 0.5 }));
        sc.rotation.z = Math.PI / 2; grp.add(sc);
        const glow = new T.Mesh(new T.SphereGeometry(0.9, 16, 12), new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.18, depthWrite: false }));
        grp.add(glow);
        grp.position.set(s[2], height(s[2], s[3]) + 1.2, s[3]); grp.visible = !this.save.scrolls.includes(i);
        this.scene.add(grp); return grp;
      });
      progress(0.92); await step();

      // place the player
      const start = this.save.pos || [TOWN[0] + 6, TOWN[1] + 4];
      this.player.g.position.set(start[0], height(start[0], start[1]), start[1]);
      this.buildMinimapImage();
      this.buildHud();
      this.bindInput();
      this.refreshMissionMarkers();
      this.resize = () => { this.renderer.setSize(innerWidth, innerHeight); this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); };
      window.addEventListener("resize", this.resize);
      this.clock = new T.Clock();
      this.updateSky(0);
      this.renderer.render(this.scene, this.camera);
      progress(1);
    }

    // ---------- builders ----------
    // A person built like a real body: lathe-turned robe over walking legs,
    // shoulders, two-part arms with hands, neck, an oval head with eyes, brows,
    // nose, ears, mouth, hair and (for men) a beard. Faces switch off at a distance.
    mat(color, rough) { this._mats = this._mats || {}; const k = color + ":" + (rough || 0.9); return this._mats[k] || (this._mats[k] = new THREE.MeshStandardMaterial({ color, roughness: rough || 0.9 })); }
    personGeo() {
      if (this._pg) return this._pg;
      const T = THREE; const V = (x, y) => new T.Vector2(x, y);
      const robe = new T.LatheGeometry([V(0.001, 0.2), V(0.31, 0.21), V(0.29, 0.42), V(0.255, 0.72), V(0.215, 0.98), V(0.235, 1.18), V(0.255, 1.33), V(0.235, 1.42), V(0.16, 1.48), V(0.07, 1.505), V(0.001, 1.51)], 22);
      const pos = robe.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const a = Math.atan2(z, x); const fold = y < 1.0 ? (1 - y) * 0.05 * Math.sin(a * 7) : 0; const r = Math.hypot(x, z); if (r > 0.01) { const k = (r + fold) / r; pos.setX(i, x * k); pos.setZ(i, z * k * 0.74); } }
      robe.computeVertexNormals();
      const veil = new T.LatheGeometry([V(0.001, 0.205), V(0.135, 0.2), V(0.15, 0.12), V(0.155, 0.02), V(0.2, -0.12), V(0.27, -0.3), V(0.3, -0.62)], 18, Math.PI * 0.25, Math.PI * 1.5);
      return (this._pg = {
        robe, veil,
        sash: new T.TorusGeometry(0.22, 0.035, 6, 20).rotateX(Math.PI / 2).scale(1, 1, 0.74),
        shoulder: new T.SphereGeometry(0.1, 10, 8),
        upper: new T.CylinderGeometry(0.068, 0.072, 0.3, 8).translate(0, -0.15, 0),
        fore: new T.CylinderGeometry(0.088, 0.058, 0.27, 8).translate(0, -0.135, 0),
        hand: new T.SphereGeometry(0.048, 8, 6).scale(0.85, 1.25, 0.6),
        thigh: new T.CylinderGeometry(0.075, 0.06, 0.74, 8).translate(0, -0.37, 0),
        sandal: new T.BoxGeometry(0.1, 0.045, 0.24),
        neck: new T.CylinderGeometry(0.052, 0.06, 0.12, 10),
        head: new T.SphereGeometry(0.112, 18, 14).scale(0.9, 1.12, 1),
        jaw: new T.SphereGeometry(0.085, 14, 10).scale(1, 0.85, 1),
        ear: new T.SphereGeometry(0.026, 8, 6).scale(0.5, 1.2, 0.9),
        eyeW: new T.SphereGeometry(0.017, 10, 8).scale(1.3, 0.75, 0.6),
        eyeP: new T.SphereGeometry(0.0095, 8, 6),
        brow: new T.BoxGeometry(0.042, 0.009, 0.012),
        nose: new T.ConeGeometry(0.019, 0.05, 6).rotateX(-Math.PI / 2 - 0.35),
        mouth: new T.BoxGeometry(0.038, 0.007, 0.01),
        hair: new T.SphereGeometry(0.122, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.36).scale(0.94, 1.1, 1.04),
        hairBack: new T.SphereGeometry(0.121, 16, 12, Math.PI * 1.02, Math.PI * 0.96, Math.PI * 0.2, Math.PI * 0.48).scale(0.95, 1.1, 1.05),
        beard: new T.SphereGeometry(0.098, 14, 10, Math.PI * 0.1, Math.PI * 0.8, Math.PI * 0.42, Math.PI * 0.5),
        cap: new T.SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.42).scale(0.96, 1.05, 1.06),
        tail: new T.CylinderGeometry(0.1, 0.17, 0.4, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8),
      });
    }
    makePerson(o) {
      const T = THREE; const G = this.personGeo(); const g = new T.Group(); const s = o.scale || 1;
      const veiled = !!o.veil, child = s < 0.85, beard = o.beard != null ? o.beard : !veiled && !child;
      const robe = this.mat(o.robe, 0.95), skin = this.mat(o.skin, 0.65), wrap = this.mat(o.wrap, 0.95), sash = this.mat(o.sash);
      const hairC = this.mat(o.hair != null ? o.hair : 0x1e1510, 1), dark = this.mat(0x120c08, 0.4), white = this.mat(0xeee6da, 0.4), lip = this.mat(0x5a2e22, 0.7), leather = this.mat(0x4a3424, 1);
      const add = (parent, geo, m, x, y, z, shadow) => { const mesh = new T.Mesh(geo, m); mesh.position.set(x || 0, y || 0, z || 0); if (shadow) mesh.castShadow = true; parent.add(mesh); return mesh; };
      const rig = new T.Group(); g.add(rig);
      // legs (pivot at the hip)
      const leg = (side) => { const p = new T.Group(); p.position.set(0.1 * side, 0.94, 0); rig.add(p); add(p, G.thigh, skin, 0, 0, 0); add(p, G.sandal, leather, 0, -0.74, 0.05, true); return p; };
      const legL = leg(-1), legR = leg(1);
      const body = add(rig, G.robe, robe, 0, 0, 0, true);
      add(rig, G.sash, sash, 0, 0.98, 0);
      for (const sd of [-1, 1]) { const sh = add(rig, G.shoulder, robe, 0.19 * sd, 1.42, 0, true); sh.scale.set(1, 0.8, 0.85); }
      // arms: shoulder pivot, elbow pivot, sleeve flares at the wrist
      const arm = (side) => { const p = new T.Group(); p.position.set(0.235 * side, 1.42, 0); p.rotation.z = 0.08 * side; rig.add(p); add(p, G.upper, robe, 0, 0, 0, true); const el = new T.Group(); el.position.y = -0.3; el.rotation.x = -0.22; p.add(el); add(el, G.fore, robe, 0, 0, 0, true); add(el, G.hand, skin, 0, -0.31, 0.005); p.elbow = el; return p; };
      const armL = arm(-1), armR = arm(1);
      add(rig, G.neck, skin, 0, 1.53, 0.005);
      const head = new T.Group(); head.position.set(0, 1.66, 0.01); rig.add(head);
      add(head, G.head, skin, 0, 0.02, 0, true);
      add(head, G.jaw, skin, 0, -0.045, 0.022);
      const face = new T.Group(); head.add(face);
      for (const sd of [-1, 1]) {
        add(face, G.ear, skin, 0.1 * sd, 0.01, -0.005);
        add(face, G.eyeW, white, 0.037 * sd, 0.03, 0.093);
        add(face, G.eyeP, dark, 0.037 * sd, 0.03, 0.102);
        const b = add(face, G.brow, hairC, 0.038 * sd, 0.058, 0.098); b.rotation.z = -0.12 * sd;
      }
      add(face, G.nose, skin, 0, 0.0, 0.112);
      add(face, G.mouth, beard ? dark : lip, 0, -0.045, 0.097);
      if (veiled) { add(head, G.cap, wrap, 0, 0.025, -0.008, true); const v = add(head, G.veil, wrap, 0, -0.18, -0.01, true); v.material = wrap; wrap.side = T.DoubleSide; }
      else {
        add(head, G.hair, hairC, 0, 0.03, -0.012); add(head, G.hairBack, hairC, 0, 0.03, -0.012);
        if (o.headcloth !== false && !child && (o.headcloth || (o.robe + o.skin) % 3 === 0)) { add(head, G.cap, wrap, 0, 0.035, -0.01, true); const t = add(head, G.tail, wrap, 0, -0.12, -0.02, true); t.material = wrap; wrap.side = T.DoubleSide; }
      }
      if (beard) { const bd = add(head, G.beard, hairC, 0, -0.04, 0.012); bd.scale.set(1.04, 1.15, 1.08); }
      if (o.staff) { const st = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 2.0, 6), this.mat(0x5a4028)); st.position.set(0, -0.3, 0.05); st.castShadow = true; armR.elbow.add(st); armR.rotation.x = -0.25; armR.elbow.rotation.x = -0.9; }
      g.scale.setScalar(s);
      return { g, rig, armL, armR, legL, legR, body, face, head, t: Math.random() * 6, staff: !!o.staff };
    }
    animatePerson(p, speed, dt) {
      p.t += dt * (2 + speed * 2.1);
      const k = Math.min(1, speed / 3), sw = Math.sin(p.t);
      if (!p.holdArms) { p.armL.rotation.x = sw * k * 0.55; if (!p.staff) p.armR.rotation.x = -sw * k * 0.55; p.armL.elbow.rotation.x = -0.22 - k * 0.25; }
      p.legL.rotation.x = -sw * k * 0.5; p.legR.rotation.x = sw * k * 0.5;
      p.rig.position.y = Math.abs(Math.cos(p.t)) * 0.03 * k;
      p.rig.rotation.y = sw * k * 0.05;
      if (k < 0.05) { p.rig.position.y = Math.sin(p.t * 0.6) * 0.004; p.head.rotation.y = Math.sin(p.t * 0.21) * 0.25; } else p.head.rotation.y *= 0.9;
    }
    makeSheep() {
      const T = THREE; const g = new T.Group();
      const wool = new T.MeshStandardMaterial({ color: 0xece4d4, roughness: 1 }), dark = new T.MeshStandardMaterial({ color: 0x2e2620 });
      const b = new T.Mesh(new T.IcosahedronGeometry(0.55, 1), wool); b.scale.set(1.3, 0.9, 0.95); b.position.y = 0.7; g.add(b);
      const h = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), dark); h.scale.set(0.9, 1, 1.3); h.position.set(0.75, 0.85, 0); g.add(h);
      for (const [x, z] of [[0.4, 0.25], [0.4, -0.25], [-0.4, 0.25], [-0.4, -0.25]]) { const l = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.42, 6), dark); l.position.set(x, 0.21, z); g.add(l); }
      g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
      return g;
    }
    makeDonkey() {
      const T = THREE; const g = new T.Group(); const c = new T.MeshStandardMaterial({ color: 0x6e6256, roughness: 1 }), d = new T.MeshStandardMaterial({ color: 0x3a3029 });
      const body = new T.Mesh(new T.CylinderGeometry(0.42, 0.45, 1.5, 12), c); body.rotation.z = Math.PI / 2; body.position.y = 1.05; g.add(body);
      for (const x of [-0.75, 0.75]) { const e = new T.Mesh(new T.SphereGeometry(0.44, 12, 8), c); e.position.set(x, 1.05, 0); g.add(e); }
      const neck = new T.Mesh(new T.CylinderGeometry(0.17, 0.24, 0.8, 8), c); neck.position.set(1.05, 1.45, 0); neck.rotation.z = -0.7; g.add(neck);
      const head = new T.Mesh(new T.BoxGeometry(0.62, 0.3, 0.3), c); head.position.set(1.42, 1.72, 0); head.rotation.z = -0.35; g.add(head);
      for (const z of [-0.08, 0.08]) { const ear = new T.Mesh(new T.ConeGeometry(0.06, 0.34, 6), c); ear.position.set(1.3, 2.0, z); ear.rotation.z = 0.2; g.add(ear); }
      const legs = []; for (const [x, z] of [[0.6, 0.22], [0.6, -0.22], [-0.6, 0.22], [-0.6, -0.22]]) { const l = new T.Mesh(new T.CylinderGeometry(0.08, 0.06, 0.85, 6), d); l.position.set(x, 0.42, z); g.add(l); legs.push(l); }
      const blanket = new T.Mesh(new T.BoxGeometry(0.9, 0.08, 1.0), new T.MeshStandardMaterial({ color: 0xa8362a })); blanket.position.set(0, 1.47, 0); g.add(blanket);
      g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
      g.legs = legs; g.t = 0;
      return g;
    }
    makeBoat() {
      const T = THREE; const g = new T.Group();
      const shape = new T.Shape(); shape.moveTo(-3.2, 0); shape.quadraticCurveTo(-2.4, 1.1, 0, 1.15); shape.quadraticCurveTo(2.4, 1.1, 3.4, 0); shape.quadraticCurveTo(2.4, -1.1, 0, -1.15); shape.quadraticCurveTo(-2.4, -1.1, -3.2, 0);
      const hull = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: 0.9, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.2, bevelSegments: 2 }), new T.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.85 }));
      hull.rotation.x = Math.PI / 2; hull.position.y = 0.75; g.add(hull);
      const inside = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false }), new T.MeshStandardMaterial({ color: 0x8a6a48 })); inside.rotation.x = Math.PI / 2; inside.scale.set(0.88, 0.82, 1); inside.position.y = 0.55; g.add(inside);
      const mast = new T.Mesh(new T.CylinderGeometry(0.07, 0.09, 5.2, 8), new T.MeshStandardMaterial({ color: 0x5a3e28 })); mast.position.set(0.6, 3.2, 0); g.add(mast);
      const sail = new T.Mesh(new T.PlaneGeometry(2.6, 3.4, 6, 6), new T.MeshStandardMaterial({ color: 0xe9dcc0, side: T.DoubleSide, roughness: 1 })); sail.position.set(0.6, 3.4, 0.05); sail.rotation.y = Math.PI / 2; g.add(sail); g.sail = sail;
      const net = new T.Mesh(new T.SphereGeometry(1.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xc9b98f, wireframe: true, transparent: true, opacity: 0.8 })); net.rotation.x = Math.PI; net.position.set(-1.6, -0.2, 2.6); net.visible = false; g.add(net); g.net = net;
      const fish = new T.Group(); const fm = new T.MeshStandardMaterial({ color: 0xb8c4c8, metalness: 0.6, roughness: 0.3 });
      for (let i = 0; i < 40; i++) { const f = new T.Mesh(new T.SphereGeometry(0.12, 6, 4), fm); f.scale.set(2.2, 0.6, 0.8); f.position.set(-1.5 + Math.random() * 3, 0.8 + Math.random() * 0.25, -0.6 + Math.random() * 1.2); f.rotation.y = Math.random() * 3; fish.add(f); }
      fish.visible = false; g.add(fish); g.fish = fish;
      g.traverse((m) => { if (m.isMesh && m !== net) { m.castShadow = true; m.receiveShadow = true; } });
      return g;
    }
    makeMarker(color, r) {
      const T = THREE; const g = new T.Group();
      const beam = new T.Mesh(new T.CylinderGeometry(r, r, 6, 32, 1, true), new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      beam.position.y = 3; g.add(beam);
      const ring = new T.Mesh(new T.RingGeometry(r * 0.85, r, 40), new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring);
      g.beam = beam; g.ring = ring;
      return g;
    }
    makeCrowd() {
      const T = THREE; const n = 420; const g = new T.Group();
      const bodies = new T.InstancedMesh(new T.ConeGeometry(0.42, 1.0, 8), new T.MeshStandardMaterial({ roughness: 1 }), n);
      const heads = new T.InstancedMesh(new T.SphereGeometry(0.17, 8, 6), new T.MeshStandardMaterial({ color: 0x7a4e34 }), n);
      const m = new T.Matrix4(), c = new T.Color(); const r = rnd(77); const ROBES = [0x9a6b4a, 0xc7b89a, 0x6d7f8f, 0x8a5070, 0x5e6b4a, 0xb9a27a, 0x7b4a3a, 0xe0d4bc];
      for (let i = 0; i < n; i++) {
        const a = -0.9 + r() * 1.8, rr = 10 + r() * 42; const x = P.crowd[0] + Math.sin(a) * rr, z = P.crowd[1] - Math.cos(a) * rr * 0.7 - 8;
        const y = height(x, z);
        m.makeTranslation(x, y + 0.5, z); bodies.setMatrixAt(i, m); bodies.setColorAt(i, c.setHex(ROBES[Math.floor(r() * ROBES.length)]));
        m.makeTranslation(x, y + 1.15, z); heads.setMatrixAt(i, m);
      }
      bodies.castShadow = true; g.add(bodies, heads);
      // twelve baskets of fragments
      g.baskets = [];
      for (let i = 0; i < 12; i++) {
        const a = -0.8 + (i / 11) * 1.6 + (r() - 0.5) * 0.1, rr = 16 + r() * 30; const x = P.crowd[0] + Math.sin(a) * rr, z = P.crowd[1] - Math.cos(a) * rr * 0.7 - 8;
        const b = new T.Group(); const bk = new T.Mesh(new T.CylinderGeometry(0.45, 0.32, 0.5, 12), new T.MeshStandardMaterial({ color: 0xa8824e })); bk.position.y = 0.25; b.add(bk);
        const bread = new T.Mesh(new T.SphereGeometry(0.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xd9a35c })); bread.position.y = 0.45; b.add(bread);
        const glow = new T.Mesh(new T.SphereGeometry(1.1, 12, 8), new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.18, depthWrite: false })); glow.position.y = 0.4; b.add(glow);
        b.position.set(x, height(x, z), z); b.visible = false; g.add(b); g.baskets.push(b);
      }
      return g;
    }
    box(x, z, w, d, h, color, rotY) {
      const T = THREE; const y = height(x, z);
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color, roughness: 0.93 }));
      m.position.set(x, y + h / 2 - 0.05, z); m.rotation.y = rotY || 0; m.castShadow = m.receiveShadow = true; this.scene.add(m);
      return m;
    }
    buildTown() {
      const T = THREE; const r = rnd(11);
      const STONE = [0xc2a984, 0xb39770, 0xcdb48e, 0xa88d68, 0xbfa27a];
      const reserved = [P.peter, P.market, [-30, 6], P.stable, [30, 8], TOWN];
      this.lamps = [];
      const lampMat = new T.MeshBasicMaterial({ color: 0xffc46b });
      const house = (x, z, w, d, h, color, opts) => {
        opts = opts || {};
        const m = this.box(x, z, w, d, h, color);
        const y = height(x, z);
        const par = new T.Mesh(new T.BoxGeometry(w + 0.25, 0.35, d + 0.25), new T.MeshStandardMaterial({ color: 0xe6d9bd, roughness: 0.9 })); par.position.set(x, y + h + 0.1, z); par.castShadow = true; this.scene.add(par);
        const door = new T.Mesh(new T.BoxGeometry(1.2, 2.1, 0.1), new T.MeshStandardMaterial({ color: 0x4a3222 })); door.position.set(x, y + 1.05, z + d / 2 + 0.03); this.scene.add(door);
        for (const s of [-1, 1]) { const win = new T.Mesh(new T.BoxGeometry(0.5, 0.6, 0.06), new T.MeshStandardMaterial({ color: 0x2e2218 })); win.position.set(x + s * w * 0.3, y + h * 0.66, z + d / 2 + 0.03); this.scene.add(win); }
        if (r() < 0.55 || opts.lamp) { const l = new T.Mesh(new T.SphereGeometry(0.13, 8, 6), lampMat); l.position.set(x + 0.9, y + 2.3, z + d / 2 + 0.25); this.scene.add(l); const halo = new T.Mesh(new T.SphereGeometry(0.9, 10, 8), new T.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); halo.position.copy(l.position); this.scene.add(halo); this.lamps.push(halo); }
        if (opts.stairs) {
          for (let i = 0; i < 10; i++) { const st = new T.Mesh(new T.BoxGeometry(1.2, 0.4, 0.9), new T.MeshStandardMaterial({ color: 0xc8b58e })); st.position.set(x + w / 2 + 0.65, y + 0.2 + i * (h / 10), z + d / 2 - 0.5 - i * 0.82); st.scale.y = 1 + i * 0.02; st.castShadow = true; this.scene.add(st); }
        }
        if (r() < 0.3) { const awn = new T.Mesh(new T.PlaneGeometry(w * 0.7, 2), new T.MeshStandardMaterial({ color: [0xa8362a, 0x2e5a6a, 0xc99a3a][Math.floor(r() * 3)], side: T.DoubleSide })); awn.position.set(x, y + h + 0.8, z); awn.rotation.x = -Math.PI / 2 + 0.15; this.scene.add(awn); }
        this.colliders.push({ x0: x - w / 2 - 0.4, x1: x + w / 2 + 0.4, z0: z - d / 2 - 0.4, z1: z + d / 2 + 0.4 });
        return m;
      };
      for (let gx = -40; gx <= 32; gx += 11) for (let gz = -38; gz <= 38; gz += 11) {
        const x = gx + (r() - 0.5) * 3, z = gz + (r() - 0.5) * 3;
        if (Math.hypot(x - TOWN[0], z - TOWN[1]) > 42) continue;
        if (roadDist(x, z) < 7.5) continue;
        if (reserved.some((p) => Math.hypot(x - p[0], z - p[1]) < 10)) continue;
        if (Math.hypot(x - TOWN[0], z - TOWN[1]) < 9) continue;
        house(x, z, 5.5 + r() * 3.5, 5.5 + r() * 3, 3.2 + r() * 2.4, STONE[Math.floor(r() * STONE.length)]);
      }
      // the synagogue
      const syn = house(-31, 6, 14, 10, 7.5, 0xe8dcc0, { lamp: true });
      for (let i = 0; i < 5; i++) { const col = new T.Mesh(new T.CylinderGeometry(0.35, 0.4, 6.4, 12), new T.MeshStandardMaterial({ color: 0xf0e6d0 })); col.position.set(-36.5 + i * 2.75, height(-31, 12) + 3.2, 11.6); col.castShadow = true; this.scene.add(col); }
      void syn;
      // Peter's house with outside stairs to the roof
      house(P.peter[0], P.peter[1] - 5, 9, 8, 4.4, 0xd2c09c, { stairs: true, lamp: true });
      // stable for the donkey
      const stab = this.box(P.stable[0] - 3, P.stable[1], 5, 4, 2.6, 0x9a7a52); stab.material.color.setHex(0x8a6a48);
      this.colliders.push({ x0: P.stable[0] - 5.9, x1: P.stable[0] - 0.1, z0: P.stable[1] - 2.4, z1: P.stable[1] + 2.4 });
      // market stalls
      const CL = [0xa8362a, 0x2e5a6a, 0xc99a3a, 0x6a4a7a, 0x4a6a3a];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, x = P.market[0] + Math.cos(a) * 7, z = P.market[1] + Math.sin(a) * 6;
        const y = height(x, z);
        const table = new T.Mesh(new T.BoxGeometry(2.4, 0.9, 1.2), new T.MeshStandardMaterial({ color: 0x7a5636 })); table.position.set(x, y + 0.45, z); table.rotation.y = -a; table.castShadow = true; this.scene.add(table);
        const cloth = new T.Mesh(new T.BoxGeometry(2.8, 0.06, 1.8), new T.MeshStandardMaterial({ color: CL[i % CL.length] })); cloth.position.set(x, y + 2.3, z); cloth.rotation.y = -a; cloth.rotation.z = 0.12; cloth.castShadow = true; this.scene.add(cloth);
        for (const s of [-1, 1]) { const pole = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.3, 6), new T.MeshStandardMaterial({ color: 0x4a3222 })); pole.position.set(x + Math.cos(-a) * 1.3 * s, y + 1.15, z + Math.sin(-a) * -1.3 * s); this.scene.add(pole); }
        const goods = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), new T.MeshStandardMaterial({ color: [0xd9a35c, 0x8aa04a, 0xc0503a, 0xe8c068][i % 4] })); goods.scale.set(2.5, 0.8, 1.4); goods.position.set(x, y + 1.0, z); this.scene.add(goods);
        this.colliders.push({ x0: x - 1.4, x1: x + 1.4, z0: z - 1.0, z1: z + 1.0 });
      }
      // the inn on the south road
      house(P.inn[0], P.inn[1], 12, 9, 5.2, 0xc9b28a, { lamp: true });
      const well = new T.Mesh(new T.CylinderGeometry(1.2, 1.3, 0.9, 16), new T.MeshStandardMaterial({ color: 0xbfae8c })); well.position.set(TOWN[0], height(TOWN[0], TOWN[1]) + 0.45, TOWN[1]); well.castShadow = true; this.scene.add(well);
      this.colliders.push({ x0: TOWN[0] - 1.5, x1: TOWN[0] + 1.5, z0: TOWN[1] - 1.5, z1: TOWN[1] + 1.5 });
    }
    buildNature() {
      const T = THREE; const r = rnd(5);
      const spots = [];
      for (let i = 0; i < 520; i++) {
        const x = (r() - 0.5) * SIZE * 0.95, z = (r() - 0.5) * SIZE * 0.95;
        const h = height(x, z);
        if (h < 0.6 || x > shoreX(z) - 3) continue;
        if (Math.hypot(x - TOWN[0], z - TOWN[1]) < 46) continue;
        if (roadDist(x, z) < 4.5) continue;
        if (h > 22 && r() < 0.6) continue;
        spots.push([x, z, h]);
      }
      const n = spots.length;
      const trunks = new T.InstancedMesh(new T.CylinderGeometry(0.18, 0.32, 2.2, 7), new T.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 }), n);
      const crowns = new T.InstancedMesh(new T.IcosahedronGeometry(1.5, 1), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), n * 2);
      const m = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), p = new T.Vector3(), c = new T.Color(), e = new T.Euler();
      spots.forEach(([x, z, h], i) => {
        const k = 0.7 + r() * 0.8;
        e.set((r() - 0.5) * 0.25, r() * 6, (r() - 0.5) * 0.25); q.setFromEuler(e);
        m.compose(p.set(x, h + 1.0 * k, z), q, s.set(k, k, k)); trunks.setMatrixAt(i, m);
        for (let j = 0; j < 2; j++) {
          m.compose(p.set(x + (r() - 0.5) * 1.4 * k, h + (2.3 + j * 0.7) * k, z + (r() - 0.5) * 1.4 * k), q, s.set(k * (1.1 - j * 0.25), k * 0.75, k * (1.1 - j * 0.25)));
          crowns.setMatrixAt(i * 2 + j, m); crowns.setColorAt(i * 2 + j, c.setHex([0x7d8a5e, 0x6e7c52, 0x8f9a6a, 0x66744c][Math.floor(r() * 4)]));
        }
      });
      trunks.castShadow = crowns.castShadow = true; crowns.receiveShadow = true;
      this.scene.add(trunks, crowns);
      // palms along the shore
      for (let i = 0; i < 26; i++) {
        const z = -140 + i * 11 + (r() - 0.5) * 6, x = shoreX(z) - 9 - r() * 8; if (Math.abs(z - 10) < 6) continue;
        const h = height(x, z); const g = new T.Group(); g.position.set(x, h, z);
        const tr = new T.Mesh(new T.CylinderGeometry(0.16, 0.26, 7, 7), new T.MeshStandardMaterial({ color: 0x7a6248 })); tr.position.y = 3.5; tr.rotation.z = (r() - 0.5) * 0.25; g.add(tr);
        for (let k = 0; k < 7; k++) { const f = new T.Mesh(new T.ConeGeometry(0.35, 3.6, 4), new T.MeshStandardMaterial({ color: 0x5e7a3e, flatShading: true })); f.position.set(0, 7, 0); f.rotation.set(0, (k / 7) * Math.PI * 2, 1.9); f.translateY(1.6); g.add(f); }
        g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); this.scene.add(g);
      }
      // rocks
      const rocks = new T.InstancedMesh(new T.DodecahedronGeometry(0.9, 0), new T.MeshStandardMaterial({ color: 0xa0937e, roughness: 1, flatShading: true }), 160);
      for (let i = 0; i < 160; i++) { let x, z; do { x = (r() - 0.5) * SIZE * 0.9; z = (r() - 0.5) * SIZE * 0.9; } while (x > shoreX(z) - 2 || Math.hypot(x - TOWN[0], z - TOWN[1]) < 45 || roadDist(x, z) < 4); const k = 0.4 + r() * 1.4; e.set(r() * 3, r() * 3, r() * 3); q.setFromEuler(e); m.compose(p.set(x, height(x, z) + k * 0.3, z), q, s.set(k, k * 0.7, k)); rocks.setMatrixAt(i, m); }
      rocks.castShadow = rocks.receiveShadow = true; this.scene.add(rocks);
      // birds
      this.birds = [];
      const bm = new T.MeshBasicMaterial({ color: 0x2e2a28, side: T.DoubleSide });
      for (let i = 0; i < 9; i++) { const b = new T.Mesh(new T.BufferGeometry().setFromPoints([new T.Vector3(-0.6, 0, 0.2), new T.Vector3(0, 0, 0), new T.Vector3(0.6, 0, 0.2)]), bm); const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.Float32BufferAttribute([-0.7, 0, 0.2, 0, 0, -0.15, 0, 0, 0.15, 0.7, 0, 0.2, 0, 0, -0.15, 0, 0, 0.15], 3)); b.geometry = geo; b.userData = { a: r() * 6, r: 20 + r() * 50, h: 22 + r() * 18, s: 0.15 + r() * 0.15, cx: (r() - 0.3) * 120, cz: (r() - 0.5) * 160 }; this.scene.add(b); this.birds.push(b); }
    }

    buildMinimapImage() {
      const N = 512; const c = document.createElement("canvas"); c.width = c.height = N; const x = c.getContext("2d");
      const img = x.createImageData(N, N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const wx = (i / N - 0.5) * SIZE, wz = (j / N - 0.5) * SIZE; const h = height(wx, wz); const k = (j * N + i) * 4;
        let col;
        if (h < WATER_Y) col = [46, 98, 116]; else if (roadDist(wx, wz) < 2.4) col = [214, 196, 160]; else if (Math.hypot(wx - TOWN[0], wz - TOWN[1]) < 40) col = [206, 190, 156]; else { const t = clamp(h / 26, 0, 1); col = [128 + t * 40, 132 + t * 18, 82 + t * 40]; }
        img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2]; img.data[k + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      x.fillStyle = "rgba(120,100,70,0.75)"; for (const b of this.colliders) { const f = (v) => (v / SIZE + 0.5) * N; x.fillRect(f(b.x0), f(b.z0), f(b.x1) - f(b.x0), f(b.z1) - f(b.z0)); }
      this.mapImg = c;
    }

    // ---------- HUD ----------
    buildHud() {
      const h = document.createElement("div"); h.className = "wy-hud"; h.id = "wyHud";
      h.innerHTML = `
        <div class="wy-top">
          <a class="wy-btn" href="#/" aria-label="Exit the game">${icon("close")}</a>
          <div class="wy-obj" id="wyObj" aria-live="polite"></div>
          <div class="wy-stat"><div class="wy-stars" id="wyStars" aria-label="Faith stars"></div><div class="wy-clock" id="wyClock"></div></div>
        </div>
        <div class="wy-tools">
          <button class="wy-btn" id="wyMapB" aria-label="Map">${icon("pin")}</button>
          <button class="wy-btn" id="wyCam" aria-label="Photo mode">${icon("camera")}</button>
          <button class="wy-btn" id="wyMus" aria-label="Psalm radio" aria-pressed="${this.save.music}">${icon(this.save.music ? "listen" : "mute")}</button>
          <button class="wy-btn" id="wyMenu" aria-label="Menu">${icon("gear")}</button>
        </div>
        <canvas class="wy-mini" id="wyMini" width="300" height="300" aria-label="Minimap, tap for the full map"></canvas>
        <div class="wy-joy" id="wyJoy" hidden><span></span></div>
        <div class="wy-pads">
          <button class="wy-pad act idle" id="wyAct" aria-disabled="true"><span id="wyActL">Action</span></button>
          <button class="wy-pad jump" id="wyJump" aria-label="Jump">${icon("chev")}</button>
          <button class="wy-pad run" id="wyRun" aria-label="Run">RUN</button>
        </div>
        <div class="wy-sub" id="wySub" hidden><b id="wySubN"></b><span id="wySubT"></span><em>Tap to continue</em></div>
        <div class="wy-toast" id="wyToast" hidden></div>
        <div class="wy-bars" id="wyBars"><i></i><i></i></div>
        <div class="wy-hold" id="wyHold" hidden><span id="wyHoldBar"></span><b id="wyHoldL"></b></div>
        <div class="wy-meter" id="wyMeter" hidden><span id="wyMeterL"></span><div><i id="wyMeterBar"></i></div></div>`;
      this.root.appendChild(h);
      this.hud = h;
      this.mini = W.$("#wyMini", h).getContext("2d");
      this.drawStars();
    }
    drawStars() { const n = this.save.done.length; W.$("#wyStars", this.hud).innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? "on" : ""}">★</i>`).join(""); }
    objective(text) { const o = W.$("#wyObj", this.hud); o.textContent = text || ""; o.classList.toggle("show", !!text); }
    toast(text, ms) { const t = W.$("#wyToast", this.hud); t.innerHTML = text; t.hidden = false; t.classList.remove("in"); void t.offsetWidth; t.classList.add("in"); clearTimeout(this._tt); this._tt = setTimeout(() => (t.hidden = true), ms || 3400); }
    cinema(on) { this.cine = on; this.hud.classList.toggle("cine", on); }
    say(lines) {
      return new Promise((res) => {
        const box = W.$("#wySub", this.hud); let i = 0;
        const show = () => { if (i >= lines.length) { box.hidden = true; box.onclick = null; this.talking = false; res(); return; } W.$("#wySubN", box).textContent = lines[i][0]; W.$("#wySubT", box).textContent = lines[i][1]; box.hidden = false; box.classList.remove("in"); void box.offsetWidth; box.classList.add("in"); };
        this.talking = true; this.advance = () => { i++; show(); };
        box.onclick = () => this.advance();
        show();
      });
    }
    hold(label, secs) {
      return new Promise((res) => { this.holdTask = { label, secs, t: 0, res }; const h = W.$("#wyHold", this.hud); h.hidden = false; W.$("#wyHoldL", h).textContent = label; h.dataset.hint = "Press and hold the gold “" + label + "” button"; W.$("#wyHoldBar", h).style.width = "0%"; });
    }
    meter(label, v) { const m = W.$("#wyMeter", this.hud); if (label == null) { m.hidden = true; return; } m.hidden = false; W.$("#wyMeterL", m).textContent = label; W.$("#wyMeterBar", m).style.width = clamp(v, 0, 1) * 100 + "%"; }

    deedDone(m) {
      return new Promise((res) => {
        this.sound.chime("pass");
        if (!this.save.done.includes(m.id)) this.save.done.push(m.id);
        this.persist(); this.drawStars();
        const d = document.createElement("div"); d.className = "wy-pass";
        d.innerHTML = `<div class="wy-pass-in"><span class="wy-pass-k">Deed done</span><h2>${esc(m.title)}</h2><p>“${esc(m.verse)}”</p><cite>${esc(m.ref)}</cite><span class="wy-pass-s">+1 Faith star · ${this.save.done.length} of 5</span><button class="wy-go small">Continue</button></div>`;
        this.root.appendChild(d);
        W.$("button", d).onclick = () => { d.classList.add("out"); setTimeout(() => d.remove(), 400); res(); };
        if (this.save.done.length === 5) setTimeout(() => this.toast("All five deeds done. Galilee is yours to wander.<br><small>Find the twelve scrolls.</small>", 6000), 600);
      });
    }

    // ---------- input ----------
    bindInput() {
      const el = this.renderer.domElement, hud = this.hud;
      const joyEl = W.$("#wyJoy", hud), knob = joyEl.firstElementChild;
      const R = 54;
      this.touches = {};
      const down = (e) => {
        if (e.target.closest && e.target.closest("button, a, .wy-mini, .wy-sub")) return;
        for (const t of e.changedTouches || [e]) {
          const id = t.identifier != null ? t.identifier : "m";
          if (t.clientX < innerWidth * 0.45 && !this.joy.active) {
            this.joy.active = true; this.joy.id = id; this.joy.ox = t.clientX; this.joy.oy = t.clientY;
            joyEl.hidden = false; joyEl.style.left = t.clientX + "px"; joyEl.style.top = t.clientY + "px"; knob.style.transform = "translate(-50%,-50%)";
            this.sound.ctx && this.sound.ctx.resume && this.sound.ctx.resume();
          } else this.touches[id] = { x: t.clientX, y: t.clientY };
        }
      };
      const move = (e) => {
        for (const t of e.changedTouches || [e]) {
          const id = t.identifier != null ? t.identifier : "m";
          if (this.joy.active && id === this.joy.id) {
            let dx = t.clientX - this.joy.ox, dy = t.clientY - this.joy.oy; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
            this.joy.x = dx / R; this.joy.y = dy / R; knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
          } else if (this.touches[id]) {
            const p = this.touches[id]; this.yaw -= (t.clientX - p.x) * 0.006; this.pitch = clamp(this.pitch + (t.clientY - p.y) * 0.004, 0.05, 1.15); p.x = t.clientX; p.y = t.clientY; this.lastLook = this.elapsed;
          }
        }
        if (e.cancelable && e.touches) e.preventDefault();
      };
      const up = (e) => {
        for (const t of e.changedTouches || [e]) {
          const id = t.identifier != null ? t.identifier : "m";
          if (this.joy.active && id === this.joy.id) { this.joy.active = false; this.joy.x = this.joy.y = 0; joyEl.hidden = true; }
          delete this.touches[id];
        }
      };
      el.addEventListener("touchstart", down, { passive: true }); this.root.addEventListener("touchmove", move, { passive: false }); this.root.addEventListener("touchend", up); this.root.addEventListener("touchcancel", up);
      let mouse = false;
      el.addEventListener("mousedown", (e) => { mouse = true; this.touches.m = { x: e.clientX, y: e.clientY }; });
      window.addEventListener("mousemove", this._mm = (e) => { if (mouse && this.touches.m) { const p = this.touches.m; this.yaw -= (e.clientX - p.x) * 0.005; this.pitch = clamp(this.pitch + (e.clientY - p.y) * 0.004, 0.05, 1.15); p.x = e.clientX; p.y = e.clientY; this.lastLook = this.elapsed; } });
      window.addEventListener("mouseup", this._mu = () => { mouse = false; delete this.touches.m; });
      el.addEventListener("wheel", (e) => { this.camDist = clamp(this.camDist + e.deltaY * 0.01, 4, 16); }, { passive: true });
      window.addEventListener("keydown", this._kd = (e) => {
        this.keys[e.code] = true;
        if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
        if (e.code === "KeyE" || e.code === "Enter") { if (this.talking) this.advance(); else this.doAction(); }
        if (e.code === "KeyM") this.openMap();
        if (e.code === "KeyP") this.photo();
        if (e.code === "Escape") this.menu();
        this.sound.ctx && this.sound.ctx.resume && this.sound.ctx.resume();
      });
      window.addEventListener("keyup", this._ku = (e) => { this.keys[e.code] = false; });
      const run = W.$("#wyRun", hud);
      const setRun = (v) => { this.running = v; run.classList.toggle("on", v); };
      run.addEventListener("touchstart", (e) => { e.preventDefault(); setRun(!this.running); }, { passive: false });
      run.addEventListener("click", () => setRun(!this.running));
      const jump = W.$("#wyJump", hud);
      const doJump = () => { if (this.grounded && this.mode === "walk" && !this.cine) { this.vy = 6.2; this.grounded = false; } };
      jump.addEventListener("touchstart", (e) => { e.preventDefault(); doJump(); }, { passive: false }); jump.addEventListener("click", doJump);
      const act = W.$("#wyAct", hud);
      act.addEventListener("touchstart", (e) => { e.preventDefault(); this.actDown = true; this.doAction(); }, { passive: false });
      act.addEventListener("touchend", () => { this.actDown = false; });
      act.addEventListener("mousedown", () => { this.actDown = true; this.doAction(); }); act.addEventListener("mouseup", () => { this.actDown = false; });
      W.$("#wyMini", hud).onclick = () => this.openMap();
      W.$("#wyMapB", hud).onclick = () => this.openMap();
      W.$("#wyCam", hud).onclick = () => this.photo();
      W.$("#wyMenu", hud).onclick = () => this.menu();
      const mus = W.$("#wyMus", hud);
      mus.onclick = () => { this.save.music = !this.save.music; this.sound.setMusic(this.save.music); mus.setAttribute("aria-pressed", this.save.music); mus.innerHTML = icon(this.save.music ? "listen" : "mute"); this.persist(); };
      document.addEventListener("visibilitychange", this._vis = () => { if (document.hidden) { this.persist(); this.sound.ctx && this.sound.ctx.suspend(); } else this.sound.ctx && this.sound.ctx.resume(); });
    }

    // ---------- start ----------
    async begin() {
      this.sound.start(this.save.music);
      this.running = false; this.elapsed = 0;
      this.loop = this.loop.bind(this);
      this.raf = requestAnimationFrame(this.loop);
      if (!this.save.seen) {
        this.save.seen = true; this.persist();
        this.cinema(true);
        this.fly = { t: 0, dur: 7 };
        this.toast("<b>Capernaum</b><br>by the Sea of Galilee", 5200);
        await new Promise((r) => setTimeout(r, 7000));
        this.fly = null; this.cinema(false);
        await this.say([["Galilee", "Five gold markers wait around Capernaum. Each one is a deed from the Gospels."], ["Galilee", "Walk with the left side of the screen. Look around with the right. Tap the map to set a waypoint."]]);
      }
      this.objective(this.save.done.length < 5 ? "Find a gold marker to begin a deed." : "Wander Galilee. " + (12 - this.save.scrolls.length) + " scrolls left to find.");
    }

    // ---------- the frame ----------
    loop() {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(this.loop);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.elapsed += dt;
      this.timeOfDay = (this.timeOfDay + dt * this.clockScale) % 1;
      this.updatePlayer(dt);
      this.updateWorld(dt);
      this.updateCamera(dt);
      this.updateSky(dt);
      this.updateHud(dt);
      this.renderer.render(this.scene, this.camera);
      if ((this._saveT = (this._saveT || 0) + dt) > 5) { this._saveT = 0; this.persist(); }
    }

    input() {
      let x = this.joy.x, y = this.joy.y;
      if (this.keys.KeyW || this.keys.ArrowUp) y = -1; if (this.keys.KeyS || this.keys.ArrowDown) y = 1;
      if (this.keys.KeyA || this.keys.ArrowLeft) x = -1; if (this.keys.KeyD || this.keys.ArrowRight) x = 1;
      const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
      return { x, y, m: Math.min(1, m), run: this.running || this.keys.ShiftLeft || this.keys.ShiftRight };
    }

    collide(nx, nz, r) {
      for (const b of this.colliders) {
        if (nx > b.x0 - r && nx < b.x1 + r && nz > b.z0 - r && nz < b.z1 + r) {
          const dl = nx - (b.x0 - r), dr = b.x1 + r - nx, du = nz - (b.z0 - r), dd = b.z1 + r - nz;
          const mn = Math.min(dl, dr, du, dd);
          if (mn === dl) nx = b.x0 - r; else if (mn === dr) nx = b.x1 + r; else if (mn === du) nz = b.z0 - r; else nz = b.z1 + r;
        }
      }
      return [nx, nz];
    }

    updatePlayer(dt) {
      const pl = this.player.g; const inp = this.cine || this.talking || this.frozen ? { x: 0, y: 0, m: 0, run: false } : this.input();
      const fwdX = -Math.sin(this.yaw), fwdZ = -Math.cos(this.yaw), rgtX = Math.cos(this.yaw), rgtZ = -Math.sin(this.yaw);
      let mx = (fwdX * -inp.y + rgtX * inp.x), mz = (fwdZ * -inp.y + rgtZ * inp.x);
      const speed = this.mode === "boat" ? 9 : this.mode === "donkey" ? (inp.run ? 13 : 8) : (inp.run ? 8.2 : 4.4);
      const carrying = this.carry ? 0.8 : 1;
      if (this.mode === "boat") {
        const b = this.boat;
        this.boatSpeed = lerp(this.boatSpeed || 0, inp.m * speed, dt * 1.5);
        if (inp.m > 0.1) { const target = Math.atan2(mx, mz); let d = target - b.rotation.y + Math.PI / 2; d = Math.atan2(Math.sin(d), Math.cos(d)); b.rotation.y += d * dt * 1.6; }
        const dirX = Math.sin(b.rotation.y - Math.PI / 2), dirZ = Math.cos(b.rotation.y - Math.PI / 2);
        let nx = b.position.x + dirX * this.boatSpeed * dt, nz = b.position.z + dirZ * this.boatSpeed * dt;
        if (height(nx, nz) > -1.2 || onDock(nx, nz) || Math.abs(nx) > SIZE * 0.85 || Math.abs(nz) > SIZE * 0.6) { nx = b.position.x; nz = b.position.z; this.boatSpeed *= 0.3; }
        b.position.set(nx, WATER_Y + Math.sin(this.elapsed * 1.6) * 0.06, nz); b.rotation.z = Math.sin(this.elapsed * 1.3) * 0.03;
        pl.position.set(nx - dirX * 1.8, WATER_Y + 0.55, nz - dirZ * 1.8); pl.rotation.y = b.rotation.y - Math.PI / 2 + Math.PI / 2;
        pl.rotation.y = Math.atan2(dirX, dirZ);
        this.animatePerson(this.player, 0, dt);
        return;
      }
      if (inp.m > 0.05) {
        const len = Math.hypot(mx, mz) || 1; mx /= len; mz /= len;
        const sp = speed * inp.m * carrying;
        let nx = pl.position.x + mx * sp * dt, nz = pl.position.z + mz * sp * dt;
        [nx, nz] = this.collide(nx, nz, this.mode === "donkey" ? 1.0 : 0.45);
        const gh = onDock(nx, nz) ? DOCK.y : height(nx, nz);
        const tooSteep = gh - (onDock(pl.position.x, pl.position.z) ? DOCK.y : height(pl.position.x, pl.position.z)) > 1.2 * dt * 10;
        if (gh > -0.2 && !tooSteep && Math.abs(nx) < SIZE / 2 - 4 && Math.abs(nz) < SIZE / 2 - 4) { pl.position.x = nx; pl.position.z = nz; }
        else if (gh <= -0.2 && !this._waterHint) { this._waterHint = true; this.toast("Take the boat from the dock to go on the water."); setTimeout(() => (this._waterHint = false), 8000); }
        const target = Math.atan2(mx, mz); let d = target - pl.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); pl.rotation.y += d * Math.min(1, dt * 12);
      }
      let gy = onDock(pl.position.x, pl.position.z) ? DOCK.y : height(pl.position.x, pl.position.z);
      if (this.floorY != null) gy = Math.max(gy, this.floorY);
      if (this.mode === "donkey") {
        const dk = this.donkey; dk.position.set(pl.position.x, gy, pl.position.z); dk.rotation.y = pl.rotation.y - Math.PI / 2;
        dk.t += dt * inp.m * (inp.run ? 14 : 9); dk.legs.forEach((l, i) => (l.rotation.z = Math.sin(dk.t + (i % 2 ? Math.PI : 0)) * 0.5 * inp.m));
        pl.position.y = gy + 1.15; this.animatePerson(this.player, 0, dt);
        if (this.rider) { this.rider.g.position.set(pl.position.x - Math.sin(pl.rotation.y) * 0.6, gy + 1.2, pl.position.z - Math.cos(pl.rotation.y) * 0.6); this.rider.g.rotation.y = pl.rotation.y; }
        return;
      }
      this.vy -= 18 * dt; pl.position.y += this.vy * dt;
      if (pl.position.y <= gy) { pl.position.y = gy; this.vy = 0; this.grounded = true; }
      this.animatePerson(this.player, inp.m * (inp.run ? 8 : 4.4), dt);
      if (this.carry) { this.carry.position.set(pl.position.x, pl.position.y + 1.62, pl.position.z); this.carry.rotation.y = pl.rotation.y + Math.PI / 2; this.player.holdArms = true; this.player.armL.rotation.x = this.player.armR.rotation.x = -2.5; this.player.armL.elbow.rotation.x = this.player.armR.elbow.rotation.x = -0.9; } else if (this.player.holdArms) { this.player.holdArms = false; this.player.armR.elbow.rotation.x = -0.22; }
    }

    updateWorld(dt) {
      const t = this.elapsed;
      for (const p of this.npcs) {
        if (!p.target) { p.wait -= dt; if (p.wait <= 0) { const a = Math.random() * Math.PI * 2, rr = 6 + Math.random() * 30; p.target = [TOWN[0] + Math.cos(a) * rr, TOWN[1] + Math.sin(a) * rr]; } this.animatePerson(p, 0, dt); continue; }
        const g = p.g; const dx = p.target[0] - g.position.x, dz = p.target[1] - g.position.z, d = Math.hypot(dx, dz);
        if (d < 0.6) { p.target = null; p.wait = 2 + Math.random() * 6; continue; }
        let nx = g.position.x + (dx / d) * p.speed * dt, nz = g.position.z + (dz / d) * p.speed * dt;
        const [cx, cz] = this.collide(nx, nz, 0.4); if (Math.hypot(cx - nx, cz - nz) > 0.01) { p.target = null; p.wait = 0.5; }
        g.position.set(cx, height(cx, cz), cz); g.rotation.y = Math.atan2(dx, dz); this.animatePerson(p, p.speed, dt);
      }
      for (const b of this.birds) { const u = b.userData; u.a += dt * u.s; b.position.set(u.cx + Math.cos(u.a) * u.r, u.h + Math.sin(u.a * 3) * 1.5, u.cz + Math.sin(u.a) * u.r); b.rotation.y = -u.a; b.scale.y = 1; const flap = Math.sin(t * 9 + u.r) * 0.5; const ps = b.geometry.attributes.position; ps.setY(0, flap); ps.setY(3, flap); ps.needsUpdate = true; }
      if ((this._lod = (this._lod || 0) + 1) % 10 === 0) { const cp = this.camera.position; for (const p of this.npcs.concat(Object.values(this.cast))) p.face.visible = p.g.position.distanceTo(cp) < 26; }
      this.waterMat.uniforms.t.value = t;
      this.markerGroup.children.forEach((m, i) => { m.beam.material.opacity = 0.18 + Math.sin(t * 2 + i) * 0.06; m.ring.scale.setScalar(1 + Math.sin(t * 2.5 + i) * 0.06); });
      if (this.objMarker.visible) { this.objMarker.beam.material.opacity = 0.25 + Math.sin(t * 3) * 0.08; }
      this.scrollMeshes.forEach((s, i) => { if (!s.visible) return; s.rotation.y = t * 1.2 + i; s.position.y = height(SCROLLS[i][2], SCROLLS[i][3]) + 1.2 + Math.sin(t * 2 + i) * 0.15; });
      if (this.boat.sail) { this.boat.sail.rotation.x = Math.sin(t * 1.4) * 0.05; }
      // scrolls
      const pl = this.player.g.position;
      SCROLLS.forEach((s, i) => {
        if (this.save.scrolls.includes(i)) return;
        if (Math.hypot(pl.x - s[2], pl.z - s[3]) < 2.4 && this.mode !== "boat") {
          this.save.scrolls.push(i); this.scrollMeshes[i].visible = false; this.sound.chime("scroll"); this.persist();
          this.toast(`<span class="wy-scroll-k">Scroll ${this.save.scrolls.length} of 12</span><b>“${esc(s[0])}”</b><small>${esc(s[1])}</small>`, 6500);
        }
      });
      // what can I do here?
      this.context = this.findContext();
      const act = W.$("#wyAct", this.hud);
      const lab = this.holdTask ? this.holdTask.label : this.context ? this.context.label : "Action";
      act.hidden = !!(this.cine || this.talking);
      act.classList.toggle("idle", !this.holdTask && !this.context);
      act.setAttribute("aria-disabled", String(!this.holdTask && !this.context));
      const L = W.$("#wyActL", act); if (L.textContent !== lab) { L.textContent = lab; act.classList.remove("pop"); void act.offsetWidth; if (lab !== "Action") act.classList.add("pop"); }
      // hold-to-do tasks
      if (this.holdTask) {
        const h = this.holdTask; const pressing = this.actDown || this.keys.KeyE || this.keys.Enter;
        h.t = clamp(h.t + (pressing ? dt : -dt * 0.5), 0, h.secs);
        W.$("#wyHoldBar", this.hud).style.width = (h.t / h.secs) * 100 + "%";
        if (h.t >= h.secs) { this.holdTask = null; W.$("#wyHold", this.hud).hidden = true; h.res(); }
      }
      const shoreDist = Math.abs(pl.x - shoreX(pl.z));
      this.sound.update(dt, { shoreDist, height: pl.y, day: this.dayLight || 1 });
    }

    findContext() {
      const pl = this.player.g.position; const near = (p, r) => Math.hypot(pl.x - p[0], pl.z - p[1]) < (r || 3);
      if (this.mission && this.mission.context) { const c = this.mission.context(); if (c) return c; }
      if (this.mode === "boat") return Math.hypot(pl.x - DOCK.x1, pl.z - (DOCK.z0 + DOCK.z1) / 2) < 9 ? { label: "Step out", fn: () => this.leaveBoat() } : null;
      if (this.mode === "donkey") return { label: "Get down", fn: () => this.dismount() };
      if (!this.mission) for (const m of MISSIONS) if (!this.save.done.includes(m.id) && near(m.at, 3.2)) return { label: "Start: " + m.title, fn: () => this.startMission(m) };
      if (!this.mission) for (const m of MISSIONS) if (this.save.done.includes(m.id) && near(m.at, 3.2)) return { label: "Replay: " + m.title, fn: () => this.startMission(m) };
      if (Math.hypot(pl.x - this.donkey.position.x, pl.z - this.donkey.position.z) < 2.6 && !this.carry) return { label: "Ride donkey", fn: () => this.mount() };
      if (Math.hypot(pl.x - this.boat.position.x, pl.z - this.boat.position.z) < 5 && (onDock(pl.x, pl.z) || pl.y < 1)) return { label: "Board the boat", fn: () => this.boardBoat() };
      return null;
    }
    doAction() { if (this.talking) return this.advance(); if (this.context && !this.cine) this.context.fn(); }
    mount() { this.mode = "donkey"; this.camDist = 9; this.player.g.position.copy(this.donkey.position); this.toast("Riding. Hold Run to gallop.", 2400); }
    dismount() { this.mode = "walk"; this.camDist = 8.5; const pl = this.player.g.position; this.donkey.position.set(pl.x, height(pl.x, pl.z), pl.z); pl.x += Math.cos(this.player.g.rotation.y) * 1.6; pl.z -= Math.sin(this.player.g.rotation.y) * 1.6; pl.y = height(pl.x, pl.z); if (this.rider) { this.rider = null; } }
    boardBoat() { this.mode = "boat"; this.camDist = 13; this.boatSpeed = 0; this.toast("Sail with the left side. Return to the dock to step out.", 3200); }
    leaveBoat() { this.mode = "walk"; this.camDist = 8.5; this.boat.position.set(P.boat[0], WATER_Y, P.boat[1]); this.boat.rotation.set(0, -Math.PI / 2, 0); this.player.g.position.set(DOCK.x1 - 3, DOCK.y, (DOCK.z0 + DOCK.z1) / 2); }

    updateCamera(dt) {
      const pl = this.player.g.position;
      if (this.fly) {
        this.fly.t += dt; const k = sstep(0, 1, this.fly.t / this.fly.dur);
        const from = new THREE.Vector3(150, 40, 90), to = new THREE.Vector3(pl.x + 10, pl.y + 6, pl.z + 12);
        this.camera.position.lerpVectors(from, to, k); this.camera.lookAt(lerp(40, pl.x, k), lerp(2, pl.y + 1.5, k), lerp(-10, pl.z, k)); return;
      }
      if (this.shot) { this.camera.position.lerp(this.shot.pos, Math.min(1, dt * 2)); const l = this.shot.look; this.camera.lookAt(l.x, l.y, l.z); return; }
      // drift behind the player after you stop steering the camera (like the console games)
      const inp = this.input();
      if (this.elapsed - this.lastLook > 1.6 && inp.m > 0.3 && !this.cine) {
        const behind = (this.mode === "boat" ? Math.atan2(Math.sin(this.boat.rotation.y - Math.PI / 2), Math.cos(this.boat.rotation.y - Math.PI / 2)) : this.player.g.rotation.y) + Math.PI;
        let d = behind - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.yaw += d * dt * 0.9;
      }
      const dist = this.camDist;
      const cx = pl.x + Math.sin(this.yaw) * Math.cos(this.pitch) * dist, cz = pl.z + Math.cos(this.yaw) * Math.cos(this.pitch) * dist;
      let cy = pl.y + 1.6 + Math.sin(this.pitch) * dist;
      cy = Math.max(cy, (this.mode === "boat" ? WATER_Y : Math.max(height(cx, cz), WATER_Y)) + 0.8);
      const want = new THREE.Vector3(cx, cy, cz);
      this.camera.position.lerp(want, Math.min(1, dt * 8));
      this.camera.lookAt(pl.x, pl.y + 1.5, pl.z);
    }

    updateSky() {
      const T = THREE; const t = this.timeOfDay;
      const ang = (t - 0.25) * Math.PI * 2; const el = Math.sin(ang), az = Math.cos(ang);
      const sunDir = new T.Vector3(az * 0.8, el, 0.45).normalize();
      const day = sstep(-0.08, 0.25, el); this.dayLight = day;
      const dusk = sstep(0.35, 0.02, Math.abs(el)) * sstep(-0.15, 0.05, el);
      const top = new T.Color(0x0b1430).lerp(new T.Color(0x3c70a8), day).lerp(new T.Color(0x4a5a8a), dusk * 0.5);
      const hor = new T.Color(0x1a2238).lerp(new T.Color(0xe7dcc6), day).lerp(new T.Color(0xf0a86a), dusk * 0.8);
      this.skyMat.uniforms.top.value.copy(top); this.skyMat.uniforms.horizon.value.copy(hor); this.skyMat.uniforms.sunDir.value.copy(sunDir); this.skyMat.uniforms.night.value = 1 - day;
      this.skyMat.uniforms.sunCol.value.setHex(0xfff2d0).lerp(new T.Color(0xff9a50), dusk);
      this.scene.fog.color.copy(hor);
      const pl = this.player.g.position;
      const lightDir = el > -0.05 ? sunDir : new T.Vector3(-az * 0.6, Math.max(0.3, -el), 0.4).normalize();
      this.sun.position.set(pl.x + lightDir.x * 120, pl.y + lightDir.y * 120, pl.z + lightDir.z * 120); this.sun.target.position.set(pl.x, pl.y, pl.z);
      this.sun.intensity = el > -0.05 ? 0.3 + 1.7 * day : 0.22; this.sun.color.setHex(el > -0.05 ? 0xfff1d6 : 0x9fb4e0).lerp(new T.Color(0xffa060), dusk * 0.8);
      this.hemi.intensity = 0.2 + 0.4 * day; this.hemi.color.setHex(0xdfe9f3).lerp(new T.Color(0x5a6a9a), 1 - day);
      this.renderer.toneMappingExposure = 0.62 + 0.28 * day;
      this.stars.material.opacity = (1 - day) * 0.9;
      this.lamps.forEach((l, i) => (l.material.opacity = (1 - day) * (0.35 + Math.sin(this.elapsed * 6 + i) * 0.04)));
      const wu = this.waterMat.uniforms; wu.sunDir.value.copy(lightDir); wu.sky.value.copy(hor); wu.fogCol.value.copy(hor); wu.camPos.value.copy(this.camera.position); wu.dim.value = 0.35 + 0.65 * day; wu.sunCol.value.copy(this.sun.color).multiplyScalar(el > -0.05 ? 1 : 0.4);
      this.farHills.material.color.setHex(0x8b8a9a).lerp(new T.Color(0x20263a), 1 - day).lerp(hor, 0.35);
    }

    updateHud() {
      const h = Math.floor(this.timeOfDay * 24), mn = Math.floor((this.timeOfDay * 24 * 60) % 60);
      W.$("#wyClock", this.hud).textContent = ((h + 11) % 12 + 1) + ":" + String(mn).padStart(2, "0") + (h < 12 ? " AM" : " PM");
      // minimap: rotates with the camera, north marked
      const c = this.mini, S = 300, pl = this.player.g.position, zoom = 2.2;
      c.save(); c.clearRect(0, 0, S, S);
      c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 4, 0, Math.PI * 2); c.clip();
      c.translate(S / 2, S / 2); c.rotate(this.yaw);
      const N = this.mapImg.width, px = (pl.x / SIZE + 0.5) * N, pz = (pl.z / SIZE + 0.5) * N;
      c.drawImage(this.mapImg, -px * zoom, -pz * zoom, N * zoom, N * zoom);
      const blip = (x, z, col, r, txt) => { const bx = ((x / SIZE + 0.5) * N - px) * zoom, bz = ((z / SIZE + 0.5) * N - pz) * zoom; const d = Math.hypot(bx, bz), lim = S / 2 - 16; let fx = bx, fz = bz; if (d > lim) { fx = (bx / d) * lim; fz = (bz / d) * lim; } c.save(); c.translate(fx, fz); c.rotate(-this.yaw); c.fillStyle = col; c.strokeStyle = "rgba(0,0,0,.55)"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill(); c.stroke(); if (txt) { c.fillStyle = "#1a140c"; c.font = "bold " + (r + 2) + "px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, 0, 1); } c.restore(); };
      if (!this.mission) MISSIONS.forEach((m) => blip(m.at[0], m.at[1], this.save.done.includes(m.id) ? "#9a9488" : "#E2A85A", 11, this.save.done.includes(m.id) ? "✓" : "!"));
      SCROLLS.forEach((s, i) => { if (!this.save.scrolls.includes(i) && Math.hypot(pl.x - s[2], pl.z - s[3]) < 70) blip(s[2], s[3], "#F6E7B0", 6); });
      if (this.objTarget) blip(this.objTarget[0], this.objTarget[1], "#FFD56B", 12, "★");
      if (this.waypoint) blip(this.waypoint[0], this.waypoint[1], "#C25AC8", 9);
      if (this.mode !== "donkey") blip(this.donkey.position.x, this.donkey.position.z, "#B5875A", 6);
      c.restore();
      // player arrow and north
      c.save(); c.translate(S / 2, S / 2);
      const facing = (this.mode === "boat" ? Math.atan2(Math.sin(this.boat.rotation.y - Math.PI / 2), Math.cos(this.boat.rotation.y - Math.PI / 2)) : this.player.g.rotation.y) - this.yaw;
      c.rotate(-facing + Math.PI); c.fillStyle = "#fff"; c.strokeStyle = "#1a140c"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -16); c.lineTo(11, 12); c.lineTo(0, 6); c.lineTo(-11, 12); c.closePath(); c.stroke(); c.fill(); c.restore();
      c.save(); c.translate(S / 2, S / 2); c.rotate(this.yaw); c.translate(0, -(S / 2 - 20)); c.rotate(-this.yaw); c.fillStyle = "#1a140c"; c.beginPath(); c.arc(0, 0, 14, 0, Math.PI * 2); c.fill(); c.fillStyle = "#fff"; c.font = "bold 16px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("N", 0, 1); c.restore();
      c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 6; c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 4, 0, Math.PI * 2); c.stroke();
      // objective marker in the world
      if (this.objTarget) { const [x, z] = this.objTarget; this.objMarker.visible = true; this.objMarker.position.set(x, (this.objTarget[2] != null ? this.objTarget[2] : Math.max(height(x, z), WATER_Y)), z); } else this.objMarker.visible = false;
    }

    refreshMissionMarkers() { this.missionMarkers.forEach((mk, i) => { mk.visible = !this.mission && !this.save.done.includes(MISSIONS[i].id); }); }

    // ---------- missions ----------
    async startMission(m) {
      this.mission = { m, context: null }; this.refreshMissionMarkers();
      this.toast(`<span class="wy-scroll-k">Deed</span><b>${esc(m.title)}</b><small>${esc(m.ref)}</small>`, 3200);
      try { await this["m_" + m.id](); } catch (e) { console.error(e); this.unlook(); this.cinema(false); this.carry = null; this.frozen = false; this.floorY = null; }
      this.objTarget = null; this.meter(null); this.mission = null; this.refreshMissionMarkers();
      this.objective(this.save.done.length < 5 ? "Find a gold marker to begin a deed." : "Wander Galilee. " + (12 - this.save.scrolls.length) + " scrolls left to find.");
    }
    until(fn) { return new Promise((res) => { const tick = () => { if (this.disposed) return; if (fn()) res(); else setTimeout(tick, 120); }; tick(); }); }
    near(p, r) { const pl = this.player.g.position; return Math.hypot(pl.x - p[0], pl.z - p[1]) < (r || 3); }
    act(label, cond) { return new Promise((res) => { this.mission.context = () => (cond() ? { label, fn: () => { this.mission.context = null; res(); } } : null); }); }
    look(at, from) { const T = THREE; this.shot = { pos: new T.Vector3(from[0], from[1], from[2]), look: new T.Vector3(at[0], at[1], at[2]) }; }
    unlook() { this.shot = null; }
    face(p, target) { p.g.rotation.y = Math.atan2(target.x - p.g.position.x, target.z - p.g.position.z); }

    async m_sheep() {
      const sh = this.cast.shepherd;
      this.face(sh, this.player.g.position);
      await this.say([["Eli the shepherd", "I had a hundred sheep this morning. Now ninety and nine."], ["Eli the shepherd", "One wandered off into the high hills. I won't leave it out there for the night."], ["Eli the shepherd", "Will you search the slopes to the west while I keep the others?"]]);
      const spot = P.sheepSpots[Math.floor(Math.random() * P.sheepSpots.length)];
      this.sheep.position.set(spot[0], height(spot[0], spot[1]), spot[1]); this.sheep.visible = true;
      const area = [spot[0] + (Math.random() - 0.5) * 30, spot[1] + (Math.random() - 0.5) * 30];
      this.objTarget = area; this.objective("Search the western hills for the lost sheep.");
      await this.until(() => this.near(spot, 22));
      this.objTarget = null; this.objective("You hear bleating. Find the sheep.");
      this.sound.chime("hint");
      await this.until(() => this.near(spot, 14));
      this.objTarget = [spot[0], spot[1]];
      await this.act("Lift the sheep", () => this.near(spot, 2.8) && this.mode === "walk");
      this.carry = this.sheep; this.sound.chime("scroll");
      this.objective("Carry the sheep home to Eli."); this.objTarget = P.shepherd;
      this.toast("“He layeth it on his shoulders, rejoicing.” Luke 15:5", 4200);
      await this.until(() => this.near(P.shepherd, 4));
      this.carry = null; this.sheep.position.set(P.shepherd[0] - 2, height(P.shepherd[0] - 2, P.shepherd[1] + 2), P.shepherd[1] + 2);
      this.objTarget = null; this.cinema(true); this.look([P.shepherd[0], height(...P.shepherd) + 1.5, P.shepherd[1]], [P.shepherd[0] + 7, height(...P.shepherd) + 3, P.shepherd[1] - 5]);
      await this.say([["Eli the shepherd", "You found her! Rejoice with me; for I have found my sheep which was lost."], ["Eli the shepherd", "There is joy in heaven over one that is found."]]);
      this.unlook(); this.cinema(false); this.sheep.visible = false;
      await this.deedDone(MISSIONS[0]);
    }

    async m_loaves() {
      const an = this.cast.andrew, boy = this.cast.boy;
      this.face(an, this.player.g.position);
      await this.say([["Andrew", "Thousands have followed the Teacher out here, and the day is far spent."], ["Andrew", "“Whence shall we buy bread, that these may eat?” Two hundred pennyworth would not be enough."], ["Andrew", "But there was a lad in the market with a basket. Find him for me?"]]);
      boy.g.position.set(P.boy[0], height(...P.boy), P.boy[1]);
      this.objective("Find the boy with the basket in the market."); this.objTarget = P.boy;
      await this.act("Talk to the boy", () => this.near(P.boy, 2.8));
      await this.say([["The boy", "I have five barley loaves and two small fishes. It's not much."], ["The boy", "But if the Teacher wants them, He can have them all."]]);
      this.objective("Bring the boy to Andrew."); this.objTarget = P.andrew;
      this.follower = boy;
      const followTick = setInterval(() => { if (!this.follower) return clearInterval(followTick); const pl = this.player.g.position, g = boy.g.position; const d = Math.hypot(pl.x - g.x, pl.z - g.z); if (d > 2.4) { const k = Math.min(1, (d - 2.2) / d); g.x += (pl.x - g.x) * k * 0.25; g.z += (pl.z - g.z) * k * 0.25; g.y = height(g.x, g.z); this.face(boy, pl); this.animatePerson(boy, 4, 0.12); } }, 60);
      await this.until(() => this.near(P.andrew, 4));
      this.follower = null;
      this.cinema(true); this.crowd.visible = true;
      this.look([P.crowd[0], height(...P.crowd) + 2, P.crowd[1] - 20], [P.andrew[0] + 10, height(...P.andrew) + 9, P.andrew[1] + 14]);
      await this.say([["John 6:11", "And Jesus took the loaves; and when he had given thanks, he distributed to the disciples, and the disciples to them that were set down."], ["John 6:11", "And likewise of the fishes as much as they would."], ["Andrew", "Five thousand men, and every one of them filled. Look at what is left over!"], ["Andrew", "He says: gather up the fragments that remain, that nothing be lost."]]);
      this.unlook(); this.cinema(false);
      const B = this.crowd.baskets; B.forEach((b) => (b.visible = true));
      let got = 0; const t0 = this.elapsed;
      this.objective("Gather the fragments: 0 of 12 baskets");
      while (got < 12) {
        const left = B.filter((b) => b.visible); const pl = this.player.g.position;
        left.sort((a, b) => Math.hypot(a.position.x - pl.x, a.position.z - pl.z) - Math.hypot(b.position.x - pl.x, b.position.z - pl.z));
        this.objTarget = [left[0].position.x, left[0].position.z];
        await this.until(() => B.some((b) => b.visible && Math.hypot(b.position.x - this.player.g.position.x, b.position.z - this.player.g.position.z) < 2.2));
        const b = B.find((b) => b.visible && Math.hypot(b.position.x - this.player.g.position.x, b.position.z - this.player.g.position.z) < 2.2);
        b.visible = false; got++; this.sound.chime("hint"); this.objective(`Gather the fragments: ${got} of 12 baskets`);
      }
      this.objTarget = null;
      const secs = Math.round(this.elapsed - t0);
      this.toast(`Twelve baskets in ${secs} seconds.`, 3000);
      await this.deedDone(MISSIONS[1]);
    }

    async m_nets() {
      const si = this.cast.simon;
      this.face(si, this.player.g.position);
      await this.say([["Simon", "We have toiled all the night, and have taken nothing."], ["Simon", "But the Teacher said: “Launch out into the deep, and let down your nets for a draught.”"], ["Simon", "Nevertheless at His word... take the boat out. I'll come behind you."]]);
      this.objective("Board the boat at the end of the dock."); this.objTarget = [P.boat[0], P.boat[1], WATER_Y];
      await this.until(() => this.mode === "boat");
      this.objective("Launch out into the deep."); this.objTarget = [P.deep[0], P.deep[1], WATER_Y];
      await this.until(() => { const b = this.boat.position; return Math.hypot(b.x - P.deep[0], b.z - P.deep[1]) < 9; });
      this.objTarget = null; this.boatSpeed = 0; this.frozen = true;
      await this.act("Let down the net", () => true);
      this.sound.splash(); this.boat.net.visible = true;
      this.objective("Hold to haul the net in.");
      await this.hold("Haul the net", 4);
      this.boat.net.visible = false; this.boat.fish.visible = true; this.sound.splash();
      this.toast("“They inclosed a great multitude of fishes: and their net brake.” Luke 5:6", 4500);
      this.frozen = false;
      this.objective("The net is breaking! Sail back to the dock."); this.objTarget = [DOCK.x1 + 2, (DOCK.z0 + DOCK.z1) / 2, WATER_Y];
      let strain = 0;
      await this.until(() => { strain = Math.min(1, strain + 0.012); this.meter("Net strain", strain); const b = this.boat.position; return Math.hypot(b.x - DOCK.x1, b.z - 10) < 9; });
      this.meter(null);
      const perfect = strain < 1;
      this.objTarget = null; this.cinema(true);
      this.look([P.boat[0], 1, P.boat[1]], [P.boat[0] - 8, 5, P.boat[1] + 10]);
      await this.say([["Simon", perfect ? "You made it before the net gave way! Both ships are full to sinking." : "The net held, just. Both ships are full to sinking."], ["Simon", "Depart from me; for I am a sinful man, O Lord."], ["Luke 5:10", "Fear not; from henceforth thou shalt catch men."]]);
      this.unlook(); this.cinema(false); this.boat.fish.visible = false; this.leaveBoat();
      await this.deedDone(MISSIONS[2]);
    }

    async m_samaritan() {
      const wd = this.cast.wounded;
      await this.say([["A traveller", "Help me... thieves... they took everything."], ["Luke 10:31–32", "A priest came by and passed on the other side. A Levite looked, and passed by too."], ["Luke 10:33", "But a certain Samaritan, as he journeyed, came where he was: and when he saw him, he had compassion on him."]]);
      this.objective("Hold to bind up his wounds with oil and wine.");
      await this.hold("Bind his wounds", 3);
      if (this.mode !== "donkey") {
        this.objective("Bring your donkey. It waits at the stable in Capernaum."); this.objTarget = [this.donkey.position.x, this.donkey.position.z];
        await this.until(() => this.mode === "donkey");
      }
      this.objective("Ride to the traveller."); this.objTarget = P.wounded;
      await this.act("Lift him onto the donkey", () => this.mode === "donkey" && this.near(P.wounded, 6));
      wd.g.rotation.z = 0; this.rider = wd;
      this.objective("Take him to the inn on the south road."); this.objTarget = [P.inn[0], P.inn[1] - 8];
      await this.until(() => this.near([P.inn[0], P.inn[1] - 8], 7));
      this.dismount(); this.rider = null;
      wd.g.position.set(P.inn[0] - 2, height(P.inn[0], P.inn[1] - 6), P.inn[1] - 6);
      this.objTarget = [P.inn[0] + 4, P.inn[1] - 5];
      this.objective("Speak to the innkeeper.");
      await this.act("Pay two pence", () => this.near([P.inn[0] + 4, P.inn[1] - 5], 3.2));
      this.objTarget = null; this.cinema(true); this.look([P.inn[0], height(...P.inn) + 1.6, P.inn[1] - 5], [P.inn[0] + 8, height(...P.inn) + 4, P.inn[1] - 14]);
      await this.say([["You", "Take care of him; and whatsoever thou spendest more, when I come again, I will repay thee."], ["Luke 10:36–37", "Which of these three was neighbour unto him? He that shewed mercy on him. Go, and do thou likewise."]]);
      this.unlook(); this.cinema(false);
      wd.g.position.set(P.wounded[0], height(...P.wounded) + 0.3, P.wounded[1]); wd.g.rotation.z = Math.PI / 2; wd.g.visible = false;
      await this.deedDone(MISSIONS[3]);
      wd.g.visible = true;
    }

    async m_roof() {
      await this.say([["Four friends", "Our friend has been sick of the palsy for years. The Teacher is inside."], ["Four friends", "But look at the crowd. We can't even get near the door!"], ["Four friends", "The stairs go up the side of the house. Lead the way?"]]);
      this.objective("Lead your friends up the outside stairs."); this.objTarget = P.stairs;
      await this.act("Climb to the roof", () => this.near(P.stairs, 3));
      const roofY = height(P.peter[0], P.peter[1] - 5) + 4.6;
      this.cinema(true);
this.floorY = roofY;
      this.player.g.position.set(P.peter[0] + 1, roofY, P.peter[1] - 5);
      for (let i = 0; i < 4; i++) { const f = this.cast["friend" + i]; f.g.position.set(P.peter[0] - 2 + i * 1.3, roofY, P.peter[1] - 3); }
      this.stretcher.position.set(P.peter[0] - 0.2, roofY + 0.5, P.peter[1] - 3.5);
      this.look([P.peter[0], roofY, P.peter[1] - 5], [P.peter[0] + 9, roofY + 6, P.peter[1] + 6]);
      await this.say([["Mark 2:4", "And when they could not come nigh unto him for the press, they uncovered the roof where he was."]]);
      this.cinema(false); this.frozen = true;
      this.objective("Break up the roof. Tap quickly!");
      const tiles = []; for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.7), new THREE.MeshStandardMaterial({ color: 0xb79c74 })); t.position.set(P.peter[0] - 1 + (i % 4) * 0.72, roofY + 0.09, P.peter[1] - 6 + Math.floor(i / 4) * 0.72); this.scene.add(t); tiles.push(t); }
      let taps = 0;
      await new Promise((res) => { this.mission.context = () => ({ label: "Break the roof", fn: () => { taps++; this.sound.splash(); const t = tiles[Math.min(tiles.length - 1, Math.floor(taps / 2))]; if (t) t.visible = false; this.meter("Opening", taps / 16); if (taps >= 16) { this.mission.context = null; res(); } } }); });
      this.meter(null);
      tiles.forEach((t) => this.scene.remove(t));
      this.objective("Hold to lower him down gently.");
      const s0 = this.stretcher.position.y;
      const lower = setInterval(() => { if (this.holdTask) this.stretcher.position.y = s0 - (this.holdTask.t / this.holdTask.secs) * 4; else clearInterval(lower); }, 50);
      await this.hold("Lower him down", 4);
      this.frozen = false; this.cinema(true);
      this.look([P.peter[0], roofY - 2, P.peter[1] - 5], [P.peter[0] + 4, roofY + 3, P.peter[1] - 1]);
      await this.say([["Mark 2:5", "When Jesus saw their faith, he said unto the sick of the palsy, Son, thy sins be forgiven thee."], ["Mark 2:11–12", "Arise, and take up thy bed... And immediately he arose, took up the bed, and went forth before them all."], ["Four friends", "We have never seen it on this fashion!"]]);
      this.unlook(); this.cinema(false);
      this.floorY = null;
      this.player.g.position.set(P.stairs[0] + 1, height(...P.stairs), P.stairs[1] + 2);
      for (let i = 0; i < 4; i++) { const f = this.cast["friend" + i]; f.g.position.set(P.peter[0] - 3 + i * 1.6, height(P.peter[0], P.peter[1] + 3), P.peter[1] + 3); }
      this.stretcher.position.set(P.peter[0] - 0.6, 0.8 + height(P.peter[0], P.peter[1] + 3), P.peter[1] + 3);
      await this.deedDone(MISSIONS[4]);
    }

    // ---------- map, photo, menu ----------
    openMap() {
      if (this.cine) return;
      const d = document.createElement("div"); d.className = "wy-map";
      d.innerHTML = `<div class="wy-map-in"><div class="wy-map-head"><b>Galilee</b><span>${this.save.done.length} of 5 deeds · ${this.save.scrolls.length} of 12 scrolls</span><button class="wy-btn" aria-label="Close map">${icon("close")}</button></div><canvas width="900" height="900"></canvas><p class="wy-map-hint">Tap anywhere on the map to set a waypoint.</p>
        <ol class="wy-map-list">${MISSIONS.map((m) => `<li class="${this.save.done.includes(m.id) ? "done" : ""}"><b>${esc(m.title)}</b><span>${esc(m.ref)} · ${this.save.done.includes(m.id) ? "Done" : "Gold marker"}</span></li>`).join("")}</ol></div>`;
      this.root.appendChild(d); this.paused = true;
      const cv = W.$("canvas", d), x = cv.getContext("2d"); const N = 900;
      const draw = () => {
        x.drawImage(this.mapImg, 0, 0, N, N);
        const f = (v) => (v / SIZE + 0.5) * N;
        const dot = (wx, wz, col, r, t) => { x.fillStyle = col; x.strokeStyle = "rgba(0,0,0,.6)"; x.lineWidth = 3; x.beginPath(); x.arc(f(wx), f(wz), r, 0, Math.PI * 2); x.fill(); x.stroke(); if (t) { x.fillStyle = "#1a140c"; x.font = "bold 16px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(t, f(wx), f(wz) + 1); } };
        x.font = "600 22px Literata, Georgia, serif"; x.fillStyle = "rgba(30,24,16,.8)"; x.textAlign = "center";
        [["Capernaum", -5, -48 + 92], ["Sea of Galilee", 140, 0], ["Western hills", -150, -100], ["Road to the inn", -16, 140]].forEach(([n, a, b]) => x.fillText(n, f(a), f(b)));
        MISSIONS.forEach((m) => dot(m.at[0], m.at[1], this.save.done.includes(m.id) ? "#9a9488" : "#E2A85A", 14, this.save.done.includes(m.id) ? "✓" : "!"));
        if (this.waypoint) dot(this.waypoint[0], this.waypoint[1], "#C25AC8", 11);
        const pl = this.player.g.position; dot(pl.x, pl.z, "#ffffff", 10);
      };
      draw();
      cv.onclick = (e) => { const r = cv.getBoundingClientRect(); const wx = ((e.clientX - r.left) / r.width - 0.5) * SIZE, wz = ((e.clientY - r.top) / r.height - 0.5) * SIZE; this.waypoint = [wx, wz]; draw(); this.toast("Waypoint set.", 1500); };
      W.$(".wy-map-head .wy-btn", d).onclick = () => { d.remove(); this.paused = false; };
    }
    photo() {
      if (this.cine) return;
      this.hud.classList.add("shot");
      this.renderer.render(this.scene, this.camera);
      const url = this.renderer.domElement.toDataURL("image/jpeg", 0.92);
      this.hud.classList.remove("shot");
      const d = document.createElement("div"); d.className = "wy-photo";
      d.innerHTML = `<div class="wy-photo-in"><img src="${url}" alt="Your photo of Galilee"><span class="wy-photo-tag">THE WAY · WFN</span><div class="wy-photo-acts"><button class="wy-go small" id="wyPS">${icon("share", "sm")}Share</button><button class="wy-go small ghost" id="wyPC">Close</button></div></div>`;
      this.root.appendChild(d); this.sound.chime("hint");
      W.$("#wyPC", d).onclick = () => d.remove();
      W.$("#wyPS", d).onclick = async () => {
        try { const blob = await (await fetch(url)).blob(); const file = new File([blob], "the-way-galilee.jpg", { type: "image/jpeg" }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "The Way", text: "Walking through Galilee in The Way, on the WFN app: wfnglobal.org/app" }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
        const a = document.createElement("a"); a.href = url; a.download = "the-way-galilee.jpg"; document.body.appendChild(a); a.click(); a.remove();
      };
    }
    menu() {
      const d = document.createElement("div"); d.className = "wy-map";
      const q = this.save.quality;
      d.innerHTML = `<div class="wy-map-in wy-menu"><div class="wy-map-head"><b>Paused</b><span>Progress saves as you play</span><button class="wy-btn" aria-label="Resume">${icon("close")}</button></div>
        <span class="wy-menu-l">Graphics</span>
        <div class="wy-seg">${[["high", "Highest"], ["auto", "Balanced"], ["battery", "Battery saver"]].map(([k, l]) => `<button data-q="${k}" aria-pressed="${q === k}">${l}</button>`).join("")}</div>
        <span class="wy-menu-l">Controls</span>
        <p class="wy-menu-p">Phone: drag the left side to walk, the right side to look. Buttons on the right: Run, Jump and the action button when something can be done.<br>Keyboard: WASD or arrows to move, Shift to run, Space to jump, E to act, M for the map, P for a photo.</p>
        <div class="wy-menu-acts"><button class="wy-go small" id="wyRes">Resume</button><button class="wy-go small ghost" id="wyHome">Return to Capernaum</button><button class="wy-go small ghost" id="wyNew">Start over</button></div></div>`;
      this.root.appendChild(d); this.paused = true;
      const close = () => { d.remove(); this.paused = false; };
      W.$(".wy-map-head .wy-btn", d).onclick = close; W.$("#wyRes", d).onclick = close;
      W.$$("[data-q]", d).forEach((b) => b.onclick = () => { this.save.quality = b.dataset.q; this.persist(); const qq = this.quality(); this.renderer.setPixelRatio(qq.dpr); this.renderer.setSize(innerWidth, innerHeight); this.renderer.shadowMap.enabled = qq.shadows; this.sun.castShadow = qq.shadows; W.$$("[data-q]", d).forEach((x) => x.setAttribute("aria-pressed", x === b)); this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; }); });
      W.$("#wyHome", d).onclick = () => { if (this.mode === "boat") this.leaveBoat(); if (this.mode === "donkey") this.dismount(); this.player.g.position.set(TOWN[0] + 6, height(TOWN[0] + 6, TOWN[1] + 4), TOWN[1] + 4); close(); };
      W.$("#wyNew", d).onclick = () => { if (this.mission) return W.toast("Finish or leave the current deed first."); this.save = Object.assign(this.save, { done: [], scrolls: [], pos: null, seen: false }); this.persist(); W.route(); };
    }

    persist() { const pl = this.player && this.player.g.position; if (pl && this.mode === "walk" && !this.mission) this.save.pos = [Math.round(pl.x * 10) / 10, Math.round(pl.z * 10) / 10]; this.save.time = this.timeOfDay; W.write(SAVE, this.save); }

    dispose() {
      this.disposed = true; cancelAnimationFrame(this.raf); this.persist(); this.sound.dispose();
      window.removeEventListener("resize", this.resize); window.removeEventListener("keydown", this._kd); window.removeEventListener("keyup", this._ku); window.removeEventListener("mousemove", this._mm); window.removeEventListener("mouseup", this._mu); document.removeEventListener("visibilitychange", this._vis);
      try { this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); this.renderer.dispose(); this.renderer.forceContextLoss && this.renderer.forceContextLoss(); } catch (e) {}
      document.body.classList.remove("way-on");
    }
  }
})();

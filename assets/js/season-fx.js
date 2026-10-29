// Word and Faith Network — seasonal weather flourish.
// A tasteful, once-per-visit canvas overlay: maple leaves drift down in
// fall (Sep–Nov), snowflakes in winter (Dec–Feb). Nothing runs in
// spring/summer. Respects reduced-motion, costs nothing once it's done
// (the canvas removes itself after a short run), and never blocks taps —
// it's pointer-events:none the whole time.
(function () {
  "use strict";

  function reducedMotion() {
    try {
      if (document.documentElement.getAttribute("data-motion") === "reduced") return true;
    } catch (e) {}
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) {
      return false;
    }
  }

  function season(d) {
    var m = (d || new Date()).getMonth() + 1; // 1–12, Northern Hemisphere
    if (m === 9 || m === 10 || m === 11) return "fall";
    if (m === 12 || m === 1 || m === 2) return "winter";
    return null; // spring / summer — no falling-weather effect
  }

  var PALETTES = {
    fall: { colors: ["#C9622A", "#D98A3D", "#A8431F", "#E2A33E", "#8C3F1E", "#B9552A"], count: 20 },
    winter: { colors: ["#FFFFFF", "#EAF3FA", "#D7E9F7", "#F5FBFF"], count: 26 }
  };

  // A simple maple-leaf silhouette, drawn once and reused for every particle.
  function leafPath() {
    return new Path2D(
      "M12 1.6c.8 2.7 3 4.2 5.4 4-1 1.7-1.1 3.6.3 5 .3.3.3.5-.1.6-1.9.4-3.1 1.6-3.4 3.4-.1.5-.3.6-.6.2" +
      "-1-1.2-2.4-1.7-4-1.4-.3 0-.5-.1-.4-.4.6-1.7.1-3.2-1.4-4.2-.3-.2-.3-.4.1-.6 1.8-.8 2.8-2.3 2.8-4.3" +
      "-1.4 1-3 1-4.5.1 1.6-1.3 2.5-3 2.3-5.1-.1-.7.2-1 .8-.6 1.2.8 2.5.7 3.5-.3.5-.5 1-.9 1.3-.4z"
    );
  }

  function run() {
    if (reducedMotion()) return;
    var s = season();
    if (!s) return;
    if (document.getElementById("wfnSeasonFx")) return;

    var cfg = PALETTES[s];
    var canvas = document.createElement("canvas");
    canvas.id = "wfnSeasonFx";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;" +
      "z-index:30;opacity:0;transition:opacity 1.2s ease;";
    document.body.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    function rand(min, max) { return min + Math.random() * (max - min); }

    function spawn(initial) {
      var isFall = s === "fall";
      return {
        x: rand(0, W),
        y: initial ? rand(-H * 0.2, H) : rand(-40, -10),
        size: isFall ? rand(10, 18) : rand(2.5, 6.5),
        speedY: isFall ? rand(16, 30) : rand(12, 26),
        speedX: rand(-12, 12),
        drift: rand(0.5, 1.4),
        phase: rand(0, Math.PI * 2),
        rotation: rand(0, Math.PI * 2),
        rotSpeed: (isFall ? rand(0.3, 0.7) : rand(0.08, 0.2)) * (Math.random() < 0.5 ? -1 : 1),
        color: cfg.colors[(Math.random() * cfg.colors.length) | 0],
        opacity: rand(0.55, 0.92)
      };
    }

    var leafShape = leafPath();
    var particles = [];
    for (var i = 0; i < cfg.count; i++) particles.push(spawn(true));

    var DURATION = 16000; // one gentle flourish per visit, not a forever-animation
    var start = performance.now();
    var raf = null;
    var finished = false;

    function tick(now) {
      ctx.clearRect(0, 0, W, H);
      var t = now / 1000;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y += p.speedY / 60;
        p.x += (p.speedX + Math.sin(t * p.drift + p.phase) * 16) / 60;
        p.rotation += p.rotSpeed / 30;

        if (p.y > H + 20) { p.y = rand(-40, -10); p.x = rand(0, W); }
        if (p.x < -24) p.x = W + 24;
        if (p.x > W + 24) p.x = -24;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (s === "fall") {
          ctx.scale(p.size / 22, p.size / 22);
          ctx.fill(leafShape);
        } else {
          ctx.shadowColor = "rgba(255,255,255,0.85)";
          ctx.shadowBlur = p.size;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (now - start < DURATION) {
        raf = requestAnimationFrame(tick);
      } else {
        finish();
      }
    }

    function finish() {
      if (finished) return;
      finished = true;
      if (raf) cancelAnimationFrame(raf);
      canvas.style.opacity = "0";
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      setTimeout(function () {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }, 1300);
    }

    function onVisibility() {
      if (finished) return;
      if (document.hidden) {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
      } else if (!raf && performance.now() - start < DURATION) {
        raf = requestAnimationFrame(tick);
      }
    }

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    requestAnimationFrame(function () {
      canvas.style.opacity = "1";
      raf = requestAnimationFrame(tick);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();

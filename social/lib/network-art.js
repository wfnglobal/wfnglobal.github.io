/*
 * The WFN signature motif, adapted from the "Global reach" illustration on
 * wfnglobal.org (index.html, the concentric-wash + radiating-line diagram
 * centered on the flame/coat-of-many-colors medallion). Reused here as a
 * parametric, recolorable SVG so the Instagram series carries the same
 * visual DNA as the live site instead of inventing a new motif.
 *
 * buildNetworkArt({ size, accentIndex, muted }) returns an inline <svg>
 * string, viewBox 0 0 520 520, scaled to `size` px square.
 *   - accentIndex (0-11): which of the 12 radiating lines is drawn bold —
 *     lets each card in a series feel like a variation on one family
 *     rather than an identical sticker.
 *   - muted: smaller/quieter version for a point-card corner echo.
 */

const WASH_COLORS = ["#C17A54", "#5E7C9A", "#6F8C7D", "#A9824F"];
const LINE_COLORS = [
  "#C17A54", "#C9A24A", "#8C9A4F", "#4F9A7D",
  "#4F8C94", "#5E7C9A", "#7D6B9A", "#9A5E82",
  "#B2573A", "#A9824F", "#6F8C7D", "#C9A968",
];

function buildNetworkArt({ size = 560, accentIndex = 0, muted = false, uid = "a" } = {}) {
  const cx = 260, cy = 260;
  const washRadii = [235, 190, 145, 100];
  const washes = washRadii
    .map((r, i) => {
      const op = muted ? 0.05 + i * 0.008 : 0.09 + i * 0.012;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${WASH_COLORS[i % WASH_COLORS.length]}" opacity="${op.toFixed(3)}"/>`;
    })
    .join("\n    ");

  const N = 12;
  let lines = "";
  for (let i = 0; i < N; i++) {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const isAccent = i === ((accentIndex % N) + N) % N;
    const r = isAccent ? 228 : 205;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const color = LINE_COLORS[i % LINE_COLORS.length];
    const strokeW = isAccent ? 2.6 : 1.2;
    const opacity = muted ? (isAccent ? 0.55 : 0.22) : isAccent ? 1 : 0.46;
    const dotR = isAccent ? 7 : 4.2;
    lines += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${color}" stroke-width="${strokeW}" opacity="${opacity}"/>\n    `;
    lines += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${dotR}" fill="${color}" stroke="#FAF8F3" stroke-width="2.4" opacity="${muted ? 0.75 : 1}"/>\n    `;
  }

  const medR = muted ? 40 : 62;
  const gradId = `medgrad-${uid}`;
  const flameScale = (medR * 2 * 0.72) / 48;
  const flameTx = cx - 24 * flameScale;
  const flameTy = cy - 24 * flameScale;

  const medallion = `
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#D3AE75"/>
        <stop offset="1" stop-color="#8C6A2E"/>
      </linearGradient>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${medR}" fill="#262420"/>
    <circle cx="${cx}" cy="${cy}" r="${medR}" fill="none" stroke="url(#${gradId})" stroke-width="2.4"/>
    <g transform="translate(${flameTx.toFixed(2)},${flameTy.toFixed(2)}) scale(${flameScale.toFixed(3)})">
      <path d="M15 32 L18.5 16 L21.75 27 L24 18 L26.25 27 L29.5 16 L33 32" fill="none" stroke="#D3AE75" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 16 C21.75 12 22.25 8.5 24 5.5 C25.75 8.5 26.25 12 24 16 Z" fill="#C17A54"/>
    </g>`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg">
    ${washes}
    ${lines}
    ${medallion}
  </svg>`;
}

module.exports = { buildNetworkArt, WASH_COLORS, LINE_COLORS };

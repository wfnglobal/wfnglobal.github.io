/*
 * The WFN signature motif, adapted from the "Global reach" illustration on
 * wfnglobal.org — concentric washes + radiating lines centered on the
 * flame/coat-of-many-colors medallion. Tuned bold and saturated: this is
 * the hero art of each card, not a faint watermark, so opacities, stroke
 * widths and the medallion glow are pushed up from the site's quiet
 * original version on purpose.
 *
 * buildNetworkArt({ size, accentIndex }) returns an inline <svg> string,
 * viewBox 0 0 520 520, scaled to `size` px square. accentIndex (0-11)
 * picks which of the 12 spokes is drawn longest/boldest/largest-dotted —
 * every card in a series is a clear variation of one bold family instead
 * of a repeated sticker.
 *
 * accentColor(index) exposes the line color for a given spoke, so
 * templates can tint an eyebrow dot, a verse-card border, a numeral, or a
 * background glow to match the card's accent spoke.
 */

const WASH_COLORS = ["#C17A54", "#5E7C9A", "#6F8C7D", "#A9824F"];
const LINE_COLORS = [
  "#C17A54", "#C9A24A", "#8C9A4F", "#4F9A7D",
  "#4F8C94", "#5E7C9A", "#7D6B9A", "#9A5E82",
  "#B2573A", "#A9824F", "#6F8C7D", "#C9A968",
];

function accentColor(index) {
  const n = 12;
  return LINE_COLORS[((index % n) + n) % n];
}

function buildNetworkArt({ size = 560, accentIndex = 0, uid = "a", glow = false } = {}) {
  const cx = 260, cy = 260;
  const washRadii = [235, 190, 145, 100];
  const washes = washRadii
    .map((r, i) => {
      const op = 0.17 + i * 0.028;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${WASH_COLORS[i % WASH_COLORS.length]}" opacity="${op.toFixed(3)}"/>`;
    })
    .join("\n    ");

  const N = 12;
  const accent = accentColor(accentIndex);
  let lines = "";
  for (let i = 0; i < N; i++) {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const isAccent = i === ((accentIndex % N) + N) % N;
    const r = isAccent ? 232 : 206;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const color = LINE_COLORS[i % LINE_COLORS.length];
    const strokeW = isAccent ? 4.2 : 2.1;
    const opacity = isAccent ? 1 : 0.72;
    const dotR = isAccent ? 11 : 6.4;
    lines += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${color}" stroke-width="${strokeW}" opacity="${opacity}" stroke-linecap="round"/>\n    `;
    lines += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${dotR}" fill="${color}" stroke="#FAF8F3" stroke-width="3" opacity="1"/>\n    `;
  }

  const medR = 66;
  const gradId = `medgrad-${uid}`;
  const glowId = `medglow-${uid}`;
  const flameScale = (medR * 2 * 0.72) / 48;
  const flameTx = cx - 24 * flameScale;
  const flameTy = cy - 24 * flameScale;

  const glowCircle = glow
    ? `<circle cx="${cx}" cy="${cy}" r="${medR * 2.3}" fill="url(#${glowId})"/>`
    : "";

  const medallion = `
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#E4C684"/>
        <stop offset="1" stop-color="#8C6A2E"/>
      </linearGradient>
      <radialGradient id="${glowId}" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="${accent}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    ${glowCircle}
    <circle cx="${cx}" cy="${cy}" r="${medR}" fill="#262420"/>
    <circle cx="${cx}" cy="${cy}" r="${medR}" fill="none" stroke="url(#${gradId})" stroke-width="3.6"/>
    <g transform="translate(${flameTx.toFixed(2)},${flameTy.toFixed(2)}) scale(${flameScale.toFixed(3)})">
      <path d="M15 32 L18.5 16 L21.75 27 L24 18 L26.25 27 L29.5 16 L33 32" fill="none" stroke="#E4C684" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 16 C21.75 12 22.25 8.5 24 5.5 C25.75 8.5 26.25 12 24 16 Z" fill="#C17A54"/>
    </g>`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg">
    ${washes}
    ${lines}
    ${medallion}
  </svg>`;
}

module.exports = { buildNetworkArt, accentColor, WASH_COLORS, LINE_COLORS };

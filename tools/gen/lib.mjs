/*
 * lib.mjs — drawing kit for Roblox classic clothing templates (585 x 559).
 *
 * The UV rectangles below are copied verbatim from assets/js/avatar-preview.js.
 * Torso is the TOP block, the limbs are the two BOTTOM blocks, and the two limbs
 * have MIRRORED face order. Do not "tidy" these numbers.
 *
 * Everything is laid out at a uniform 64 px per stud, which is why a pattern with
 * a period that divides 128 wraps seamlessly on the torso (circumference 384) AND
 * on a limb (circumference 256) at the same time.
 */

import { createCanvas } from '@napi-rs/canvas';

export const W = 585, H = 559;

export const TORSO = { up:[231,8,128,64],  down:[231,204,128,64], front:[231,74,128,128],
                       back:[427,74,128,128], rt:[165,74,64,128],  lf:[361,74,64,128] };
export const RLIMB = { up:[217,289,64,64], down:[217,485,64,64],   front:[217,355,64,128],
                       back:[85,355,64,128], lf:[19,355,64,128],   rt:[151,355,64,128] };
export const LLIMB = { up:[308,289,64,64], down:[308,485,64,64],   front:[308,355,64,128],
                       back:[440,355,64,128], lf:[374,355,64,128], rt:[506,355,64,128] };

// Face order going once around the part, same rotational direction for all three.
export const TORSO_ORDER = ['rt', 'front', 'lf', 'back'];   // 64+128+64+128 = 384
export const RLIMB_ORDER = ['lf', 'back', 'rt', 'front'];   // 4 x 64        = 256
export const LLIMB_ORDER = ['front', 'lf', 'back', 'rt'];   // 4 x 64        = 256

export const TORSO_CIRC = 384, LIMB_CIRC = 256;
export const BODY_TOP = 74, BODY_H = 128;      // torso side faces
export const LIMB_TOP = 355, LIMB_H = 128;     // limb side faces

/** Where a shirt sleeve stops, as a fraction of the limb. Hand stays bare below. */
export const SLEEVE = { long: 0.86, threeq: 0.66, short: 0.42, cap: 0.20, none: 0 };
/** Pants cover the lower part of the torso only. */
export const WAIST = 0.60;

/* ---------------------------------------------------------------- colour --- */

export function hex(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
export function rgb(c) { return `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; }
export function rgba(c, a) {
  const v = typeof c === 'string' ? hex(c) : c;
  return `rgba(${v[0]|0},${v[1]|0},${v[2]|0},${a})`;
}
export function mix(a, b, t) {
  const x = typeof a === 'string' ? hex(a) : a, y = typeof b === 'string' ? hex(b) : b;
  return [x[0]+(y[0]-x[0])*t, x[1]+(y[1]-x[1])*t, x[2]+(y[2]-x[2])*t];
}
/** amt > 0 lightens toward white, amt < 0 darkens toward black. */
export function shade(c, amt) {
  return amt >= 0 ? mix(c, [255,255,255], amt) : mix(c, [0,0,0], -amt);
}

/* ------------------------------------------------------------------ rng ---- */

export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/* --------------------------------------------------------------- canvas ---- */

export function surface(w, h) {
  const c = createCanvas(w, h);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  return { c, x, w, h };
}

export function newTemplate() {
  const s = surface(W, H);
  s.x.clearRect(0, 0, W, H);
  return s;
}

/* ------------------------------------------------------------- wrapping ---- */

function rectsFor(part) {
  return part === 'torso' ? TORSO : part === 'rlimb' ? RLIMB : LLIMB;
}
function orderFor(part) {
  return part === 'torso' ? TORSO_ORDER : part === 'rlimb' ? RLIMB_ORDER : LLIMB_ORDER;
}
export function circOf(part) { return part === 'torso' ? TORSO_CIRC : LIMB_CIRC; }

/**
 * Paints a horizontally seamless band around one part.
 *
 * `draw(ctx, circumference, height)` renders the band ONCE, unrolled flat. It is
 * then sliced into the individual faces in wrap order, so whatever you draw is
 * automatically continuous across every seam — including under the arms and
 * across the back.
 *
 * top/height are given as fractions of the part (0 = shoulder, 1 = hem).
 */
export function wrapBand(ctx, part, top, height, draw) {
  const rects = rectsFor(part), order = orderFor(part);
  const circ = circOf(part);
  const faceTop = part === 'torso' ? BODY_TOP : LIMB_TOP;
  const faceH   = part === 'torso' ? BODY_H : LIMB_H;

  const py = Math.round(faceTop + top * faceH);
  const ph = Math.round(height * faceH);
  if (ph <= 0) return;

  const band = surface(circ, ph);
  draw(band.x, circ, ph);

  let u = 0;
  for (const k of order) {
    const [x, y, w] = rects[k];
    // 2px overdraw each side fills the gutters, sampled with wraparound so the
    // bleed matches what is on the other side of the seam
    for (const [sx, dx, sw] of [
      [u, x, w],
      [(u - 2 + circ) % circ, x - 2, 2],
      [(u + w) % circ, x + w, 2]
    ]) {
      if (sx + sw <= circ) {
        ctx.drawImage(band.c, sx, 0, sw, ph, dx, py, sw, ph);
      } else {
        const first = circ - sx;
        ctx.drawImage(band.c, sx, 0, first, ph, dx, py, first, ph);
        ctx.drawImage(band.c, 0, 0, sw - first, ph, dx + first, py, sw - first, ph);
      }
    }
    u += w;
  }
}

/** Fills the up/down cap of a part with a flat colour (shoulder top, hem underside). */
export function cap(ctx, part, which, style, inset = 0) {
  const [x, y, w, h] = rectsFor(part)[which];
  ctx.save();
  ctx.fillStyle = style;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  if (inset) {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 2, y - 2, w + 4, inset);
  }
  ctx.restore();
}

/** Runs `fn(ctx, x, y, w, h)` for one named face, clipped to it. */
export function face(ctx, part, which, fn) {
  const [x, y, w, h] = rectsFor(part)[which];
  ctx.save();
  ctx.beginPath(); ctx.rect(x - 2, y - 2, w + 4, h + 4); ctx.clip();
  fn(ctx, x, y, w, h);
  ctx.restore();
}

/** The u offset of a face within its part's unrolled band. */
export function faceU(part, which) {
  const rects = rectsFor(part), order = orderFor(part);
  let u = 0;
  for (const k of order) { if (k === which) return u; u += rects[k][2]; }
  return 0;
}

/* --------------------------------------------------------------- shading --- */

/**
 * Cylindrical shading inside each face, so a flat colour reads as a rounded body.
 * This is most of what separates a cheap-looking template from a good one.
 */
export function curvature(ctx, part, strength = 0.16) {
  const rects = rectsFor(part), order = orderFor(part);
  for (const k of order) {
    const [x, y, w, h] = rects[k];
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    // light sits front-left, so the shading peak is offset rather than centred
    g.addColorStop(0,    `rgba(0,0,0,${strength})`);
    g.addColorStop(0.34, 'rgba(0,0,0,0)');
    g.addColorStop(0.62, `rgba(255,255,255,${strength * 0.34})`);
    g.addColorStop(1,    `rgba(0,0,0,${strength})`);
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = g;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.restore();
  }
}

/** Soft darkening at the very bottom of a part — contact shadow under the hem. */
export function hemShadow(ctx, part, atFrac = 1, depth = 0.14, height = 0.12) {
  const faceTop = part === 'torso' ? BODY_TOP : LIMB_TOP;
  const faceH   = part === 'torso' ? BODY_H : LIMB_H;
  const y1 = faceTop + atFrac * faceH;
  const y0 = y1 - height * faceH;
  wrapBand(ctx, part, (y0 - faceTop) / faceH, height, (b, cw, ch) => {
    const g = b.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${depth})`);
    b.fillStyle = g; b.fillRect(0, 0, cw, ch);
  });
}

/* ----------------------------------------------------------------- grain --- */

/** Per-pixel noise over everything already drawn. Keeps flats from looking plastic. */
export function grain(ctx, amount = 7, seed = 11) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const r = rng(seed);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = (r() - 0.5) * amount * 2;
    d[i] = clamp(d[i] + n); d[i+1] = clamp(d[i+1] + n); d[i+2] = clamp(d[i+2] + n);
  }
  ctx.putImageData(img, 0, 0);
}

export function clamp(v, lo = 0, hi = 255) { return v < lo ? lo : v > hi ? hi : v; }

/**
 * Grows opaque pixels outward into transparent gutters.
 * Roblox samples slightly outside each UV rect, so without this you get bright
 * hairlines along every seam on the body.
 */
export function bleed(ctx, passes = 2) {
  for (let p = 0; p < passes; p++) {
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;                          // mutated in place
    const s = new Uint8ClampedArray(d);          // snapshot to read from
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (s[i + 3] > 8) continue;
        let r = 0, g = 0, b = 0, a = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = (ny * W + nx) * 4;
          if (s[j + 3] > 8) { r += s[j]; g += s[j+1]; b += s[j+2]; a += s[j+3]; n++; }
        }
        if (n) { d[i] = r/n; d[i+1] = g/n; d[i+2] = b/n; d[i+3] = a/n; }
      }
    }
    ctx.putImageData(img, 0, 0);
  }
}

/* ------------------------------------------------------------------ text --- */

export const HEAVY = '"Franklin Gothic Heavy", Impact, Arial';
export const COND  = 'Haettenschweiler, Impact, Arial';
export const SANS  = 'Arial';
export const SERIF = '"Times New Roman", Georgia, serif';
export const MONO  = 'Consolas, monospace';

/** Draws text scaled to fit a maximum width. Returns the size actually used. */
export function fitText(ctx, str, cx, cy, maxW, size, family, fill, opts = {}) {
  let s = size;
  ctx.save();
  ctx.textAlign = opts.align || 'center';
  ctx.textBaseline = opts.baseline || 'middle';
  for (; s > 4; s -= 0.5) {
    ctx.font = `${opts.weight || 900} ${s}px ${family}`;
    if (ctx.measureText(str).width <= maxW) break;
  }
  if (opts.track) {
    drawTracked(ctx, str, cx, cy, opts.track, fill);
  } else {
    ctx.fillStyle = fill;
    ctx.fillText(str, cx, cy);
  }
  ctx.restore();
  return s;
}

function drawTracked(ctx, str, cx, cy, track, fill) {
  const chars = [...str];
  let total = 0;
  chars.forEach(c => { total += ctx.measureText(c).width + track; });
  total -= track;
  let x = cx - total / 2;
  ctx.fillStyle = fill;
  ctx.textAlign = 'left';
  for (const c of chars) { ctx.fillText(c, x, cy); x += ctx.measureText(c).width + track; }
}

/** Brand device: white type with a cyan/red chromatic split. */
export function splitText(ctx, str, cx, cy, maxW, size, family, opts = {}) {
  const off = opts.offset ?? 2.2;
  fitText(ctx, str, cx - off, cy, maxW, size, family, opts.cyan || '#34E2E8', opts);
  fitText(ctx, str, cx + off, cy, maxW, size, family, opts.red  || '#E4221C', opts);
  fitText(ctx, str, cx, cy, maxW, size, family, opts.core || '#f2f2ef', opts);
}

/** Horizontal tear: displaces a slice of whatever is inside `rect`. */
export function tearSlice(ctx, x, y, w, h, dx) {
  const s = surface(w, h);
  s.x.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h);
  ctx.clearRect(x, y, w, h);
  ctx.drawImage(s.c, 0, 0, w, h, x + dx, y, w, h);
}

/* -------------------------------------------------------------- surfaces --- */

/** Woven cloth: fine crosshatch. */
export function weave(ctx, x, y, w, h, alpha = 0.05, step = 3) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = x; i < x + w; i += step) { ctx.moveTo(i, y); ctx.lineTo(i, y + h); }
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.7})`;
  ctx.beginPath();
  for (let j = y; j < y + h; j += step) { ctx.moveTo(x, j); ctx.lineTo(x + w, j); }
  ctx.stroke();
  ctx.restore();
}

/** Knitwear: chunky V stitches. */
export function knit(ctx, x, y, w, h, light, dark, sx = 6, sy = 5) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.lineWidth = 1.3;
  for (let j = y; j < y + h; j += sy) {
    for (let i = x; i < x + w; i += sx) {
      ctx.strokeStyle = rgba(light, 0.20);
      ctx.beginPath(); ctx.moveTo(i, j + sy); ctx.lineTo(i + sx/2, j); ctx.lineTo(i + sx, j + sy); ctx.stroke();
      ctx.strokeStyle = rgba(dark, 0.18);
      ctx.beginPath(); ctx.moveTo(i, j + sy + 1); ctx.lineTo(i + sx/2, j + 1); ctx.lineTo(i + sx, j + sy + 1); ctx.stroke();
    }
  }
  ctx.restore();
}

/** Denim twill: fine diagonal ribs plus slub speckle. */
export function twill(ctx, x, y, w, h, seed = 5) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.strokeStyle = 'rgba(255,255,255,0.055)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -h; i < w; i += 3) { ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.beginPath();
  for (let i = -h; i < w; i += 3) { ctx.moveTo(x + i + 1.5, y + h); ctx.lineTo(x + i + h + 1.5, y); }
  ctx.stroke();
  const r = rng(seed);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let n = 0; n < w * h * 0.05; n++) ctx.fillRect(x + r() * w, y + r() * h, 1, 1);
  ctx.restore();
}

/** Corduroy: vertical wales. */
export function wales(ctx, x, y, w, h, step = 5) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  for (let i = x; i < x + w; i += step) {
    const g = ctx.createLinearGradient(i, 0, i + step, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.20)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0.20)');
    ctx.fillStyle = g; ctx.fillRect(i, y, step, h);
  }
  ctx.restore();
}

/** Ribbed trim for cuffs, collars and hems. */
export function rib(ctx, x, y, w, h, base, step = 4) {
  ctx.save();
  ctx.fillStyle = rgb(base);
  ctx.fillRect(x, y, w, h);
  for (let i = x; i < x + w; i += step) {
    ctx.fillStyle = rgba(shade(base, -0.28), 0.9);
    ctx.fillRect(i, y, step / 2, h);
  }
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(0,0,0,0.22)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  g.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Soft blurred blob, used for airbrush and glow work. */
export function blob(ctx, cx, cy, r, colour, alpha = 1) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgba(colour, alpha));
  g.addColorStop(1, rgba(colour, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
}

/* ------------------------------------------------------- garment helpers --- */

/**
 * Paints a shirt body: every torso face plus both sleeves down to `len`.
 * `paint(ctx, circ, h, part)` draws the unrolled band for whichever part is
 * being filled, so the pattern stays continuous around the whole garment.
 */
export function shirtBody(ctx, len, paint) {
  wrapBand(ctx, 'torso', 0, 1, (b, c, h) => paint(b, c, h, 'torso'));
  for (const part of ['rlimb', 'llimb']) {
    if (len > 0) wrapBand(ctx, part, 0, len, (b, c, h) => paint(b, c, h, part));
  }
}

/**
 * Paints pants: the WHOLE torso block plus both legs.
 *
 * Roblox layers pants underneath the shirt, so a pants template has to fill the
 * entire torso — not just the hips. Painting only from the waist down leaves a
 * ring of bare skin around the stomach the moment the shirt is short, cropped,
 * or missing. `waist` is still where the waistband detail goes, not where the
 * fabric starts.
 */
export function pantsBody(ctx, paint, waist = WAIST, legLen = 1) {
  wrapBand(ctx, 'torso', 0, 1, (b, c, h) => paint(b, c, h, 'torso'));
  for (const part of ['rlimb', 'llimb']) {
    wrapBand(ctx, part, 0, legLen, (b, c, h) => paint(b, c, h, part));
  }
}

/** Caps for a shirt: shoulders on top of the torso and both sleeves. */
export function shirtCaps(ctx, colour, len) {
  cap(ctx, 'torso', 'up', rgb(shade(colour, 0.06)));
  cap(ctx, 'torso', 'down', rgb(shade(colour, -0.30)));
  // The limb 'down' face is the underside of the hand — it always stays bare so
  // the wearer's own skin tone shows, no matter how long the sleeve is.
  for (const p of ['rlimb', 'llimb']) if (len > 0) cap(ctx, p, 'up', rgb(shade(colour, 0.10)));
}

export function pantsCaps(ctx, colour, legLen = 1) {
  // top of the torso block is covered too — see pantsBody
  cap(ctx, 'torso', 'up', rgb(shade(colour, 0.04)));
  cap(ctx, 'torso', 'down', rgb(shade(colour, -0.28)));
  for (const p of ['rlimb', 'llimb']) {
    // top of the leg sits under the hip and is always covered by the garment
    cap(ctx, p, 'up', rgb(shade(colour, -0.10)));
    // bottom of the leg is the underside of the foot; only fill it for full-length
    if (legLen >= 1) cap(ctx, p, 'down', rgb(shade(colour, -0.40)));
  }
}

/**
 * A band on a sleeve, clamped to the sleeve's own length.
 *
 * Use this for every cuff, stripe or piece of sleeve lettering. Drawing a detail
 * with wrapBand directly is how you end up with a cuff or a wordmark floating on
 * the wearer's bare forearm when the sleeve turns out to be short.
 */
export function sleeveBand(ctx, part, top, height, len, draw) {
  if (len <= 0) return;
  const t = Math.min(top, len);
  const h = Math.min(height, len - t);
  if (h <= 0.001) return;
  wrapBand(ctx, part, t, h, draw);
}

/**
 * Cuts a neck opening so the wearer's own skin shows at the throat.
 *
 * On R6 the head covers the torso's top face, but the very top of the torso
 * FRONT is visible right under the chin — so a garment painted solid to the top
 * edge reads as if it swallows the neck. Call this LAST, after finish(), because
 * the bleed pass would otherwise creep back into the opening.
 */
export function neckline(ctx, { width = 46, depth = 15, back = 9, shape = 'crew' } = {}) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';

  const [fx, fy, fw] = TORSO.front;
  const cx = fx + fw / 2;
  ctx.beginPath();
  if (shape === 'v') {
    ctx.moveTo(cx - width / 2, fy - 2);
    ctx.lineTo(cx, fy + depth * 1.7);
    ctx.lineTo(cx + width / 2, fy - 2);
  } else {
    ctx.moveTo(cx - width / 2, fy - 2);
    ctx.quadraticCurveTo(cx, fy + depth * 1.7, cx + width / 2, fy - 2);
  }
  ctx.closePath(); ctx.fill();

  // shallow scoop at the back of the neck
  const [bx, by, bw] = TORSO.back;
  const bcx = bx + bw / 2;
  ctx.beginPath();
  ctx.moveTo(bcx - width / 2, by - 2);
  ctx.quadraticCurveTo(bcx, by + back * 1.7, bcx + width / 2, by - 2);
  ctx.closePath(); ctx.fill();

  ctx.restore();
}

/**
 * Clears the bottom of both limbs so the hands show bare skin.
 * `from` is a fraction of the limb: 0.82 leaves the last 18% as hand.
 */
export function openHands(ctx, from = 0.82) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (const part of ['rlimb', 'llimb']) {
    const rects = rectsFor(part);
    const y = Math.round(LIMB_TOP + from * LIMB_H);
    for (const k of ['front', 'back', 'lf', 'rt']) {
      const [rx, , rw] = rects[k];
      ctx.fillRect(rx - 3, y, rw + 6, (LIMB_TOP + LIMB_H) - y + 3);
    }
    const [dx, dy, dw, dh] = rects.down;
    ctx.fillRect(dx - 3, dy - 3, dw + 6, dh + 6);
  }
  ctx.restore();
}

/** Standard finish: curvature on every part, hem shadows, grain, then bleed. */
export function finish(ctx, { seed = 3, grainAmt = 6, curve = 0.15 } = {}) {
  curvature(ctx, 'torso', curve);
  curvature(ctx, 'rlimb', curve);
  curvature(ctx, 'llimb', curve);
  if (grainAmt) grain(ctx, grainAmt, seed);
  // one pass is exactly enough to fill the 2px gutters without smearing hems
  bleed(ctx, 1);
}

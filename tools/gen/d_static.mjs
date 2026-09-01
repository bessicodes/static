/* d_static.mjs — the STATIC house line: glitch, signal loss, broadcast failure. */

import * as L from './lib.mjs';

const CY = '#34E2E8', RD = '#E4221C';
const INK = L.hex('#0d0e10');
const PAPER = L.hex('#ece9e2');

/* -------------------------------------------------------------- devices --- */

/** Scanlines across a whole unrolled band. */
function scanlines(b, w, h, alpha = 0.14, step = 3) {
  b.fillStyle = `rgba(0,0,0,${alpha})`;
  for (let y = 0; y < h; y += step) b.fillRect(0, y, w, 1);
}

/** Dead-channel TV noise. Seamless because it is generated on the unrolled band. */
function tvNoise(b, w, h, seed = 7) {
  const img = b.createImageData(w, h);
  const d = img.data;
  const r = L.rng(seed);
  for (let y = 0; y < h; y++) {
    // horizontal streaks: keep a running value so noise reads as broadcast hash
    let run = 0, runLen = 0, v = 0;
    for (let x = 0; x < w; x++) {
      if (runLen <= 0) { v = 30 + r() * 200; runLen = 1 + (r() * 4 | 0); }
      runLen--;
      const n = L.clamp(v + (r() - 0.5) * 70);
      const i = (y * w + x) * 4;
      d[i] = d[i+1] = d[i+2] = n; d[i+3] = 255;
      run++;
    }
  }
  b.putImageData(img, 0, 0);
}

/** Displaced horizontal slices — the signal-tear device. */
function tearRows(b, w, h, seed = 3, count = 7, rgbSplit = true) {
  const r = L.rng(seed);
  for (let n = 0; n < count; n++) {
    const y = (r() * h) | 0;
    const sh = 2 + (r() * 7 | 0);
    const dx = ((r() - 0.5) * w * 0.35) | 0;
    const slice = L.surface(w, sh);
    slice.x.drawImage(b.canvas, 0, y, w, sh, 0, 0, w, sh);
    b.clearRect(0, y, w, sh);
    // wrap the displacement so the tear stays continuous around the body
    b.drawImage(slice.c, ((dx % w) + w) % w - w, y);
    b.drawImage(slice.c, ((dx % w) + w) % w, y);
    if (rgbSplit && r() > 0.45) {
      b.save();
      b.globalCompositeOperation = 'screen';
      b.globalAlpha = 0.55;
      b.fillStyle = r() > 0.5 ? CY : RD;
      b.fillRect(0, y, w, sh);
      b.restore();
    }
  }
}

/** SMPTE-style bars. 8 bars of 16px = 128 period, which divides 384 and 256. */
const BARS = ['#eceae4', '#d8d800', '#34E2E8', '#16b32a', '#c026d3', '#E4221C', '#1d4ed8', '#0d0e10'];
function colourBars(b, w, h) {
  const bw = 16;
  for (let u = 0; u < w; u += bw) {
    b.fillStyle = BARS[((u / bw) | 0) % BARS.length];
    b.fillRect(u, 0, bw, h);
  }
  // vertical falloff so it reads as fabric rather than flat vector
  const g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0.10)');
  g.addColorStop(0.5, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.26)');
  b.fillStyle = g; b.fillRect(0, 0, w, h);
}

/** STATIC set vertically down a sleeve, repeated so it reads on all four faces. */
function sleeveText(x, part, text, colour, len, size = 11) {
  // clamped to the sleeve: on a short sleeve an unclamped band puts the
  // wordmark on the wearer's bare forearm
  L.sleeveBand(x, part, 0.14, Math.max(0, len - 0.20), len, (b, w, h) => {
    b.save();
    b.font = `900 ${size}px ${L.HEAVY}`;
    b.textAlign = 'center'; b.textBaseline = 'middle';
    b.fillStyle = colour;
    // one hit per face keeps it upright and clear of every seam
    for (let f = 0; f < 4; f++) {
      const cx = f * (w / 4) + w / 8;
      b.save(); b.translate(cx, h / 2); b.rotate(-Math.PI / 2);
      let t = '';
      while (b.measureText(t + text + ' ').width < h * 0.9) t += (t ? ' ' : '') + text;
      b.fillText(t, 0, 0);
      b.restore();
    }
    b.restore();
  });
}

/** Cyan/red banding above the cuff, wrapping every face. */
function cuffBands(x, part, at = 0.72) {
  L.wrapBand(x, part, at, 0.05, (b, w, h) => { b.fillStyle = CY; b.fillRect(0, 0, w, h); });
  L.wrapBand(x, part, at + 0.07, 0.05, (b, w, h) => { b.fillStyle = RD; b.fillRect(0, 0, w, h); });
}

/* -------------------------------------------------------------- designs --- */

function coreTee(x, { body, ink, sleeve }) {
  L.shirtBody(x, sleeve, (b, w, h) => {
    b.fillStyle = L.rgb(body); b.fillRect(0, 0, w, h);
    L.weave(b, 0, 0, w, h, 0.035, 3);
    scanlines(b, w, h, 0.10);
  });
  L.shirtCaps(x, body, sleeve);

  // chest hit: small, kept well inside the front face
  L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
    L.splitText(c, 'STATIC', fx + fw / 2, fy + 34, fw * 0.52, 17, L.HEAVY,
                { core: L.rgb(ink), offset: 1.8 });
  });

  // back: full wordmark with tear bars through it
  L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
    L.splitText(c, 'STATIC', fx + fw / 2, fy + fh * 0.42, fw * 0.86, 34, L.HEAVY,
                { core: L.rgb(ink), offset: 3 });
    for (const [oy, ox] of [[-6, 9], [0, -12], [5, 7], [11, -6]]) {
      L.tearSlice(c, fx, fy + fh * 0.42 + oy, fw, 3, ox);
    }
    c.font = `700 8px ${L.MONO}`;
    c.textAlign = 'center'; c.fillStyle = L.rgba(ink, 0.55);
    c.fillText('NO SIGNAL — CH 00', fx + fw / 2, fy + fh * 0.42 + 30);
  });

  sleeveText(x, 'rlimb', 'STATIC', L.rgba(ink, 0.72), sleeve);
  sleeveText(x, 'llimb', 'STATIC', L.rgba(ink, 0.72), sleeve);
  L.hemShadow(x, 'torso');
}

export default {

  'ST1_STATIC_CORE_TEE_BLACK.png'(x) {
    coreTee(x, { body: INK, ink: PAPER, sleeve: L.SLEEVE.short });
    L.finish(x, { seed: 21, grainAmt: 7 });
  },

  'ST2_STATIC_CORE_LONGSLEEVE_WHITE.png'(x) {
    const body = PAPER, ink = L.hex('#14161a');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => {
      b.fillStyle = L.rgb(body); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.05, 3);
      scanlines(b, w, h, 0.045);
    });
    L.shirtCaps(x, body, L.SLEEVE.long);

    L.face(x, 'torso', 'front', (c, fx, fy, fw) => {
      L.splitText(c, 'STATIC', fx + fw / 2, fy + 34, fw * 0.5, 16, L.HEAVY,
                  { core: L.rgb(ink), offset: 1.8 });
    });
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      L.splitText(c, 'STATIC', fx + fw / 2, fy + fh * 0.42, fw * 0.86, 34, L.HEAVY,
                  { core: L.rgb(ink), offset: 3 });
      for (const [oy, ox] of [[-5, 8], [1, -10], [7, 6]]) {
        L.tearSlice(c, fx, fy + fh * 0.42 + oy, fw, 3, ox);
      }
    });
    for (const p of ['rlimb', 'llimb']) cuffBands(x, p, 0.70);
    L.hemShadow(x, 'torso');
    L.finish(x, { seed: 22, grainAmt: 5 });
  },

  'ST4_STATIC_INTERFERENCE_SHIRT.png'(x) {
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => {
      tvNoise(b, w, h, 9);
      tearRows(b, w, h, 5, 9);
      scanlines(b, w, h, 0.22, 3);
      // pull the contrast toward the brand's black-and-white core
      b.save();
      b.globalCompositeOperation = 'multiply';
      b.fillStyle = 'rgba(190,190,196,1)'; b.fillRect(0, 0, w, h);
      b.restore();
    });
    L.shirtCaps(x, L.hex('#6a6a70'), L.SLEEVE.long);
    L.finish(x, { seed: 24, grainAmt: 4, curve: 0.12 });
  },

  'ST5_STATIC_TEST_CARD_SHIRT.png'(x) {
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => {
      colourBars(b, w, h);
      tearRows(b, w, h, 11, 6, false);
    });
    L.shirtCaps(x, L.hex('#8a8a86'), L.SLEEVE.long);
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      c.save();
      c.fillStyle = 'rgba(13,14,16,0.82)';
      c.fillRect(fx + 10, fy + fh * 0.36, fw - 20, 34);
      L.splitText(c, 'STATIC', fx + fw / 2, fy + fh * 0.36 + 17, fw * 0.7, 22, L.HEAVY, { offset: 2.4 });
      c.restore();
    });
    L.finish(x, { seed: 25, grainAmt: 5, curve: 0.13 });
  },

  'ST7_STATIC_INTERFERENCE_PANTS.png'(x) {
    L.pantsBody(x, (b, w, h) => {
      tvNoise(b, w, h, 31);
      tearRows(b, w, h, 13, 8);
      scanlines(b, w, h, 0.22, 3);
      b.save();
      b.globalCompositeOperation = 'multiply';
      b.fillStyle = 'rgba(190,190,196,1)'; b.fillRect(0, 0, w, h);
      b.restore();
    }, L.WAIST, 0.9);
    // ribbed ankle cuff
    for (const p of ['rlimb', 'llimb']) {
      L.wrapBand(x, p, 0.9, 0.1, (b, w, h) => L.rib(b, 0, 0, w, h, L.hex('#26272b'), 4));
    }
    L.pantsCaps(x, L.hex('#26272b'));
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      L.splitText(c, 'STATIC', fx + fw / 2, fy + fh * 0.82, fw * 0.4, 13, L.HEAVY, { offset: 1.5 });
    });
    L.finish(x, { seed: 27, grainAmt: 4, curve: 0.12 });
  },

  'ST8_STATIC_TEST_CARD_PANTS.png'(x) {
    L.pantsBody(x, (b, w, h) => {
      colourBars(b, w, h);
      tearRows(b, w, h, 17, 5, false);
    }, L.WAIST, 0.9);
    for (const p of ['rlimb', 'llimb']) {
      L.wrapBand(x, p, 0.9, 0.1, (b, w, h) => L.rib(b, 0, 0, w, h, L.hex('#2a2b2f'), 4));
    }
    L.pantsCaps(x, L.hex('#2a2b2f'));
    L.finish(x, { seed: 28, grainAmt: 5, curve: 0.13 });
  }
};

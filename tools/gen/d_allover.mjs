/*
 * d_allover.mjs — seamless wrap-around prints.
 *
 * Every pattern here is generated on the UNROLLED band, so it is continuous
 * across the back, under the arms and over the shoulders with no seam anywhere.
 * Where a pattern repeats it uses a period that divides both 384 (torso) and
 * 256 (limb), so the shirt and the pants read as one continuous set.
 */

import * as L from './lib.mjs';

/* ------------------------------------------------------------ noise field -- */

/** Value noise that tiles horizontally over `period`, for seamless wraps. */
function tileNoise(w, h, period, octaves, seed) {
  const r = L.rng(seed);
  const field = new Float32Array(w * h);
  let amp = 1, total = 0;

  for (let o = 0; o < octaves; o++) {
    const cols = Math.max(2, Math.round(period / (1 << o) / 8));
    const rows = Math.max(2, Math.round(h / (1 << o) / 8));
    const grid = new Float32Array(cols * rows);
    for (let i = 0; i < grid.length; i++) grid[i] = r();

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const gx = (x / w) * cols, gy = (y / h) * rows;
        const x0 = Math.floor(gx), y0 = Math.floor(gy);
        const tx = gx - x0, ty = gy - y0;
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        // wrap on x so the field is continuous around the body
        const xa = ((x0 % cols) + cols) % cols, xb = (xa + 1) % cols;
        const ya = Math.min(y0, rows - 1), yb = Math.min(y0 + 1, rows - 1);
        const v = (grid[ya*cols+xa]*(1-sx) + grid[ya*cols+xb]*sx) * (1-sy)
                + (grid[yb*cols+xa]*(1-sx) + grid[yb*cols+xb]*sx) * sy;
        field[y*w+x] += v * amp;
      }
    }
    total += amp; amp *= 0.5;
  }
  for (let i = 0; i < field.length; i++) field[i] /= total;
  return field;
}

/** Paints a band from a per-pixel colour function. */
function pixels(b, w, h, fn) {
  const img = b.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = fn(x, y);
      const i = (y * w + x) * 4;
      d[i] = c[0]; d[i+1] = c[1]; d[i+2] = c[2]; d[i+3] = c.length > 3 ? c[3] : 255;
    }
  }
  b.putImageData(img, 0, 0);
}

/* -------------------------------------------------------------- patterns -- */

/**
 * Fire climbing from the hem.
 *
 * Each column gets its own flame height from tiling noise, so the fire breaks
 * into tongues instead of a solid block, and the white-hot core stays thin.
 */
function flames(b, w, h, seed) {
  const tall = tileNoise(w, h, w, 3, seed);          // how far this column burns
  const turb = tileNoise(w, h, w, 5, seed + 91);     // breaks the front up
  pixels(b, w, h, (x, y) => {
    const above = (h - y) / h;                       // 0 at the hem, 1 at the top
    // sample the height field near the hem so a column has one coherent tongue
    const top = 0.20 + tall[((h - 1) | 0) * w + x] * 0.62;
    const wobble = (turb[y*w+x] - 0.5) * 0.20;
    const heat = L.clamp(1 - (above + wobble) / top, 0, 1);
    if (heat <= 0.015) return [9, 7, 9, 255];
    let c;
    if (heat < 0.40)      c = L.mix([32, 8, 8],    [176, 26, 10],  heat / 0.40);
    else if (heat < 0.72) c = L.mix([176, 26, 10], [242, 122, 16], (heat - 0.40) / 0.32);
    else if (heat < 0.92) c = L.mix([242, 122, 16],[255, 206, 74], (heat - 0.72) / 0.20);
    else                  c = L.mix([255, 206, 74],[255, 248, 214],(heat - 0.92) / 0.08);
    return [c[0], c[1], c[2], 255];
  });
}

function nebula(b, w, h, seed) {
  const a = tileNoise(w, h, w, 5, seed);
  const c2 = tileNoise(w, h, w, 4, seed + 41);
  const c3 = tileNoise(w, h, w, 3, seed + 77);
  const r = L.rng(seed + 5);
  pixels(b, w, h, (x, y) => {
    const n = a[y*w+x], m = c2[y*w+x], k = c3[y*w+x];
    let col = L.mix([9, 6, 22], [86, 24, 140], L.clamp(n * 1.7, 0, 1));
    col = L.mix(col, [196, 42, 152], L.clamp((m - 0.42) * 2.1, 0, 1) * 0.8);
    col = L.mix(col, [46, 196, 226], L.clamp((k - 0.58) * 2.4, 0, 1) * 0.62);
    return [col[0], col[1], col[2], 255];
  });
  // stars, scattered on the band so they wrap too
  for (let i = 0; i < w * h * 0.0022; i++) {
    const sx = r() * w, sy = r() * h, s = r();
    b.fillStyle = `rgba(255,255,255,${0.35 + s * 0.6})`;
    const rad = s > 0.93 ? 1.6 : 0.8;
    b.beginPath(); b.arc(sx, sy, rad, 0, 7); b.fill();
  }
}

function magma(b, w, h, seed) {
  const cellN = tileNoise(w, h, w, 3, seed);
  const fine = tileNoise(w, h, w, 5, seed + 23);
  // crack field: ridged noise gives vein-like lines
  pixels(b, w, h, (x, y) => {
    const n = cellN[y*w+x], f = fine[y*w+x];
    const ridge = Math.abs(n - 0.5) * 2;                 // 0 on the crack line
    const crack = L.clamp(1 - ridge * 5.5, 0, 1);
    const rock = L.mix([16, 14, 15], [46, 42, 44], f);
    if (crack < 0.02) return [rock[0], rock[1], rock[2], 255];
    const glow = Math.pow(crack, 0.7);
    let c = L.mix(rock, [168, 32, 8], L.clamp(glow * 1.6, 0, 1));
    c = L.mix(c, [255, 132, 22], L.clamp((glow - 0.34) * 2.2, 0, 1));
    c = L.mix(c, [255, 240, 190], L.clamp((glow - 0.76) * 3.4, 0, 1));
    return [c[0], c[1], c[2], 255];
  });
  // heat rising from the hem
  const g = b.createLinearGradient(0, h, 0, h * 0.45);
  g.addColorStop(0, 'rgba(255,120,20,0.30)');
  g.addColorStop(1, 'rgba(255,120,20,0)');
  b.fillStyle = g; b.fillRect(0, 0, w, h);
}

/**
 * Circuit board. Traces sit on a 16px lattice, which divides both 384 and 256.
 *
 * Every element is drawn three times at -w / 0 / +w with the RNG re-seeded each
 * pass, so a trace that runs off the right of the band reappears on the left and
 * the board stays continuous around the wrap seam.
 */
function circuit(b, w, h, seed) {
  const step = 16;
  b.fillStyle = '#06110d'; b.fillRect(0, 0, w, h);
  b.lineCap = 'square';

  const traces = (off, pass) => {
    const r = L.rng(seed + pass * 17);
    const colour = pass ? '#34E2E8' : '#2ee66a';
    b.strokeStyle = colour; b.shadowColor = colour;
    for (let gy = 0; gy < h; gy += step) {
      for (let gx = 0; gx < w; gx += step) {
        if (r() > 0.45) continue;
        b.globalAlpha = 0.5 + r() * 0.5;
        b.lineWidth = r() > 0.7 ? 2.2 : 1.2;
        b.shadowBlur = 5;
        const horiz = r() > 0.5;
        const len = step * (1 + (r() * 2 | 0));
        const elbow = r() > 0.55;
        const X = gx + off;
        b.beginPath();
        if (horiz) { b.moveTo(X, gy); b.lineTo(X + len, gy); if (elbow) b.lineTo(X + len, gy + step); }
        else       { b.moveTo(X, gy); b.lineTo(X, gy + len); if (elbow) b.lineTo(X + step, gy + len); }
        b.stroke();
      }
    }
  };

  const parts = (off) => {
    const r = L.rng(seed + 991);
    for (let gy = 0; gy < h; gy += step) {
      for (let gx = 0; gx < w; gx += step) {
        const q = r();
        const X = gx + off;
        if (q > 0.9) {
          b.fillStyle = 'rgba(52,226,232,0.85)';
          b.beginPath(); b.arc(X, gy, 2.4, 0, 7); b.fill();
          b.fillStyle = '#06110d';
          b.beginPath(); b.arc(X, gy, 1.1, 0, 7); b.fill();
        } else if (q > 0.86) {
          b.fillStyle = '#0d1a16'; b.strokeStyle = 'rgba(46,230,106,0.7)'; b.lineWidth = 1;
          b.fillRect(X - 5, gy - 3, 10, 6); b.strokeRect(X - 5, gy - 3, 10, 6);
        }
      }
    }
  };

  for (const off of [-w, 0, w]) for (const pass of [0, 1]) traces(off, pass);
  b.shadowBlur = 0; b.globalAlpha = 1;
  for (const off of [-w, 0, w]) parts(off);
}

/** Molten chrome: shaded from a height field so highlights bend like metal. */
function chrome(b, w, h, seed) {
  const f = tileNoise(w, h, w, 4, seed);
  const g2 = tileNoise(w, h, w, 5, seed + 13);
  const at = (x, y) => {
    const xx = ((x % w) + w) % w, yy = L.clamp(y, 0, h - 1) | 0;
    return f[yy*w+xx] * 0.7 + g2[yy*w+xx] * 0.3;
  };
  pixels(b, w, h, (x, y) => {
    // gradient of the height field -> surface normal -> reflection band
    const dx = at(x + 1, y) - at(x - 1, y);
    const dy = at(x, y + 1) - at(x, y - 1);
    const n = L.clamp((dx * 8 + dy * 4 + 0.5), 0, 1);
    const band = (Math.sin(n * Math.PI * 3.1) + 1) / 2;      // stacked reflections
    let c = L.mix([28, 32, 40], [232, 238, 246], Math.pow(band, 0.75));
    // oil-slick iridescence keyed off the slope
    const hue = (n * 5.2 + at(x, y) * 2.4) % 1;
    const irid = [
      128 + 127 * Math.sin(6.28 * hue),
      128 + 127 * Math.sin(6.28 * hue + 2.1),
      128 + 127 * Math.sin(6.28 * hue + 4.2)
    ];
    c = L.mix(c, irid, 0.26 * Math.pow(band, 0.5));
    return [c[0], c[1], c[2], 255];
  });
}

/* --------------------------------------------------------------- builders -- */

/**
 * Fills a cap by stretching the very edge of the pattern band over it, so the
 * shoulder or hem underside continues the colour of whatever it adjoins instead
 * of restarting the pattern at a wrong scale.
 */
function capFromBand(x, part, which, paint, edge) {
  const rects = part === 'torso' ? L.TORSO : part === 'rlimb' ? L.RLIMB : L.LLIMB;
  const [rx, ry, rw, rh] = rects[which];
  const circ = L.circOf(part), bh = 128;
  const band = L.surface(circ, bh);
  paint(band.x, circ, bh, part);
  // crop at 1:1 rather than stretching a thin slice, which would smear the
  // pattern into vertical streaks across the cap
  const sh = Math.min(rh + 4, bh);
  const sy = edge === 'top' ? 0 : bh - sh;
  x.drawImage(band.c, 0, sy, rw + 4, sh, rx - 2, ry - 2, rw + 4, rh + 4);
}

function alloverShirt(x, paint, capColour, seed) {
  L.shirtBody(x, L.SLEEVE.long, paint);
  L.shirtCaps(x, capColour, L.SLEEVE.long);
  // shoulders take the top of the pattern, the hem underside takes the bottom
  capFromBand(x, 'torso', 'up', paint, 'top');
  capFromBand(x, 'torso', 'down', paint, 'bottom');
  capFromBand(x, 'rlimb', 'up', paint, 'top');
  capFromBand(x, 'llimb', 'up', paint, 'top');
  L.finish(x, { seed, grainAmt: 5, curve: 0.14 });
}

function alloverPants(x, paint, cuff, seed) {
  L.pantsBody(x, paint, L.WAIST, 0.9);
  for (const p of ['rlimb', 'llimb']) {
    L.wrapBand(x, p, 0.9, 0.1, (b, w, h) => L.rib(b, 0, 0, w, h, cuff, 4));
  }
  L.pantsCaps(x, cuff);
  capFromBand(x, 'torso', 'down', paint, 'bottom');
  capFromBand(x, 'rlimb', 'up', paint, 'top');
  capFromBand(x, 'llimb', 'up', paint, 'top');
  L.finish(x, { seed, grainAmt: 5, curve: 0.14 });
}

export default {

  'S24_INFERNO_FLAME_WRAP.png'(x) {
    alloverShirt(x, (b, w, h) => flames(b, w, h, 101), L.hex('#1a0d0b'), 41);
  },
  'P13_INFERNO_FLAME_WRAP.png'(x) {
    alloverPants(x, (b, w, h) => flames(b, w, h, 103), L.hex('#241110'), 42);
  },

  'S25_NEBULA_GALAXY_WRAP.png'(x) {
    alloverShirt(x, (b, w, h) => nebula(b, w, h, 201), L.hex('#160c2a'), 43);
  },
  'P14_NEBULA_GALAXY_WRAP.png'(x) {
    alloverPants(x, (b, w, h) => nebula(b, w, h, 203), L.hex('#1d1136'), 44);
  },

  'S26_MAGMA_LAVA_CRACK.png'(x) {
    alloverShirt(x, (b, w, h) => magma(b, w, h, 301), L.hex('#1b1718'), 45);
  },
  'P15_MAGMA_LAVA_CRACK.png'(x) {
    alloverPants(x, (b, w, h) => magma(b, w, h, 303), L.hex('#221d1e'), 46);
  },

  'S27_OVERCLOCK_CIRCUIT.png'(x) {
    alloverShirt(x, (b, w, h) => circuit(b, w, h, 401), L.hex('#08150f'), 47);
  },
  'P16_OVERCLOCK_CIRCUIT.png'(x) {
    alloverPants(x, (b, w, h) => circuit(b, w, h, 403), L.hex('#0a1a13'), 48);
  },

  'S28_LIQUID_CHROME.png'(x) {
    alloverShirt(x, (b, w, h) => chrome(b, w, h, 501), L.hex('#8e97a4'), 49);
  },
  'P17_LIQUID_CHROME.png'(x) {
    alloverPants(x, (b, w, h) => chrome(b, w, h, 503), L.hex('#7d8794'), 50);
  }
};

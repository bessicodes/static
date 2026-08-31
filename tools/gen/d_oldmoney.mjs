/* d_oldmoney.mjs — tailoring, knitwear and country pieces. Quiet colour, real cloth. */

import * as L from './lib.mjs';

/* --------------------------------------------------------------- cloths --- */

/** Herringbone: the classic broken-twill chevron, tiled so it wraps. */
export function herringbone(b, w, h, base, seed = 3) {
  b.fillStyle = L.rgb(base); b.fillRect(0, 0, w, h);
  const band = 8;                                   // divides 384 and 256
  b.lineWidth = 1;
  for (let row = 0; row < h; row += band) {
    const dir = ((row / band) | 0) % 2 ? 1 : -1;
    for (let i = -band; i < w + band; i += 3) {
      b.strokeStyle = L.rgba(L.shade(base, -0.20), 0.55);
      b.beginPath();
      b.moveTo(i, row + band); b.lineTo(i + dir * band, row);
      b.stroke();
      b.strokeStyle = L.rgba(L.shade(base, 0.22), 0.35);
      b.beginPath();
      b.moveTo(i + 1.4, row + band); b.lineTo(i + 1.4 + dir * band, row);
      b.stroke();
    }
  }
  const r = L.rng(seed);
  b.fillStyle = L.rgba(L.shade(base, -0.3), 0.25);
  for (let i = 0; i < w * h * 0.02; i++) b.fillRect(r() * w, r() * h, 1, 1);
}

/** Argyle. Diamond grid is 64 wide, which divides both 384 and 256 exactly. */
export function argyle(b, w, h, bg, d1, d2, line) {
  b.fillStyle = L.rgb(bg); b.fillRect(0, 0, w, h);
  const gw = 64, gh = 40;
  const diamond = (cx, cy, colour, sx = 1) => {
    b.fillStyle = L.rgb(colour);
    b.beginPath();
    b.moveTo(cx, cy - gh / 2 * sx); b.lineTo(cx + gw / 2 * sx, cy);
    b.lineTo(cx, cy + gh / 2 * sx); b.lineTo(cx - gw / 2 * sx, cy);
    b.closePath(); b.fill();
  };
  for (let cy = -gh; cy < h + gh; cy += gh) {
    for (let cx = -gw; cx < w + gw; cx += gw) {
      const odd = (((cx / gw) | 0) + ((cy / gh) | 0)) % 2 !== 0;
      diamond(cx, cy, odd ? d1 : d2);
      diamond(cx + gw / 2, cy + gh / 2, odd ? d2 : d1);
    }
  }
  // wine overstitch running both diagonals
  b.strokeStyle = L.rgba(line, 0.9);
  b.lineWidth = 1.4;
  b.setLineDash([4, 3]);
  for (let cx = -gw; cx < w + gw; cx += gw / 2) {
    b.beginPath();
    b.moveTo(cx, -gh); b.lineTo(cx + (h + gh * 2) * (gw / 2) / gh, h + gh); b.stroke();
    b.beginPath();
    b.moveTo(cx, -gh); b.lineTo(cx - (h + gh * 2) * (gw / 2) / gh, h + gh); b.stroke();
  }
  b.setLineDash([]);
}

/** Vertical braided cables, as on a cricket sweater. */
export function cables(b, w, h, base) {
  b.fillStyle = L.rgb(base); b.fillRect(0, 0, w, h);
  L.knit(b, 0, 0, w, h, L.shade(base, 0.3), L.shade(base, -0.3), 5, 4);
  const step = 32;                                    // divides 384 and 256
  for (let cx = 0; cx < w; cx += step) {
    // rope shading either side of the cable
    const g = b.createLinearGradient(cx - 9, 0, cx + 9, 0);
    g.addColorStop(0, L.rgba(L.shade(base, -0.30), 0.75));
    g.addColorStop(0.5, L.rgba(L.shade(base, 0.26), 0.85));
    g.addColorStop(1, L.rgba(L.shade(base, -0.30), 0.75));
    b.fillStyle = g; b.fillRect(cx - 9, 0, 18, h);
    // the plait itself
    b.strokeStyle = L.rgba(L.shade(base, -0.34), 0.7);
    b.lineWidth = 2;
    for (let y = -12; y < h + 12; y += 12) {
      b.beginPath(); b.moveTo(cx - 7, y); b.quadraticCurveTo(cx, y + 6, cx + 7, y + 12); b.stroke();
      b.beginPath(); b.moveTo(cx + 7, y); b.quadraticCurveTo(cx, y + 6, cx - 7, y + 12); b.stroke();
    }
  }
}

/** Diamond quilting for field and puffer jackets. Period divides the wrap. */
export function quilting(b, w, h, base, cell = 32) {
  b.fillStyle = L.rgb(base); b.fillRect(0, 0, w, h);
  for (let cy = -cell; cy < h + cell; cy += cell) {
    for (let cx = -cell; cx < w + cell; cx += cell) {
      // puff each cell so the panels read as padded
      const g = b.createRadialGradient(cx + cell/2, cy + cell/2, 2, cx + cell/2, cy + cell/2, cell * 0.8);
      g.addColorStop(0, L.rgba(L.shade(base, 0.18), 0.9));
      g.addColorStop(1, L.rgba(L.shade(base, -0.22), 0.9));
      b.fillStyle = g;
      b.save();
      b.translate(cx + cell/2, cy + cell/2); b.rotate(Math.PI/4);
      b.fillRect(-cell*0.36, -cell*0.36, cell*0.72, cell*0.72);
      b.restore();
    }
  }
  // stitch lines on both diagonals
  b.strokeStyle = L.rgba(L.shade(base, -0.45), 0.75);
  b.lineWidth = 1.1;
  b.setLineDash([3, 2]);
  for (let i = -h; i < w + h; i += cell) {
    b.beginPath(); b.moveTo(i, 0); b.lineTo(i + h, h); b.stroke();
    b.beginPath(); b.moveTo(i, h); b.lineTo(i + h, 0); b.stroke();
  }
  b.setLineDash([]);
}

/* ------------------------------------------------------- tailoring parts --- */

/** Peak or notch lapels with a shirt and tie underneath, on the torso front. */
export function jacketFront(c, fx, fy, fw, fh, o) {
  const midX = fx + fw / 2;
  // shirt panel
  c.fillStyle = L.rgb(o.shirt);
  c.fillRect(midX - 20, fy, 40, fh * 0.62);
  // collar
  c.fillStyle = L.rgb(L.shade(o.shirt, -0.10));
  c.beginPath();
  c.moveTo(midX - 20, fy); c.lineTo(midX, fy + 16); c.lineTo(midX + 20, fy);
  c.closePath(); c.fill();

  if (o.tie) {
    c.fillStyle = L.rgb(o.tie);
    c.beginPath();
    c.moveTo(midX - 6, fy + 14); c.lineTo(midX + 6, fy + 14);
    c.lineTo(midX + 8, fy + fh * 0.60); c.lineTo(midX, fy + fh * 0.66);
    c.lineTo(midX - 8, fy + fh * 0.60);
    c.closePath(); c.fill();
    if (o.tieStripe) {
      c.save(); c.clip();
      c.strokeStyle = L.rgba(o.tieStripe, 0.95); c.lineWidth = 3;
      for (let i = -40; i < 80; i += 10) {
        c.beginPath(); c.moveTo(midX - 14 + i, fy + 8); c.lineTo(midX - 14 + i + 30, fy + fh * 0.7); c.stroke();
      }
      c.restore();
    }
    // knot
    c.fillStyle = L.rgb(L.shade(o.tie, -0.16));
    c.fillRect(midX - 5, fy + 12, 10, 8);
  }

  // lapels
  const lap = (dir) => {
    c.fillStyle = L.rgb(o.lapel);
    c.beginPath();
    c.moveTo(midX + dir * 22, fy);
    if (o.peak) {
      c.lineTo(midX + dir * 46, fy + 6);
      c.lineTo(midX + dir * 30, fy + 22);
      c.lineTo(midX + dir * 40, fy + 30);
    } else {
      c.lineTo(midX + dir * 44, fy + 10);
      c.lineTo(midX + dir * 30, fy + 26);
    }
    c.lineTo(midX + dir * 12, fy + fh * 0.55);
    c.lineTo(midX + dir * 4, fy + fh * 0.34);
    c.closePath(); c.fill();
    c.strokeStyle = L.rgba(L.shade(o.lapel, -0.4), 0.7); c.lineWidth = 1; c.stroke();
  };
  lap(-1); lap(1);

  // buttons
  const bx = o.doubleBreasted ? [midX - 16, midX + 16] : [midX + 12];
  const rows = o.doubleBreasted ? 2 : 3;
  for (let r = 0; r < rows; r++) {
    const by = fy + fh * (o.doubleBreasted ? 0.58 + r * 0.13 : 0.60 + r * 0.10);
    for (const X of bx) {
      c.fillStyle = L.rgb(o.button);
      c.beginPath(); c.arc(X, by, 3.4, 0, 7); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 0.8; c.stroke();
    }
  }

  // welt pockets
  c.fillStyle = L.rgba(L.shade(o.lapel, -0.45), 0.85);
  c.fillRect(fx + 12, fy + fh * 0.68, 28, 4);
  c.fillRect(fx + fw - 40, fy + fh * 0.68, 28, 4);

  if (o.pocketSquare) {
    c.fillStyle = L.rgb(o.pocketSquare);
    c.fillRect(fx + fw - 40, fy + fh * 0.40, 16, 5);
  }
}

/** Cuff detail on both sleeves: buttons, turnback, or a shirt cuff showing. */
export function sleeveCuffs(x, o) {
  for (const part of ['rlimb', 'llimb']) {
    if (o.turnback) {
      L.wrapBand(x, part, 0.70, 0.14, (b, w, h) => {
        b.fillStyle = L.rgb(L.shade(o.colour, 0.10)); b.fillRect(0, 0, w, h);
        b.fillStyle = 'rgba(0,0,0,0.22)'; b.fillRect(0, 0, w, 2);
      });
    }
    if (o.shirtCuff) {
      L.wrapBand(x, part, 0.80, 0.06, (b, w, h) => {
        b.fillStyle = L.rgb(o.shirtCuff); b.fillRect(0, 0, w, h);
      });
    }
    // buttons sit on one face only, clear of the seams
    const u = L.faceU(part, 'front');
    L.wrapBand(x, part, 0.66, 0.16, (b, w, h) => {
      b.fillStyle = L.rgb(o.button);
      for (let i = 0; i < (o.cuffButtons || 0); i++) {
        b.beginPath(); b.arc(u + 32, 4 + i * 6, 2.2, 0, 7); b.fill();
      }
    });
  }
}

/** Waistband with belt and buckle, on the lower torso. */
export function beltBand(x, colour, buckle) {
  L.wrapBand(x, 'torso', L.WAIST, 0.11, (b, w, h) => {
    b.fillStyle = L.rgb(colour); b.fillRect(0, 0, w, h);
    b.fillStyle = 'rgba(0,0,0,0.28)'; b.fillRect(0, h - 2, w, 2);
    b.fillStyle = 'rgba(255,255,255,0.10)'; b.fillRect(0, 1, w, 1);
    // loops all the way round
    b.fillStyle = L.rgba(L.shade(colour, -0.4), 0.8);
    for (let u = 8; u < w; u += 48) b.fillRect(u, 0, 4, h);
  });
  const u = L.faceU('torso', 'front');
  L.wrapBand(x, 'torso', L.WAIST + 0.01, 0.08, (b) => {
    b.fillStyle = L.rgb(buckle);
    b.fillRect(u + 58, 1, 12, 9);
    b.fillStyle = 'rgba(0,0,0,0.5)';
    b.fillRect(u + 61, 4, 6, 3);
  });
}

/** Pressed crease down the front of each trouser leg. */
export function crease(x, colour) {
  for (const part of ['rlimb', 'llimb']) {
    const u = L.faceU(part, 'front');
    L.wrapBand(x, part, 0, 1, (b, w, h) => {
      b.fillStyle = L.rgba(L.shade(colour, 0.30), 0.55);
      b.fillRect(u + 31, 0, 2, h);
      b.fillStyle = L.rgba(L.shade(colour, -0.22), 0.4);
      b.fillRect(u + 33, 0, 1, h);
    });
  }
}

export function turnUp(x, colour) {
  for (const part of ['rlimb', 'llimb']) {
    L.wrapBand(x, part, 0.88, 0.12, (b, w, h) => {
      b.fillStyle = L.rgb(L.shade(colour, -0.10)); b.fillRect(0, 0, w, h);
      b.fillStyle = 'rgba(0,0,0,0.30)'; b.fillRect(0, 0, w, 2);
      b.fillStyle = 'rgba(255,255,255,0.10)'; b.fillRect(0, 3, w, 1);
    });
  }
}

/* -------------------------------------------------------------- designs --- */

export default {

  'OM1_CAMBRIDGE_CAMEL_OVERCOAT.png'(x) {
    const camel = L.hex('#b8874e'), horn = L.hex('#4a2f1c');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => herringbone(b, w, h, camel, 7));
    L.shirtCaps(x, camel, L.SLEEVE.long);

    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      jacketFront(c, fx, fy, fw, fh, {
        shirt: L.hex('#e8e2d4'), tie: L.hex('#5a3b26'), lapel: L.shade(camel, -0.06),
        button: horn, peak: true, doubleBreasted: true
      });
    });
    // buttoned half-belt across the back
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      c.fillStyle = L.rgb(L.shade(camel, -0.14));
      c.fillRect(fx + 24, fy + fh * 0.58, fw - 48, 10);
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1;
      c.strokeRect(fx + 24, fy + fh * 0.58, fw - 48, 10);
      c.fillStyle = L.rgb(horn);
      for (const bx of [fx + 40, fx + fw - 40]) {
        c.beginPath(); c.arc(bx, fy + fh * 0.58 + 5, 3, 0, 7); c.fill();
      }
      // centre vent
      c.fillStyle = 'rgba(0,0,0,0.30)';
      c.fillRect(fx + fw/2 - 1, fy + fh * 0.72, 2, fh * 0.28);
    });
    sleeveCuffs(x, { colour: camel, button: horn, cuffButtons: 3, turnback: true });
    L.hemShadow(x, 'torso');
    L.finish(x, { seed: 61, grainAmt: 6 });
  },

  'OM2_REGATTA_CLUB_BLAZER.png'(x) {
    const navy = L.hex('#1e2c48'), gold = L.hex('#c9a227');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => {
      b.fillStyle = L.rgb(navy); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.10, 4);               // hopsack is a coarse basket weave
    });
    L.shirtCaps(x, navy, L.SLEEVE.long);

    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      jacketFront(c, fx, fy, fw, fh, {
        shirt: L.hex('#f0ece1'), tie: L.hex('#7a1f2b'), tieStripe: L.hex('#d9c46a'),
        lapel: L.shade(navy, 0.05), button: gold, peak: false, pocketSquare: L.hex('#f0ece1')
      });
      // crest on the breast pocket
      c.fillStyle = L.rgb(gold);
      c.beginPath();
      c.moveTo(fx + 26, fy + fh * 0.36); c.lineTo(fx + 42, fy + fh * 0.36);
      c.lineTo(fx + 42, fy + fh * 0.46); c.lineTo(fx + 34, fy + fh * 0.52);
      c.lineTo(fx + 26, fy + fh * 0.46);
      c.closePath(); c.fill();
      c.fillStyle = L.rgb(L.shade(navy, -0.2));
      c.fillRect(fx + 31, fy + fh * 0.385, 6, 8);
    });
    sleeveCuffs(x, { colour: navy, button: gold, cuffButtons: 3, shirtCuff: L.hex('#f0ece1') });
    L.hemShadow(x, 'torso');
    L.finish(x, { seed: 62, grainAmt: 6 });
  },

  'OM3_BRAEMAR_ARGYLE_KNIT.png'(x) {
    const camel = L.hex('#c49a5f'), navy = L.hex('#243352'), wine = L.hex('#8d2436');
    const bg = L.hex('#ab8654');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => {
      argyle(b, w, h, bg, camel, navy, wine);
      L.knit(b, 0, 0, w, h, L.shade(camel, 0.3), L.shade(navy, -0.2), 5, 4);
    });
    L.shirtCaps(x, camel, L.SLEEVE.long);

    // V-neck over a shirt collar
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      c.fillStyle = L.rgb(L.hex('#efe9db'));
      c.beginPath();
      c.moveTo(fx + fw/2 - 22, fy); c.lineTo(fx + fw/2, fy + 30); c.lineTo(fx + fw/2 + 22, fy);
      c.closePath(); c.fill();
      c.strokeStyle = L.rgb(L.shade(navy, 0.05)); c.lineWidth = 5;
      c.beginPath();
      c.moveTo(fx + fw/2 - 24, fy - 2); c.lineTo(fx + fw/2, fy + 30); c.lineTo(fx + fw/2 + 24, fy - 2);
      c.stroke();
    });
    // ribbed trim at both cuffs and the hem
    for (const p of ['rlimb', 'llimb']) {
      L.wrapBand(x, p, 0.76, 0.10, (b, w, h) => L.rib(b, 0, 0, w, h, navy, 4));
    }
    L.wrapBand(x, 'torso', 0.90, 0.10, (b, w, h) => L.rib(b, 0, 0, w, h, navy, 4));
    L.finish(x, { seed: 63, grainAmt: 6 });
  },

  'S21_ROSEMEAD_CRICKET_KNIT.png'(x) {
    const cream = L.hex('#e6ded0'), navy = L.hex('#26365c'), wine = L.hex('#8b2333');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => cables(b, w, h, cream));
    L.shirtCaps(x, cream, L.SLEEVE.long);

    const clubTrim = (b, w, h) => {
      b.fillStyle = L.rgb(L.shade(cream, -0.05)); b.fillRect(0, 0, w, h);
      b.fillStyle = L.rgb(navy); b.fillRect(0, h * 0.30, w, h * 0.16);
      b.fillStyle = L.rgb(wine); b.fillRect(0, h * 0.52, w, h * 0.12);
    };
    for (const p of ['rlimb', 'llimb']) L.wrapBand(x, p, 0.74, 0.12, clubTrim);
    L.wrapBand(x, 'torso', 0.88, 0.12, clubTrim);

    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      c.fillStyle = L.rgb(L.hex('#f4f1e8'));
      c.beginPath();
      c.moveTo(fx + fw/2 - 22, fy); c.lineTo(fx + fw/2, fy + 30); c.lineTo(fx + fw/2 + 22, fy);
      c.closePath(); c.fill();
      c.lineWidth = 5; c.strokeStyle = L.rgb(navy);
      c.beginPath();
      c.moveTo(fx + fw/2 - 25, fy - 2); c.lineTo(fx + fw/2, fy + 31); c.lineTo(fx + fw/2 + 25, fy - 2);
      c.stroke();
      c.lineWidth = 2; c.strokeStyle = L.rgb(wine);
      c.beginPath();
      c.moveTo(fx + fw/2 - 30, fy - 2); c.lineTo(fx + fw/2, fy + 36); c.lineTo(fx + fw/2 + 30, fy - 2);
      c.stroke();
    });
    L.finish(x, { seed: 64, grainAmt: 6 });
  },

  'S22_CAP_FERRAT_LINEN_SHIRT.png'(x) {
    const sand = L.hex('#d9cbaa');
    L.shirtBody(x, L.SLEEVE.short, (b, w, h) => {
      b.fillStyle = L.rgb(sand); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.07, 3);
      // linen slub: irregular thick threads
      const r = L.rng(19);
      for (let i = 0; i < w * h * 0.012; i++) {
        b.fillStyle = L.rgba(L.shade(sand, r() > 0.5 ? 0.22 : -0.20), 0.5);
        b.fillRect(r() * w, r() * h, 1 + r() * 4, 1);
      }
    });
    L.shirtCaps(x, sand, L.SLEEVE.short);

    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      // open camp collar
      c.fillStyle = L.rgb(L.shade(sand, -0.12));
      c.beginPath();
      c.moveTo(fx + fw/2 - 26, fy); c.lineTo(fx + fw/2 - 6, fy + 20);
      c.lineTo(fx + fw/2 - 20, fy + 24); c.lineTo(fx + fw/2 - 34, fy + 4);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(fx + fw/2 + 26, fy); c.lineTo(fx + fw/2 + 6, fy + 20);
      c.lineTo(fx + fw/2 + 20, fy + 24); c.lineTo(fx + fw/2 + 34, fy + 4);
      c.closePath(); c.fill();
      // placket and shell buttons
      c.fillStyle = L.rgba(L.shade(sand, -0.16), 0.9);
      c.fillRect(fx + fw/2 - 5, fy + 16, 10, fh - 16);
      for (let i = 0; i < 4; i++) {
        c.fillStyle = L.rgb(L.hex('#f6f1e4'));
        c.beginPath(); c.arc(fx + fw/2, fy + 34 + i * 22, 2.6, 0, 7); c.fill();
      }
      // chest pocket
      c.strokeStyle = L.rgba(L.shade(sand, -0.3), 0.8); c.lineWidth = 1;
      c.strokeRect(fx + 22, fy + 34, 24, 20);
    });
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      c.fillStyle = L.rgba(L.shade(sand, -0.12), 0.9);
      c.fillRect(fx, fy + 22, fw, 3);                 // back yoke
    });
    sleeveCuffs(x, { colour: sand, button: sand, turnback: true, cuffButtons: 0 });
    L.hemShadow(x, 'torso');
    L.finish(x, { seed: 65, grainAmt: 7 });
  },

  'S23_HAWTHORNE_FIELD_JACKET.png'(x) {
    const olive = L.hex('#4e5334'), cord = L.hex('#8a6a3f'), brass = L.hex('#c8a43c');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => quilting(b, w, h, olive, 32));
    L.shirtCaps(x, olive, L.SLEEVE.long);

    // corduroy collar
    L.wrapBand(x, 'torso', 0, 0.12, (b, w, h) => {
      b.fillStyle = L.rgb(cord); b.fillRect(0, 0, w, h);
      L.wales(b, 0, 0, w, h, 4);
    });
    // corduroy cuffs
    for (const p of ['rlimb', 'llimb']) {
      L.wrapBand(x, p, 0.72, 0.13, (b, w, h) => {
        b.fillStyle = L.rgb(cord); b.fillRect(0, 0, w, h);
        L.wales(b, 0, 0, w, h, 4);
      });
    }
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      // storm placket with brass studs
      c.fillStyle = L.rgb(L.shade(olive, -0.16));
      c.fillRect(fx + fw/2 - 8, fy + 12, 16, fh - 12);
      for (let i = 0; i < 5; i++) {
        c.fillStyle = L.rgb(brass);
        c.beginPath(); c.arc(fx + fw/2, fy + 28 + i * 20, 2.6, 0, 7); c.fill();
      }
      // flapped pockets
      for (const px of [fx + 16, fx + fw - 48]) {
        c.fillStyle = L.rgb(L.shade(olive, -0.13));
        c.fillRect(px, fy + fh * 0.60, 32, 22);
        c.fillStyle = L.rgb(L.shade(olive, -0.26));
        c.fillRect(px, fy + fh * 0.60, 32, 8);
        c.fillStyle = L.rgb(brass);
        c.beginPath(); c.arc(px + 16, fy + fh * 0.60 + 8, 2.2, 0, 7); c.fill();
      }
    });
    L.hemShadow(x, 'torso');
    L.finish(x, { seed: 66, grainAmt: 6 });
  },

  'P11_CAMEL_PLEATED_TROUSERS.png'(x) {
    const camel = L.hex('#bd9a63');
    L.pantsBody(x, (b, w, h) => {
      b.fillStyle = L.rgb(camel); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.05, 3);
    });
    L.pantsCaps(x, camel);
    crease(x, camel);
    turnUp(x, camel);
    beltBand(x, L.hex('#6b4a2c'), L.hex('#c9a961'));
    // front pleats
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      c.fillStyle = L.rgba(L.shade(camel, -0.20), 0.55);
      c.fillRect(fx + fw/2 - 20, fy + fh * 0.74, 2, fh * 0.26);
      c.fillRect(fx + fw/2 + 18, fy + fh * 0.74, 2, fh * 0.26);
    });
    L.finish(x, { seed: 67, grainAmt: 6 });
  },

  'P12_TOBACCO_CORD_TROUSERS.png'(x) {
    const tob = L.hex('#7d5527');
    L.pantsBody(x, (b, w, h) => {
      b.fillStyle = L.rgb(tob); b.fillRect(0, 0, w, h);
      L.wales(b, 0, 0, w, h, 5);
    });
    L.pantsCaps(x, tob);
    turnUp(x, tob);
    beltBand(x, L.hex('#3f2a16'), L.hex('#caa43f'));
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      c.strokeStyle = L.rgba(L.shade(tob, -0.4), 0.8); c.lineWidth = 1.2;
      for (const px of [fx + 26, fx + fw - 56]) c.strokeRect(px, fy + fh * 0.74, 30, 20);
    });
    L.finish(x, { seed: 68, grainAmt: 6 });
  }
};

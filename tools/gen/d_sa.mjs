/* d_sa.mjs — Springveld: South African rugby kit. Green and gold, buck and protea. */

import * as L from './lib.mjs';

const GREEN = L.hex('#0d5c3a');
const GOLD  = L.hex('#d4a418');
const WHITE = L.hex('#f0f0ea');

/* ---------------------------------------------------------------- marks --- */

/** Simplified South African flag — the Y, both fimbriations, all six colours. */
function saFlag(c, x, y, w, h) {
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();

  c.fillStyle = '#de3831'; c.fillRect(x, y, w, h / 2);            // red top
  c.fillStyle = '#002395'; c.fillRect(x, y + h / 2, w, h / 2);    // blue bottom

  // white fimbriation of the Y
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(x, y); c.lineTo(x + w * 0.62, y + h / 2); c.lineTo(x, y + h);
  c.lineTo(x, y + h * 0.78); c.lineTo(x + w * 0.30, y + h / 2);
  c.lineTo(x, y + h * 0.22); c.closePath(); c.fill();
  c.fillRect(x + w * 0.30, y + h * 0.34, w * 0.7, h * 0.32);

  // green Y
  c.fillStyle = '#007a4d';
  c.beginPath();
  c.moveTo(x, y + h * 0.10); c.lineTo(x + w * 0.44, y + h / 2); c.lineTo(x, y + h * 0.90);
  c.lineTo(x, y + h * 0.70); c.lineTo(x + w * 0.18, y + h / 2);
  c.lineTo(x, y + h * 0.30); c.closePath(); c.fill();
  c.fillRect(x + w * 0.18, y + h * 0.40, w * 0.82, h * 0.20);

  // black hoist triangle with gold fimbriation
  c.fillStyle = '#ffb612';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + w * 0.34, y + h / 2); c.lineTo(x, y + h); c.closePath(); c.fill();
  c.fillStyle = '#000000';
  c.beginPath(); c.moveTo(x, y + h * 0.08); c.lineTo(x + w * 0.24, y + h / 2); c.lineTo(x, y + h * 0.92); c.closePath(); c.fill();

  c.restore();
}

/**
 * Leaping springbok, side profile, drawn as one bold silhouette.
 * Legs are tapered wedges rather than strokes so it stays readable at ~30px.
 */
function buck(c, cx, cy, s, colour) {
  c.save();
  c.translate(cx, cy); c.scale(s, s);
  c.fillStyle = L.rgb(colour);
  c.strokeStyle = L.rgb(colour);
  c.lineJoin = 'round';

  // legs first, so the body sits over the joints
  const leg = (x1, y1, x2, y2, w1, w2) => {
    const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
    c.beginPath();
    c.moveTo(x1 + Math.cos(a) * w1, y1 + Math.sin(a) * w1);
    c.lineTo(x2 + Math.cos(a) * w2, y2 + Math.sin(a) * w2);
    c.lineTo(x2 - Math.cos(a) * w2, y2 - Math.sin(a) * w2);
    c.lineTo(x1 - Math.cos(a) * w1, y1 - Math.sin(a) * w1);
    c.closePath(); c.fill();
  };
  // start each leg well inside the body mass so the joints never show a gap
  leg(-11, -4, -22,  6, 2.0, 0.9);      // rear pair, thrown back
  leg( -7, -3, -15, 11, 1.9, 0.85);
  leg(  4, -5,  17,  2, 1.9, 0.85);     // front pair, reaching forward
  leg(  7, -5,  14, 11, 1.9, 0.85);

  // body: arched back, deep chest, belly low enough to cover the leg joints
  c.beginPath();
  c.moveTo(-16, -3);
  c.quadraticCurveTo(-12, -11, -2, -11);      // arched back
  c.quadraticCurveTo(7, -11, 11, -16);        // neck base
  c.quadraticCurveTo(15, -20, 20, -23);       // head
  c.lineTo(22, -19);                          // muzzle
  c.quadraticCurveTo(16, -15, 13, -11);       // throat
  c.quadraticCurveTo(9, -5, 3, -1);           // chest
  c.quadraticCurveTo(-6, 2, -14, 1);          // belly
  c.closePath(); c.fill();

  // tail and horns
  c.lineWidth = 1.3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-16, -4); c.quadraticCurveTo(-22, -5, -24, -9); c.stroke();
  c.beginPath(); c.moveTo(19, -23); c.quadraticCurveTo(21, -30, 17, -33); c.stroke();
  c.beginPath(); c.moveTo(21, -22); c.quadraticCurveTo(24, -28, 21, -32); c.stroke();
  c.restore();
}

/** Protea shield badge. */
function protea(c, cx, cy, s, base, petal) {
  c.save();
  c.translate(cx, cy); c.scale(s, s);
  c.fillStyle = L.rgb(base);
  c.beginPath();
  c.moveTo(-9, -11); c.lineTo(9, -11); c.lineTo(9, 3);
  c.quadraticCurveTo(9, 11, 0, 14); c.quadraticCurveTo(-9, 11, -9, 3);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();
  c.fillStyle = L.rgb(petal);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.beginPath();
    c.ellipse(Math.cos(a) * 4, Math.sin(a) * 4 - 1, 2.6, 1.5, a, 0, 7);
    c.fill();
  }
  c.beginPath(); c.arc(0, -1, 2.2, 0, 7); c.fill();
  c.restore();
}

/** Fine technical mesh knit. */
function mesh(b, w, h, base) {
  b.fillStyle = L.rgb(base); b.fillRect(0, 0, w, h);
  b.fillStyle = L.rgba(L.shade(base, -0.24), 0.5);
  for (let y = 0; y < h; y += 3) for (let x = (y / 3) % 2 ? 0 : 1.5; x < w; x += 3) b.fillRect(x, y, 1.2, 1.2);
  b.fillStyle = L.rgba(L.shade(base, 0.20), 0.28);
  for (let y = 1; y < h; y += 3) for (let x = (y / 3) % 2 ? 1.5 : 0; x < w; x += 3) b.fillRect(x, y, 1, 1);
}

/**
 * Raglan shoulder yoke.
 *
 * Drawn as a wrap band rather than per-face, so the yoke runs continuously over
 * both shoulders and around the sides instead of stopping dead at a seam. The
 * yoke is deepest where the arms attach (the two side faces) and rises to a
 * shallow point at the centre of the chest and the centre of the back — which is
 * one full cosine cycle per shoulder, so period 192 over a 384 circumference.
 */
function raglan(x, colour) {
  L.wrapBand(x, 'torso', 0, 0.42, (b, w, h) => {
    const sideU = w === L.TORSO_CIRC ? 32 : w / 12;     // centre of the 'rt' face
    b.fillStyle = L.rgb(colour);
    for (let u = 0; u < w; u++) {
      const depth = 9 + 26 * (Math.cos((2 * Math.PI * (u - sideU)) / (w / 2)) * 0.5 + 0.5);
      b.fillRect(u, 0, 1, depth);
    }
  });
  // sleeve heads match, which is what makes it read as raglan rather than set-in
  for (const p of ['rlimb', 'llimb']) {
    L.wrapBand(x, p, 0, 0.12, (b, w, h) => {
      b.fillStyle = L.rgb(colour); b.fillRect(0, 0, w, h);
    });
    L.cap(x, p, 'up', L.rgb(L.shade(colour, 0.08)));
  }
  L.cap(x, 'torso', 'up', L.rgb(L.shade(colour, 0.06)));
}

/** Flag on every face of both sleeves, so it reads from any angle. */
function sleeveFlags(x, withBuck) {
  for (const part of ['rlimb', 'llimb']) {
    L.wrapBand(x, part, 0.16, 0.18, (b, w, h) => {
      for (let f = 0; f < 4; f++) {
        const cx = f * (w / 4) + w / 8;
        saFlag(b, cx - 13, 2, 26, 16);
        b.strokeStyle = 'rgba(0,0,0,0.35)'; b.lineWidth = 1;
        b.strokeRect(cx - 13, 2, 26, 16);
      }
    });
    if (withBuck) {
      // buck sits above the flag, near the shoulder, clear of the cuff band
      L.wrapBand(x, part, 0.015, 0.13, (b, w, h) => {
        for (let f = 0; f < 4; f++) buck(b, f * (w / 4) + w / 8, h / 2 + 5, 0.36, GOLD);
      });
    }
  }
}

function backNumber(x, num, name, colour, outline) {
  L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `900 54px ${L.HEAVY}`;
    c.lineWidth = 3; c.strokeStyle = L.rgb(outline);
    c.strokeText(num, fx + fw / 2, fy + fh * 0.64);
    c.fillStyle = L.rgb(colour);
    c.fillText(num, fx + fw / 2, fy + fh * 0.64);
    c.font = `900 12px ${L.HEAVY}`;
    c.fillStyle = L.rgb(colour);
    L.fitText(c, name, fx + fw / 2, fy + fh * 0.44, fw * 0.78, 13, L.HEAVY, L.rgb(colour), { track: 1.5 });
    c.restore();
  });
}

/* -------------------------------------------------------------- designs --- */

function jersey(x, o) {
  L.shirtBody(x, 0.50, (b, w, h) => mesh(b, w, h, o.body));
  L.shirtCaps(x, o.body, 0.50);
  raglan(x, o.shoulder);

  // polo collar all the way round
  L.wrapBand(x, 'torso', 0, 0.11, (b, w, h) => {
    b.fillStyle = L.rgb(o.collar); b.fillRect(0, 0, w, h);
    b.fillStyle = 'rgba(0,0,0,0.22)'; b.fillRect(0, h - 2, w, 2);
    if (o.collarText) {
      b.fillStyle = L.rgba(o.body, 0.85);
      b.font = `900 7px ${L.HEAVY}`; b.textAlign = 'center'; b.textBaseline = 'middle';
      for (let f = 0; f < 4; f++) b.fillText('SPRINGVELD', f * (w / 4) + w / 8, h / 2);
    }
  });
  // chevron trim band around the chest
  L.wrapBand(x, 'torso', 0.30, 0.06, (b, w, h) => {
    b.fillStyle = L.rgb(o.trim); b.fillRect(0, 0, w, h);
    b.fillStyle = L.rgba(o.body, 0.55);
    for (let u = 0; u < w; u += 16) {
      b.beginPath(); b.moveTo(u, h); b.lineTo(u + 8, 0); b.lineTo(u + 16, h); b.closePath(); b.fill();
    }
  });

  L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
    buck(c, fx + fw * 0.34, fy + fh * 0.56, 1.25, o.mark);
    protea(c, fx + fw * 0.64, fy + fh * 0.55, 1.15, o.shieldBase, o.shieldPetal);
    if (o.placket) {
      c.fillStyle = L.rgba(L.shade(o.body, -0.22), 0.9);
      c.fillRect(fx + fw / 2 - 7, fy + 12, 14, 34);
      c.fillStyle = L.rgb(o.collar);
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(fx + fw/2, fy + 20 + i * 11, 2.2, 0, 7); c.fill(); }
    }
  });

  if (o.sidePanels) {
    for (const side of ['lf', 'rt']) {
      L.face(x, 'torso', side, (c, fx, fy, fw, fh) => {
        const g = c.createLinearGradient(fx, 0, fx + fw, 0);
        g.addColorStop(0, L.rgba(o.shoulder, 0.0));
        g.addColorStop(0.5, L.rgba(o.shoulder, 0.85));
        g.addColorStop(1, L.rgba(o.shoulder, 0.0));
        c.fillStyle = g; c.fillRect(fx, fy + fh * 0.30, fw, fh * 0.62);
      });
    }
  }

  sleeveFlags(x, o.sleeveBuck);
  // cuff
  for (const p of ['rlimb', 'llimb']) {
    L.wrapBand(x, p, o.deepCuff ? 0.38 : 0.42, o.deepCuff ? 0.12 : 0.08, (b, w, h) => {
      b.fillStyle = L.rgb(o.collar); b.fillRect(0, 0, w, h);
    });
  }
  backNumber(x, o.number, 'SUID-AFRIKA', o.mark, o.body);
  L.hemShadow(x, 'torso');
  L.finish(x, { seed: o.seed, grainAmt: 5 });
}

export default {

  'SA1_SPRINGVELD_HOME_JERSEY.png'(x) {
    jersey(x, {
      body: GREEN, collar: GOLD, shoulder: L.shade(GREEN, -0.16), trim: GOLD, mark: GOLD,
      shieldBase: GOLD, shieldPetal: GREEN, number: '10', seed: 71
    });
  },

  'SA2_SPRINGVELD_ALT_JERSEY.png'(x) {
    jersey(x, {
      body: WHITE, collar: GREEN, shoulder: GOLD, trim: GREEN, mark: GREEN,
      shieldBase: GREEN, shieldPetal: GOLD, number: '7', seed: 72
    });
  },

  'SA4_SPRINGVELD_PRO_JERSEY.png'(x) {
    jersey(x, {
      body: GREEN, collar: GOLD, shoulder: L.shade(GREEN, -0.22), trim: GOLD, mark: GOLD,
      shieldBase: GOLD, shieldPetal: GREEN, number: '10', seed: 74,
      collarText: true, placket: true, sidePanels: true, sleeveBuck: true, deepCuff: true
    });
  },

  'SA3_SPRINGVELD_SHORTS_SOCKS.png'(x) {
    // shorts on the hips and upper leg, bare knee, then hooped socks
    L.wrapBand(x, 'torso', L.WAIST, 1 - L.WAIST, (b, w, h) => {
      b.fillStyle = L.rgb(GREEN); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.05, 3);
    });
    L.cap(x, 'torso', 'down', L.rgb(L.shade(GREEN, -0.3)));

    for (const part of ['rlimb', 'llimb']) {
      // shorts
      L.wrapBand(x, part, 0, 0.40, (b, w, h) => {
        b.fillStyle = L.rgb(GREEN); b.fillRect(0, 0, w, h);
        L.weave(b, 0, 0, w, h, 0.05, 3);
        b.fillStyle = L.rgb(GOLD); b.fillRect(0, h - 4, w, 4);       // hem trim
      });
      // gold side stripe down the outer seam of each leg
      const outer = L.faceU(part, part === 'rlimb' ? 'rt' : 'lf');
      L.wrapBand(x, part, 0, 0.40, (b, w, h) => {
        b.fillStyle = L.rgb(GOLD);
        b.fillRect(outer + 28, 0, 5, h);
      });
      L.cap(x, part, 'up', L.rgb(L.shade(GREEN, -0.1)));

      // hooped socks below the bare knee
      L.wrapBand(x, part, 0.58, 0.42, (b, w, h) => {
        b.fillStyle = L.rgb(GREEN); b.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 10) {
          b.fillStyle = L.rgb(y % 20 === 0 ? GOLD : GREEN);
          b.fillRect(0, y, w, 5);
        }
        L.rib(b, 0, 0, w, 6, GOLD, 3);                                 // turnover top
      });
      L.cap(x, part, 'down', L.rgb(L.shade(GREEN, -0.4)));
    }
    L.finish(x, { seed: 73, grainAmt: 5 });
  }
};

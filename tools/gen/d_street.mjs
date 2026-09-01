/* d_street.mjs — jackets, jerseys, alt and Y2K pieces. */

import * as L from './lib.mjs';
import { jacketFront, sleeveCuffs, quilting } from './d_oldmoney.mjs';

/* -------------------------------------------------------------- surfaces --- */

/** Buffalo check. 32px repeat divides both 384 and 256. */
function plaid(b, w, h, a, c2, cell = 32) {
  b.fillStyle = L.rgb(a); b.fillRect(0, 0, w, h);
  b.fillStyle = L.rgba(c2, 0.92);
  for (let y = 0; y < h; y += cell * 2) b.fillRect(0, y, w, cell);
  for (let u = 0; u < w; u += cell * 2) b.fillRect(u, 0, cell, h);
  // overlap squares go darker, the way real check does
  b.fillStyle = L.rgba(L.shade(c2, -0.35), 0.55);
  for (let y = 0; y < h; y += cell * 2)
    for (let u = 0; u < w; u += cell * 2) b.fillRect(u, y, cell, cell);
  b.strokeStyle = 'rgba(0,0,0,0.10)'; b.lineWidth = 1;
  for (let y = 0; y < h; y += cell) { b.beginPath(); b.moveTo(0, y); b.lineTo(w, y); b.stroke(); }
  for (let u = 0; u < w; u += cell) { b.beginPath(); b.moveTo(u, 0); b.lineTo(u, h); b.stroke(); }
}

/** Horizontal padded channels for a puffer. */
function channels(b, w, h, base, count = 6) {
  const ch = h / count;
  for (let i = 0; i < count; i++) {
    const g = b.createLinearGradient(0, i * ch, 0, (i + 1) * ch);
    g.addColorStop(0,    L.rgb(L.shade(base, -0.30)));
    g.addColorStop(0.30, L.rgb(L.shade(base, 0.16)));
    g.addColorStop(0.62, L.rgb(base));
    g.addColorStop(1,    L.rgb(L.shade(base, -0.34)));
    b.fillStyle = g; b.fillRect(0, i * ch, w, ch);
    b.fillStyle = 'rgba(0,0,0,0.35)'; b.fillRect(0, (i + 1) * ch - 1, w, 1.5);
  }
  // nylon sheen
  b.fillStyle = 'rgba(255,255,255,0.05)';
  for (let u = 0; u < w; u += 7) b.fillRect(u, 0, 2, h);
}

/** Leather: broad specular sweep plus fine grain. */
function leather(b, w, h, base, seed = 9) {
  b.fillStyle = L.rgb(base); b.fillRect(0, 0, w, h);
  const g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0.16)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.03)');
  g.addColorStop(0.7, 'rgba(0,0,0,0.20)');
  g.addColorStop(1, 'rgba(0,0,0,0.34)');
  b.fillStyle = g; b.fillRect(0, 0, w, h);
  const r = L.rng(seed);
  for (let i = 0; i < w * h * 0.06; i++) {
    b.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.07)';
    b.fillRect(r() * w, r() * h, 1.4, 1.2);
  }
}

/** Crushed velour: vertical nap with a soft sheen. */
function velour(b, w, h, base, seed = 4) {
  b.fillStyle = L.rgb(base); b.fillRect(0, 0, w, h);
  const r = L.rng(seed);
  for (let u = 0; u < w; u += 2) {
    const t = r();
    b.fillStyle = t > 0.5 ? L.rgba(L.shade(base, 0.20), 0.5) : L.rgba(L.shade(base, -0.18), 0.45);
    b.fillRect(u, 0, 2, h);
  }
  const g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0.18)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.02)');
  g.addColorStop(1, 'rgba(0,0,0,0.22)');
  b.fillStyle = g; b.fillRect(0, 0, w, h);
}

/* ---------------------------------------------------------------- motifs --- */

function rhinestones(c, pts, size = 2.2) {
  for (const [px, py] of pts) {
    const g = c.createRadialGradient(px, py, 0, px, py, size);
    g.addColorStop(0, 'rgba(255,255,255,0.98)');
    g.addColorStop(0.5, 'rgba(232,240,255,0.8)');
    g.addColorStop(1, 'rgba(180,200,230,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(px, py, size, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(px - size, py); c.lineTo(px + size, py);
    c.moveTo(px, py - size); c.lineTo(px, py + size); c.stroke();
  }
}

function butterfly(c, cx, cy, s, c1, c2) {
  c.save(); c.translate(cx, cy); c.scale(s, s);
  const wing = (dir) => {
    const g = c.createLinearGradient(0, -14, dir * 22, 14);
    g.addColorStop(0, L.rgb(c1)); g.addColorStop(1, L.rgb(c2));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, -2);
    c.quadraticCurveTo(dir * 20, -20, dir * 22, -6);
    c.quadraticCurveTo(dir * 20, 2, dir * 6, 2);
    c.quadraticCurveTo(dir * 20, 6, dir * 16, 16);
    c.quadraticCurveTo(dir * 8, 20, 0, 6);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(30,20,40,0.55)'; c.lineWidth = 0.9; c.stroke();
  };
  wing(-1); wing(1);
  c.fillStyle = 'rgba(30,20,40,0.8)';
  c.beginPath(); c.ellipse(0, 1, 1.6, 8, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(30,20,40,0.7)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(-5, -14, -8, -15); c.stroke();
  c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(5, -14, 8, -15); c.stroke();
  c.restore();
}

function laceEdge(b, w, h, colour, scallop = 8) {
  b.fillStyle = L.rgba(colour, 0.95);
  b.fillRect(0, 0, w, h * 0.4);
  for (let u = 0; u <= w; u += scallop) {
    b.beginPath(); b.arc(u + scallop / 2, h * 0.4, scallop / 2, 0, Math.PI); b.fill();
  }
  b.strokeStyle = L.rgba(L.shade(colour, -0.35), 0.5); b.lineWidth = 0.7;
  for (let u = 0; u <= w; u += scallop / 2) {
    b.beginPath(); b.moveTo(u, 0); b.lineTo(u, h * 0.4); b.stroke();
  }
}

function chenillePatch(c, cx, cy, ch, base, edge) {
  const W = 30, H = 34;                    // half-extents
  c.save();
  c.fillStyle = L.rgb(edge);
  c.fillRect(cx - W, cy - H, W * 2, H * 2);
  c.fillStyle = L.rgb(base);
  c.fillRect(cx - W + 5, cy - H + 5, (W - 5) * 2, (H - 5) * 2);
  // fuzzy chenille pile
  const r = L.rng(31);
  for (let i = 0; i < 1400; i++) {
    c.fillStyle = L.rgba(L.shade(base, r() > 0.5 ? 0.28 : -0.28), 0.55);
    c.fillRect(cx - W + 5 + r() * (W - 5) * 2, cy - H + 5 + r() * (H - 5) * 2, 1.7, 1.7);
  }
  c.font = `900 46px ${L.HEAVY}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 4; c.lineJoin = 'round';
  c.strokeStyle = L.rgb(L.shade(base, -0.45));
  c.strokeText(ch, cx, cy + 2);
  c.fillStyle = L.rgb(edge);
  c.fillText(ch, cx, cy + 2);
  c.restore();
}

function zip(c, x, y0, y1, metal) {
  c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
  c.fillStyle = L.rgb(metal);
  for (let y = y0; y < y1; y += 4) c.fillRect(x - 1.6, y, 3.2, 2.2);
  c.fillStyle = L.rgb(L.shade(metal, 0.25));
  c.fillRect(x - 3, y0 + 4, 6, 9);
}

/* --------------------------------------------------------------- designs --- */

export default {

  '5_BLOKECORE_RETRO_10.png'(x) {
    const body = L.hex('#d8dde4'), navy = L.hex('#17244a'), red = L.hex('#b3202c');
    L.shirtBody(x, L.SLEEVE.short, (b, w, h) => {
      b.fillStyle = L.rgb(body); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.05, 3);
      b.fillStyle = L.rgba(navy, 0.10);
      for (let u = 0; u < w; u += 24) b.fillRect(u, 0, 12, h);      // subtle shadow stripe
    });
    L.shirtCaps(x, body, L.SLEEVE.short);
    L.wrapBand(x, 'torso', 0, 0.09, (b, w, h) => { b.fillStyle = L.rgb(navy); b.fillRect(0, 0, w, h); });
    // wrapped sleeve stripes
    for (const p of ['rlimb', 'llimb']) {
      L.wrapBand(x, p, 0.24, 0.06, (b, w, h) => { b.fillStyle = L.rgb(navy); b.fillRect(0, 0, w, h); });
      L.wrapBand(x, p, 0.32, 0.04, (b, w, h) => { b.fillStyle = L.rgb(red); b.fillRect(0, 0, w, h); });
    }
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      c.fillStyle = L.rgb(navy);
      c.beginPath();
      c.moveTo(fx + 24, fy + 30); c.lineTo(fx + 48, fy + 30); c.lineTo(fx + 48, fy + 48);
      c.quadraticCurveTo(fx + 36, fy + 58, fx + 24, fy + 48); c.closePath(); c.fill();
      c.fillStyle = L.rgb(red); c.beginPath(); c.arc(fx + 36, fy + 41, 5, 0, 7); c.fill();
      L.fitText(c, 'ROVERS', fx + fw / 2 + 8, fy + fh * 0.62, fw * 0.5, 15, L.HEAVY, L.rgb(navy), { track: 1 });
    });
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      c.font = `900 62px ${L.HEAVY}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = L.rgb(navy); c.fillText('10', fx + fw / 2, fy + fh * 0.58);
      L.fitText(c, 'ROVERS 96', fx + fw / 2, fy + fh * 0.24, fw * 0.7, 14, L.HEAVY, L.rgb(navy), { track: 1.5 });
    });
    L.hemShadow(x, 'torso');
    L.finish(x, { seed: 81, grainAmt: 6 });
  },

  'S6_ALPNX_QUILTED_PUFFER.png'(x) {
    const blue = L.hex('#2f5f9e');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h, part) => {
      channels(b, w, h, blue, part === 'torso' ? 6 : 5);
    });
    L.shirtCaps(x, blue, L.SLEEVE.long);
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      zip(c, fx + fw / 2, fy + 6, fy + fh - 4, L.hex('#c9ccd2'));
      c.fillStyle = L.rgb(L.hex('#e8721c'));
      c.fillRect(fx + fw / 2 + 14, fy + 26, 18, 6);
    });
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      c.fillStyle = 'rgba(232,236,244,0.85)';
      c.fillRect(fx + 10, fy + fh * 0.46, fw - 20, 5);
      L.fitText(c, 'ALPNX', fx + fw / 2, fy + fh * 0.34, fw * 0.5, 16, L.HEAVY, 'rgba(232,236,244,0.9)', { track: 2 });
    });
    L.finish(x, { seed: 82, grainAmt: 5 });
  },

  'S7_RIVET_DENIM_TRUCKER.png'(x) {
    const indigo = L.hex('#33578c'), gold = L.hex('#d9a441');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => {
      b.fillStyle = L.rgb(indigo); b.fillRect(0, 0, w, h);
      L.twill(b, 0, 0, w, h, 12);
    });
    L.shirtCaps(x, indigo, L.SLEEVE.long);
    // faded shoulder yoke, wrapped so it meets at every seam
    L.wrapBand(x, 'torso', 0.10, 0.10, (b, w, h) => {
      b.fillStyle = L.rgba(L.shade(indigo, 0.22), 0.55); b.fillRect(0, 0, w, h);
      b.strokeStyle = L.rgba(gold, 0.9); b.lineWidth = 1;
      b.setLineDash([4, 3]);
      b.beginPath(); b.moveTo(0, h - 1); b.lineTo(w, h - 1); b.stroke();
      b.setLineDash([]);
    });
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      // white tee at the collar
      c.fillStyle = L.rgb(L.hex('#eceae4'));
      c.beginPath();
      c.moveTo(fx + fw/2 - 20, fy); c.lineTo(fx + fw/2, fy + 14); c.lineTo(fx + fw/2 + 20, fy);
      c.closePath(); c.fill();
      // placket
      c.fillStyle = L.rgb(L.shade(indigo, -0.14));
      c.fillRect(fx + fw/2 - 7, fy + 12, 14, fh - 12);
      c.fillStyle = L.rgb(gold);
      for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(fx + fw/2, fy + 24 + i * 20, 2.4, 0, 7); c.fill(); }
      // chest pockets with flaps
      for (const px of [fx + 18, fx + fw - 50]) {
        c.fillStyle = L.rgba(L.shade(indigo, -0.10), 0.95);
        c.fillRect(px, fy + 34, 32, 24);
        c.fillStyle = L.rgb(L.shade(indigo, 0.06));
        c.fillRect(px, fy + 34, 32, 9);
        c.strokeStyle = L.rgba(gold, 0.85); c.lineWidth = 1;
        c.setLineDash([3, 2]); c.strokeRect(px, fy + 34, 32, 24); c.setLineDash([]);
        c.fillStyle = L.rgb(gold);
        c.beginPath(); c.arc(px + 16, fy + 43, 2, 0, 7); c.fill();
      }
    });
    sleeveCuffs(x, { colour: indigo, button: gold, cuffButtons: 2, len: L.SLEEVE.long });
    L.finish(x, { seed: 83, grainAmt: 6 });
  },

  'S8_APEX_MOTO_07.png'(x) {
    const black = L.hex('#181b21'), orange = L.hex('#f26a1b');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => {
      b.fillStyle = L.rgb(black); b.fillRect(0, 0, w, h);
      /*
       * The sweep is a single sine cycle around the body rather than a straight
       * diagonal. A diagonal cannot close on itself: it would arrive back at the
       * start 24% of the way up the garment and tear open at the wrap seam.
       */
      const sweep = (u) => h * 0.36 + h * 0.16 * Math.sin((2 * Math.PI * u) / w);
      const ribbon = (offset, thickness, style) => {
        b.fillStyle = style;
        b.beginPath();
        for (let u = 0; u <= w; u++) b.lineTo(u, sweep(u) + offset);
        for (let u = w; u >= 0; u--) b.lineTo(u, sweep(u) + offset + thickness);
        b.closePath(); b.fill();
      };
      ribbon(0, h * 0.20, L.rgb(orange));
      ribbon(h * 0.20, h * 0.05, 'rgba(255,255,255,0.20)');
      L.weave(b, 0, 0, w, h, 0.04, 3);
    });
    L.shirtCaps(x, black, L.SLEEVE.long);
    // chequered flag band on both sleeves
    for (const p of ['rlimb', 'llimb']) {
      L.wrapBand(x, p, 0.44, 0.12, (b, w, h) => {
        for (let u = 0; u < w; u += 8) for (let v = 0; v < h; v += 8) {
          b.fillStyle = ((u / 8 + v / 8) % 2) ? '#f2f2ef' : '#14161a';
          b.fillRect(u, v, 8, 8);
        }
      });
    }
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      for (const [px, py, t] of [[fx + 20, fy + 26, 'APEX'], [fx + fw - 56, fy + 26, 'MOTO']]) {
        c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(px, py, 36, 14);
        L.fitText(c, t, px + 18, py + 7, 32, 10, L.HEAVY, L.rgb(black));
      }
    });
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      c.fillStyle = 'rgba(242,242,239,0.95)';
      c.fillRect(fx + fw/2 - 34, fy + fh * 0.40, 68, 56);
      c.strokeStyle = L.rgb(black); c.lineWidth = 3;
      c.strokeRect(fx + fw/2 - 34, fy + fh * 0.40, 68, 56);
      c.font = `900 44px ${L.HEAVY}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = L.rgb(black);
      c.fillText('07', fx + fw/2, fy + fh * 0.40 + 30);
    });
    L.finish(x, { seed: 84, grainAmt: 6 });
  },

  'S10_CAMPUS_VARSITY_88.png'(x) {
    const cream = L.hex('#e8e2d0'), green = L.hex('#1f5138');
    // cream body, green raglan sleeves
    L.wrapBand(x, 'torso', 0, 1, (b, w, h) => {
      b.fillStyle = L.rgb(cream); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.05, 4);
    });
    for (const p of ['rlimb', 'llimb']) {
      L.wrapBand(x, p, 0, L.SLEEVE.long, (b, w, h) => {
        b.fillStyle = L.rgb(green); b.fillRect(0, 0, w, h);
        leather(b, w, h, green, 5);
      });
    }
    L.cap(x, 'torso', 'up', L.rgb(L.shade(cream, 0.05)));
    L.cap(x, 'torso', 'down', L.rgb(L.shade(cream, -0.3)));
    for (const p of ['rlimb', 'llimb']) L.cap(x, p, 'up', L.rgb(L.shade(green, 0.1)));

    const stripe = (b, w, h) => {
      b.fillStyle = L.rgb(cream); b.fillRect(0, 0, w, h);
      b.fillStyle = L.rgb(green); b.fillRect(0, h * 0.22, w, h * 0.20);
      b.fillStyle = L.rgb(green); b.fillRect(0, h * 0.58, w, h * 0.20);
      L.rib(b, 0, 0, w, h, cream, 4);
      b.fillStyle = L.rgba(green, 0.85);
      b.fillRect(0, h * 0.24, w, h * 0.16); b.fillRect(0, h * 0.60, w, h * 0.16);
    };
    L.wrapBand(x, 'torso', 0, 0.10, stripe);
    L.wrapBand(x, 'torso', 0.90, 0.10, stripe);
    for (const p of ['rlimb', 'llimb']) L.wrapBand(x, p, 0.76, 0.10, stripe);

    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      chenillePatch(c, fx + fw * 0.32, fy + fh * 0.46, 'C', green, cream);
    });
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      L.fitText(c, 'CAMPUS', fx + fw / 2, fy + fh * 0.30, fw * 0.72, 20, L.HEAVY, L.rgb(green), { track: 2 });
      c.font = `900 62px ${L.HEAVY}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = L.rgb(green); c.fillText('88', fx + fw / 2, fy + fh * 0.60);
    });
    L.finish(x, { seed: 85, grainAmt: 6 });
  },

  'S11_MIDNIGHT_TAILORED_SUIT.png'(x) {
    const char = L.hex('#39404f');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => {
      b.fillStyle = L.rgb(char); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.05, 3);
    });
    L.shirtCaps(x, char, L.SLEEVE.long);
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      jacketFront(c, fx, fy, fw, fh, {
        shirt: L.hex('#f2f0ea'), tie: L.hex('#3b4a70'), tieStripe: L.hex('#c3cbdd'),
        lapel: L.shade(char, 0.06), button: L.hex('#15171c'), peak: true,
        pocketSquare: L.hex('#f2f0ea')
      });
    });
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.fillRect(fx + fw / 2 - 1, fy + fh * 0.66, 2, fh * 0.34);   // centre vent
    });
    sleeveCuffs(x, { colour: char, button: L.hex('#15171c'), cuffButtons: 4, shirtCuff: L.hex('#f2f0ea'), len: L.SLEEVE.long });
    L.hemShadow(x, 'torso');
    L.finish(x, { seed: 86, grainAmt: 5 });
  },

  'S13_WESTBROOK_PREP_VEST.png'(x) {
    const navy = L.hex('#22304f'), white = L.hex('#f1efe8'), gold = L.hex('#c8a83c');
    // white shirt underneath everywhere, vest over the torso
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => {
      b.fillStyle = L.rgb(white); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.06, 3);
    });
    L.wrapBand(x, 'torso', 0.10, 0.90, (b, w, h) => {
      b.fillStyle = L.rgb(navy); b.fillRect(0, 0, w, h);
      // cable knit
      for (let u = 0; u < w; u += 16) {
        b.strokeStyle = L.rgba(L.shade(navy, 0.3), 0.5); b.lineWidth = 2;
        for (let y = -10; y < h + 10; y += 10) {
          b.beginPath(); b.moveTo(u, y); b.quadraticCurveTo(u + 5, y + 5, u, y + 10); b.stroke();
        }
      }
      L.knit(b, 0, 0, w, h, L.shade(navy, 0.35), L.shade(navy, -0.35), 5, 4);
    });
    L.shirtCaps(x, navy, L.SLEEVE.long);
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      // V opening with collar and tie
      c.fillStyle = L.rgb(white);
      c.beginPath();
      c.moveTo(fx + fw/2 - 24, fy + 8); c.lineTo(fx + fw/2, fy + 52); c.lineTo(fx + fw/2 + 24, fy + 8);
      c.closePath(); c.fill();
      c.fillStyle = L.rgb(L.shade(white, -0.10));
      c.beginPath();
      c.moveTo(fx + fw/2 - 22, fy + 4); c.lineTo(fx + fw/2, fy + 22); c.lineTo(fx + fw/2 + 22, fy + 4);
      c.closePath(); c.fill();
      c.fillStyle = L.rgb(navy);
      c.beginPath();
      c.moveTo(fx + fw/2 - 6, fy + 18); c.lineTo(fx + fw/2 + 6, fy + 18);
      c.lineTo(fx + fw/2 + 5, fy + 52); c.lineTo(fx + fw/2 - 5, fy + 52);
      c.closePath(); c.fill();
      c.strokeStyle = L.rgb(gold); c.lineWidth = 2.4;
      for (let i = 0; i < 4; i++) {
        c.beginPath(); c.moveTo(fx + fw/2 - 6, fy + 22 + i * 9); c.lineTo(fx + fw/2 + 6, fy + 26 + i * 9); c.stroke();
      }
      // letter patch
      c.fillStyle = L.rgb(gold);
      c.fillRect(fx + 24, fy + fh * 0.50, 20, 22);
      L.fitText(c, 'W', fx + 34, fy + fh * 0.50 + 11, 18, 16, L.HEAVY, L.rgb(navy));
    });
    sleeveCuffs(x, { colour: white, button: white, cuffButtons: 2, len: L.SLEEVE.long });
    L.wrapBand(x, 'torso', 0.90, 0.10, (b, w, h) => L.rib(b, 0, 0, w, h, navy, 4));
    L.finish(x, { seed: 87, grainAmt: 5 });
  },

  'S14_SUGARDROP_CUTECORE.png'(x) {
    const pink = L.hex('#f4b8cd'), cream = L.hex('#fff4f7'), rose = L.hex('#e0708f');
    L.shirtBody(x, L.SLEEVE.short, (b, w, h) => {
      b.fillStyle = L.rgb(pink); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.04, 3);
      // scattered hearts and stars all the way round
      const r = L.rng(55);
      for (let i = 0; i < w * h * 0.0018; i++) {
        const px = r() * w, py = r() * h;
        b.fillStyle = L.rgba(r() > 0.5 ? cream : rose, 0.75);
        if (r() > 0.5) {
          b.beginPath();
          b.moveTo(px, py + 3);
          b.quadraticCurveTo(px - 4, py - 1, px - 2, py - 3);
          b.quadraticCurveTo(px, py - 4, px, py - 1);
          b.quadraticCurveTo(px, py - 4, px + 2, py - 3);
          b.quadraticCurveTo(px + 4, py - 1, px, py + 3);
          b.fill();
        } else {
          b.beginPath();
          for (let s = 0; s < 5; s++) {
            const a = (s / 5) * Math.PI * 2 - Math.PI / 2;
            b.lineTo(px + Math.cos(a) * 4, py + Math.sin(a) * 4);
            const a2 = a + Math.PI / 5;
            b.lineTo(px + Math.cos(a2) * 1.7, py + Math.sin(a2) * 1.7);
          }
          b.closePath(); b.fill();
        }
      }
      // puffed shoulder shading
      const g = b.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0.22)');
      g.addColorStop(0.3, 'rgba(255,255,255,0)');
      b.fillStyle = g; b.fillRect(0, 0, w, h);
    });
    L.shirtCaps(x, pink, L.SLEEVE.short);
    L.wrapBand(x, 'torso', 0, 0.09, (b, w, h) => laceEdge(b, w, h, cream, 8));
    for (const p of ['rlimb', 'llimb']) {
      L.wrapBand(x, p, 0.32, 0.10, (b, w, h) => laceEdge(b, w, h, cream, 7));
    }
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      // big satin bow
      const cx = fx + fw / 2, cy = fy + fh * 0.36;
      c.fillStyle = L.rgb(rose);
      for (const dir of [-1, 1]) {
        c.beginPath();
        c.moveTo(cx, cy);
        c.quadraticCurveTo(cx + dir * 30, cy - 18, cx + dir * 26, cy + 2);
        c.quadraticCurveTo(cx + dir * 24, cy + 16, cx, cy + 2);
        c.closePath(); c.fill();
      }
      c.fillStyle = L.rgb(L.shade(rose, 0.22));
      c.beginPath(); c.ellipse(cx, cy + 1, 6, 7, 0, 0, 7); c.fill();
      c.fillStyle = L.rgb(rose);
      c.beginPath(); c.moveTo(cx - 5, cy + 6); c.lineTo(cx - 12, cy + 26); c.lineTo(cx - 2, cy + 20); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(cx + 5, cy + 6); c.lineTo(cx + 12, cy + 26); c.lineTo(cx + 2, cy + 20); c.closePath(); c.fill();
    });
    L.finish(x, { seed: 88, grainAmt: 4 });
  },

  'S15_LACEWING_PASTEL_GOTH.png'(x) {
    const black = L.hex('#191720'), pink = L.hex('#e88fb4');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => {
      b.fillStyle = L.rgb(black); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.05, 3);
    });
    L.shirtCaps(x, black, L.SLEEVE.long);
    L.wrapBand(x, 'torso', 0, 0.08, (b, w, h) => laceEdge(b, w, h, L.hex('#f0d7e4'), 7));
    for (const p of ['rlimb', 'llimb']) {
      L.wrapBand(x, p, 0.76, 0.10, (b, w, h) => laceEdge(b, w, h, L.hex('#f0d7e4'), 6));
      // bow on each sleeve, on every face so it reads from any angle
      L.wrapBand(x, p, 0.40, 0.12, (b, w, h) => {
        for (let f = 0; f < 4; f++) {
          const cx = f * (w / 4) + w / 8;
          b.fillStyle = L.rgb(pink);
          for (const dir of [-1, 1]) {
            b.beginPath();
            b.moveTo(cx, h / 2);
            b.quadraticCurveTo(cx + dir * 11, h / 2 - 7, cx + dir * 9, h / 2 + 1);
            b.quadraticCurveTo(cx + dir * 8, h / 2 + 6, cx, h / 2 + 1);
            b.closePath(); b.fill();
          }
          b.beginPath(); b.arc(cx, h / 2, 2.2, 0, 7); b.fill();
        }
      });
    }
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      // corset lacing
      const cx = fx + fw / 2;
      c.strokeStyle = L.rgb(pink); c.lineWidth = 2.4; c.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const y = fy + 24 + i * 13;
        c.beginPath(); c.moveTo(cx - 15, y); c.lineTo(cx + 15, y + 7); c.stroke();
        c.beginPath(); c.moveTo(cx + 15, y); c.lineTo(cx - 15, y + 7); c.stroke();
      }
      c.fillStyle = 'rgba(220,220,230,0.9)';
      for (let i = 0; i < 8; i++) {
        c.beginPath(); c.arc(cx - 15, fy + 24 + i * 13, 1.8, 0, 7); c.fill();
        c.beginPath(); c.arc(cx + 15, fy + 24 + i * 13, 1.8, 0, 7); c.fill();
      }
    });
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      c.fillStyle = L.rgb(pink);
      const cx = fx + fw / 2, cy = fy + fh * 0.5;
      c.fillRect(cx - 5, cy - 30, 10, 60);
      c.fillRect(cx - 20, cy - 14, 40, 10);
    });
    L.finish(x, { seed: 89, grainAmt: 5 });
  },

  'S16_CEDAR_FLANNEL_LAYERED.png'(x) {
    const red = L.hex('#a8302c'), black = L.hex('#20181a'), white = L.hex('#e9e6de');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => plaid(b, w, h, red, black, 32));
    L.shirtCaps(x, red, L.SLEEVE.long);
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      // white tee showing through the open flannel
      c.fillStyle = L.rgb(white);
      c.fillRect(fx + fw / 2 - 22, fy, 44, fh);
      L.weave(c, fx + fw / 2 - 22, fy, 44, fh, 0.05, 3);
      // flannel edges over it
      c.fillStyle = L.rgba(black, 0.5);
      c.fillRect(fx + fw / 2 - 24, fy, 3, fh);
      c.fillRect(fx + fw / 2 + 21, fy, 3, fh);
      // chest pockets and buttons on the flannel panels
      for (const px of [fx + 16, fx + fw - 48]) {
        c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1.2;
        c.strokeRect(px, fy + 34, 30, 22);
      }
      c.fillStyle = 'rgba(235,230,220,0.9)';
      for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(fx + fw/2 - 26, fy + 30 + i * 24, 2.2, 0, 7); c.fill(); }
    });
    // rolled sleeve cuffs
    for (const p of ['rlimb', 'llimb']) {
      L.wrapBand(x, p, 0.70, 0.14, (b, w, h) => {
        plaid(b, w, h, L.shade(red, 0.18), L.shade(black, 0.14), 16);
        b.fillStyle = 'rgba(0,0,0,0.25)'; b.fillRect(0, 0, w, 2);
      });
    }
    L.finish(x, { seed: 90, grainAmt: 6 });
  },

  'S17_IRONSIDE_BIKER_JACKET.png'(x) {
    const black = L.hex('#1a1a1e'), steel = L.hex('#b9bec7');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => leather(b, w, h, black, 21));
    L.shirtCaps(x, black, L.SLEEVE.long);
    // quilted shoulders, wrapped
    L.wrapBand(x, 'torso', 0, 0.20, (b, w, h) => {
      quilting(b, w, h, L.shade(black, 0.06), 16);
      leather(b, w, h, L.shade(black, 0.02), 3);
      quilting(b, w, h, L.shade(black, 0.05), 16);
    });
    // waist belt right round
    L.wrapBand(x, 'torso', 0.82, 0.10, (b, w, h) => {
      leather(b, w, h, L.shade(black, -0.16), 7);
      b.fillStyle = 'rgba(0,0,0,0.4)'; b.fillRect(0, 0, w, 1.5);
    });
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      // asymmetric zip
      c.save();
      c.translate(fx + fw * 0.58, fy + 6); c.rotate(0.14);
      zip(c, 0, 0, fh * 0.78, steel);
      c.restore();
      // zip pockets
      c.save(); c.translate(fx + 18, fy + fh * 0.56); c.rotate(-0.32);
      zip(c, 0, 0, 26, steel); c.restore();
      c.save(); c.translate(fx + fw - 26, fy + fh * 0.56); c.rotate(0.32);
      zip(c, 0, 0, 26, steel); c.restore();
      // buckle on the waist belt
      c.fillStyle = L.rgb(steel);
      c.fillRect(fx + fw/2 - 8, fy + fh * 0.84, 16, 10);
      c.fillStyle = L.rgb(black); c.fillRect(fx + fw/2 - 4, fy + fh * 0.86, 8, 5);
    });
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      L.fitText(c, 'IRONSIDE', fx + fw / 2, fy + fh * 0.36, fw * 0.78, 20, L.HEAVY, 'rgba(232,232,238,0.92)', { track: 2 });
      c.strokeStyle = 'rgba(232,232,238,0.75)'; c.lineWidth = 2;
      c.beginPath(); c.arc(fx + fw / 2, fy + fh * 0.62, 22, 0, 7); c.stroke();
      L.fitText(c, 'MC', fx + fw / 2, fy + fh * 0.62, 30, 18, L.HEAVY, 'rgba(232,232,238,0.9)');
    });
    // studded sleeve straps on every face
    for (const p of ['rlimb', 'llimb']) {
      L.wrapBand(x, p, 0.40, 0.09, (b, w, h) => {
        leather(b, w, h, L.shade(black, -0.2), 11);
        b.fillStyle = L.rgb(steel);
        for (let u = 5; u < w; u += 11) { b.beginPath(); b.arc(u, h / 2, 1.8, 0, 7); b.fill(); }
      });
    }
    L.finish(x, { seed: 91, grainAmt: 5 });
  },

  'S18_FAIRYFLOSS_BUTTERFLY_TEE.png'(x) {
    const pink = L.hex('#f7cfe0');
    L.shirtBody(x, L.SLEEVE.short, (b, w, h) => {
      b.fillStyle = L.rgb(pink); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.035, 3);
      const r = L.rng(66);
      for (let i = 0; i < w * h * 0.0012; i++) {
        const px = r() * w, py = r() * h;
        b.fillStyle = 'rgba(255,255,255,0.8)';
        b.beginPath(); b.arc(px, py, 0.9, 0, 7); b.fill();
      }
    });
    L.shirtCaps(x, pink, L.SLEEVE.short);
    // rhinestone trim on the collar and both sleeve hems
    const stones = (b, w, h) => {
      b.fillStyle = L.rgba(L.shade(pink, -0.10), 0.6); b.fillRect(0, 0, w, h);
      const pts = [];
      for (let u = 3; u < w; u += 6) pts.push([u, h / 2]);
      rhinestones(b, pts, 2);
    };
    L.wrapBand(x, 'torso', 0, 0.06, stones);
    for (const p of ['rlimb', 'llimb']) L.wrapBand(x, p, 0.33, 0.08, stones);
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      butterfly(c, fx + fw / 2, fy + fh * 0.42, 1.5, L.hex('#8fd3f4'), L.hex('#f78fd0'));
      L.fitText(c, 'FAIRYFLOSS', fx + fw / 2, fy + fh * 0.70, fw * 0.66, 13, L.HEAVY, '#ffffff', { track: 1.4 });
      const pts = [];
      for (let i = 0; i < 26; i++) pts.push([fx + fw * 0.18 + (i % 13) * (fw * 0.055), fy + fh * 0.66 + (i > 12 ? 10 : 0)]);
      rhinestones(c, pts, 1.6);
    });
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      butterfly(c, fx + fw / 2, fy + fh * 0.46, 2.1, L.hex('#f78fd0'), L.hex('#8fd3f4'));
    });
    L.finish(x, { seed: 92, grainAmt: 4 });
  },

  'S19_GLAMOUR_VELOUR_ZIP_TOP.png'(x) {
    const hot = L.hex('#e0499a');
    L.shirtBody(x, L.SLEEVE.long, (b, w, h) => velour(b, w, h, hot, 8));
    L.shirtCaps(x, hot, L.SLEEVE.long);
    // white piping down the outside of both sleeves, on every face boundary
    for (const p of ['rlimb', 'llimb']) {
      const outer = L.faceU(p, p === 'rlimb' ? 'rt' : 'lf');
      L.wrapBand(x, p, 0, L.SLEEVE.long, (b, w, h) => {
        b.fillStyle = 'rgba(255,255,255,0.92)';
        b.fillRect(outer + 29, 0, 5, h);
      });
      L.wrapBand(x, p, 0.78, 0.08, (b, w, h) => L.rib(b, 0, 0, w, h, L.shade(hot, -0.12), 3));
    }
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      zip(c, fx + fw / 2, fy + 4, fy + fh - 2, L.hex('#dcdfe6'));
      for (const px of [fx + 20, fx + fw - 22]) {
        c.save(); c.translate(px, fy + fh * 0.60); c.rotate(0.1);
        zip(c, 0, 0, 24, L.hex('#dcdfe6')); c.restore();
      }
    });
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      L.fitText(c, 'GLAMOUR', fx + fw / 2, fy + fh * 0.44, fw * 0.76, 22, L.HEAVY, '#ffffff', { track: 2 });
      const pts = [];
      for (let i = 0; i < 18; i++) pts.push([fx + fw * 0.14 + i * (fw * 0.042), fy + fh * 0.58]);
      rhinestones(c, pts, 1.8);
    });
    L.finish(x, { seed: 93, grainAmt: 4 });
  },

  'S20_HEATWAVE_AIRBRUSH_TEE.png'(x) {
    const white = L.hex('#f4f2ec');
    L.shirtBody(x, L.SLEEVE.short, (b, w, h) => {
      b.fillStyle = L.rgb(white); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.035, 3);
      // airbrush colour blooms, wrapped by drawing each blob three times
      const r = L.rng(77);
      const cols = ['#ff5f8d', '#ffb03a', '#4fc3f7', '#a06bff'];
      for (let i = 0; i < 9; i++) {
        const cx = r() * w, cy = r() * h, rad = 34 + r() * 42;
        const col = cols[(r() * cols.length) | 0];
        for (const off of [-w, 0, w]) {
          b.save(); b.globalAlpha = 0.62;
          L.blob(b, cx + off, cy, rad, L.hex(col), 1);
          b.restore();
        }
      }
      // scattered stars
      b.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < w * h * 0.0006; i++) {
        const px = r() * w, py = r() * h;
        b.beginPath();
        for (let s = 0; s < 5; s++) {
          const a = (s / 5) * Math.PI * 2 - Math.PI / 2;
          b.lineTo(px + Math.cos(a) * 4, py + Math.sin(a) * 4);
          const a2 = a + Math.PI / 5;
          b.lineTo(px + Math.cos(a2) * 1.6, py + Math.sin(a2) * 1.6);
        }
        b.closePath(); b.fill();
      }
    });
    L.shirtCaps(x, white, L.SLEEVE.short);
    const bubble = (c, t, cx, cy, maxW, size) => {
      c.save();
      c.lineJoin = 'round'; c.textAlign = 'center'; c.textBaseline = 'middle';
      let s = size;
      for (; s > 6; s -= 0.5) { c.font = `900 ${s}px ${L.HEAVY}`; if (c.measureText(t).width <= maxW) break; }
      c.lineWidth = 7; c.strokeStyle = '#1b1b22'; c.strokeText(t, cx, cy);
      c.lineWidth = 4; c.strokeStyle = '#ffffff'; c.strokeText(t, cx, cy);
      const g = c.createLinearGradient(0, cy - s / 2, 0, cy + s / 2);
      g.addColorStop(0, '#ffd54a'); g.addColorStop(0.5, '#ff7a3d'); g.addColorStop(1, '#f0398b');
      c.fillStyle = g; c.fillText(t, cx, cy);
      c.restore();
    };
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => bubble(c, 'HEATWAVE', fx + fw / 2, fy + fh * 0.44, fw * 0.84, 26));
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      bubble(c, '2K4', fx + fw / 2, fy + fh * 0.42, fw * 0.6, 40);
      bubble(c, 'BOARDWALK', fx + fw / 2, fy + fh * 0.66, fw * 0.8, 16);
    });
    L.finish(x, { seed: 94, grainAmt: 5 });
  }
};

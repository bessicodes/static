/* d_pants.mjs — denim, cargos, track bottoms, skirts and Y2K flares. */

import * as L from './lib.mjs';
import { beltBand, crease } from './d_oldmoney.mjs';

/* -------------------------------------------------------------- surfaces --- */

function denim(b, w, h, base, seed = 4) {
  b.fillStyle = L.rgb(base); b.fillRect(0, 0, w, h);
  L.twill(b, 0, 0, w, h, seed);
}

/** Whiskering across the thigh, wrapped so it does not stop at a seam. */
function whiskers(b, w, h, base, seed = 6) {
  const r = L.rng(seed);
  b.save();
  b.strokeStyle = L.rgba(L.shade(base, 0.34), 0.4);
  b.lineWidth = 2.4; b.lineCap = 'round';
  for (let i = 0; i < 22; i++) {
    const y = h * (0.06 + r() * 0.30);
    const cx = r() * w, len = 12 + r() * 22;
    for (const off of [-w, 0, w]) {
      b.beginPath();
      b.moveTo(cx + off - len, y);
      b.quadraticCurveTo(cx + off, y - 4 - r() * 3, cx + off + len, y);
      b.stroke();
    }
  }
  // knee and hem fade
  const g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0.14)');
  b.fillStyle = g; b.fillRect(0, 0, w, h);
  b.restore();
}

function goldStitch(b, w, h, gold) {
  b.strokeStyle = L.rgba(gold, 0.85);
  b.lineWidth = 1; b.setLineDash([4, 3]);
  b.beginPath(); b.moveTo(0, h * 0.04); b.lineTo(w, h * 0.04); b.stroke();
  b.setLineDash([]);
}

/** Back pockets on the seat, with topstitching. */
function backPockets(x, base, gold) {
  L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
    for (const px of [fx + 24, fx + fw - 56]) {
      c.fillStyle = L.rgba(L.shade(base, -0.10), 0.9);
      c.fillRect(px, fy + fh * 0.70, 32, 24);
      c.strokeStyle = L.rgba(gold, 0.9); c.lineWidth = 1;
      c.setLineDash([3, 2]); c.strokeRect(px, fy + fh * 0.70, 32, 24); c.setLineDash([]);
    }
  });
}

/**
 * Distressed knee.
 *
 * A single oval hole reads as a pale floating blob on the body, because the
 * skin behind it is brighter than the denim. Real ripped jeans read as a LADDER
 * of horizontal slashes with white weft threads still spanning the gap, so that
 * is what this draws: several thin cuts at the knee, a dark worn halo around
 * them, and threads left bridging the openings.
 */
function rips(x, base, seed = 12) {
  for (const part of ['rlimb', 'llimb']) {
    const [px, py, pw, ph] = (part === 'rlimb' ? L.RLIMB : L.LLIMB).front;
    const r = L.rng(seed + (part === 'rlimb' ? 0 : 7));
    const cx = px + pw / 2, cy = py + ph * 0.47;
    const halfW = pw * 0.40;

    // worn, bleached halo so the tear sits in a scuffed patch
    x.save();
    const g = x.createRadialGradient(cx, cy, 2, cx, cy, halfW * 1.5);
    g.addColorStop(0, L.rgba(L.shade(base, 0.30), 0.55));
    g.addColorStop(1, L.rgba(L.shade(base, 0.30), 0));
    x.fillStyle = g;
    x.fillRect(cx - halfW * 1.6, cy - 26, halfW * 3.2, 52);
    x.restore();

    // the cuts themselves, cut clean through to skin
    const slashes = [];
    for (let i = 0; i < 4; i++) {
      const sy = cy - 15 + i * 9 + (r() - 0.5) * 2;
      const w = halfW * (0.55 + r() * 0.45);
      slashes.push([sy, w]);
      x.save();
      x.globalCompositeOperation = 'destination-out';
      x.beginPath();
      x.ellipse(cx + (r() - 0.5) * 5, sy, w, 2.4 + r() * 1.2, 0, 0, 7);
      x.fill();
      x.restore();
    }

    // white weft threads still bridging the gaps
    x.save();
    x.strokeStyle = 'rgba(232,230,222,0.9)';
    x.lineWidth = 0.8;
    for (let i = 0; i < 22; i++) {
      const tx = cx - halfW + r() * halfW * 2;
      x.beginPath();
      x.moveTo(tx, cy - 18);
      x.lineTo(tx + (r() - 0.5) * 3, cy + 18);
      x.stroke();
    }
    x.restore();

    // dark shadow along the top lip of each cut, so the hole reads as depth
    x.save();
    x.globalCompositeOperation = 'source-atop';
    x.strokeStyle = 'rgba(0,0,0,0.45)';
    x.lineWidth = 1.6;
    for (const [sy, w] of slashes) {
      x.beginPath();
      x.ellipse(cx, sy, w, 3.4, 0, Math.PI, Math.PI * 2);
      x.stroke();
    }
    x.restore();
  }
}

/* --------------------------------------------------------------- designs --- */

export default {

  'P1_UTILITY_CARGO_OLIVE.png'(x) {
    const olive = L.hex('#4d5537');
    L.pantsBody(x, (b, w, h) => {
      b.fillStyle = L.rgb(olive); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.055, 3);
    }, L.WAIST, 0.92);
    L.pantsCaps(x, olive);
    beltBand(x, L.shade(olive, -0.28), L.hex('#3b3f33'));
    // flapped thigh pockets on the outside of each leg
    for (const part of ['rlimb', 'llimb']) {
      const outer = L.faceU(part, part === 'rlimb' ? 'rt' : 'lf');
      const front = L.faceU(part, 'front');
      L.wrapBand(x, part, 0.22, 0.24, (b, w, h) => {
        for (const u of [outer, front]) {
          b.fillStyle = L.rgb(L.shade(olive, -0.10));
          b.fillRect(u + 12, 4, 40, 26);
          b.fillStyle = L.rgb(L.shade(olive, 0.08));
          b.fillRect(u + 12, 4, 40, 10);
          b.strokeStyle = 'rgba(0,0,0,0.45)'; b.lineWidth = 1;
          b.strokeRect(u + 12, 4, 40, 26);
          b.fillStyle = L.rgb(L.hex('#2e3228'));
          b.fillRect(u + 28, 11, 8, 4);
        }
      });
      // buckle tabs and a drawstring hem, right round the leg
      L.wrapBand(x, part, 0.60, 0.05, (b, w, h) => {
        b.fillStyle = L.rgb(L.shade(olive, -0.30)); b.fillRect(0, 0, w, h);
        b.fillStyle = L.rgb(L.hex('#20231b'));
        for (let u = 10; u < w; u += 40) b.fillRect(u, 0, 8, h);
      });
      L.wrapBand(x, part, 0.88, 0.12, (b, w, h) => {
        L.rib(b, 0, 0, w, h, L.shade(olive, -0.12), 4);
        b.strokeStyle = 'rgba(0,0,0,0.5)'; b.lineWidth = 1.4;
        b.beginPath(); b.moveTo(0, 3); b.lineTo(w, 3); b.stroke();
      });
    }
    L.finish(x, { seed: 101, grainAmt: 6 });
  },

  'P2_LIGHTWASH_BAGGY_DENIM.png'(x) {
    const light = L.hex('#8fb0d0'), gold = L.hex('#d8a63f');
    L.pantsBody(x, (b, w, h) => {
      denim(b, w, h, light, 8);
      whiskers(b, w, h, light, 9);
      goldStitch(b, w, h, gold);
    });
    L.pantsCaps(x, light);
    beltBand(x, L.shade(light, -0.24), L.hex('#c8b070'));
    backPockets(x, light, gold);
    L.face(x, 'torso', 'back', (c, fx, fy, fw, fh) => {
      c.fillStyle = L.rgb(L.hex('#6b4a2c'));
      c.fillRect(fx + fw - 34, fy + fh * 0.60, 22, 10);        // leather brand tab
    });
    L.finish(x, { seed: 102, grainAmt: 6 });
  },

  'P3_TRACK_STRIPE_BLACK.png'(x) {
    const black = L.hex('#191b20'), red = L.hex('#c8262c'), white = L.hex('#eeeeea');
    L.pantsBody(x, (b, w, h) => {
      b.fillStyle = L.rgb(black); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.04, 3);
    }, L.WAIST, 0.9);
    // side stripes down the outer seam of each leg
    for (const part of ['rlimb', 'llimb']) {
      const outer = L.faceU(part, part === 'rlimb' ? 'rt' : 'lf');
      L.wrapBand(x, part, 0, 0.9, (b, w, h) => {
        b.fillStyle = L.rgb(white); b.fillRect(outer + 24, 0, 5, h);
        b.fillStyle = L.rgb(red);   b.fillRect(outer + 30, 0, 7, h);
        b.fillStyle = L.rgb(white); b.fillRect(outer + 38, 0, 5, h);
      });
      L.wrapBand(x, part, 0.9, 0.1, (b, w, h) => L.rib(b, 0, 0, w, h, black, 4));
    }
    L.pantsCaps(x, black);
    // drawstring waist
    L.wrapBand(x, 'torso', L.WAIST, 0.08, (b, w, h) => {
      L.rib(b, 0, 0, w, h, L.shade(black, 0.06), 5);
    });
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      c.strokeStyle = 'rgba(230,230,226,0.9)'; c.lineWidth = 2.2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(fx + fw/2 - 12, fy + fh * 0.66); c.lineTo(fx + fw/2 - 4, fy + fh * 0.78); c.stroke();
      c.beginPath(); c.moveTo(fx + fw/2 + 12, fy + fh * 0.66); c.lineTo(fx + fw/2 + 4, fy + fh * 0.78); c.stroke();
    });
    L.finish(x, { seed: 103, grainAmt: 5 });
  },

  'P4_MIDNIGHT_SUIT_TROUSERS.png'(x) {
    const char = L.hex('#39404f');
    L.pantsBody(x, (b, w, h) => {
      b.fillStyle = L.rgb(char); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.05, 3);
    });
    L.pantsCaps(x, char);
    crease(x, char);
    beltBand(x, L.hex('#15171c'), L.hex('#b9bec7'));
    L.finish(x, { seed: 104, grainAmt: 5 });
  },

  'P5_TARTAN_PLEAT_SKIRT_SOCKS.png'(x) {
    const navy = L.hex('#23304e'), green = L.hex('#2f5240'), white = L.hex('#eeeee8');
    const tartan = (b, w, h) => {
      b.fillStyle = L.rgb(navy); b.fillRect(0, 0, w, h);
      // 32px sett divides both 384 and 256
      b.fillStyle = L.rgba(green, 0.85);
      for (let u = 0; u < w; u += 32) b.fillRect(u, 0, 16, h);
      for (let v = 0; v < h; v += 32) b.fillRect(0, v, w, 16);
      b.strokeStyle = L.rgba(white, 0.75); b.lineWidth = 1.6;
      for (let u = 8; u < w; u += 32) { b.beginPath(); b.moveTo(u, 0); b.lineTo(u, h); b.stroke(); }
      for (let v = 8; v < h; v += 32) { b.beginPath(); b.moveTo(0, v); b.lineTo(w, v); b.stroke(); }
      b.strokeStyle = 'rgba(200,60,60,0.5)'; b.lineWidth = 1;
      for (let u = 24; u < w; u += 32) { b.beginPath(); b.moveTo(u, 0); b.lineTo(u, h); b.stroke(); }
    };
    // skirt on the hips and the top of the legs
    L.wrapBand(x, 'torso', 0, 1, (b, w, h) => {
      tartan(b, w, h);
      b.fillStyle = 'rgba(0,0,0,0.22)';
      for (let u = 0; u < w; u += 16) b.fillRect(u, 0, 2, h);        // pleats
    });
    L.cap(x, 'torso', 'up', L.rgb(L.shade(navy, 0.04)));
    L.cap(x, 'torso', 'down', L.rgb(L.shade(navy, -0.3)));
    for (const part of ['rlimb', 'llimb']) {
      L.wrapBand(x, part, 0, 0.30, (b, w, h) => {
        tartan(b, w, h);
        b.fillStyle = 'rgba(0,0,0,0.22)';
        for (let u = 0; u < w; u += 16) b.fillRect(u, 0, 2, h);
        b.fillStyle = 'rgba(0,0,0,0.30)'; b.fillRect(0, h - 3, w, 3);
      });
      L.cap(x, part, 'up', L.rgb(L.shade(navy, -0.1)));
      // bare knee gap, then striped knee socks
      L.wrapBand(x, part, 0.56, 0.44, (b, w, h) => {
        b.fillStyle = L.rgb(white); b.fillRect(0, 0, w, h);
        b.fillStyle = L.rgba(navy, 0.9);
        b.fillRect(0, 4, w, 4); b.fillRect(0, 12, w, 4);
        L.rib(b, 0, 0, w, 5, white, 3);
        L.knit(b, 0, 0, w, h, L.shade(white, 0.2), L.shade(white, -0.25), 4, 4);
      });
      L.cap(x, part, 'down', L.rgb(L.shade(white, -0.35)));
    }
    L.finish(x, { seed: 105, grainAmt: 5 });
  },

  'P6_RIPPED_BAGGY_JEANS.png'(x) {
    const mid = L.hex('#5f83ab'), gold = L.hex('#d8a63f');
    L.pantsBody(x, (b, w, h) => {
      denim(b, w, h, mid, 14);
      whiskers(b, w, h, mid, 15);
      goldStitch(b, w, h, gold);
      // frayed hem
      b.fillStyle = 'rgba(230,230,224,0.30)';
      for (let u = 0; u < w; u += 3) b.fillRect(u, h - 4 - Math.random() * 3, 1.6, 5);
    });
    L.pantsCaps(x, mid);
    beltBand(x, L.shade(mid, -0.26), L.hex('#c8b070'));
    backPockets(x, mid, gold);
    rips(x, mid, 12);
    L.finish(x, { seed: 106, grainAmt: 6 });
  },

  'P7_PASTEL_SHORTS_KNEESOCKS.png'(x) {
    const lilac = L.hex('#c9b4e8'), pink = L.hex('#f2a8c8'), sock = L.hex('#f6eef8');
    L.wrapBand(x, 'torso', 0, 1, (b, w, h) => {
      b.fillStyle = L.rgb(lilac); b.fillRect(0, 0, w, h);
      L.weave(b, 0, 0, w, h, 0.04, 3);
    });
    L.cap(x, 'torso', 'up', L.rgb(L.shade(lilac, 0.04)));
    L.cap(x, 'torso', 'down', L.rgb(L.shade(lilac, -0.3)));
    L.face(x, 'torso', 'front', (c, fx, fy, fw, fh) => {
      // bow at the waist
      const cx = fx + fw / 2, cy = fy + fh * 0.66;
      c.fillStyle = L.rgb(pink);
      for (const dir of [-1, 1]) {
        c.beginPath(); c.moveTo(cx, cy);
        c.quadraticCurveTo(cx + dir * 16, cy - 9, cx + dir * 13, cy + 2);
        c.quadraticCurveTo(cx + dir * 12, cy + 8, cx, cy + 2);
        c.closePath(); c.fill();
      }
      c.beginPath(); c.arc(cx, cy + 1, 3, 0, 7); c.fill();
    });
    for (const part of ['rlimb', 'llimb']) {
      // cuffed shorts
      L.wrapBand(x, part, 0, 0.32, (b, w, h) => {
        b.fillStyle = L.rgb(lilac); b.fillRect(0, 0, w, h);
        L.weave(b, 0, 0, w, h, 0.04, 3);
        b.fillStyle = L.rgb(L.shade(lilac, -0.12));
        b.fillRect(0, h - 7, w, 7);                                   // turn-up cuff
        b.fillStyle = 'rgba(0,0,0,0.18)'; b.fillRect(0, h - 8, w, 1.4);
        // hearts on the thighs, on every face — sized up and outlined so they
        // do not disappear into the lilac at avatar scale
        for (let f = 0; f < 4; f++) {
          const cx = f * (w / 4) + w / 8, cy = h * 0.44, s = 1.9;
          b.beginPath();
          b.moveTo(cx, cy + 5 * s);
          b.quadraticCurveTo(cx - 7 * s, cy - 1 * s, cx - 3.5 * s, cy - 5 * s);
          b.quadraticCurveTo(cx, cy - 7 * s, cx, cy - 2 * s);
          b.quadraticCurveTo(cx, cy - 7 * s, cx + 3.5 * s, cy - 5 * s);
          b.quadraticCurveTo(cx + 7 * s, cy - 1 * s, cx, cy + 5 * s);
          b.fillStyle = L.rgb(pink); b.fill();
          b.strokeStyle = 'rgba(150,60,105,0.75)'; b.lineWidth = 1.2; b.stroke();
        }
      });
      L.cap(x, part, 'up', L.rgb(L.shade(lilac, -0.1)));
      // striped knee socks below a bare knee
      L.wrapBand(x, part, 0.58, 0.42, (b, w, h) => {
        b.fillStyle = L.rgb(sock); b.fillRect(0, 0, w, h);
        for (let v = 0; v < h; v += 12) {
          b.fillStyle = L.rgba(pink, 0.85); b.fillRect(0, v, w, 5);
          b.fillStyle = L.rgba(lilac, 0.85); b.fillRect(0, v + 6, w, 4);
        }
        L.rib(b, 0, 0, w, 6, sock, 3);
        L.knit(b, 0, 0, w, h, L.shade(sock, 0.2), L.shade(sock, -0.2), 4, 4);
      });
      L.cap(x, part, 'down', L.rgb(L.shade(sock, -0.32)));
    }
    L.finish(x, { seed: 107, grainAmt: 4 });
  },

  'P8_BLACK_CHAIN_JEANS.png'(x) {
    const black = L.hex('#1f2026'), steel = L.hex('#c3c8d0');
    L.pantsBody(x, (b, w, h) => {
      denim(b, w, h, black, 18);
      b.strokeStyle = 'rgba(80,84,94,0.55)'; b.lineWidth = 1;
      b.setLineDash([4, 3]);
      b.beginPath(); b.moveTo(0, h * 0.04); b.lineTo(w, h * 0.04); b.stroke();
      b.setLineDash([]);
    });
    L.pantsCaps(x, black);
    beltBand(x, L.hex('#111216'), steel);
    // studded belt
    L.wrapBand(x, 'torso', L.WAIST + 0.02, 0.06, (b, w, h) => {
      b.fillStyle = L.rgb(steel);
      for (let u = 4; u < w; u += 12) { b.beginPath(); b.arc(u, h / 2, 2, 0, 7); b.fill(); }
    });
    // chains looping down the outer leg
    for (const part of ['rlimb', 'llimb']) {
      const outer = L.faceU(part, part === 'rlimb' ? 'rt' : 'lf');
      L.wrapBand(x, part, 0.04, 0.60, (b, w, h) => {
        b.strokeStyle = L.rgba(steel, 0.95);
        b.lineWidth = 2.2;
        for (const dx of [22, 38]) {
          b.beginPath();
          b.moveTo(outer + dx, 0);
          b.quadraticCurveTo(outer + dx - 9, h * 0.55, outer + dx + 3, h);
          b.stroke();
        }
        // links
        b.fillStyle = L.rgba(L.shade(steel, 0.25), 0.9);
        for (let v = 0; v < h; v += 6) {
          b.beginPath(); b.arc(outer + 22 - 9 * Math.sin(Math.PI * v / h), v, 1.5, 0, 7); b.fill();
        }
      });
    }
    rips(x, black, 20);
    L.finish(x, { seed: 108, grainAmt: 5 });
  },

  'P9_Y2K_LOWRISE_FLARE_JEANS.png'(x) {
    const light = L.hex('#9dbcd8');
    L.pantsBody(x, (b, w, h) => {
      denim(b, w, h, light, 22);
      whiskers(b, w, h, light, 23);
      // flare: shading widens toward the hem
      const g = b.createLinearGradient(0, h * 0.45, 0, h);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.20)');
      b.fillStyle = g; b.fillRect(0, 0, w, h);
      b.strokeStyle = 'rgba(216,166,63,0.85)'; b.lineWidth = 1;
      b.setLineDash([4, 3]);
      b.beginPath(); b.moveTo(0, h * 0.05); b.lineTo(w, h * 0.05); b.stroke();
      b.setLineDash([]);
    });
    L.pantsCaps(x, light);
    // low-rise rhinestone waistband
    L.wrapBand(x, 'torso', 0.74, 0.09, (b, w, h) => {
      b.fillStyle = L.rgb(L.shade(light, -0.16)); b.fillRect(0, 0, w, h);
      for (let u = 4; u < w; u += 8) {
        const g = b.createRadialGradient(u, h / 2, 0, u, h / 2, 2.4);
        g.addColorStop(0, 'rgba(255,255,255,0.98)');
        g.addColorStop(1, 'rgba(190,205,235,0)');
        b.fillStyle = g;
        b.beginPath(); b.arc(u, h / 2, 2.4, 0, 7); b.fill();
      }
    });
    // butterflies on the thigh, on every face. They need a body and antennae to
    // read as butterflies — wings alone collapse into a pink X at this size.
    for (const part of ['rlimb', 'llimb']) {
      L.wrapBand(x, part, 0.20, 0.22, (b, w, h) => {
        for (let f = 0; f < 4; f++) {
          const cx = f * (w / 4) + w / 8;
          b.save(); b.translate(cx, h / 2); b.scale(0.66, 0.66);
          const wing = (dir) => {
            const g = b.createLinearGradient(0, -14, dir * 22, 14);
            g.addColorStop(0, L.rgb(L.hex('#f8a8d4')));
            g.addColorStop(1, L.rgb(L.hex('#d94fa0')));
            b.fillStyle = g;
            b.beginPath();
            b.moveTo(0, -2);
            b.quadraticCurveTo(dir * 20, -20, dir * 22, -6);
            b.quadraticCurveTo(dir * 20, 2, dir * 6, 2);
            b.quadraticCurveTo(dir * 20, 6, dir * 16, 16);
            b.quadraticCurveTo(dir * 8, 20, 0, 6);
            b.closePath(); b.fill();
            b.strokeStyle = 'rgba(60,20,50,0.6)'; b.lineWidth = 1.2; b.stroke();
          };
          wing(-1); wing(1);
          b.fillStyle = 'rgba(50,18,44,0.9)';
          b.beginPath(); b.ellipse(0, 1, 1.9, 9, 0, 0, 7); b.fill();
          b.strokeStyle = 'rgba(50,18,44,0.8)'; b.lineWidth = 1.2;
          b.beginPath(); b.moveTo(0, -7); b.quadraticCurveTo(-6, -15, -9, -16); b.stroke();
          b.beginPath(); b.moveTo(0, -7); b.quadraticCurveTo(6, -15, 9, -16); b.stroke();
          b.restore();
        }
      });
    }
    L.finish(x, { seed: 109, grainAmt: 6 });
  },

  'P10_GLAMOUR_VELOUR_TRACK_PANTS.png'(x) {
    const hot = L.hex('#e0499a');
    L.pantsBody(x, (b, w, h) => {
      b.fillStyle = L.rgb(hot); b.fillRect(0, 0, w, h);
      const r = L.rng(41);
      for (let u = 0; u < w; u += 2) {
        b.fillStyle = r() > 0.5 ? L.rgba(L.shade(hot, 0.20), 0.5) : L.rgba(L.shade(hot, -0.18), 0.45);
        b.fillRect(u, 0, 2, h);
      }
      const g = b.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0.16)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.02)');
      g.addColorStop(1, 'rgba(0,0,0,0.22)');
      b.fillStyle = g; b.fillRect(0, 0, w, h);
    }, L.WAIST, 0.9);
    for (const part of ['rlimb', 'llimb']) {
      const outer = L.faceU(part, part === 'rlimb' ? 'rt' : 'lf');
      L.wrapBand(x, part, 0, 0.9, (b, w, h) => {
        b.fillStyle = 'rgba(255,255,255,0.92)';
        b.fillRect(outer + 29, 0, 5, h);
      });
      L.wrapBand(x, part, 0.9, 0.1, (b, w, h) => L.rib(b, 0, 0, w, h, L.shade(hot, -0.12), 4));
    }
    L.pantsCaps(x, hot);
    L.wrapBand(x, 'torso', L.WAIST, 0.08, (b, w, h) => L.rib(b, 0, 0, w, h, L.shade(hot, 0.06), 5));
    // rhinestone lettering down one leg
    const u = L.faceU('rlimb', 'front');
    L.wrapBand(x, 'rlimb', 0.28, 0.20, (b, w, h) => {
      b.save();
      b.font = `900 13px ${L.HEAVY}`; b.textAlign = 'center'; b.textBaseline = 'middle';
      b.fillStyle = 'rgba(255,255,255,0.95)';
      b.fillText('GLAM', u + 32, h / 2);
      b.restore();
    });
    L.finish(x, { seed: 110, grainAmt: 4 });
  }
};

/*
 * render.mjs — draws a template onto an R6 body, offline.
 *
 * This is a Node port of the projection in assets/js/avatar-preview.js, used
 * only for reviewing artwork in bulk. The site still ships the original file
 * untouched; this exists so every design can be checked AS WORN without a
 * browser, which is the only way to catch faults that a flat template hides.
 *
 * The UV rectangles and face order are copied verbatim from the renderer.
 */

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync } from 'node:fs';
import { TORSO, RLIMB, LLIMB } from './lib.mjs';

const BODIES = {
  classic: { torso:[2,2,1],     limb:[1,2,1],       head:[2,1.2,1.2] },
  slim:    { torso:[1.7,2,0.8], limb:[0.72,2,0.72], head:[1.75,1.1,1.1] },
  wide:    { torso:[2.4,2,1.2], limb:[1.25,2,1.25], head:[2.2,1.3,1.3] }
};

const FACES = [
  { k:'front', n:[0,0,1],  c:[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]] },
  { k:'back',  n:[0,0,-1], c:[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]] },
  { k:'lf',    n:[1,0,0],  c:[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]] },
  { k:'rt',    n:[-1,0,0], c:[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]] },
  { k:'up',    n:[0,-1,0], c:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]] },
  { k:'down',  n:[0,1,0],  c:[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]] }
];
const LIGHT = (() => { const v=[-0.42,-0.66,0.62], m=Math.hypot(...v); return v.map(x=>x/m); })();
const FACE_LIGHT = { front:1, back:0.9, lf:0.94, rt:0.94, up:1.05, down:0.78 };
export const VIEWS = { front:[0,-6], three:[26,-9], side:[90,-6], back:[180,-6] };

export async function renderWorn({ shirt, pants, w = 300, h = 380, view = 'three',
                                   body = 'classic', skin = '#f3c77c', zoom = 168, bg = '#101319' }) {
  const tex = {
    shirt: shirt ? await loadImage(readFileSync(shirt)) : null,
    pants: pants ? await loadImage(readFileSync(pants)) : null
  };
  const [yaw, pitch] = VIEWS[view];
  const B = BODIES[body], P = 42;
  const T = B.torso.map(v=>v*P), Lm = B.limb.map(v=>v*P), H = B.head.map(v=>v*P);
  const armX = T[0]/2 + Lm[0]/2, legX = Lm[0]/2;

  const parts = [
    { size:H,  pos:[0, -(T[1]/2+H[1]/2), 0], tex:'head' },
    { size:T,  pos:[0,0,0],                  tex:'shirt', map:TORSO },
    { size:Lm, pos:[-armX,0,0],              tex:'shirt', map:RLIMB },
    { size:Lm, pos:[ armX,0,0],              tex:'shirt', map:LLIMB },
    { size:Lm, pos:[-legX, T[1]/2+Lm[1]/2,0],tex:'pants', map:RLIMB },
    { size:Lm, pos:[ legX, T[1]/2+Lm[1]/2,0],tex:'pants', map:LLIMB }
  ];

  const rot = (p) => {
    const ry = yaw*Math.PI/180, rx = pitch*Math.PI/180;
    const X =  p[0]*Math.cos(ry) + p[2]*Math.sin(ry);
    let   Z = -p[0]*Math.sin(ry) + p[2]*Math.cos(ry);
    const Y =  p[1]*Math.cos(rx) - Z*Math.sin(rx);
    Z = p[1]*Math.sin(rx) + Z*Math.cos(rx);
    return [X, Y, Z];
  };

  const out = [];
  for (const part of parts) {
    const hh = part.size.map(v => v/2 * 1.004);
    for (const f of FACES) {
      const n = rot(f.n);
      if (n[2] <= 0.001) continue;
      const pts = f.c.map(c => rot([
        part.pos[0] + c[0]*hh[0], part.pos[1] + c[1]*hh[1], part.pos[2] + c[2]*hh[2]]));
      const lam = Math.max(0, n[0]*LIGHT[0] + n[1]*LIGHT[1] + n[2]*LIGHT[2]);
      out.push({ pts, k:f.k, tex:part.tex, rect: part.map ? part.map[f.k] : null,
                 d: pts.reduce((a,q)=>a+q[2],0)/4,
                 b: (0.68 + 0.40*lam) * FACE_LIGHT[f.k] });
    }
  }
  out.sort((a,b) => a.d - b.d);

  const cv = createCanvas(w, h);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

  let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9;
  for (const f of out) for (const p of f.pts) {
    minY = Math.min(minY,p[1]); maxY = Math.max(maxY,p[1]);
    minX = Math.min(minX,p[0]); maxX = Math.max(maxX,p[0]);
  }
  // fit the whole figure in the tile: a review sheet is useless if it crops the
  // hands and feet, which is exactly where wrap faults show up
  const S = Math.min((h * 0.92) / (maxY - minY), (w * 0.92) / (maxX - minX));
  const cx = w/2 - (minX+maxX)/2*S, cy = h/2 - (minY+maxY)/2*S;

  for (const f of out) {
    const Pp = f.pts.map(p => [cx + p[0]*S, cy + p[1]*S]);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(Pp[0][0], Pp[0][1]);
    for (let i=1;i<4;i++) ctx.lineTo(Pp[i][0], Pp[i][1]);
    ctx.closePath(); ctx.clip();
    ctx.fillStyle = skin; ctx.fill();
    const t = tex[f.tex];
    if (t && f.rect) {
      const [rx,ry,rw,rh] = f.rect;
      const e1 = [(Pp[1][0]-Pp[0][0])/rw, (Pp[1][1]-Pp[0][1])/rw];
      const e2 = [(Pp[3][0]-Pp[0][0])/rh, (Pp[3][1]-Pp[0][1])/rh];
      ctx.setTransform(1,0,0,1,0,0);
      ctx.transform(e1[0], e1[1], e2[0], e2[1],
                    Pp[0][0] - rx*e1[0] - ry*e2[0],
                    Pp[0][1] - rx*e1[1] - ry*e2[1]);
      ctx.drawImage(t, 0, 0);
      ctx.setTransform(1,0,0,1,0,0);
    }
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = f.b < 1 ? `rgba(0,0,0,${(1-f.b).toFixed(3)})`
                            : `rgba(255,255,255,${(f.b-1).toFixed(3)})`;
    ctx.fillRect(0,0,w,h);
    ctx.restore();
  }
  return cv;
}

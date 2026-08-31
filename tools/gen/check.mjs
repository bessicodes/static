/*
 * check.mjs — audits generated templates without opening a browser.
 *
 *   node check.mjs                 # every PNG in ../../designs
 *   node check.mjs ST1_FOO.png     # one file
 *
 * Reports, per template:
 *   size      must be exactly 585 x 559
 *   seams     colour continuity across every wrap boundary (torso + both limbs)
 *   coverage  how much of each face is actually painted — catches blank backs,
 *             bare sleeve faces and unpainted shoulder caps
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { TORSO, RLIMB, LLIMB, TORSO_ORDER, RLIMB_ORDER, LLIMB_ORDER, W, H } from './lib.mjs';

const DESIGNS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'designs');

const PARTS = [
  ['torso', TORSO, TORSO_ORDER],
  ['rlimb', RLIMB, RLIMB_ORDER],
  ['llimb', LLIMB, LLIMB_ORDER]
];

function at(d, x, y) {
  const i = (y * W + x) * 4;
  return [d[i], d[i+1], d[i+2], d[i+3]];
}
const dist = (a, b) => Math.max(Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]), Math.abs(a[2]-b[2]));

export async function audit(file) {
  const img = await loadImage(readFileSync(file));
  const c = createCanvas(W, H);
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H).data;

  const out = { file, size: `${img.width}x${img.height}`, sizeOk: img.width === W && img.height === H,
                seams: [], coverage: {}, worstSeam: 0 };

  for (const [part, rects, order] of PARTS) {
    // face-by-face coverage
    for (const k of Object.keys(rects)) {
      const [rx, ry, rw, rh] = rects[k];
      let on = 0;
      for (let yy = ry; yy < ry + rh; yy += 2)
        for (let xx = rx; xx < rx + rw; xx += 2) if (at(d, xx, yy)[3] > 8) on++;
      const total = Math.ceil(rh / 2) * Math.ceil(rw / 2);
      out.coverage[`${part}.${k}`] = +(on / total).toFixed(2);
    }

    /*
     * Seam continuity.
     *
     * A hard colour edge landing exactly on a seam is legitimate — stripes do it
     * all the time. What is NOT legitimate is a jump at the seam that is far
     * bigger than the pattern's own local contrast, or one side being painted
     * while the other is bare. So compare the step across the seam against the
     * largest step between adjacent columns just either side of it.
     */
    for (let i = 0; i < order.length; i++) {
      const a = rects[order[i]], b = rects[order[(i + 1) % order.length]];
      const ax = a[0] + a[2] - 1, bx = b[0];
      let worst = 0, samples = 0;
      for (let yy = a[1]; yy < a[1] + a[3]; yy += 3) {
        const pa = at(d, ax, yy), pb = at(d, bx, yy);
        if (pa[3] < 8 && pb[3] < 8) continue;                 // both bare: fine
        // one side solid while the other is fully bare is a real hole in the wrap
        if ((pa[3] > 250 && pb[3] < 8) || (pb[3] > 250 && pa[3] < 8)) { worst = 255; samples++; continue; }
        // anything part-transparent is an antialiased hem or a bleed fringe, not a seam
        if (pa[3] < 250 || pb[3] < 250) continue;
        // skip rows sitting within 3px of a hem: the bleed pass smears colour there
        const solid = (X, Y) => at(d, X, Y)[3] > 250;
        if (!solid(ax, yy - 3) || !solid(ax, yy + 3) || !solid(bx, yy - 3) || !solid(bx, yy + 3)) continue;
        samples++;

        // biggest column-to-column step anywhere along this row of either face:
        // that is how much contrast the pattern itself legitimately contains
        let local = 0;
        for (const [fx, fw] of [[a[0], a[2]], [b[0], b[2]]]) {
          for (let k = 0; k < fw - 1; k++) {
            const p1 = at(d, fx + k, yy), p2 = at(d, fx + k + 1, yy);
            if (p1[3] > 8 && p2[3] > 8) local = Math.max(local, dist(p1, p2));
          }
        }
        worst = Math.max(worst, Math.max(0, dist(pa, pb) - local));
      }
      if (samples) {
        out.seams.push({ at: `${part} ${order[i]}->${order[(i+1)%order.length]}`, worst });
        out.worstSeam = Math.max(out.worstSeam, worst);
      }
    }
  }
  return out;
}

const CATALOGUE = JSON.parse(readFileSync(join(DESIGNS, 'designs.json'), 'utf8'));
const KIND = new Map(CATALOGUE.designs.map(d => [d.file, d.kind]));

function verdict(a, kind) {
  const problems = [];
  if (!a.sizeOk) problems.push(`SIZE ${a.size}`);
  const c = a.coverage;

  /*
   * Roblox draws pants underneath the shirt, so a pants template must fill the
   * WHOLE torso block. Covering only the hips leaves a ring of bare skin round
   * the stomach as soon as the shirt is short, cropped or absent.
   */
  if (kind === 'pants') {
    for (const k of ['torso.front', 'torso.back', 'torso.lf', 'torso.rt', 'torso.up']) {
      if (c[k] < 0.95) problems.push(`pants ${k} only ${(c[k]*100)|0}% (must fill the torso)`);
    }
  }

  // a shirt with no sleeve at all is almost always a mistake, not a design
  if (kind === 'shirt') {
    const sleeves = ['rlimb', 'llimb'].map(p => c[`${p}.front`]);
    if (Math.max(...sleeves) < 0.05) problems.push('shirt has no sleeves painted');
  }

  /*
   * A back or side left blank while the front is painted is the classic "cheap
   * template" failure. Compare the four side faces against EACH OTHER rather than
   * against 100%, because pants legitimately cover only the lower torso.
   */
  const cov = c;
  if (cov['torso.front'] > 0.05) {
    const faces = ['front', 'back', 'lf', 'rt'].map(f => cov[`torso.${f}`]);
    const spread = Math.max(...faces) - Math.min(...faces);
    if (spread > 0.12) problems.push(`torso uneven (${faces.map(v => (v*100)|0).join('/')})`);
    // only a full-torso garment (a shirt) needs its shoulder cap filled
    if (cov['torso.front'] > 0.8 && cov['torso.up'] < 0.9) {
      problems.push(`torso.up shoulder ${(cov['torso.up']*100)|0}%`);
    }
  }
  const sleeve = Math.max(cov['rlimb.front'], cov['llimb.front']);
  if (sleeve > 0.05) {
    for (const p of ['rlimb', 'llimb']) {
      const faces = ['front','back','lf','rt'].map(f => cov[`${p}.${f}`]);
      const spread = Math.max(...faces) - Math.min(...faces);
      if (spread > 0.12) problems.push(`${p} sleeve uneven (${faces.map(v=>(v*100)|0).join('/')})`);
      if (cov[`${p}.up`] < 0.9) problems.push(`${p}.up shoulder ${(cov[`${p}.up`]*100)|0}%`);
    }
  }
  return problems;
}

const arg = process.argv[2];
const files = arg ? [join(DESIGNS, arg)]
                  : readdirSync(DESIGNS).filter(f => f.endsWith('.png')).map(f => join(DESIGNS, f));

let bad = 0;
for (const f of files) {
  const a = await audit(f);
  const p = verdict(a, KIND.get(basename(f)));
  // noise-heavy patterns scatter a little either side of their own contrast,
  // so allow some headroom; a genuinely broken wrap scores 180+
  const seamFlag = a.worstSeam > 45 ? `SEAM ${a.worstSeam}` : null;
  if (seamFlag) p.push(seamFlag + ' @ ' + a.seams.filter(s => s.worst === a.worstSeam).map(s => s.at).join(','));
  const name = f.split(/[\\/]/).pop();
  if (p.length) { bad++; console.log(`FAIL ${name}\n      ${p.join('\n      ')}`); }
  else console.log(`ok   ${name}  seam<=${a.worstSeam}`);
}
console.log(`\n${files.length - bad}/${files.length} clean`);

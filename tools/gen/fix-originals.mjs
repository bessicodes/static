/*
 * fix-originals.mjs — opens the hands and necks on the hand-drawn originals.
 *
 *   node fix-originals.mjs          # report what it would change
 *   node fix-originals.mjs --apply  # write the changes
 *
 * These eight templates were drawn by hand, not generated, so build.mjs will
 * never touch them. This script is deliberately SUBTRACTIVE: it only erases
 * regions to let skin through, and never repaints artwork. Everything it does
 * is reversible with `git checkout designs/`.
 *
 *   hands  the bottom of each arm is the hand. Painting over it means the
 *          wearer's own skin tone never shows, which is why every one of these
 *          reads as if the sleeves run all the way to the fingertips.
 *   neck   the top of the torso front sits just under the chin and is visible.
 *          Crew-neck garments should let the throat show.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { W, H, RLIMB, LLIMB, TORSO, LIMB_TOP, LIMB_H, openHands, neckline } from './lib.mjs';

const DESIGNS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'designs');
const apply = process.argv.includes('--apply');

// hand = how far down the arm the garment is allowed to reach
const JOBS = [
  { file: '1_OPIUM_NOCTVRNE.png',              hand: 0.82, neck: { width: 44, depth: 13 } },
  { file: '2_Y2K_REBEL_SOVL.png',              hand: 0.82, neck: { width: 46, depth: 14 } },
  { file: '3_ESSENTIALS_CREAM.png',            hand: 0.84, neck: { width: 44, depth: 13 } },
  { file: '4_EMO_VOIDKID.png',                 hand: 0.82, neck: null },   // chain sits at the throat
  { file: 'S9_N3ON_CYBER_GRID.png',            hand: 0.82, neck: { width: 46, depth: 14 } },
  { file: 'S12_NOTHING_OVERSIZED_HOODIE.png',  hand: 0.84, neck: { width: 42, depth: 12 } },
  { file: 'ST3_STATIC_NO_SIGNAL_HOODIE.png',   hand: 0.84, neck: { width: 42, depth: 12 } }
];

function coverage(data, rect) {
  const [rx, ry, rw, rh] = rect;
  let on = 0, total = 0;
  for (let y = ry; y < ry + rh; y += 2)
    for (let x = rx; x < rx + rw; x += 2) { total++; if (data[(y * W + x) * 4 + 3] > 8) on++; }
  return on / total;
}

let changed = 0;
for (const job of JOBS) {
  const path = join(DESIGNS, job.file);
  const img = await loadImage(readFileSync(path));
  const c = createCanvas(W, H);
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);

  const before = x.getImageData(0, 0, W, H).data;
  const handRow = Math.round(LIMB_TOP + job.hand * LIMB_H);
  const handCovered = coverage(before, [RLIMB.front[0], handRow, RLIMB.front[2], (LIMB_TOP + LIMB_H) - handRow]);
  const neckCovered = before[((TORSO.front[1] + 3) * W + (TORSO.front[0] + (TORSO.front[2] >> 1))) * 4 + 3] > 128;

  const todo = [];
  if (handCovered > 0.1) todo.push(`open hands below ${Math.round(job.hand * 100)}%`);
  if (job.neck && neckCovered) todo.push('open neck');
  if (!todo.length) { console.log(`ok    ${job.file} — already open`); continue; }

  if (apply) {
    if (handCovered > 0.1) openHands(x, job.hand);
    if (job.neck && neckCovered) neckline(x, job.neck);
    writeFileSync(path, c.toBuffer('image/png'));
  }
  changed++;
  console.log(`${apply ? 'FIXED' : 'would'} ${job.file} — ${todo.join(', ')}`);
}

console.log(`\n${changed} template(s) ${apply ? 'updated' : 'need changes; re-run with --apply'}`);

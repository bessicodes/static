/*
 * build.mjs — renders clothing templates into ../../designs.
 *
 *   node build.mjs            # every design that has a painter
 *   node build.mjs ST1 S24    # only files whose name contains one of these
 *   node build.mjs --force    # overwrite even if the PNG already exists
 *
 * By default an existing PNG is left alone, so hand-made artwork is never
 * clobbered by a generated one.
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newTemplate } from './lib.mjs';

import staticLine from './d_static.mjs';
import allover from './d_allover.mjs';
import oldmoney from './d_oldmoney.mjs';
import sa from './d_sa.mjs';
import street from './d_street.mjs';
import pants from './d_pants.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DESIGNS = join(HERE, '..', '..', 'designs');

const painters = { ...staticLine, ...allover, ...oldmoney, ...sa, ...street, ...pants };

const args = process.argv.slice(2);
const force = args.includes('--force');
const filters = args.filter(a => !a.startsWith('--'));

const catalogue = JSON.parse(readFileSync(join(DESIGNS, 'designs.json'), 'utf8'));
const known = new Set(catalogue.designs.map(d => d.file));

let made = 0, skipped = 0, unknown = [];

for (const [file, paint] of Object.entries(painters)) {
  if (filters.length && !filters.some(f => file.includes(f))) continue;
  if (!known.has(file)) unknown.push(file);

  const out = join(DESIGNS, file);
  if (existsSync(out) && !force) { skipped++; continue; }

  const { x, c } = newTemplate();
  paint(x);
  writeFileSync(out, c.toBuffer('image/png'));
  made++;
  console.log('  wrote', file);
}

console.log(`\n${made} written, ${skipped} left alone (use --force to overwrite)`);
if (unknown.length) console.log('NOT IN designs.json:', unknown.join(', '));

// anything in the catalogue with neither a file nor a painter
const missing = catalogue.designs
  .filter(d => !existsSync(join(DESIGNS, d.file)) && !painters[d.file])
  .map(d => `${d.id} ${d.file}`);
if (missing.length) console.log(`\nstill missing (${missing.length}):\n  ` + missing.join('\n  '));

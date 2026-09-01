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
import { newTemplate, neckline } from './lib.mjs';

import staticLine from './d_static.mjs';
import allover from './d_allover.mjs';
import oldmoney from './d_oldmoney.mjs';
import sa from './d_sa.mjs';
import street from './d_street.mjs';
import pants from './d_pants.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DESIGNS = join(HERE, '..', '..', 'designs');

const painters = { ...staticLine, ...allover, ...oldmoney, ...sa, ...street, ...pants };

/*
 * Neck openings.
 *
 * Only garments with NO drawn collar get one. A blazer, a polo jersey or a
 * camp shirt already renders its own collar, and cutting a hole through it
 * would leave a bite out of the tailoring. Everything here is a tee, a hoodie,
 * a knit or an all-over print, where the wearer's neck should show.
 *
 * Applied after the painter, because finish()'s bleed pass would otherwise
 * creep back into the opening.
 */
const NECKLINES = {
  'ST1_STATIC_CORE_TEE_BLACK.png':        { width: 46, depth: 14 },
  'ST2_STATIC_CORE_LONGSLEEVE_WHITE.png': { width: 44, depth: 13 },
  'ST4_STATIC_INTERFERENCE_SHIRT.png':    { width: 46, depth: 14 },
  'ST5_STATIC_TEST_CARD_SHIRT.png':       { width: 46, depth: 14 },
  'S24_INFERNO_FLAME_WRAP.png':           { width: 46, depth: 14 },
  'S25_NEBULA_GALAXY_WRAP.png':           { width: 46, depth: 14 },
  'S26_MAGMA_LAVA_CRACK.png':             { width: 46, depth: 14 },
  'S27_OVERCLOCK_CIRCUIT.png':            { width: 46, depth: 14 },
  'S28_LIQUID_CHROME.png':                { width: 46, depth: 14 },
  'S14_SUGARDROP_CUTECORE.png':           { width: 42, depth: 12 },
  'S18_FAIRYFLOSS_BUTTERFLY_TEE.png':     { width: 44, depth: 13 },
  'S20_HEATWAVE_AIRBRUSH_TEE.png':        { width: 46, depth: 14 },
  'S8_APEX_MOTO_07.png':                  { width: 42, depth: 12 },
  'S15_LACEWING_PASTEL_GOTH.png':         { width: 40, depth: 12 },
  'S21_ROSEMEAD_CRICKET_KNIT.png':        { width: 44, depth: 16, shape: 'v' },
  'OM3_BRAEMAR_ARGYLE_KNIT.png':          { width: 44, depth: 16, shape: 'v' }
};

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
  if (NECKLINES[file]) neckline(x, NECKLINES[file]);
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

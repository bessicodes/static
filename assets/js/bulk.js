/*
 * bulk.js — download the whole catalogue (or whatever the filters are showing)
 * as one ZIP of Roblox-ready templates.
 *
 * The PNGs are shipped exactly as Roblox wants them: 585 x 559, 8-bit RGBA,
 * non-interlaced. Nothing is converted here — the files go into the archive
 * byte-for-byte, so what you upload is what you saw on the site.
 *
 * An UPLOAD-SHEET.txt goes in alongside them with the name, description and
 * keywords for each design, so the Roblox upload form can be filled from one
 * place instead of clicking back and forth.
 */

import { makeZip } from './zip.js';
import { saveBlob, toast } from './ui.js';

const FLOOR = 5;   // Robux price floor for classic shirts and pants

function uploadSheet(designs) {
  const lines = [];
  lines.push('STATIC — upload sheet');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`${designs.length} classic clothing template(s), 585 x 559 PNG.`);
  lines.push('Upload at: https://create.roblox.com/dashboard/creations');
  lines.push('');
  lines.push('Before you spend anything, remember:');
  lines.push(`  - 90 Robux per item up front (80 upload fee + 10 publishing advance).`);
  lines.push('  - The 80 Robux upload fee is NOT refunded if moderation rejects it.');
  lines.push(`  - Price floor is ${FLOOR} Robux. Listing AT the floor pays you 30%.`);
  lines.push('    15 Robux (3x floor) pays 62% and clears your costs in 10 sales');
  lines.push('    instead of 60. See the Guide page for the full table.');
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('');

  for (const d of designs) {
    lines.push(`[${d.id}]  ${d.file}`);
    lines.push(`  Type        Classic ${d.kind}`);
    lines.push(`  Name        ${d.name}`);
    lines.push(`  Description ${d.description}`);
    lines.push(`  Keywords    ${d.keywords.join(', ')}`);
    lines.push('');
  }
  return new TextEncoder().encode(lines.join('\r\n'));   // CRLF so Notepad is happy
}

/**
 * @param {Array} designs   catalogue entries to include
 * @param {(msg:string)=>void} onProgress
 */
export async function downloadAll(designs, onProgress = () => {}) {
  if (!designs.length) { toast('Nothing to download'); return; }

  const files = [];
  for (let i = 0; i < designs.length; i++) {
    const d = designs[i];
    onProgress(`Fetching ${i + 1} / ${designs.length}`);
    const res = await fetch(d.full, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`${d.file} — HTTP ${res.status}`);
    files.push({ name: `designs/${d.file}`, data: new Uint8Array(await res.arrayBuffer()) });
  }

  files.push({ name: 'UPLOAD-SHEET.txt', data: uploadSheet(designs) });

  onProgress('Building ZIP');
  const blob = makeZip(files);

  const stamp = new Date().toISOString().slice(0, 10);
  const label = designs.length === 1 ? designs[0].id
              : designs.every(d => d.kind === 'shirt') ? 'shirts'
              : designs.every(d => d.kind === 'pants') ? 'pants'
              : 'catalogue';
  saveBlob(blob, `STATIC-${label}-${stamp}.zip`);
  toast(`${designs.length} templates downloaded`);
}

/* preview.js — wires the R6 mannequin to the catalogue and to your own PNGs. */

import { AvatarPreview } from './avatar-preview.js';
import { loadCatalogue } from './data.js';
import { markNav, toast, saveBlob } from './ui.js';

const TEMPLATE_W = 585;
const TEMPLATE_H = 559;

// sensible on-brand opening look; both of these ship with the repo
const DEFAULT_SHIRT = 'ST-03';
const DEFAULT_PANTS = 'ST-06';

const SKINS = [
  ['#f3c77c', 'Sand'],      ['#ffdbb4', 'Light'],
  ['#e8b98a', 'Tan'],       ['#d69a5e', 'Honey'],
  ['#c68642', 'Bronze'],    ['#a26a37', 'Umber'],
  ['#7d4b25', 'Cocoa'],     ['#573118', 'Deep'],
  ['#f2f0ea', 'Porcelain'], ['#9aa1aa', 'Ash']
];

const el = id => document.getElementById(id);
const canvas = el('stage');

const preview = new AvatarPreview(canvas, { body: 'classic', skin: SKINS[0][0], zoom: 168 });

let data = null;
// object URLs for user-dropped artwork, kept alive while in use
const custom = { shirt: null, pants: null };

/* ---------- texture handling ---------- */

async function wear(slot, id) {
  const sel = el(slot);
  if (!id) {
    releaseCustom(slot);
    await preview.setTexture(slot, null);
    sel.value = '';
    return;
  }

  const d = data.byId.get(id);
  if (!d) return;

  try {
    releaseCustom(slot);
    await preview.setTexture(slot, d.full);
    sel.value = id;
    syncTitle();
  } catch {
    // the design is listed in designs.json but its PNG is not in /designs yet
    await preview.setTexture(slot, null);
    const opt = [...sel.options].find(o => o.value === id);
    if (opt && !opt.dataset.flagged) {
      opt.dataset.flagged = '1';
      opt.textContent += '  — no artwork';
    }
    sel.value = '';
    toast(`${d.id} has no PNG in the repo yet`);
  }
}

function releaseCustom(slot) {
  if (custom[slot]) { URL.revokeObjectURL(custom[slot]); custom[slot] = null; }
}

/** Loads a user-supplied PNG straight onto the mannequin. */
function useCustomFile(file, slot) {
  if (!file || !file.type.startsWith('image/')) { toast('Needs to be a PNG image'); return; }

  const url = URL.createObjectURL(file);
  const probe = new Image();

  probe.onload = async () => {
    const wrongSize = probe.naturalWidth !== TEMPLATE_W || probe.naturalHeight !== TEMPLATE_H;
    releaseCustom(slot);
    custom[slot] = url;
    await preview.setTexture(slot, url);
    el(slot).value = '';
    el('title-' + slot).textContent = file.name;
    toast(wrongSize
      ? `${probe.naturalWidth}×${probe.naturalHeight} — not a ${TEMPLATE_W}×${TEMPLATE_H} template`
      : `Loaded ${file.name}`);
  };
  probe.onerror = () => { URL.revokeObjectURL(url); toast('Could not read that image'); };
  probe.src = url;
}

function syncTitle() {
  const s = data.byId.get(el('shirt').value);
  const p = data.byId.get(el('pants').value);
  if (s) el('title-shirt').textContent = s.name;
  if (p) el('title-pants').textContent = p.name;
}

/* ---------- pickers ---------- */

function fillPicker(sel, kind) {
  const none = document.createElement('option');
  none.value = '';
  none.textContent = `— no ${kind} —`;
  sel.appendChild(none);

  const items = data.designs.filter(d => d.kind === kind);
  const byStyle = new Map();
  items.forEach(d => {
    if (!byStyle.has(d.style)) byStyle.set(d.style, []);
    byStyle.get(d.style).push(d);
  });

  [...byStyle.keys()].sort((a, b) => a.localeCompare(b)).forEach(style => {
    const g = document.createElement('optgroup');
    g.label = style;
    byStyle.get(style).forEach(d => {
      const o = document.createElement('option');
      o.value = d.id;
      o.textContent = `${d.id} · ${d.name.split('|')[0].trim()}`;
      g.appendChild(o);
    });
    sel.appendChild(g);
  });

  sel.addEventListener('change', () => wear(kind, sel.value));
}

function fillFits() {
  const box = el('fits');
  data.fits.forEach(f => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-sm';
    b.textContent = f.name;
    b.setAttribute('aria-label',
      `Wear the ${f.name} fit: ${data.byId.get(f.shirt).name} with ${data.byId.get(f.pants).name}`);
    b.addEventListener('click', async () => {
      await wear('shirt', f.shirt);
      await wear('pants', f.pants);
    });
    box.appendChild(b);
  });
}

function fillSkins() {
  const box = el('skins');
  SKINS.forEach(([hex, name], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sw';
    b.style.background = hex;
    b.title = name;
    b.setAttribute('aria-label', `Skin tone: ${name}`);
    b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', () => {
      preview.setSkin(hex);
      box.querySelectorAll('.sw').forEach(s => s.setAttribute('aria-pressed', String(s === b)));
    });
    box.appendChild(b);
  });
}

/* ---------- toggle groups ---------- */

function group(containerId, attr, onPick, initial) {
  const box = el(containerId);
  const paint = val => box.querySelectorAll(`button[data-${attr}]`).forEach(b => {
    const on = b.dataset[attr] === val;
    b.classList.toggle('btn-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  box.addEventListener('click', e => {
    const b = e.target.closest(`button[data-${attr}]`);
    if (!b) return;
    onPick(b.dataset[attr]);
    paint(b.dataset[attr]);
  });
  if (initial !== undefined) paint(initial);
  return paint;
}

/* ---------- spin ---------- */

function setSpin(on) {
  preview.spin = on;
  const b = el('spin');
  b.setAttribute('aria-pressed', String(on));
  b.classList.toggle('btn-on', on);
  b.textContent = on ? 'Spinning' : 'Spin';
}

/* ---------- drag and drop ---------- */

function wireDropzone() {
  const stage = el('pv-stage');
  let depth = 0;

  const slot = () => el('drop-slot').querySelector('button.btn-on')?.dataset.slot || 'shirt';

  stage.addEventListener('dragenter', e => {
    e.preventDefault(); depth++; stage.classList.add('dragging');
  });
  stage.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  stage.addEventListener('dragleave', () => { if (--depth <= 0) { depth = 0; stage.classList.remove('dragging'); } });
  stage.addEventListener('drop', e => {
    e.preventDefault(); depth = 0; stage.classList.remove('dragging');
    const file = e.dataTransfer?.files?.[0];
    if (file) useCustomFile(file, slot());
  });

  // touch devices get a file picker instead — there is no drag-and-drop there
  el('upload').addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) useCustomFile(file, slot());
    e.target.value = '';
  });
}

/* ---------- boot ---------- */

(async function init() {
  markNav();

  try {
    data = await loadCatalogue();
  } catch (err) {
    toast('Could not load the catalogue');
    console.error(err);
    return;
  }

  fillPicker(el('shirt'), 'shirt');
  fillPicker(el('pants'), 'pants');
  fillFits();
  fillSkins();

  group('bodies', 'body', v => preview.setBody(v), 'classic');

  const paintView = group('views', 'view', v => { preview.setView(v); setSpin(false); });

  el('drop-slot').addEventListener('click', e => {
    const b = e.target.closest('button[data-slot]');
    if (!b) return;
    el('drop-slot').querySelectorAll('button[data-slot]').forEach(x => {
      const on = x === b;
      x.classList.toggle('btn-on', on);
      x.setAttribute('aria-pressed', String(on));
    });
  });

  // zoom, kept in step with the wheel handler inside the renderer
  const zoom = el('zoom'), zoomOut = el('zoom-out');
  const showZoom = () => { zoom.value = Math.round(preview.zoom); zoomOut.value = `${Math.round(preview.zoom)}%`; };
  zoom.addEventListener('input', () => { preview.setZoom(+zoom.value); zoomOut.value = `${zoom.value}%`; });
  canvas.addEventListener('wheel', () => requestAnimationFrame(showZoom), { passive: true });
  showZoom();

  el('spin').addEventListener('click', () => setSpin(!preview.spin));
  // dragging the model stops the spin inside the renderer; keep the button honest
  canvas.addEventListener('pointerdown', () => { if (preview.spin) setSpin(false); });
  setSpin(true);

  el('save').addEventListener('click', async () => {
    const btn = el('save');
    btn.disabled = true;
    try {
      const transparent = el('save-alpha').checked;
      const blob = await preview.toPNG(900, 1100, transparent ? null : '#0c0e11');
      const s = el('shirt').value || 'custom';
      const p = el('pants').value || 'custom';
      saveBlob(blob, `STATIC_${s}_${p}.png`);
      toast('Render saved');
    } catch (err) {
      console.error(err);
      toast('Could not save the render');
    } finally {
      btn.disabled = false;
    }
  });

  wireDropzone();

  // opening state: URL wins, otherwise the house fit
  const q = new URLSearchParams(location.search);
  const wantShirt = q.get('shirt');
  const wantPants = q.get('pants');

  if (wantShirt || wantPants) {
    if (wantShirt) await wear('shirt', wantShirt);
    if (wantPants) await wear('pants', wantPants);
    // arriving with only one half set: dress the other from a fit that uses it
    if (wantShirt && !wantPants) {
      const f = data.fits.find(f => f.shirt === wantShirt);
      if (f) await wear('pants', f.pants);
    } else if (wantPants && !wantShirt) {
      const f = data.fits.find(f => f.pants === wantPants);
      if (f) await wear('shirt', f.shirt);
    }
  } else {
    await wear('shirt', DEFAULT_SHIRT);
    await wear('pants', DEFAULT_PANTS);
  }

  paintView('three');
  preview.setView('three');
  setSpin(true);
})();

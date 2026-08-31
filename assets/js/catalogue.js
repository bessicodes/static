/* catalogue.js — grid, filters, search, counts. */

import { loadCatalogue } from './data.js';
import { buildCard } from './card.js';
import { markNav } from './ui.js';

const el = {
  grid:   document.getElementById('grid'),
  tpl:    document.getElementById('card-tpl'),
  search: document.getElementById('search'),
  style:  document.getElementById('style'),
  chips:  document.getElementById('kind-chips'),
  count:  document.getElementById('count'),
  empty:  document.getElementById('empty'),
  status: document.getElementById('load-status')
};

const state = { q: '', kind: 'all', style: 'all' };
let all = [];

/* ---------- filtering ---------- */

function matches(d) {
  if (state.kind !== 'all' && d.kind !== state.kind) return false;
  if (state.style !== 'all' && d.style !== state.style) return false;
  if (state.q && !d.haystack.includes(state.q)) return false;
  return true;
}

function render() {
  const hits = all.filter(matches);

  const frag = document.createDocumentFragment();
  hits.forEach(d => frag.appendChild(buildCard(el.tpl, d)));
  el.grid.replaceChildren(frag);

  el.count.replaceChildren();
  const b = document.createElement('b');
  b.textContent = String(hits.length);
  el.count.append(b, ` of ${all.length} designs`);

  el.empty.hidden = hits.length > 0;
  el.grid.hidden = hits.length === 0;
}

/* ---------- controls ---------- */

function syncUrl() {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.kind !== 'all') p.set('kind', state.kind);
  if (state.style !== 'all') p.set('style', state.style);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

function paintChips(kind) {
  el.chips.querySelectorAll('button[data-kind]').forEach(b => {
    const on = b.dataset.kind === kind;
    b.classList.toggle('btn-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

function wireControls() {
  el.search.addEventListener('input', () => {
    state.q = el.search.value.trim().toLowerCase();
    render(); syncUrl();
  });

  el.style.addEventListener('change', () => {
    state.style = el.style.value;
    render(); syncUrl();
  });

  el.chips.addEventListener('click', e => {
    const btn = e.target.closest('button[data-kind]');
    if (!btn) return;
    state.kind = btn.dataset.kind;
    paintChips(state.kind);
    render(); syncUrl();
  });
}

function applyUrl() {
  const p = new URLSearchParams(location.search);
  const q = p.get('q'), kind = p.get('kind'), style = p.get('style');

  if (q) { state.q = q.toLowerCase(); el.search.value = q; }
  if (kind === 'shirt' || kind === 'pants') { state.kind = kind; paintChips(kind); }
  if (style && [...el.style.options].some(o => o.value === style)) {
    state.style = style; el.style.value = style;
  }
}

/* ---------- boot ---------- */

(async function init() {
  markNav();
  try {
    const { designs, styles } = await loadCatalogue();
    all = designs;

    styles.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      el.style.appendChild(o);
    });

    applyUrl();
    wireControls();
    render();
    el.status.remove();
  } catch (err) {
    el.status.textContent = `Could not load the catalogue: ${err.message}`;
    console.error(err);
  }
})();

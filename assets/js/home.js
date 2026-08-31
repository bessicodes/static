/*
 * home.js — the "current drop" row and the headline counts.
 *
 * The row leads with the house line, then anything else flagged new. When a
 * manifest is available it features only designs that actually have artwork, so
 * the front page never leads with an empty tile — and it fills itself in on its
 * own as artwork lands in /designs.
 */

import { loadCatalogue } from './data.js';
import { buildCard } from './card.js';
import { markNav } from './ui.js';

const FEATURED = 4;

/** House line first, then other new pieces, then the rest of the catalogue. */
function rank(d) {
  return d.style === 'STATIC' ? 0 : d.isNew ? 1 : 2;
}

(async function init() {
  markNav();

  const row = document.getElementById('drop-row');
  const tpl = document.getElementById('card-tpl');
  if (!row || !tpl) return;

  let data;
  try {
    data = await loadCatalogue();
  } catch (err) {
    row.textContent = 'Could not load the catalogue.';
    console.error(err);
    return;
  }

  // headline counts, straight off the data rather than typed into the markup
  const shirts = data.designs.filter(d => d.kind === 'shirt').length;
  const set = (id, val) => { const n = document.getElementById(id); if (n) n.textContent = val; };
  set('n-designs', data.designs.length);
  set('n-shirts', shirts);
  set('n-pants', data.designs.length - shirts);
  set('n-fits', data.fits.length);

  const ordered = [...data.designs].sort((a, b) => rank(a) - rank(b));

  // with a manifest we know what exists; without one, lead with the house line
  // and let each card resolve its own artwork
  const withArt = ordered.filter(d => d.hasArt);
  const show = (withArt.length ? withArt : ordered).slice(0, FEATURED);

  const frag = document.createDocumentFragment();
  show.forEach(d => {
    const cell = document.createElement('div');
    cell.className = 'drop-cell';
    cell.appendChild(buildCard(tpl, d));
    frag.appendChild(cell);
  });
  row.replaceChildren(frag);
})();

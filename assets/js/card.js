/*
 * card.js — builds one catalogue tile.
 * Shared by the catalogue grid and the "current drop" row on the home page,
 * so a design looks and behaves the same wherever it appears.
 */

import { wireArtwork } from './data.js';
import { toast, copyText } from './ui.js';

const KEYWORDS_SHOWN = 6;

export function buildCard(tpl, d) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  const img  = node.querySelector('.card-img');
  const dl   = node.querySelector('.js-dl');
  const tryB = node.querySelector('.js-try');
  const copy = node.querySelector('.js-copy');

  node.dataset.id = d.id;

  img.alt = `${d.name} — classic Roblox ${d.kind} template`;

  if (d.isNew) node.querySelector('.badge').hidden = false;

  const meta = node.querySelector('.card-meta');
  meta.textContent = `${d.id} · ${d.kind} · `;
  const em = document.createElement('em');
  em.textContent = d.style;
  meta.appendChild(em);

  node.querySelector('.card-name').textContent = d.name;
  node.querySelector('.card-desc').textContent = d.description;

  const kw = node.querySelector('.kw');
  d.keywords.slice(0, KEYWORDS_SHOWN).forEach(k => {
    const li = document.createElement('li');
    li.textContent = k;
    kw.appendChild(li);
  });
  if (d.keywords.length > KEYWORDS_SHOWN) {
    const li = document.createElement('li');
    li.className = 'more';
    li.textContent = `+${d.keywords.length - KEYWORDS_SHOWN}`;
    kw.appendChild(li);
  }

  tryB.setAttribute('aria-label', `Try on ${d.name} in the preview`);
  tryB.addEventListener('click', () => {
    location.href = `preview.html?${d.kind}=${encodeURIComponent(d.id)}`;
  });

  dl.href = d.full;
  dl.setAttribute('download', d.file);
  dl.setAttribute('aria-label', `Download ${d.name} as a PNG template`);

  copy.setAttribute('aria-label', `Copy the ${d.keywords.length} marketplace keywords for ${d.name}`);
  copy.addEventListener('click', async () => {
    const ok = await copyText(d.keywords.join(', '));
    toast(ok ? `Copied ${d.keywords.length} keywords` : 'Copy failed');
  });

  // Last: with a manifest this callback fires synchronously, so it has to run
  // after the download link is built or it would be re-enabled underneath us.
  wireArtwork(img, d, () => {
    // listed in designs.json but the PNG is not in /designs yet
    node.classList.add('is-lost');
    tryB.disabled = true;
    tryB.title = 'Artwork not in the repo yet';
    dl.removeAttribute('href');
    dl.removeAttribute('download');
    dl.setAttribute('aria-disabled', 'true');
    dl.tabIndex = -1;
  });

  return node;
}

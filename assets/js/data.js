/*
 * data.js — single source of truth for the catalogue.
 *
 * Loads designs/designs.json once and hands back a normalised, cached view.
 * Every path stays RELATIVE so the site works from a project sub-path
 * (bessicodes.github.io/static/) as well as from a domain root.
 *
 * designs/manifest.json is optional. When it is present (written by
 * tools/prepare-designs.ps1) the site knows up front which templates have
 * artwork, so a design with no PNG shows its placeholder without firing a
 * failed request. When it is absent, everything still works — the site just
 * finds out by trying to load the image and handling the error.
 */

const DATA_URL = 'designs/designs.json';
const MANIFEST_URL = 'designs/manifest.json';

let cache = null;

async function loadManifest() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!res.ok) return null;
    const m = await res.json();
    return {
      designs: new Set(m.designs || []),
      thumbs: new Set(m.thumbs || [])
    };
  } catch {
    return null;   // no manifest is a supported state, not an error
  }
}

/** @returns {Promise<{designs:Array, byId:Map, fits:Array, styles:string[], manifest:object|null}>} */
export async function loadCatalogue() {
  if (cache) return cache;

  const [res, manifest] = await Promise.all([
    fetch(DATA_URL, { cache: 'no-cache' }),
    loadManifest()
  ]);
  if (!res.ok) throw new Error(`Could not load ${DATA_URL} (HTTP ${res.status})`);
  const raw = await res.json();

  const designs = (raw.designs || []).map(d => ({
    ...d,
    // full-size template — what you download and what the mannequin wears
    full: 'designs/' + d.file,
    // optional lightweight grid image
    thumb: 'designs/thumbs/' + d.file,
    // null when we cannot know without asking the server
    hasArt: manifest ? manifest.designs.has(d.file) : null,
    // pre-lowered haystack so search does no work per keystroke
    haystack: [d.name, d.style, d.kind, d.description, ...(d.keywords || [])]
      .join(' ').toLowerCase()
  }));

  const byId = new Map(designs.map(d => [d.id, d]));

  // fits[] arrive as ["Name", shirtId, pantsId]; drop any that reference a missing id
  const fits = (raw.fits || [])
    .map(([name, shirt, pants]) => ({ name, shirt, pants }))
    .filter(f => byId.has(f.shirt) && byId.has(f.pants));

  const styles = [...new Set(designs.map(d => d.style))].sort((a, b) => a.localeCompare(b));

  cache = { designs, byId, fits, styles, manifest };
  return cache;
}

/**
 * Points an <img> at the best available artwork and reports when there is none.
 *
 * With a manifest: goes straight to the right file, or straight to the
 * placeholder — no wasted requests.
 * Without one: tries thumbnail, then full size, then gives up. This is the
 * chain that lets you drop a raw PNG into /designs and have it just appear.
 */
export function wireArtwork(img, design, onMissing) {
  const manifest = cache && cache.manifest;

  if (manifest && design.hasArt === false) {
    img.hidden = true;
    if (onMissing) onMissing();
    return;
  }

  // if the manifest says there is no thumbnail, do not bother asking for one
  let stage = (manifest && !manifest.thumbs.has(design.file)) ? 'full' : 'thumb';

  img.addEventListener('error', () => {
    if (stage === 'thumb') { stage = 'full'; img.src = design.full; return; }
    stage = 'gone';
    img.hidden = true;
    if (onMissing) onMissing();
  });

  img.src = stage === 'full' ? design.full : design.thumb;
}

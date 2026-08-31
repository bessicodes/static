# STATIC

Roblox classic clothing brand site — catalogue, 3D preview and pricing guide.

Live: **https://bessicodes.github.io/static/**

Static HTML, CSS and vanilla ES modules. No framework, no build step, no
dependencies. GitHub Pages serves the files exactly as they sit in this repo.

---

## Pages

| File | What it does |
| --- | --- |
| `index.html` | Hero, current drop, about |
| `catalogue.html` | All designs, filter by type and style, search, keyword copy, PNG download |
| `preview.html` | 3D R6 mannequin — fits, body type, skin tone, views, zoom, drag-and-drop your own PNG, save render |
| `guide.html` | Upload cost, account requirements, revenue-share maths |

## Layout

```
designs/
  designs.json        the catalogue — the single source of truth
  manifest.json       generated: which templates actually exist
  *.png               full-size 585x559 templates
  thumbs/*.png        generated: 320px grid images
assets/
  css/site.css        brand system: colour, type, buttons, grain, tear
  css/pages.css       per-page layout
  js/avatar-preview.js  the R6 renderer — do not edit
  js/data.js          loads designs.json + manifest, resolves artwork paths
  js/card.js          builds one catalogue tile
  js/catalogue.js     grid, filters, search
  js/preview.js       wires the mannequin to the catalogue
  js/home.js          current drop + headline counts
  js/ui.js            nav state, toast, clipboard, file save
tools/
  prepare-designs.ps1 builds thumbnails + manifest
  serve.mjs           local dev server
```

---

## Adding a new design

**1. Put the PNG in `designs/`.** It must be exactly 585 × 559.

**2. Add an entry to `designs/designs.json`,** inside the `"designs"` array:

```json
{
  "id": "ST-09",
  "kind": "shirt",
  "style": "STATIC",
  "name": "STATIC Dead Air Tee | Black",
  "description": "One or two sentences. Shown on the catalogue card.",
  "keywords": ["static", "glitch", "black tee", "streetwear"],
  "file": "ST9_STATIC_DEAD_AIR.png",
  "isNew": true
}
```

- `id` — must be unique. Shirts `SH-`/`ST-`/`OM-`, pants `PT-`, whatever suits.
- `kind` — `"shirt"` or `"pants"`. This decides which slot it loads into on the preview.
- `style` — free text. A new value automatically appears in the catalogue's style filter.
- `file` — must match the PNG filename exactly, including case.
- `isNew` — `true` puts a NEW badge on the card and favours it on the home page.

**3. Optionally pair it in `"fits"`** at the bottom of the same file, as
`["Display name", shirtId, pantsId]`:

```json
["Dead Air", "ST-09", "ST-06"]
```

That adds a one-click preset button on the preview page.

**4. Run the prepare script** (from the repo root):

```bash
powershell -ExecutionPolicy Bypass -File tools\prepare-designs.ps1
```

This builds the 320px grid thumbnail and rewrites `designs/manifest.json`.

**5. Commit and push.** Pages redeploys in about a minute.

```bash
git add -A && git commit -m "Add ST-09 Dead Air tee" && git push
```

### If you skip step 4

Everything still works. The site falls back to loading the full-size PNG, and
the design shows up normally — the page is just heavier, and the browser has to
discover the missing thumbnail with a failed request. Run the script when
convenient.

### Designs with no artwork yet

If an entry exists in `designs.json` but its PNG is not in `designs/`, the card
renders a **NO SIGNAL** placeholder and its try-on and download buttons switch
off. Nothing breaks. Drop the PNG in later, re-run the prepare script, and it
appears on its own.

---

## Running it locally

You need a real HTTP server — ES modules and `fetch()` do not work from
`file://`.

```bash
node tools/serve.mjs
```

Then open http://localhost:5173.

---

## The renderer

`assets/js/avatar-preview.js` is used as delivered and should not be rewritten.
The UV rectangles at the top are measured off the official Roblox template and
the layout is deliberately counter-intuitive: the torso is the **top** block,
the limbs are the two **bottom** blocks, and the two limbs have **mirrored**
face order. Changing them produces a mannequin that looks fine but wraps
textures incorrectly.

API:

```js
const p = new AvatarPreview(canvas);
p.setTexture('shirt' | 'pants', url);   // url or null
p.setSkin('#f3c77c');
p.setBody('classic' | 'slim' | 'wide');
p.setView('front' | 'three' | 'side' | 'back');
p.setZoom(168);
p.spin = true;
p.toPNG(900, 1100, '#0c0e11').then(blob => ...);
```

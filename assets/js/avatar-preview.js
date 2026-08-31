/*
 * avatar-preview.js — renders a Roblox R6 avatar wearing classic clothing textures.
 *
 * Orthographic projection, so every cube face lands as an exact parallelogram and the
 * texture maps with a pure affine transform. No perspective distortion, no libraries.
 *
 *   const p = new AvatarPreview(document.querySelector('canvas'));
 *   p.setTexture('shirt', '/designs/ST1_STATIC_CORE_TEE_BLACK.png');
 *   p.setTexture('pants', '/designs/ST6_STATIC_UTILITY_PANTS.png');
 *   p.setSkin('#f3c77c');
 *   p.setBody('slim');            // 'classic' | 'slim' | 'wide'
 *   p.setView('three');           // 'front' | 'three' | 'side' | 'back'
 *   p.spin = true;
 *   p.toPNG(900, 1100, '#14161c').then(blob => ...);
 *
 * UV rectangles below are measured off the official 585x559 Roblox template:
 * the torso is the TOP block, the limbs are the two BOTTOM blocks, and the two
 * limbs have MIRRORED face order. Getting this wrong is the single most common
 * mistake — verify against the template image before changing anything.
 */

const TORSO = { up:[231,8,128,64],  down:[231,204,128,64], front:[231,74,128,128],
                back:[427,74,128,128], rt:[165,74,64,128],  lf:[361,74,64,128] };
const RLIMB = { up:[217,289,64,64], down:[217,485,64,64],   front:[217,355,64,128],
                back:[85,355,64,128], lf:[19,355,64,128],   rt:[151,355,64,128] };
const LLIMB = { up:[308,289,64,64], down:[308,485,64,64],   front:[308,355,64,128],
                back:[440,355,64,128], lf:[374,355,64,128], rt:[506,355,64,128] };

const BODIES = {
  classic: { label:'Classic', torso:[2,2,1],     limb:[1,2,1],       head:[2,1.2,1.2] },
  slim:    { label:'Slim',    torso:[1.7,2,0.8], limb:[0.72,2,0.72], head:[1.75,1.1,1.1] },
  wide:    { label:'Wide',    torso:[2.4,2,1.2], limb:[1.25,2,1.25], head:[2.2,1.3,1.3] }
};

// corner order per face: [uv origin, +u, opposite, +v]
const FACES = [
  { k:'front', n:[0,0,1],  c:[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]] },
  { k:'back',  n:[0,0,-1], c:[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]] },
  { k:'lf',    n:[1,0,0],  c:[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]] },
  { k:'rt',    n:[-1,0,0], c:[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]] },
  { k:'up',    n:[0,-1,0], c:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]] },
  { k:'down',  n:[0,1,0],  c:[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]] }
];
const LIGHT = (() => { const v=[-0.42,-0.66,0.62], m=Math.hypot(...v); return v.map(x=>x/m); })();
const FACE_LIGHT = { front:1, back:0.9, lf:0.94, rt:0.94, up:1.05, down:0.78 };
const VIEWS = { front:[0,-6], three:[26,-9], side:[90,-6], back:[180,-6] };

export class AvatarPreview {
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.tex = { shirt:null, pants:null };
    this.skin = opts.skin || '#f3c77c';
    this.body = opts.body || 'classic';
    this.yaw = opts.yaw ?? 26;
    this.pitch = opts.pitch ?? -9;
    this.zoom = opts.zoom ?? 118;
    this.px = opts.studPx ?? 42;          // screen px per stud
    this.spin = opts.spin ?? true;
    this.spinSpeed = opts.spinSpeed ?? 0.34;
    this._drag = false;
    this._bindInput();
    this._loop();
    addEventListener('resize', () => this.render());
  }

  setTexture(slot, src) {
    return new Promise((res, rej) => {
      if (!src) { this.tex[slot] = null; this.render(); return res(null); }
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => { this.tex[slot] = im; this.render(); res(im); };
      im.onerror = () => rej(new Error('Could not load ' + src));
      im.src = src;
    });
  }
  setSkin(c) { this.skin = c; this.render(); }
  setBody(b) { if (BODIES[b]) { this.body = b; this.render(); } }
  setView(v) { const t = VIEWS[v]; if (t) { [this.yaw, this.pitch] = t; this.spin = false; this.render(); } }
  setZoom(z) { this.zoom = Math.max(70, Math.min(260, z)); this.render(); }

  _parts() {
    const B = BODIES[this.body], P = this.px;
    const T = B.torso.map(v=>v*P), L = B.limb.map(v=>v*P), H = B.head.map(v=>v*P);
    const armX = T[0]/2 + L[0]/2, legX = L[0]/2;
    return [
      { size:H, pos:[0, -(T[1]/2+H[1]/2), 0], tex:'head' },
      { size:T, pos:[0,0,0],                  tex:'shirt', map:TORSO },
      { size:L, pos:[-armX,0,0],              tex:'shirt', map:RLIMB },
      { size:L, pos:[ armX,0,0],              tex:'shirt', map:LLIMB },
      { size:L, pos:[-legX, T[1]/2+L[1]/2,0], tex:'pants', map:RLIMB },
      { size:L, pos:[ legX, T[1]/2+L[1]/2,0], tex:'pants', map:LLIMB }
    ];
  }

  _rot(p) {
    const ry = this.yaw*Math.PI/180, rx = this.pitch*Math.PI/180;
    const x =  p[0]*Math.cos(ry) + p[2]*Math.sin(ry);
    let   z = -p[0]*Math.sin(ry) + p[2]*Math.cos(ry);
    const y =  p[1]*Math.cos(rx) - z*Math.sin(rx);
    z = p[1]*Math.sin(rx) + z*Math.cos(rx);
    return [x, y, z];
  }

  _faces() {
    const out = [];
    for (const part of this._parts()) {
      const h = part.size.map(v => v/2 * 1.004);       // hairline overlap kills seams
      for (const f of FACES) {
        const n = this._rot(f.n);
        if (n[2] <= 0.001) continue;                   // backface
        const pts = f.c.map(c => this._rot([
          part.pos[0] + c[0]*h[0], part.pos[1] + c[1]*h[1], part.pos[2] + c[2]*h[2]]));
        const lam = Math.max(0, n[0]*LIGHT[0] + n[1]*LIGHT[1] + n[2]*LIGHT[2]);
        out.push({ pts, k:f.k, tex:part.tex, rect: part.map ? part.map[f.k] : null,
                   d: pts.reduce((a,q)=>a+q[2],0)/4,
                   b: (0.68 + 0.40*lam) * FACE_LIGHT[f.k] });
      }
    }
    return out.sort((a,b) => a.d - b.d);               // painter's algorithm
  }

  _draw(ctx, w, h, dpr, bg, zoom) {
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0,0,w,h); }
    const faces = this._faces();
    let minY = 1e9, maxY = -1e9;
    for (const f of faces) for (const p of f.pts) { minY = Math.min(minY,p[1]); maxY = Math.max(maxY,p[1]); }
    const S = zoom/118, cx = w/2, cy = h/2 - (minY+maxY)/2*S;

    ctx.save();                                        // ground shadow
    ctx.globalAlpha = 0.32; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(cx, cy + maxY*S + 10, 78*S, 13*S, 0, 0, 7);
    ctx.filter = 'blur(4px)'; ctx.fill(); ctx.restore();

    for (const f of faces) {
      const P = f.pts.map(p => [cx + p[0]*S, cy + p[1]*S]);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
      for (let i=1;i<4;i++) ctx.lineTo(P[i][0], P[i][1]);
      ctx.closePath(); ctx.clip();
      ctx.fillStyle = this.skin; ctx.fill();           // skin behind, so alpha shows body colour
      if (f.tex === 'head' && f.k === 'front') this._face(ctx, P);
      const t = this.tex[f.tex];
      if (t && f.rect) {
        const [rx,ry,rw,rh] = f.rect;
        const e1 = [(P[1][0]-P[0][0])/rw, (P[1][1]-P[0][1])/rw];
        const e2 = [(P[3][0]-P[0][0])/rh, (P[3][1]-P[0][1])/rh];
        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.transform(e1[0], e1[1], e2[0], e2[1],
                      P[0][0] - rx*e1[0] - ry*e2[0],
                      P[0][1] - rx*e1[1] - ry*e2[1]);
        ctx.drawImage(t, 0, 0);
        ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      ctx.globalCompositeOperation = 'source-atop';    // per-face lighting
      ctx.fillStyle = f.b < 1 ? `rgba(0,0,0,${(1-f.b).toFixed(3)})`
                              : `rgba(255,255,255,${(f.b-1).toFixed(3)})`;
      ctx.fillRect(0,0,w,h);
      ctx.restore();
    }
  }

  _face(ctx, P) {
    const at = (u,v) => [P[0][0] + u*(P[1][0]-P[0][0]) + v*(P[3][0]-P[0][0]),
                         P[0][1] + u*(P[1][1]-P[0][1]) + v*(P[3][1]-P[0][1])];
    const sc = Math.hypot(P[1][0]-P[0][0], P[1][1]-P[0][1]) / 64;
    ctx.fillStyle = '#20242c';
    for (const u of [0.34, 0.66]) {
      const e = at(u, 0.40);
      ctx.beginPath(); ctx.ellipse(e[0], e[1], 3.4*sc, 4.4*sc, 0, 0, 7); ctx.fill();
    }
    const a = at(0.34,0.60), m = at(0.50,0.74), b = at(0.66,0.60);
    ctx.strokeStyle = '#20242c'; ctx.lineWidth = 2.6*sc; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.quadraticCurveTo(m[0],m[1],b[0],b[1]); ctx.stroke();
  }

  render() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = this.cv.clientWidth, h = this.cv.clientHeight;
    if (!w || !h) return;
    if (this.cv.width !== w*dpr || this.cv.height !== h*dpr) {
      this.cv.width = w*dpr; this.cv.height = h*dpr;
    }
    this._draw(this.cv.getContext('2d'), w, h, dpr, null, this.zoom);
  }

  /** Off-screen render at any size — use for marketplace thumbnails. */
  toPNG(w = 900, h = 1100, bg = null) {
    const c = document.createElement('canvas');
    c.width = w*2; c.height = h*2;
    this._draw(c.getContext('2d'), w, h, 2, bg, this.zoom*2.4);
    return new Promise(res => c.toBlob(res, 'image/png'));
  }

  _bindInput() {
    let px = 0, py = 0;
    this.cv.addEventListener('pointerdown', e => {
      this._drag = true; this.spin = false; px = e.clientX; py = e.clientY;
      this.cv.setPointerCapture(e.pointerId);
    });
    this.cv.addEventListener('pointermove', e => {
      if (!this._drag) return;
      this.yaw += (e.clientX - px) * 0.55;
      this.pitch = Math.max(-44, Math.min(44, this.pitch + (e.clientY - py) * 0.35));
      px = e.clientX; py = e.clientY; this.render();
    });
    addEventListener('pointerup', () => { this._drag = false; });
    this.cv.addEventListener('wheel', e => {
      e.preventDefault(); this.setZoom(this.zoom - e.deltaY * 0.12);
    }, { passive: false });
  }

  _loop() {
    const step = () => {
      if (this.spin && !this._drag) { this.yaw += this.spinSpeed; this.render(); }
      requestAnimationFrame(step);
    };
    step();
  }
}

export { BODIES, VIEWS, TORSO, RLIMB, LLIMB };

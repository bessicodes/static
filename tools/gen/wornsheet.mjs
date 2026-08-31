import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { renderWorn } from './render.mjs';

const D = join('..','..','designs');
const cat = JSON.parse(readFileSync(join(D,'designs.json'),'utf8'));
const view = process.argv[2] || 'three';
const kind = process.argv[3];
// pair each item with a plain counterpart so the figure reads as dressed and
// the item under review is the only thing that can look wrong
const NEUTRAL_PANTS = join(D,'P4_MIDNIGHT_SUIT_TROUSERS.png');
const NEUTRAL_SHIRT = join(D,'ST1_STATIC_CORE_TEE_BLACK.png');

const items = cat.designs.filter(d => !kind || d.kind === kind);
const TW=220, TH=280, LBL=15, COLS=4, per=12;

for (let s=0; s*per < items.length; s++){
  const batch = items.slice(s*per,(s+1)*per);
  const rows = Math.ceil(batch.length/COLS);
  const c = createCanvas(COLS*TW, rows*(TH+LBL));
  const x = c.getContext('2d');
  x.fillStyle='#0c0e12'; x.fillRect(0,0,c.width,c.height);
  for (let i=0;i<batch.length;i++){
    const d = batch[i];
    const m = await renderWorn({
      shirt: d.kind==='shirt' ? join(D,d.file) : NEUTRAL_SHIRT,
      pants: d.kind==='pants' ? join(D,d.file) : NEUTRAL_PANTS,
      w:TW,h:TH,view});
    const cx=(i%COLS)*TW, cy=Math.floor(i/COLS)*(TH+LBL);
    x.drawImage(m,cx,cy);
    x.fillStyle='#000d'; x.fillRect(cx,cy+TH,TW,LBL);
    x.fillStyle='#fff'; x.font='10px Arial'; x.textBaseline='middle';
    x.fillText(d.id+'  '+d.name.split('|')[0].trim().slice(0,30), cx+4, cy+TH+LBL/2);
  }
  writeFileSync(`worn_${view}_${kind||'all'}_${s+1}.png`, c.toBuffer('image/png'));
  console.log(`worn_${view}_${kind||'all'}_${s+1}.png`);
}

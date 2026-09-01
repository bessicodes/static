/*
 * zip.js — minimal ZIP writer, no dependencies.
 *
 * Files are STORED, not deflated. PNGs are already compressed, so deflating
 * them again would burn CPU for roughly nothing — and storing keeps this small
 * enough to stay in plain vanilla JS with no build step.
 *
 * Produces a standard archive that Windows Explorer, macOS and 7-Zip all open.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/** DOS date/time stamp — ZIP predates unix time. */
function dosStamp(d = new Date()) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2) | 0;
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

class Writer {
  constructor(size) { this.b = new Uint8Array(size); this.v = new DataView(this.b.buffer); this.p = 0; }
  u16(n) { this.v.setUint16(this.p, n, true); this.p += 2; }
  u32(n) { this.v.setUint32(this.p, n >>> 0, true); this.p += 4; }
  bytes(a) { this.b.set(a, this.p); this.p += a.length; }
}

/**
 * @param {{name:string, data:Uint8Array}[]} files
 * @returns {Blob} a ready-to-save application/zip Blob
 */
export function makeZip(files) {
  const enc = new TextEncoder();
  const { time, date } = dosStamp();

  const entries = files.map(f => {
    const name = enc.encode(f.name);
    return { name, data: f.data, crc: crc32(f.data), offset: 0 };
  });

  const LOCAL = 30, CENTRAL = 46, EOCD = 22;
  let total = EOCD;
  for (const e of entries) total += LOCAL + e.name.length + e.data.length + CENTRAL + e.name.length;

  const w = new Writer(total);

  // local file headers + data
  for (const e of entries) {
    e.offset = w.p;
    w.u32(0x04034b50);
    w.u16(20);            // version needed
    w.u16(0x0800);        // flags: UTF-8 filenames
    w.u16(0);             // method: stored
    w.u16(time); w.u16(date);
    w.u32(e.crc);
    w.u32(e.data.length); // compressed == uncompressed when stored
    w.u32(e.data.length);
    w.u16(e.name.length);
    w.u16(0);             // no extra field
    w.bytes(e.name);
    w.bytes(e.data);
  }

  // central directory
  const cdStart = w.p;
  for (const e of entries) {
    w.u32(0x02014b50);
    w.u16(20); w.u16(20);
    w.u16(0x0800);
    w.u16(0);
    w.u16(time); w.u16(date);
    w.u32(e.crc);
    w.u32(e.data.length);
    w.u32(e.data.length);
    w.u16(e.name.length);
    w.u16(0); w.u16(0);   // extra, comment
    w.u16(0);             // disk number
    w.u16(0);             // internal attrs
    w.u32(0);             // external attrs
    w.u32(e.offset);
    w.bytes(e.name);
  }
  const cdSize = w.p - cdStart;

  // end of central directory
  w.u32(0x06054b50);
  w.u16(0); w.u16(0);
  w.u16(entries.length); w.u16(entries.length);
  w.u32(cdSize); w.u32(cdStart);
  w.u16(0);

  return new Blob([w.b], { type: 'application/zip' });
}

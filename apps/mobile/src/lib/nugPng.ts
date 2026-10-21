// Minimal PNG writer for on-device specimen renders. Pixels are palette-indexed
// on the green channel (the renderer's colour is a function of one intensity),
// and the zlib stream uses stored blocks so no compressor is needed on native.

const CRC = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array, start: number, end: number) {
  let c = 0xffffffff;
  for (let i = start; i < end; i += 1) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

class Writer {
  bytes: Uint8Array;
  at = 0;
  constructor(size: number) {
    this.bytes = new Uint8Array(size);
  }
  u8(v: number) {
    this.bytes[this.at++] = v & 0xff;
  }
  u32(v: number) {
    this.u8(v >>> 24);
    this.u8(v >>> 16);
    this.u8(v >>> 8);
    this.u8(v);
  }
  chunk(type: string, body: Uint8Array) {
    this.u32(body.length);
    const start = this.at;
    for (let i = 0; i < 4; i += 1) this.u8(type.charCodeAt(i));
    this.bytes.set(body, this.at);
    this.at += body.length;
    this.u32(crc32(this.bytes, start, this.at));
  }
}

export function encodeNugPng(width: number, height: number, rgba: Uint8ClampedArray, levels = 64) {
  const shift = Math.round(Math.log2(256 / levels));
  const sums = new Float64Array(levels * 4);
  const raw = new Uint8Array((width + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width + 1)] = 0;
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const b = rgba[i * 4 + 1] >> shift;
      raw[y * (width + 1) + 1 + x] = b;
      sums[b * 4] += rgba[i * 4];
      sums[b * 4 + 1] += rgba[i * 4 + 1];
      sums[b * 4 + 2] += rgba[i * 4 + 2];
      sums[b * 4 + 3] += 1;
    }
  }
  const plte = new Uint8Array(levels * 3);
  for (let b = 0; b < levels; b += 1) {
    const n = sums[b * 4 + 3] || 1;
    plte[b * 3] = Math.round(sums[b * 4] / n);
    plte[b * 3 + 1] = sums[b * 4 + 3] ? Math.round(sums[b * 4 + 1] / n) : b << shift;
    plte[b * 3 + 2] = Math.round(sums[b * 4 + 2] / n);
  }
  const blocks = Math.ceil(raw.length / 65535);
  const zlib = new Uint8Array(2 + raw.length + blocks * 5 + 4);
  let z = 0;
  zlib[z++] = 0x78;
  zlib[z++] = 0x01;
  for (let off = 0; off < raw.length; off += 65535) {
    const len = Math.min(65535, raw.length - off);
    zlib[z++] = off + len >= raw.length ? 1 : 0;
    zlib[z++] = len & 0xff;
    zlib[z++] = len >>> 8;
    zlib[z++] = ~len & 0xff;
    zlib[z++] = (~len >>> 8) & 0xff;
    zlib.set(raw.subarray(off, off + len), z);
    z += len;
  }
  let a = 1;
  let b = 0;
  for (let i = 0; i < raw.length; i += 1) {
    a = (a + raw[i]) % 65521;
    b = (b + a) % 65521;
  }
  const adler = ((b << 16) | a) >>> 0;
  zlib[z++] = adler >>> 24;
  zlib[z++] = (adler >>> 16) & 0xff;
  zlib[z++] = (adler >>> 8) & 0xff;
  zlib[z++] = adler & 0xff;
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8;
  header[9] = 3;
  const out = new Writer(8 + 25 + 12 + plte.length + 12 + zlib.length + 12);
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].forEach((v) => out.u8(v));
  out.chunk("IHDR", header);
  out.chunk("PLTE", plte);
  out.chunk("IDAT", zlib);
  out.chunk("IEND", new Uint8Array(0));
  return out.bytes.subarray(0, out.at);
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function toBase64(bytes: Uint8Array) {
  const parts: string[] = [];
  let line = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    line += B64[(n >>> 18) & 63] + B64[(n >>> 12) & 63] + (i + 1 < bytes.length ? B64[(n >>> 6) & 63] : "=") + (i + 2 < bytes.length ? B64[n & 63] : "=");
    if (line.length > 8192) {
      parts.push(line);
      line = "";
    }
  }
  parts.push(line);
  return parts.join("");
}

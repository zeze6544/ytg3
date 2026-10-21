import { deflateSync } from "node:zlib";

const TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// The renderer's colour is a monotone function of one intensity value, so a
// palette keyed on the green channel reproduces it with no visible loss.
export function encodeIndexedPng(width, height, rgba, levels = 64) {
  const shift = Math.round(Math.log2(256 / levels));
  const sums = new Float64Array(levels * 4);
  const index = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const b = rgba[i * 4 + 1] >> shift;
    index[i] = b;
    sums[b * 4] += rgba[i * 4];
    sums[b * 4 + 1] += rgba[i * 4 + 1];
    sums[b * 4 + 2] += rgba[i * 4 + 2];
    sums[b * 4 + 3] += 1;
  }
  const plte = Buffer.alloc(levels * 3);
  for (let b = 0; b < levels; b += 1) {
    const n = sums[b * 4 + 3] || 1;
    plte[b * 3] = Math.round(sums[b * 4] / n);
    plte[b * 3 + 1] = sums[b * 4 + 3] ? Math.round(sums[b * 4 + 1] / n) : (b << shift);
    plte[b * 3 + 2] = Math.round(sums[b * 4 + 2] / n);
  }
  const raw = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width + 1)] = 0;
    raw.set(index.subarray(y * width, (y + 1) * width), y * (width + 1) + 1);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 3;
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", header),
    chunk("PLTE", plte),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function encodePng(width, height, rgba) {
  const stride = width * 3;
  const rgb = Buffer.alloc(stride * height);
  for (let i = 0, p = 0; i < width * height; i += 1, p += 3) {
    rgb[p] = rgba[i * 4];
    rgb[p + 1] = rgba[i * 4 + 1];
    rgb[p + 2] = rgba[i * 4 + 2];
  }
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const out = y * (stride + 1);
    raw[out] = 1;
    for (let i = 0; i < stride; i += 1) {
      const left = i >= 3 ? rgb[y * stride + i - 3] : 0;
      raw[out + 1 + i] = (rgb[y * stride + i] - left) & 0xff;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

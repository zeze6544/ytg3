// Checks that every record's specimen image differs from every other record's.
// Step 1 compares 256-bit thumbnail dHashes for all pairs (from
// gen-images --hash-all). Step 2 re-renders the closest pairs and measures the
// actual pixel difference, so the verdict rests on images, not on names or ids.
//   NODE_NO_WARNINGS=1 node scripts/strains/image-uniqueness.mjs [--check 200]
import { join } from "node:path";
import { DATA, MOBILE, OUT, args, readJson, writeJson } from "./lib.mjs";

const opts = args();
const CHECK = Number(opts.check ?? 200);
const { renderNug } = await import(join(MOBILE, "src", "lib", "nugRender.ts"));
const { hashes, renderer } = readJson(join(DATA, "image-hashes.json"));
const index = readJson(join(OUT, "index.json"));
const TYPES = ["hybrid", "indica", "sativa", "ruderalis", "unspecified"];
const info = new Map(index.cols.slug.map((slug, i) => [slug, { family: index.cols.family[i], type: TYPES[index.cols.type[i]] }]));
const slugs = Object.keys(hashes);
const N = slugs.length;
const W = new Uint32Array(N * 8);
const h64 = new Map();
slugs.forEach((slug, i) => {
  const [short, long] = hashes[slug];
  h64.set(short, (h64.get(short) ?? 0) + 1);
  for (let w = 0; w < 8; w += 1) W[i * 8 + w] = parseInt(long.slice(w * 8, w * 8 + 8), 16) >>> 0;
});
const pop = (v) => {
  v -= (v >>> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
};
const exact = new Map();
for (const slug of slugs) {
  const k = hashes[slug][1];
  (exact.get(k) ?? exact.set(k, []).get(k)).push(slug);
}
const collisions = [...exact.values()].filter((list) => list.length > 1);
const histogram = new Float64Array(257);
// Keep the CHECK closest pairs in a simple bounded list.
const closest = [];
let worstKept = 257;
const started = Date.now();
for (let i = 0; i < N; i += 1) {
  const a = i * 8;
  for (let j = i + 1; j < N; j += 1) {
    const b = j * 8;
    let d = 0;
    for (let w = 0; w < 8; w += 1) d += pop(W[a + w] ^ W[b + w]);
    histogram[d] += 1;
    if (closest.length < CHECK || d < worstKept) {
      closest.push([i, j, d]);
      if (closest.length > CHECK * 2) {
        closest.sort((x, y) => x[2] - y[2]);
        closest.length = CHECK;
        worstKept = closest[CHECK - 1][2];
      }
    }
  }
}
closest.sort((x, y) => x[2] - y[2]);
closest.length = Math.min(closest.length, CHECK);
const hashSeconds = Math.round((Date.now() - started) / 1000);

// Pixel check: mean absolute difference of the green channel, and the share of
// pixels that differ by more than 24 levels, on the real 300x200 thumbnails.
const cache = new Map();
const thumb = (slug) => {
  if (!cache.has(slug)) cache.set(slug, renderNug(`s_${slug}`, "thumb", info.get(slug)?.type).data);
  return cache.get(slug);
};
const pixelPairs = closest.map(([i, j, d]) => {
  const A = thumb(slugs[i]);
  const B = thumb(slugs[j]);
  let sum = 0;
  let differ = 0;
  for (let p = 1; p < A.length; p += 4) {
    const diff = Math.abs(A[p] - B[p]);
    sum += diff;
    if (diff > 24) differ += 1;
  }
  const px = A.length / 4;
  const fa = info.get(slugs[i])?.family;
  return { a: slugs[i], b: slugs[j], hamming256: d, mean_abs_diff: Math.round((sum / px) * 100) / 100, pixels_differing_pct: Math.round((differ / px) * 1000) / 10, same_family: fa !== undefined && fa === info.get(slugs[j])?.family };
});
const pairs = (N * (N - 1)) / 2;
let acc = 0;
let median = null;
for (let d = 0; d <= 256; d += 1) {
  acc += histogram[d];
  if (median === null && acc >= pairs / 2) median = d;
}
const minPixel = pixelPairs.reduce((m, p) => Math.min(m, p.pixels_differing_pct), 100);
const report = {
  renderer,
  checked: new Date().toISOString().slice(0, 10),
  records: N,
  distinct_256bit_hashes: exact.size,
  exact_256bit_collisions: collisions.length,
  collision_groups: collisions.slice(0, 30),
  distinct_64bit_hashes: h64.size,
  pairs_compared: pairs,
  min_hamming_256: closest[0]?.[2] ?? null,
  median_hamming_256: median,
  hamming_256_low: Object.fromEntries([...histogram.slice(0, 40)].map((n, d) => [d, n]).filter(([, n]) => n)),
  pixel_checked_pairs: pixelPairs.length,
  pixel_min_pct_differing: minPixel,
  closest_pairs: pixelPairs.slice(0, 25),
  seconds_hash: hashSeconds,
  seconds_total: Math.round((Date.now() - started) / 1000),
};
writeJson(join(DATA, "image-uniqueness.json"), report, true);
console.log(JSON.stringify({ ...report, collision_groups: collisions.length, closest_pairs: report.closest_pairs.slice(0, 6) }, null, 1));

// Renders persistent specimen images and tracks them in data/strains/images.json.
//   node scripts/strains/gen-images.mjs --batch 500          next 500 by priority that lack a current asset
//   node scripts/strains/gen-images.mjs --top 1000           ensure the first 1000 by priority have a current asset
//   node scripts/strains/gen-images.mjs --regen blue-dream,og-kush
//   node scripts/strains/gen-images.mjs --hash-all           thumbnail dHash of every record, no files written
// Assets live in apps/mobile/public/strains/img/<size>/<slug>.png. Records
// without a stored asset are rendered on the device from the same geometry.
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { cpus } from "node:os";
import { DATA, MOBILE, OUT, TODAY, args, readJson, writeJson } from "./lib.mjs";
import { encodeIndexedPng } from "./png.mjs";

const RENDERER = join(MOBILE, "src", "lib", "nugRender.ts");

if (!isMainThread) {
  const { renderNug, nugDHash, nugDHash256, NUG_RENDERER_VERSION } = await import(RENDERER);
  parentPort.on("message", ({ id, slug, type, mode }) => {
    try {
      const thumb = renderNug(id, "thumb", type);
      const hash = nugDHash(thumb);
      const hash256 = nugDHash256(thumb);
      if (mode === "hash") return parentPort.postMessage({ id, slug, hash, hash256, version: NUG_RENDERER_VERSION });
      const detail = renderNug(id, "detail", type);
      const t = encodeIndexedPng(thumb.width, thumb.height, thumb.data);
      const d = encodeIndexedPng(detail.width, detail.height, detail.data);
      writeFileSync(join(OUT, "img", "t", `${slug}.png`), t);
      writeFileSync(join(OUT, "img", "d", `${slug}.png`), d);
      parentPort.postMessage({ id, slug, hash, hash256, detailHash: nugDHash(detail), version: NUG_RENDERER_VERSION, bytes: t.length + d.length });
    } catch (error) {
      parentPort.postMessage({ id, slug, error: String(error?.message ?? error) });
    }
  });
} else {
  const opts = args();
  const { NUG_RENDERER_VERSION } = await import(RENDERER);
  const index = readJson(join(OUT, "index.json"));
  const manifestPath = join(DATA, "images.json");
  const manifest = readJson(manifestPath, { renderer: null, assets: {} });
  manifest.renderer = { version: NUG_RENDERER_VERSION, module: "apps/mobile/src/lib/nugRender.ts", thumb: "300x200", detail: "640x600" };
  const TYPES = ["hybrid", "indica", "sativa", "ruderalis", "unspecified"];
  const { slug, type, complete, kind } = index.cols;
  const rows = slug.map((s, i) => ({ id: `s_${s}`, slug: s, type: TYPES[type[i]], complete: complete[i], kind: kind[i], i }));
  const current = (row) => {
    const asset = manifest.assets[row.id];
    return asset?.status === "stored" && asset.version === NUG_RENDERER_VERSION && existsSync(join(OUT, "img", "t", `${row.slug}.png`)) && existsSync(join(OUT, "img", "d", `${row.slug}.png`));
  };
  let todo;
  let mode = "store";
  if (opts["hash-all"]) {
    mode = "hash";
    todo = rows;
  } else if (opts.regen) {
    const wanted = new Set(String(opts.regen).split(",").map((s) => s.trim()));
    todo = rows.filter((row) => wanted.has(row.slug));
  } else {
    // Priority: cultivars before products, most complete first, then name order.
    const ranked = rows.sort((a, b) => Number(a.kind !== 0) - Number(b.kind !== 0) || b.complete - a.complete || a.i - b.i);
    todo = opts.top
      ? ranked.slice(0, Number(opts.top)).filter((row) => !current(row))
      : ranked.filter((row) => !current(row)).slice(0, Number(opts.batch ?? 100));
  }
  if (mode === "store") {
    mkdirSync(join(OUT, "img", "t"), { recursive: true });
    mkdirSync(join(OUT, "img", "d"), { recursive: true });
    for (const row of todo) manifest.assets[row.id] = { ...(manifest.assets[row.id] ?? {}), status: "queued", queued: TODAY };
    writeJson(manifestPath, manifest);
  }
  const workers = Math.max(1, Math.min(Number(opts.workers ?? cpus().length), todo.length));
  const hashes = {};
  let done = 0;
  let failed = 0;
  const started = Date.now();
  await new Promise((resolve) => {
    if (!todo.length) return resolve();
    let next = 0;
    let live = 0;
    for (let w = 0; w < workers; w += 1) {
      const worker = new Worker(fileURLToPath(import.meta.url), { workerData: {} });
      live += 1;
      const feed = () => {
        if (next >= todo.length) {
          worker.terminate();
          live -= 1;
          if (!live) resolve();
          return;
        }
        const row = todo[next++];
        worker.postMessage({ id: row.id, slug: row.slug, type: row.type, mode });
      };
      worker.on("message", (msg) => {
        done += 1;
        if (msg.error) {
          failed += 1;
          if (mode === "store") manifest.assets[msg.id] = { status: "failed", error: msg.error, attempted: TODAY };
        } else if (mode === "hash") hashes[msg.slug] = [msg.hash, msg.hash256];
        else manifest.assets[msg.id] = { status: "stored", version: msg.version, hash: msg.hash, hash256: msg.hash256, detail_hash: msg.detailHash, bytes: msg.bytes, generated: TODAY };
        if (done % 500 === 0) {
          console.log(`${done}/${todo.length} ${((Date.now() - started) / 1000).toFixed(0)}s`);
          if (mode === "store") writeJson(manifestPath, manifest);
        }
        feed();
      });
      worker.on("error", (error) => {
        console.error(error);
        failed += 1;
        feed();
      });
      feed();
    }
  });
  if (mode === "store") writeJson(manifestPath, manifest);
  if (mode === "hash") {
    writeJson(join(DATA, "image-hashes.json"), { renderer: NUG_RENDERER_VERSION, built: TODAY, size: "thumb", hashes });
  }
  const stored = Object.values(manifest.assets).filter((a) => a.status === "stored").length;
  console.log(JSON.stringify({ mode, processed: done, failed, seconds: Math.round((Date.now() - started) / 1000), stored_total: stored }));
  void statSync;
  void workerData;
}

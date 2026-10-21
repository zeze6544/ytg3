// Downloads raw source files into .cache/strains and records what was fetched.
//   node scripts/strains/fetch-sources.mjs            fetch anything missing
//   node scripts/strains/fetch-sources.mjs --force    refetch everything
//   node scripts/strains/fetch-sources.mjs --from DIR copy already-downloaded files
import { copyFileSync, createWriteStream, existsSync, mkdirSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { CACHE, DATA, args, readJson, writeJson } from "./lib.mjs";
import { SOURCE_FILES } from "./sources.mjs";

const opts = args();
mkdirSync(CACHE, { recursive: true });
const manifestPath = join(DATA, "fetch-manifest.json");
const manifest = readJson(manifestPath, { files: {} });

async function sha256(path) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}

for (const source of SOURCE_FILES) {
  const dest = join(CACHE, source.file);
  if (existsSync(dest) && !opts.force) {
    console.log(`have  ${source.file}`);
    if (!manifest.files[source.id]) manifest.files[source.id] = { ...source, fetched_at: statSync(dest).mtime.toISOString(), bytes: statSync(dest).size, sha256: await sha256(dest) };
    continue;
  }
  if (opts.from && existsSync(join(opts.from, source.file))) {
    copyFileSync(join(opts.from, source.file), dest);
    console.log(`copy  ${source.file}`);
  } else {
    console.log(`fetch ${source.url}`);
    const res = await fetch(source.url, { redirect: "follow" });
    if (!res.ok || !res.body) {
      console.error(`  failed ${res.status}`);
      manifest.files[source.id] = { ...source, error: `HTTP ${res.status}`, attempted_at: new Date().toISOString() };
      continue;
    }
    await pipeline(Readable.fromWeb(res.body), createWriteStream(`${dest}.part`));
    renameSync(`${dest}.part`, dest);
  }
  manifest.files[source.id] = { ...source, fetched_at: new Date().toISOString(), bytes: statSync(dest).size, sha256: await sha256(dest) };
}

writeJson(manifestPath, manifest, true);
console.log(`manifest ${manifestPath}`);

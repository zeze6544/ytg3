// Drops filler drug files and same-name duplicates from the published JSON.
//   node scripts/prune-files.mjs
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isBoilerplateFile, nameKey } from "./file-relevance.mjs";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const archivePaths = ["apps/mobile/src/data/archive.json", "src/data/archive.json"].map((rel) => join(root, rel));
const extraPaths = ["apps/mobile/src/data/drugs-extra.json", "src/data/drugs-extra.json"].map((rel) => join(root, rel));
const catalogueDirs = ["apps/mobile/public/catalogue", "public/catalogue", "src/data/catalogue"].map((rel) => join(root, rel));

function read(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function write(path, value) {
  writeFileSync(path, JSON.stringify(value));
}

function score(drug, where) {
  const place = where === "archive" ? 40 : where === "extra" ? 20 : 0;
  return place + Math.min(String(drug.summary ?? "").length, 500);
}

export function prunePublishedFiles() {
  const archivePath = archivePaths.find((path) => existsSync(path));
  const extraPath = extraPaths.find((path) => existsSync(path));
  const catalogueDir = catalogueDirs.find((dir) => existsSync(join(dir, "manifest.json")));
  if (!archivePath || !extraPath || !catalogueDir) throw new Error("published archive files are missing");

  const archive = read(archivePath);
  const extra = read(extraPath);
  const manifest = read(join(catalogueDir, "manifest.json"));
  const shardNames = manifest.drugs ?? [];
  const shards = shardNames.map((name) => ({ name, body: read(join(catalogueDir, name)) }));

  const removedSlugs = new Set();
  const redirect = new Map();
  let boilerplate = 0;

  function stripBoilerplate(drugs, refs) {
    const keep = [];
    const keepIds = new Set();
    for (const drug of drugs) {
      if (isBoilerplateFile(drug)) {
        boilerplate += 1;
        removedSlugs.add(drug.slug);
        continue;
      }
      keep.push(drug);
      keepIds.add(drug.id);
    }
    return { drugs: keep, refs: (refs ?? []).filter((ref) => keepIds.has(ref.drug_id)) };
  }

  const archiveNext = stripBoilerplate(archive.drugs, archive.refs);
  archive.drugs = archiveNext.drugs;
  archive.refs = archiveNext.refs;
  const extraNext = stripBoilerplate(extra.drugs ?? [], extra.refs ?? []);
  extra.drugs = extraNext.drugs;
  extra.refs = extraNext.refs;
  for (const shard of shards) {
    const next = stripBoilerplate(shard.body.drugs ?? [], shard.body.refs ?? []);
    shard.body.drugs = next.drugs;
    shard.body.refs = next.refs;
  }

  const rows = [
    ...archive.drugs.map((drug) => ({ drug, where: "archive" })),
    ...extra.drugs.map((drug) => ({ drug, where: "extra" })),
    ...shards.flatMap((shard) => (shard.body.drugs ?? []).map((drug) => ({ drug, where: "catalogue" }))),
  ];
  const byName = new Map();
  for (const row of rows) {
    const key = nameKey(row.drug.name);
    if (!key) continue;
    (byName.get(key) ?? byName.set(key, []).get(key)).push(row);
  }
  const dropIds = new Set();
  let sameName = 0;
  for (const list of byName.values()) {
    if (list.length < 2) continue;
    const ranked = [...list].sort((a, b) => score(b.drug, b.where) - score(a.drug, a.where) || a.drug.slug.localeCompare(b.drug.slug));
    const keep = ranked[0].drug;
    for (const row of ranked.slice(1)) {
      dropIds.add(row.drug.id);
      removedSlugs.add(row.drug.slug);
      redirect.set(row.drug.slug, keep.slug);
      sameName += 1;
    }
  }

  function applyDrop(drugs, refs) {
    const next = drugs.filter((drug) => !dropIds.has(drug.id));
    const ids = new Set(next.map((drug) => drug.id));
    return { drugs: next, refs: (refs ?? []).filter((ref) => ids.has(ref.drug_id)) };
  }
  const archiveKept = applyDrop(archive.drugs, archive.refs);
  archive.drugs = archiveKept.drugs;
  archive.refs = archiveKept.refs;
  const extraKept = applyDrop(extra.drugs, extra.refs);
  extra.drugs = extraKept.drugs;
  extra.refs = extraKept.refs;
  for (const shard of shards) {
    const next = applyDrop(shard.body.drugs, shard.body.refs);
    shard.body.drugs = next.drugs;
    shard.body.refs = next.refs;
  }

  const classNames = new Set((archive.classes ?? []).map((row) => row.slug ?? row.id?.replace(/^c_/, "")).filter(Boolean));
  function mapSlug(slug) {
    let next = slug;
    const seen = new Set();
    while (redirect.has(next) && !seen.has(next)) {
      seen.add(next);
      next = redirect.get(next);
    }
    return removedSlugs.has(next) ? null : next;
  }
  let rulesDropped = 0;
  if (archive.groups) {
    for (const [key, slugs] of Object.entries(archive.groups)) {
      const next = [];
      const seen = new Set();
      for (const slug of slugs) {
        const mapped = mapSlug(slug);
        if (!mapped || seen.has(mapped)) continue;
        seen.add(mapped);
        next.push(mapped);
      }
      archive.groups[key] = next;
    }
  }
  if (Array.isArray(archive.rules)) {
    archive.rules = archive.rules.filter((rule) => {
      const mapSide = (tokens) => {
        const next = [];
        const seen = new Set();
        for (const token of tokens ?? []) {
          let mapped = token;
          if (!token.startsWith("group:") && !classNames.has(token) && (redirect.has(token) || removedSlugs.has(token))) mapped = mapSlug(token);
          if (!mapped || seen.has(mapped)) continue;
          seen.add(mapped);
          next.push(mapped);
        }
        return next;
      };
      rule.left = mapSide(rule.left);
      rule.right = mapSide(rule.right);
      if (!rule.left.length || !rule.right.length) {
        rulesDropped += 1;
        return false;
      }
      return true;
    });
  }

  for (const path of archivePaths) if (existsSync(path)) write(path, archive);
  for (const path of extraPaths) if (existsSync(path)) write(path, extra);
  const keptShards = shards.filter((shard) => shard.body.drugs.length);
  for (const dir of catalogueDirs) {
    if (!existsSync(join(dir, "manifest.json"))) continue;
    const local = read(join(dir, "manifest.json"));
    local.drugs = keptShards.map((shard) => shard.name);
    write(join(dir, "manifest.json"), local);
    for (const shard of keptShards) write(join(dir, shard.name), shard.body);
    for (const name of readdirSync(dir)) {
      if (!/^drugs-max-\d+\.json$/.test(name)) continue;
      if (keptShards.some((shard) => shard.name === name)) continue;
      unlinkSync(join(dir, name));
    }
  }

  const stats = {
    boilerplate,
    sameName,
    rulesDropped,
    drugs: archive.drugs.length + extra.drugs.length + keptShards.reduce((sum, shard) => sum + shard.body.drugs.length, 0),
    archive: archive.drugs.length,
    extra: extra.drugs.length,
    catalogue: keptShards.reduce((sum, shard) => sum + shard.body.drugs.length, 0),
    shards: keptShards.map((shard) => `${shard.name}:${shard.body.drugs.length}`),
  };
  console.log(JSON.stringify(stats));
  return stats;
}

if (process.argv[1] && process.argv[1].endsWith("prune-files.mjs")) prunePublishedFiles();

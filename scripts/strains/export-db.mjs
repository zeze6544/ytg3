// Writes the built strain archive as tab-separated files matching the tables in
// supabase/migrations/20261021120000_strain_archive.sql, plus a load script.
//   node scripts/strains/export-db.mjs            -> .cache/strains/db/*.tsv + load.sql
//   psql "$DATABASE_URL" -f .cache/strains/db/load.sql
import { createWriteStream, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { CACHE, DATA, OUT, readJson } from "./lib.mjs";
import { SOURCES } from "./sources.mjs";

const DIR = join(CACHE, "db");
mkdirSync(DIR, { recursive: true });
const esc = (v) => (v === null || v === undefined ? "\\N" : String(v).replace(/\\/g, "\\\\").replace(/\t/g, " ").replace(/\n/g, " ").replace(/\r/g, " "));
const pgArray = (list) => `{${list.map((s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;
const tables = {
  strain_sources: ["id", "registry_id", "rank", "label", "url", "license", "retrieved_on", "link_status", "link_checked_on"],
  strain_records: ["slug", "archive_id", "name", "kind", "origin", "type", "family_key", "canonical_slug", "completeness", "status", "best_rank", "source_count", "lineage_score", "lineage_conflict", "suspected_duplicate", "evidence_updated_on", "open_questions"],
  strain_aliases: ["slug", "alias", "source_id"],
  strain_lineage_claims: ["slug", "claim_no", "parent_name", "parent_slug", "source_id", "status"],
  strain_measurements: ["slug", "analyte", "class", "kind", "low", "p25", "median", "p75", "high", "n", "unit", "jurisdiction", "context", "measured_from", "measured_to", "source_id", "implausible"],
  strain_claims: ["slug", "field", "value_text", "value_low", "value_high", "unit", "evidence", "source_id"],
  strain_products: ["id", "region", "brand", "product", "form", "thc_label", "cbd_label", "period", "source_id"],
  strain_product_links: ["slug", "product_id", "relation"],
  strain_image_assets: ["slug", "renderer_version", "status", "dhash64", "dhash256", "bytes", "generated_on", "error"],
};
const streams = Object.fromEntries(Object.keys(tables).map((t) => [t, createWriteStream(join(DIR, `${t}.tsv`))]));
const counts = Object.fromEntries(Object.keys(tables).map((t) => [t, 0]));
const put = (table, row) => {
  streams[table].write(`${tables[table].map((c) => esc(row[c])).join("\t")}\n`);
  counts[table] += 1;
};

const links = readJson(join(DATA, "links.json"), { checked: {} }).checked;
const sources = new Map();
for (const [id, s] of Object.entries(SOURCES)) sources.set(id, { id, registry_id: id, rank: s.rank, label: s.label, url: s.url, license: s.license ?? null });
const sourceId = (file, key) => {
  const ref = file.sources.find((s) => s.url === key) ?? file.sources.find((s) => s.id === key);
  if (!ref) return sources.has(key) ? key : "legacy";
  if (!ref.url) return ref.id;
  if (!sources.has(ref.url)) {
    const c = links[ref.url];
    sources.set(ref.url, { id: ref.url, registry_id: ref.id, rank: ref.rank, label: ref.label, url: ref.url, license: SOURCES[ref.id]?.license ?? null, retrieved_on: ref.date, link_status: c ? (c.ok ? "ok" : `broken ${c.status || c.error}`) : null, link_checked_on: c?.checked ?? null });
  }
  return ref.url;
};

const images = readJson(join(DATA, "images.json"), { assets: {} }).assets;
const products = new Set();
const files = readdirSync(join(OUT, "d")).filter((f) => f.endsWith(".json"));
const records = [];
for (const name of files) for (const file of Object.values(readJson(join(OUT, "d", name)))) records.push(file);
const slugs = new Set(records.map((r) => r.slug));
for (const f of records) {
  put("strain_records", {
    slug: f.slug, archive_id: f.id, name: f.name, kind: f.kind, origin: f.origin, type: f.type, family_key: f.family?.key ?? null,
    canonical_slug: f.family?.canonical?.slug ?? null, completeness: f.completeness, status: f.status,
    best_rank: Math.min(8, ...f.sources.filter((s) => s.id !== "nida" && s.id !== "cnb_names").map((s) => s.rank)),
    source_count: f.sources.filter((s) => s.id !== "nida").length, lineage_score: f.lineage ? Math.min(4, f.lineage.parents.length) : 0,
    lineage_conflict: f.lineage?.conflict ? "t" : "f", suspected_duplicate: f.duplicates.length ? "t" : "f", evidence_updated_on: f.updated, open_questions: pgArray(f.questions),
  });
  for (const a of f.aliases) put("strain_aliases", { slug: f.slug, alias: a.name, source_id: sourceId(f, a.source) });
  (f.lineage?.claims ?? []).forEach((claim, n) => {
    for (const p of claim.parents) put("strain_lineage_claims", { slug: f.slug, claim_no: n + 1, parent_name: p.name, parent_slug: p.slug && slugs.has(p.slug) ? p.slug : null, source_id: claim.sources[0] ? sourceId(f, claim.sources[0]) : "legacy", status: f.lineage.status });
  });
  for (const m of f.cannabinoids) put("strain_measurements", { slug: f.slug, analyte: m.analyte, class: "cannabinoid", kind: m.kind, low: m.low, p25: m.p25, median: m.median, p75: m.p75, high: m.high, n: m.n, unit: m.unit, jurisdiction: m.state ?? null, context: m.context, measured_from: m.from ?? m.date ?? null, measured_to: m.to ?? m.date ?? null, source_id: sourceId(f, m.source), implausible: m.implausible ? "t" : "f" });
  for (const m of f.terpenes.measured) put("strain_measurements", { slug: f.slug, analyte: m.name, class: "terpene", kind: m.kind, low: m.low, p25: m.p25, median: m.median, p75: m.p75, high: m.high, n: m.n, unit: m.unit, jurisdiction: m.state ?? null, context: m.context, measured_from: m.from ?? null, measured_to: m.to ?? null, source_id: sourceId(f, m.source), implausible: "f" });
  for (const t of f.terpenes.mentioned) put("strain_claims", { slug: f.slug, field: "terpene_mention", value_text: t.name, evidence: t.kind === "legacy" ? "legacy" : "seller", source_id: sourceId(f, t.source) });
  for (const a of f.aroma) put("strain_claims", { slug: f.slug, field: "aroma", value_text: a.name, evidence: "seller", source_id: sourceId(f, a.sources[0]) });
  for (const e of f.effects) put("strain_claims", { slug: f.slug, field: "effect", value_text: e.name, evidence: "anecdotal", source_id: sourceId(f, e.sources[0]) });
  for (const b of f.breeders) put("strain_claims", { slug: f.slug, field: "breeder", value_text: b.name, evidence: "seller", source_id: "ci_strains" });
  for (const [field, unit] of [["flowering_days", "days"], ["height_indoor_cm", "cm"], ["height_outdoor_cm", "cm"], ["indica_pct", "%"]]) {
    const v = f.botany?.[field];
    if (v) put("strain_claims", { slug: f.slug, field, value_low: v.low, value_high: v.high, unit, evidence: "seller", source_id: sourceId(f, v.sources[0]) });
  }
  for (const d of f.descriptions) put("strain_claims", { slug: f.slug, field: "description", value_text: d.text, evidence: "seller", source_id: sourceId(f, d.source) });
  if (f.kind === "product") {
    const p = f.medical.products[0];
    if (p && !products.has(f.slug)) {
      products.add(f.slug);
      put("strain_products", { id: f.slug, region: f.slug.startsWith("au-") ? "AU" : "US-CT", brand: p.brand, product: p.product, form: p.form, thc_label: p.thc_label, cbd_label: p.cbd_label, period: f.slug.startsWith("au-") ? "2026-01-01/2026-06-30" : null, source_id: f.slug.startsWith("au-") ? "tga" : "ct_dcp" });
      put("strain_product_links", { slug: f.slug, product_id: f.slug, relation: "is_product_record" });
    }
  }
  const img = images[f.id];
  put("strain_image_assets", { slug: f.slug, renderer_version: img?.version ?? readJson(join(DATA, "images.json")).renderer?.version ?? 0, status: img?.status ?? "on-device", dhash64: img?.hash ?? null, dhash256: img?.hash256 ?? null, bytes: img?.bytes ?? null, generated_on: img?.generated ?? null, error: img?.error ?? null });
}
// Name links from cultivars to registry products are written after every product exists.
for (const f of records) for (const p of f.medical.registry_products) if (products.has(p.slug)) put("strain_product_links", { slug: f.slug, product_id: p.slug, relation: "same_cleaned_name" });
for (const s of sources.values()) put("strain_sources", s);
await Promise.all(Object.values(streams).map((s) => new Promise((resolve) => s.end(resolve))));
const order = ["strain_sources", "strain_records", "strain_aliases", "strain_lineage_claims", "strain_measurements", "strain_claims", "strain_products", "strain_product_links", "strain_image_assets"];
const load = [
  "BEGIN;",
  "TRUNCATE public.strain_product_links, public.strain_products, public.strain_image_assets, public.strain_claims, public.strain_measurements, public.strain_lineage_claims, public.strain_aliases, public.strain_records, public.strain_sources CASCADE;",
  "ALTER TABLE public.strain_records DROP CONSTRAINT IF EXISTS strain_records_canonical_slug_fkey;",
  ...order.map((t) => `\\copy public.${t} (${tables[t].join(", ")}) FROM '${join(DIR, `${t}.tsv`)}'`),
  "ALTER TABLE public.strain_records ADD CONSTRAINT strain_records_canonical_slug_fkey FOREIGN KEY (canonical_slug) REFERENCES public.strain_records (slug) ON DELETE SET NULL;",
  "COMMIT;",
].join("\n");
const { writeFileSync } = await import("node:fs");
writeFileSync(join(DIR, "load.sql"), `${load}\n`);
console.log(JSON.stringify(counts, null, 1));

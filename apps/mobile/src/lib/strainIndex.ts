import { archiveUrl } from "@/lib/localArchive";

// The strain archive ships as one columnar index (names, aliases, parents,
// breeders, flags, scores) plus detail buckets fetched on demand, so the list
// never downloads every file body.

export type SourceRef = { id: string; rank: number; label?: string; url?: string | null; date?: string | null; link?: string };
export type Named = { name: string; slug: string | null };
export type Measurement = {
  analyte: string;
  kind: "lab_aggregate" | "registry" | "label" | "listing_claim" | "legacy";
  low: number;
  high: number;
  p25?: number;
  median?: number;
  p75?: number;
  n?: number;
  state?: string;
  unit: string;
  context: string;
  date?: string | null;
  from?: string | null;
  to?: string | null;
  source: string;
  implausible?: boolean;
};
export type TerpMeasure = Omit<Measurement, "analyte" | "low" | "high"> & { name: string; low?: number; high?: number };
export type RangeField = { low: number; high: number; listings: number; differ?: boolean; sources: string[] } | null;
export type Counted = { name: string; listings: number; sources: string[] };

export type StrainFile = {
  id: string;
  slug: string;
  name: string;
  kind: "cultivar" | "product";
  origin: "curated" | "namelist" | "listing" | "registry";
  type: string;
  genetics: string[];
  aliases: { name: string; source: string }[];
  family: { key: string; canonical: { slug: string; name: string } | null; variants: { slug: string; name: string }[]; variant_total: number } | null;
  duplicates: { slug: string; name: string }[];
  breeders: { name: string; listings: number }[];
  producer: string | null;
  sellers: { seller: string | null; breeder: string | null; url: string | null; scraped: string | null; link: string }[];
  seller_total: number;
  family_listings: number;
  lineage: {
    status: "seller-listed" | "legacy" | "reviewed";
    parents: Named[];
    grandparents: { of: string; parents: Named[] }[];
    claims: { parents: Named[]; own: boolean; sources: string[]; count: number }[];
    conflict: boolean;
  } | null;
  children: { slug: string; name: string }[];
  children_total: number;
  cannabinoids: Measurement[];
  terpenes: { measured: TerpMeasure[]; mentioned: { name: string; source: string; kind: string }[] };
  botany: {
    flowering_days: RangeField;
    height_indoor_cm: RangeField;
    height_outdoor_cm: RangeField;
    yield_indoor_g_m2: RangeField;
    yield_outdoor_g_plant: RangeField;
    indica_pct: RangeField;
    harvest: string[];
    genetics: string[];
    auto: boolean | null;
    feminized: boolean | null;
  } | null;
  aroma: Counted[];
  effects: Counted[];
  descriptions: { text: string; source: string }[];
  medical: {
    au: "tga_product" | "no_cultivar_on_tga_list";
    products: { region: string; brand: string; product: string; form: string; thc_label: string | null; cbd_label: string | null; source: string; source_url: string }[];
    registry_products: { slug: string; name: string; region: string; brand: string | null; thc: number | null; cbd: number | null }[];
    registry_total: number;
  };
  sources: SourceRef[];
  completeness: number;
  status: "documented" | "partial" | "needs_research";
  questions: string[];
  research: { attempted: string; outcome: string; proposals: { type: string; [k: string]: unknown }[] } | null;
  updated: string | null;
  image: { status: string; version?: number; hash?: string };
};

export type StrainMeta = {
  built: string;
  counts: Record<string, number> & { status: Record<string, number> };
  ranks: Record<string, string>;
  sources: Record<string, { rank: number; label: string; url: string | null; note: string; license: string | null }>;
  renderer: { version: number } | null;
};

type Index = {
  v: number;
  built: string;
  buckets: number;
  count: number;
  terpenes: string[];
  breeders: string[];
  flags: Record<string, number>;
  cols: {
    slug: string[];
    name: string[];
    type: number[];
    kind: number[];
    alias: string[];
    breeder: number[];
    parents: string[];
    family: number[];
    flags: number[];
    complete: number[];
    rank: number[];
    sources: number[];
    lineage: number[];
    updated: number[];
    terps: number[];
    image: number[];
  };
};

export const TYPE_NAMES = ["hybrid", "indica", "sativa", "ruderalis", "unspecified"] as const;
export const KIND_NAMES = ["cultivar", "CT registry product", "TGA product line"] as const;

export type StrainRow = {
  i: number;
  slug: string;
  id: string;
  name: string;
  type: string;
  kind: number;
  aliases: string[];
  breeder: string;
  parents: string[];
  flags: number;
  complete: number;
  rank: number;
  sources: number;
  lineage: number;
  updated: string | null;
  image: number;
};

let indexPromise: Promise<Index> | null = null;
let haystack: string[] | null = null;
let metaPromise: Promise<StrainMeta> | null = null;

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(archiveUrl(path));
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return (await response.json()) as T;
}

export function loadStrainIndex() {
  if (!indexPromise) {
    indexPromise = getJson<Index>("/strains/index.json").catch((error) => {
      indexPromise = null;
      throw error;
    });
  }
  return indexPromise;
}

export function loadStrainMeta() {
  if (!metaPromise) {
    metaPromise = getJson<StrainMeta>("/strains/meta.json").catch((error) => {
      metaPromise = null;
      throw error;
    });
  }
  return metaPromise;
}

export function strainFlag(index: Index, name: string) {
  return index.flags[name] ?? 0;
}

function hay(index: Index) {
  if (!haystack) {
    const { name, alias, parents, breeder } = index.cols;
    haystack = name.map((n, i) => `${n}\n${alias[i]}\n${parents[i]}\n${index.breeders[breeder[i]] ?? ""}`.toLowerCase());
  }
  return haystack;
}

function row(index: Index, i: number): StrainRow {
  const c = index.cols;
  const u = c.updated[i];
  return {
    i,
    slug: c.slug[i],
    id: `s_${c.slug[i]}`,
    name: c.name[i],
    type: TYPE_NAMES[c.type[i]] ?? "unspecified",
    kind: c.kind[i],
    aliases: c.alias[i] ? c.alias[i].split("|") : [],
    breeder: index.breeders[c.breeder[i]] ?? "",
    parents: c.parents[i] ? c.parents[i].split("|") : [],
    flags: c.flags[i],
    complete: c.complete[i],
    rank: c.rank[i],
    sources: c.sources[i],
    lineage: c.lineage[i],
    updated: u ? `${String(u).slice(0, 4)}-${String(u).slice(4, 6)}-${String(u).slice(6, 8)}` : null,
    image: c.image[i],
  };
}

export type StrainQuery = {
  search: string;
  type: "all" | (typeof TYPE_NAMES)[number];
  kind: "all" | "cultivar" | "product";
  terps: string[];
  terpMode: "any" | "all";
  chem: "any" | "lab" | "registry" | "listing" | "legacy" | "none";
  medical: boolean;
  breeder: string;
  evidence: "any" | "3" | "6";
  status: "any" | "documented" | "partial" | "needs_research";
  image: "any" | "stored" | "device" | "failed";
  lineage: "any" | "has" | "conflict" | "none";
  duplicates: boolean;
  sort: "name" | "updated" | "complete" | "sources" | "lineage";
};

export const DEFAULT_QUERY: StrainQuery = {
  search: "",
  type: "all",
  kind: "all",
  terps: [],
  terpMode: "any",
  chem: "any",
  medical: false,
  breeder: "",
  evidence: "any",
  status: "any",
  image: "any",
  lineage: "any",
  duplicates: false,
  sort: "name",
};

function matcher(index: Index, q: StrainQuery, skip?: keyof StrainQuery) {
  const F = index.flags;
  const c = index.cols;
  const tokens = q.search.toLowerCase().split(/\s+/).filter(Boolean);
  const h = tokens.length ? hay(index) : null;
  let terpMask = 0;
  for (const t of q.terps) {
    const bit = index.terpenes.indexOf(t);
    if (bit >= 0) terpMask |= 1 << bit;
  }
  const typeCode = q.type === "all" ? -1 : TYPE_NAMES.indexOf(q.type);
  const breederTerm = q.breeder.trim().toLowerCase();
  const breederOk = breederTerm ? new Set(index.breeders.map((b, i) => (b.toLowerCase().includes(breederTerm) ? i : -1)).filter((i) => i >= 0)) : null;
  return (i: number) => {
    const f = c.flags[i];
    if (skip !== "type" && typeCode >= 0 && c.type[i] !== typeCode) return false;
    if (skip !== "kind" && q.kind !== "all" && (q.kind === "cultivar") !== (c.kind[i] === 0)) return false;
    if (terpMask && (q.terpMode === "all" ? (c.terps[i] & terpMask) !== terpMask : !(c.terps[i] & terpMask))) return false;
    if (skip !== "chem" && q.chem !== "any") {
      if (q.chem === "lab" && !(f & F.lab)) return false;
      if (q.chem === "registry" && !(f & F.registry)) return false;
      if (q.chem === "listing" && !(f & F.listing_claim)) return false;
      if (q.chem === "legacy" && !(f & F.legacy)) return false;
      if (q.chem === "none" && f & F.cannabinoid) return false;
    }
    if (q.medical && !(f & F.medical)) return false;
    if (breederOk && !breederOk.has(c.breeder[i])) return false;
    if (q.evidence !== "any" && c.rank[i] > Number(q.evidence)) return false;
    if (skip !== "status" && q.status !== "any") {
      const s = c.complete[i] >= 60 ? "documented" : c.complete[i] >= 25 ? "partial" : "needs_research";
      if (s !== q.status) return false;
    }
    if (q.image !== "any" && c.image[i] !== { device: 0, stored: 1, failed: 2 }[q.image]) return false;
    if (q.lineage === "has" && !(f & F.lineage)) return false;
    if (q.lineage === "none" && f & F.lineage) return false;
    if (q.lineage === "conflict" && !(f & F.lineage_conflict)) return false;
    if (q.duplicates && !(f & F.duplicate)) return false;
    if (h) {
      const text = h[i];
      for (const t of tokens) if (!text.includes(t)) return false;
    }
    return true;
  };
}

export type StrainResult = {
  total: number;
  matched: number;
  rows: StrainRow[];
  facets: { type: Record<string, number>; status: Record<string, number>; kind: Record<string, number> };
  built: string;
};

export async function queryStrains(q: StrainQuery, limit: number): Promise<StrainResult> {
  const index = await loadStrainIndex();
  const c = index.cols;
  const ok = matcher(index, q);
  const hits: number[] = [];
  for (let i = 0; i < index.count; i += 1) if (ok(i)) hits.push(i);
  const term = q.search.trim().toLowerCase();
  const nameRank = (i: number) => {
    if (!term) return 0;
    const n = c.name[i].toLowerCase();
    return n === term ? 0 : n.startsWith(term) ? 1 : n.includes(term) ? 2 : 3;
  };
  // Index order is alphabetical, so "name" only needs the search boost.
  if (q.sort === "name") {
    if (term) hits.sort((a, b) => nameRank(a) - nameRank(b) || a - b);
  } else {
    const key = { updated: c.updated, complete: c.complete, sources: c.sources, lineage: c.lineage }[q.sort];
    hits.sort((a, b) => key[b] - key[a] || a - b);
  }
  const facet = (skip: keyof StrainQuery, label: (i: number) => string) => {
    const counts: Record<string, number> = {};
    const test = matcher(index, q, skip);
    for (let i = 0; i < index.count; i += 1) if (test(i)) counts[label(i)] = (counts[label(i)] ?? 0) + 1;
    return counts;
  };
  return {
    total: index.count,
    matched: hits.length,
    rows: hits.slice(0, limit).map((i) => row(index, i)),
    facets: {
      type: facet("type", (i) => TYPE_NAMES[c.type[i]]),
      status: facet("status", (i) => (c.complete[i] >= 60 ? "documented" : c.complete[i] >= 25 ? "partial" : "needs_research")),
      kind: facet("kind", (i) => (c.kind[i] === 0 ? "cultivar" : "product")),
    },
    built: index.built,
  };
}

export async function strainRowBySlug(slug: string) {
  const index = await loadStrainIndex();
  const i = index.cols.slug.indexOf(slug);
  return i < 0 ? null : row(index, i);
}

export async function strainBreeders(term: string, limit = 12) {
  const index = await loadStrainIndex();
  const t = term.trim().toLowerCase();
  if (!t) return [];
  return index.breeders.filter((b) => b && b.toLowerCase().includes(t)).slice(0, limit);
}

function bucketOf(slug: string, buckets: number) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % buckets;
}

const bucketCache = new Map<number, Promise<Record<string, StrainFile>>>();

export async function fetchStrainFile(slug: string): Promise<StrainFile | null> {
  const index = await loadStrainIndex();
  const b = bucketOf(slug, index.buckets);
  let job = bucketCache.get(b);
  if (!job) {
    job = getJson<Record<string, StrainFile>>(`/strains/d/${b}.json`);
    bucketCache.set(b, job);
    job.catch(() => bucketCache.delete(b));
    while (bucketCache.size > 40) bucketCache.delete(bucketCache.keys().next().value as number);
  }
  return (await job)[slug] ?? null;
}

export async function fetchAdminQueues() {
  return getJson<Record<string, unknown>>("/strains/admin/queues.json");
}

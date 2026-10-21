// Builds the public strain index, detail buckets, sources, report and admin
// queues from the archive plus the committed enrichment artefacts.
//   node scripts/strains/build-strains.mjs
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { DATA, OUT, TODAY, bucketOf, cultivarKey, excludedBase, familyKeys, loadBase, nameKey, readJson, splitCross, writeJson } from "./lib.mjs";
import { RANKS, SOURCES } from "./sources.mjs";

export const BUCKETS = 1024;
const INDEX_VERSION = 1;

const base = loadBase();
const listings = readJson(join(DATA, "listings.json"), { records: {} }).records;
const labs = readJson(join(DATA, "labs.json"), { keys: {} }).keys;
const links = readJson(join(DATA, "links.json"), { checked: {} }).checked;
const images = readJson(join(DATA, "images.json"), { renderer: null, assets: {} });
const research = readJson(join(DATA, "research.json"), { records: {} }).records;
const review = readJson(join(DATA, "review.json"), { not_duplicates: [], lineage_overrides: {} });
const keys = familyKeys(base, listings);
const notDuplicate = new Set((review.not_duplicates ?? []).map((pair) => [...pair].sort().join("|")));

const ORIGIN_RANK = { curated: 0, namelist: 1, listing: 2, registry: 3 };
const isProduct = (row) => row.origin === "registry";
const productRegion = (row) => (row.slug.startsWith("au-") ? "AU" : "US-CT");

const TERPS = [
  ["myrcene", /myrcene/], ["limonene", /limonene/], ["caryophyllene", /caryophyllene(?! oxide)/], ["pinene", /pinene/],
  ["linalool", /linalool/], ["humulene", /humulene/], ["terpinolene", /terpinolene/], ["ocimene", /ocimene/],
  ["bisabolol", /bisabolol/], ["nerolidol", /nerolidol/], ["eucalyptol", /eucalyptol|cineole/], ["phellandrene", /phellandrene/],
  ["carene", /carene/], ["sabinene", /sabinene/], ["valencene", /valencene/], ["geraniol", /geraniol/],
  ["terpineol", /terpineol/], ["guaiol", /guaiol/], ["camphene", /camphene/], ["fenchol", /fenchol|fenchyl/],
];
const terpName = (raw) => {
  const text = String(raw).toLowerCase();
  for (const [name, re] of TERPS) if (re.test(text)) return name;
  return null;
};
const terpBit = (name) => {
  const i = TERPS.findIndex(([n]) => n === name);
  return i < 0 ? 0 : 1 << i;
};

const F = {
  cannabinoid: 1, lab: 2, registry: 4, listing_claim: 8, legacy: 16, terp_quant: 32, terp_mention: 64, lineage: 128,
  lineage_conflict: 256, medical: 512, duplicate: 1024, auto: 2048, aroma: 4096, botany: 8192, effects: 16384, canonical: 32768,
  breeder: 65536, product: 131072,
};

// ---------- families and suspected duplicates ----------
const bySlug = new Map(base.map((row) => [row.slug, row]));
const families = new Map();
for (const row of base) {
  const key = keys.get(row.slug);
  if (!key) continue;
  let fam = families.get(key);
  if (!fam) families.set(key, (fam = { key, cultivars: [], products: [] }));
  (isProduct(row) ? fam.products : fam.cultivars).push(row.slug);
}
const autoCache = new Map();
const autoOf = (slug) => {
  if (autoCache.has(slug)) return autoCache.get(slug);
  const row = bySlug.get(slug);
  let value = /\bauto/i.test(row.name);
  if (!value && row.origin === "listing") {
    const flags = (listings[slug] ?? []).filter((l) => l.auto !== undefined);
    if (flags.length) value = flags.filter((l) => l.auto).length > flags.length / 2;
  }
  autoCache.set(slug, value);
  return value;
};
const breedersOf = (slug) => [...new Set((listings[slug] ?? []).map((l) => l.breeder).filter(Boolean).map(nameKey))];
for (const fam of families.values()) {
  const pick = (list) =>
    [...list].sort((a, b) => {
      const ra = bySlug.get(a);
      const rb = bySlug.get(b);
      const exactA = nameKey(ra.name) === fam.key ? 0 : 1;
      const exactB = nameKey(rb.name) === fam.key ? 0 : 1;
      return Number(autoOf(a)) - Number(autoOf(b)) || ORIGIN_RANK[ra.origin] - ORIGIN_RANK[rb.origin] || exactA - exactB || ra.name.length - rb.name.length || a.localeCompare(b);
    })[0];
  fam.canonical = fam.cultivars.length ? pick(fam.cultivars) : pick(fam.products);
  fam.dupes = new Map();
  const groups = new Map();
  for (const slug of fam.cultivars) {
    const b = breedersOf(slug);
    const g = `${autoOf(slug) ? "auto" : "photo"}|${b.length === 1 ? b[0] : b.length ? "multi" : "none"}`;
    (groups.get(g) ?? groups.set(g, []).get(g)).push(slug);
  }
  // Records with no breeder pair with the breeder-free canonical name only.
  for (const [g, list] of groups) {
    if (list.length < 2) continue;
    for (const slug of list) {
      const others = list.filter((other) => other !== slug && !notDuplicate.has([slug, other].sort().join("|")));
      if (others.length) fam.dupes.set(slug, others);
    }
    void g;
  }
}
const familyOf = (slug) => families.get(keys.get(slug)) ?? null;
const resolveName = (name) => {
  const fam = families.get(cultivarKey(name));
  return fam && fam.cultivars.length ? fam.canonical : null;
};

// ---------- lineage ----------
const claimKey = (parents) => parents.map(nameKey).sort().join(" × ");
function lineageClaims(slug) {
  const row = bySlug.get(slug);
  const claims = new Map();
  const add = (parents, source, own) => {
    if (parents.length < 1) return;
    const k = claimKey(parents);
    let claim = claims.get(k);
    if (!claim) claims.set(k, (claim = { parents, sources: [], own: false }));
    claim.sources.push(source);
    claim.own ||= own;
  };
  const override = review.lineage_overrides?.[slug];
  if (override) add(override.parents, { id: "review", label: override.note ?? "Admin review" }, true);
  const fam = familyOf(slug);
  // Variants only lend lineage when they share the autoflower flag, so an
  // auto's "x Ruderalis" cross never becomes the photoperiod cultivar's pedigree.
  const auto = autoOf(slug);
  const ownKey = keys.get(slug);
  const members = fam ? [slug, ...fam.cultivars.filter((s) => s !== slug && autoOf(s) === auto)] : [slug];
  for (const member of members) {
    for (const l of listings[member] ?? []) {
      if (member === slug && l.auto !== undefined && l.auto !== auto) continue;
      const parents = (l.parents ?? []).map((p) => splitCross(`${p} x _`)[0] ?? null).filter(Boolean);
      const cleaned = (parents.length ? parents : splitCross(l.formula ?? "")).filter((p) => cultivarKey(p) !== ownKey);
      if (cleaned.length) add(cleaned, { id: "listing", url: l.url, seller: l.seller, date: l.scraped, record: member }, member === slug);
    }
  }
  if (row.origin === "curated" && row.lineage) {
    const parents = /\sx\s/i.test(row.lineage) ? splitCross(row.lineage) : [];
    if (parents.length) add(parents, { id: "legacy" }, true);
    else if (!/chemotype|seller|registration|report/i.test(row.lineage) && row.lineage.length < 40) add([row.lineage.trim()], { id: "legacy" }, true);
  }
  return [...claims.values()].sort((a, b) => Number(b.own) - Number(a.own) || b.sources.length - a.sources.length);
}

const lineage = new Map();
for (const row of base) {
  if (isProduct(row)) continue;
  const claims = lineageClaims(row.slug);
  if (!claims.length) continue;
  lineage.set(row.slug, claims);
}
const children = new Map();
for (const [slug, claims] of lineage) {
  const fam = familyOf(slug);
  if (fam && fam.canonical !== slug) continue;
  for (const parent of claims[0].parents) {
    const target = resolveName(parent);
    if (!target || target === slug) continue;
    (children.get(target) ?? children.set(target, new Set()).get(target)).add(slug);
  }
}

// ---------- per-record assembly ----------
function linkState(url) {
  const c = url ? links[url] : null;
  return c ? (c.ok ? "ok" : `broken ${c.status || c.error}`) : "unchecked";
}

function range(values) {
  const v = values.filter((x) => x !== null && x !== undefined);
  if (!v.length) return null;
  return [Math.min(...v), Math.max(...v)];
}

function assemble(row) {
  const slug = row.slug;
  const fam = familyOf(slug);
  const recordAuto = autoOf(slug);
  const own = (listings[slug] ?? []).filter((l) => l.auto === undefined || l.auto === recordAuto);
  const famListings = fam ? fam.cultivars.filter((s) => s !== slug).flatMap((s) => (listings[s] ?? []).map((l) => ({ ...l, record: s }))) : [];
  const sources = new Map();
  const cite = (id, extra = {}) => {
    const key = extra.url ?? id;
    if (!sources.has(key)) {
      const src = SOURCES[id];
      sources.set(key, extra.url ? { id, rank: src?.rank ?? 8, label: extra.label ?? src?.label ?? id, url: extra.url, date: extra.date ?? null, link: linkState(extra.url) } : { id, rank: src?.rank ?? 8 });
    }
    return key;
  };
  let flags = 0;
  const questions = [];

  // identity
  const aliases = [];
  for (const l of own) if (l.aka && nameKey(l.aka) !== nameKey(row.name)) aliases.push({ name: l.aka, source: cite("ci_strains", { url: l.url, label: `${l.seller ?? "Seller"} listing`, date: l.scraped }) });
  const dupes = fam?.dupes.get(slug) ?? [];
  if (dupes.length) flags |= F.duplicate;
  const product = isProduct(row);
  if (product) flags |= F.product;
  if (fam && fam.canonical === slug) flags |= F.canonical;
  if (row.origin === "namelist") cite("cnb_names");

  // breeder
  const breederCounts = new Map();
  for (const l of own) if (l.breeder) breederCounts.set(l.breeder, (breederCounts.get(l.breeder) ?? 0) + 1);
  const breeders = [...breederCounts.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, listings: n }));
  if (breeders.length) flags |= F.breeder;
  const sellers = own.slice(0, 12).map((l) => ({ seller: l.seller ?? null, breeder: l.breeder ?? null, url: l.url ?? null, scraped: l.scraped ?? null, link: linkState(l.url) }));
  for (const l of own.slice(0, 12)) cite("ci_strains", { url: l.url, label: `${l.seller ?? "Seller"} listing`, date: l.scraped });
  if (own.length) cite("ci_strains");
  const producer = product ? row.products?.[0]?.brand ?? null : null;

  // lineage
  let lin = null;
  if (!product) {
    const claims = lineage.get(slug) ?? [];
    if (claims.length) {
      flags |= F.lineage;
      const primary = claims[0];
      const resolved = primary.parents.map((name) => ({ name, slug: resolveName(name) }));
      const grand = [];
      for (const parent of resolved) {
        if (!parent.slug) continue;
        const pc = lineage.get(parent.slug);
        if (pc?.[0]) grand.push({ of: parent.name, parents: pc[0].parents.map((name) => ({ name, slug: resolveName(name) })) });
      }
      const distinct = claims.filter((c) => c.parents.length >= 2 || claims.length === 1);
      const conflict = distinct.length > 1;
      if (conflict) flags |= F.lineage_conflict;
      lin = {
        status: primary.sources.some((s) => s.id === "listing") ? "seller-listed" : primary.sources.some((s) => s.id === "review") ? "reviewed" : "legacy",
        parents: resolved,
        grandparents: grand,
        claims: claims.slice(0, 6).map((c) => ({
          parents: c.parents.map((name) => ({ name, slug: resolveName(name) })),
          own: c.own,
          sources: c.sources.slice(0, 4).map((s) => (s.id === "listing" ? cite("ci_strains", { url: s.url, label: `${s.seller ?? "Seller"} listing`, date: s.date }) : s.id === "legacy" ? cite("legacy") : s.label)),
          count: c.sources.length,
        })),
        conflict,
      };
      if (primary.sources.every((s) => s.id === "legacy")) questions.push("Lineage comes only from a legacy entry with no recorded source. Find a breeder statement.");
      if (conflict) questions.push("Sellers disagree on the parents. Resolve against a breeder statement.");
    } else questions.push("No parents on file. Search breeder catalogues for a stated cross.");
  }
  const kids = children.get(slug);
  const childList = kids ? [...kids].slice(0, 30).map((s) => ({ slug: s, name: bySlug.get(s).name })) : [];

  // measurements
  const cannabinoids = [];
  const terpQuant = [];
  const terpMentions = [];
  let terpMask = 0;
  if (product) {
    const sourceId = row.slug.startsWith("au-") ? "tga" : "ct_dcp";
    const src = cite(sourceId);
    const kind = sourceId === "tga" ? "label" : "registry";
    const context = sourceId === "tga" ? "Sponsor-declared label strength on the TGA list" : "Value as filed on the Connecticut registration";
    if (row.thc_low != null) cannabinoids.push({ analyte: "THC", kind, low: row.thc_low, high: row.thc_high, unit: "%", context, source: src, implausible: row.thc_high > 40 || undefined });
    if (row.cbd_low != null) cannabinoids.push({ analyte: "CBD", kind, low: row.cbd_low, high: row.cbd_high, unit: "%", context, source: src, implausible: row.cbd_high > 40 || undefined });
    for (const point of row.cannabinoids ?? []) cannabinoids.push({ analyte: point.name, kind, low: point.percent, high: point.percent, unit: "%", context, source: src });
    for (const point of row.terpene_profile ?? []) {
      const name = terpName(point.name) ?? point.name;
      terpQuant.push({ name, kind, median: point.percent, n: 1, unit: "%", context: "Latest registration reporting this terpene", source: src });
      terpMask |= terpBit(name);
    }
    flags |= F.registry | F.medical;
  } else {
    if (row.origin === "curated" && row.thc_low != null) {
      const src = cite("legacy");
      cannabinoids.push({ analyte: "THC", kind: "legacy", low: row.thc_low, high: row.thc_high, unit: "%", context: "Legacy range with no recorded source", source: src });
      if (row.cbd_low != null) cannabinoids.push({ analyte: "CBD", kind: "legacy", low: row.cbd_low, high: row.cbd_high, unit: "%", context: "Legacy range with no recorded source", source: src });
      flags |= F.legacy;
      questions.push("THC/CBD range is a legacy entry without a source. Replace with a lab or registry figure.");
    }
    for (const l of own.slice(0, 8)) {
      const src = cite("ci_strains", { url: l.url, label: `${l.seller ?? "Seller"} listing`, date: l.scraped });
      if (l.thc) cannabinoids.push({ analyte: "THC", kind: "listing_claim", low: l.thc[0], high: l.thc[1], unit: "%", context: `Printed on ${l.seller ?? "a seller"} page${l.breeder ? ` for the ${l.breeder} release` : ""}`, date: l.scraped, source: src });
      if (l.cbd) cannabinoids.push({ analyte: "CBD", kind: "listing_claim", low: l.cbd[0], high: l.cbd[1], unit: "%", context: `Printed on ${l.seller ?? "a seller"} page`, date: l.scraped, source: src });
      if (l.thc || l.cbd) flags |= F.listing_claim;
    }
    for (const group of labs[keys.get(slug)] ?? []) {
      const src = cite(group.source);
      flags |= F.lab;
      for (const [analyte, stats] of Object.entries(group.analytes)) {
        const label = { total_thc: "Total THC (lab-reported)", thca: "THCA", delta_9_thc: "Δ9-THC", total_cbd: "Total CBD (lab-reported)", cbd: "CBD", cbda: "CBDA", cbg: "CBG", cbn: "CBN", total_cannabinoids: "Total cannabinoids (lab-reported)", total_terpenes: "Total terpenes (lab-reported)" }[analyte];
        const context = `${stats.n} tested lot${stats.n === 1 ? "" : "s"} of flower sold as “${group.names[0].name}” in ${group.state}${group.from ? `, ${group.from.slice(0, 7)} to ${group.to.slice(0, 7)}` : ""}`;
        if (label && analyte !== "total_terpenes") cannabinoids.push({ analyte: label, kind: "lab_aggregate", state: group.state, n: stats.n, low: stats.min, p25: stats.p25, median: stats.median, p75: stats.p75, high: stats.max, unit: "% w/w", context, source: src, from: group.from, to: group.to });
        else {
          const name = analyte === "total_terpenes" ? "total terpenes" : analyte;
          terpQuant.push({ name, kind: "lab_aggregate", state: group.state, n: stats.n, low: stats.min, p25: stats.p25, median: stats.median, p75: stats.p75, high: stats.max, unit: "% w/w", context, source: src });
          terpMask |= terpBit(terpName(name));
        }
      }
    }
    const mentioned = new Map();
    for (const l of own) for (const t of l.terpenes ?? []) {
      const name = terpName(t) ?? t;
      if (!mentioned.has(name)) mentioned.set(name, cite("ci_strains", { url: l.url, label: `${l.seller ?? "Seller"} listing`, date: l.scraped }));
    }
    if (row.origin === "curated") for (const t of row.terpenes ?? []) if (!mentioned.has(t)) mentioned.set(terpName(t) ?? t, cite("legacy"));
    for (const [name, source] of mentioned) {
      terpMentions.push({ name, source, kind: source === "legacy" ? "legacy" : "listing_mention" });
      terpMask |= terpBit(name);
    }
  }
  if (cannabinoids.length) flags |= F.cannabinoid;
  if (terpQuant.length) flags |= F.terp_quant;
  if (terpMentions.length) flags |= F.terp_mention;
  if (!product && !(flags & (F.lab | F.listing_claim))) questions.push("No cannabinoid figure with a source. Look for state lab results or a registry filing under this name.");
  if (!terpQuant.length && !product) questions.push("No measured terpene percentages. Lab terpene panels for flower sold under this name would answer this.");

  // botany, aroma, effects
  const pool = own.length ? own : [];
  const field = (name) => {
    const values = pool.filter((l) => l[name]).map((l) => ({ v: l[name], src: cite("ci_strains", { url: l.url, label: `${l.seller ?? "Seller"} listing`, date: l.scraped }) }));
    if (!values.length) return null;
    const lo = Math.min(...values.map((x) => x.v[0]));
    const hi = Math.max(...values.map((x) => x.v[1]));
    const distinct = new Set(values.map((x) => x.v.join("-"))).size;
    return { low: lo, high: hi, listings: values.length, differ: distinct > 1, sources: [...new Set(values.map((x) => x.src))].slice(0, 3) };
  };
  const botany = product
    ? null
    : {
        flowering_days: field("flowering_days"),
        height_indoor_cm: field("height_indoor_cm"),
        height_outdoor_cm: field("height_outdoor_cm"),
        yield_indoor_g_m2: field("yield_indoor_g_m2"),
        yield_outdoor_g_plant: field("yield_outdoor_g_plant"),
        indica_pct: null,
        harvest: [...new Set(pool.map((l) => l.harvest).filter(Boolean))].slice(0, 3),
        genetics: [...new Set(pool.map((l) => l.genetics).filter(Boolean))].slice(0, 3),
        auto: pool.some((l) => l.auto === true) ? true : pool.some((l) => l.auto === false) ? false : null,
        feminized: pool.some((l) => l.feminized === true) ? true : pool.some((l) => l.feminized === false) ? false : null,
      };
  if (botany) {
    for (const l of pool) if (l.indica != null) { botany.indica_pct = { low: l.indica, high: l.indica, listings: 1, sources: [cite("ci_strains", { url: l.url, label: `${l.seller ?? "Seller"} listing`, date: l.scraped })] }; break; }
    if (botany.flowering_days || botany.height_indoor_cm || botany.yield_indoor_g_m2) flags |= F.botany;
    if (botany.auto) flags |= F.auto;
    else if (!pool.length && autoOf(slug)) flags |= F.auto;
  }
  const count = (prop) => {
    const m = new Map();
    for (const l of pool) for (const v of l[prop] ?? []) {
      const k = v.toLowerCase();
      if (!m.has(k)) m.set(k, { name: k, listings: 0, sources: [] });
      const e = m.get(k);
      e.listings += 1;
      if (e.sources.length < 2) e.sources.push(cite("ci_strains", { url: l.url, label: `${l.seller ?? "Seller"} listing`, date: l.scraped }));
    }
    return [...m.values()].sort((a, b) => b.listings - a.listings).slice(0, 12);
  };
  const aroma = count("flavors");
  const effects = count("effects");
  if (aroma.length) flags |= F.aroma;
  if (effects.length) flags |= F.effects;
  const descriptions = pool
    .map((l) => l.genetics_text || l.lineage_text)
    .filter(Boolean)
    .slice(0, 2)
    .map((text, i) => ({ text, source: cite("ci_strains", { url: pool[i]?.url, label: `${pool[i]?.seller ?? "Seller"} listing`, date: pool[i]?.scraped }) }));

  // medical
  const registryProducts = product ? [] : (fam?.products ?? []).slice(0, 20).map((s) => {
    const p = bySlug.get(s);
    return { slug: s, name: p.name, region: productRegion(p), brand: p.products?.[0]?.brand ?? null, thc: p.thc_high ?? null, cbd: p.cbd_high ?? null };
  });
  if (registryProducts.length) flags |= F.medical;
  const medical = {
    au: product && row.slug.startsWith("au-") ? "tga_product" : "no_cultivar_on_tga_list",
    products: product ? row.products ?? [] : [],
    registry_products: registryProducts,
    registry_total: product ? 0 : fam?.products.length ?? 0,
  };
  if (registryProducts.length) cite("ct_dcp");
  cite("nida");

  // completeness
  const score =
    (row.type && row.type !== "unspecified" ? 5 : 0) +
    (breeders.length || producer ? 10 : 0) +
    (lin ? (lin.parents.length >= 2 ? 10 : 5) + (lin.parents.filter((p) => p.slug).length >= 2 ? 5 : 0) : 0) +
    (flags & (F.lab | F.registry) ? 20 : flags & F.listing_claim ? 8 : flags & F.legacy ? 3 : 0) +
    (terpQuant.length ? 10 : terpMentions.length ? 4 : 0) +
    (botany?.flowering_days ? 10 : 0) +
    (aroma.length ? 5 : 0) +
    (effects.length ? 5 : 0) +
    (new Set([...sources.values()].filter((s) => s.id !== "nida").map((s) => s.id)).size >= 2 ? 10 : 0) +
    (product ? 25 : 0);
  const completeness = Math.min(100, score);
  if (!breeders.length && !product) questions.push("No breeder on file.");
  const sourceList = [...sources.values()].sort((a, b) => a.rank - b.rank);
  const bestRank = Math.min(8, ...sourceList.filter((s) => s.id !== "nida" && s.id !== "cnb_names").map((s) => s.rank));
  const dates = [
    ...own.map((l) => l.scraped),
    ...(labs[keys.get(slug)] ?? []).map((g) => g.to),
    product && row.slug.startsWith("au-") ? "2026-06-30" : null,
  ].filter(Boolean).sort();
  const updated = dates[dates.length - 1] ?? null;
  const filed = images.assets[row.id];
  const asset = filed?.status === "stored" && !(existsSync(join(OUT, "img", "t", `${slug}.png`)) && existsSync(join(OUT, "img", "d", `${slug}.png`))) ? null : filed;
  const lineageScore = lin ? Math.min(4, lin.parents.length + (lin.parents.filter((p) => p.slug).length >= 2 ? 1 : 0) + (lin.grandparents.length ? 1 : 0)) : 0;

  return {
    file: {
      id: row.id,
      slug,
      name: row.name,
      kind: product ? "product" : "cultivar",
      origin: row.origin,
      type: row.type,
      genetics: botany?.genetics ?? [],
      aliases,
      family: fam
        ? {
            key: fam.key,
            canonical: fam.canonical === slug ? null : { slug: fam.canonical, name: bySlug.get(fam.canonical).name },
            variants: fam.cultivars.filter((s) => s !== slug).slice(0, 24).map((s) => ({ slug: s, name: bySlug.get(s).name })),
            variant_total: Math.max(0, fam.cultivars.length - (fam.cultivars.includes(slug) ? 1 : 0)),
          }
        : null,
      duplicates: dupes.slice(0, 12).map((s) => ({ slug: s, name: bySlug.get(s).name })),
      breeders,
      producer,
      sellers,
      seller_total: own.length,
      family_listings: famListings.length,
      lineage: lin,
      children: childList,
      children_total: kids?.size ?? 0,
      cannabinoids,
      terpenes: { measured: terpQuant, mentioned: terpMentions },
      botany,
      aroma,
      effects,
      descriptions,
      medical,
      sources: sourceList,
      completeness,
      status: completeness >= 60 ? "documented" : completeness >= 25 ? "partial" : "needs_research",
      questions,
      research: research[slug] ?? null,
      updated,
      image: asset ? { status: asset.status, version: asset.version, hash: asset.hash } : { status: "on-device" },
    },
    index: { flags, completeness, bestRank, sourceCount: sourceList.filter((s) => s.id !== "nida").length, lineageScore, updated, terpMask, breeder: breeders[0]?.name ?? producer ?? "", parents: lin ? lin.parents.map((p) => p.name).join("|") : "", aliases: aliases.map((a) => a.name).join("|"), image: asset ? (asset.status === "stored" ? 1 : asset.status === "failed" ? 2 : 0) : 0 },
  };
}

// ---------- write ----------
if (existsSync(OUT)) for (const sub of ["d", "admin"]) rmSync(join(OUT, sub), { recursive: true, force: true });
mkdirSync(join(OUT, "d"), { recursive: true });
const TYPE_CODE = { hybrid: 0, indica: 1, sativa: 2, ruderalis: 3, unspecified: 4 };
const cols = { slug: [], name: [], type: [], kind: [], alias: [], breeder: [], parents: [], family: [], flags: [], complete: [], rank: [], sources: [], lineage: [], updated: [], terps: [], image: [] };
const breederIndex = new Map();
const familyIndex = new Map();
const buckets = Array.from({ length: BUCKETS }, () => ({}));
const counters = { records: 0, cultivars: 0, products: 0, status: { documented: 0, partial: 0, needs_research: 0 }, with_sources: 0, with_cannabinoids: 0, with_sourced_cannabinoids: 0, with_lab: 0, with_terpenes_measured: 0, with_terpenes_any: 0, with_lineage: 0, with_lineage_conflict: 0, with_breeder: 0, suspected_duplicates: 0, image_stored: 0, image_failed: 0, image_on_device: 0, families_multi: 0 };
const queues = { images_missing: [], images_failed: [], missing_sources: [], incomplete: [], duplicates: [], lineage_conflicts: [], broken_links: [], medical_outdated: [] };
const sorted = [...base].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }) || a.slug.localeCompare(b.slug));
for (const row of sorted) {
  const { file, index } = assemble(row);
  buckets[bucketOf(row.slug, BUCKETS)][row.slug] = file;
  if (!breederIndex.has(index.breeder)) breederIndex.set(index.breeder, breederIndex.size);
  const famKey = file.family?.key ?? "";
  if (!familyIndex.has(famKey)) familyIndex.set(famKey, familyIndex.size);
  cols.slug.push(row.slug);
  cols.name.push(row.name);
  cols.type.push(TYPE_CODE[row.type] ?? 4);
  cols.kind.push(file.kind === "product" ? (row.slug.startsWith("au-") ? 2 : 1) : 0);
  cols.alias.push(index.aliases);
  cols.breeder.push(breederIndex.get(index.breeder));
  cols.parents.push(index.parents);
  cols.family.push(familyIndex.get(famKey));
  cols.flags.push(index.flags);
  cols.complete.push(index.completeness);
  cols.rank.push(index.bestRank);
  cols.sources.push(index.sourceCount);
  cols.lineage.push(index.lineageScore);
  cols.updated.push(index.updated ? Number(index.updated.replaceAll("-", "")) : 0);
  cols.terps.push(index.terpMask);
  cols.image.push(index.image);
  counters.records += 1;
  counters[file.kind === "product" ? "products" : "cultivars"] += 1;
  counters.status[file.status] += 1;
  if (file.sources.some((s) => s.rank <= 7 && s.id !== "nida" && s.id !== "cnb_names")) counters.with_sources += 1;
  if (index.flags & F.cannabinoid) counters.with_cannabinoids += 1;
  if (index.flags & (F.lab | F.registry | F.listing_claim)) counters.with_sourced_cannabinoids += 1;
  if (index.flags & F.lab) counters.with_lab += 1;
  if (index.flags & F.terp_quant) counters.with_terpenes_measured += 1;
  if (index.flags & (F.terp_quant | F.terp_mention)) counters.with_terpenes_any += 1;
  if (index.flags & F.lineage) counters.with_lineage += 1;
  if (index.flags & F.lineage_conflict) counters.with_lineage_conflict += 1;
  if (index.flags & F.breeder) counters.with_breeder += 1;
  if (index.flags & F.duplicate) counters.suspected_duplicates += 1;
  if (index.image === 1) counters.image_stored += 1;
  else if (index.image === 2) counters.image_failed += 1;
  else counters.image_on_device += 1;
  const brief = { slug: row.slug, name: row.name, complete: file.completeness };
  if (index.image === 0) queues.images_missing.push(brief.slug);
  if (index.image === 2) queues.images_failed.push({ ...brief, error: images.assets[row.id]?.error ?? null });
  if (!file.sources.some((s) => s.rank <= 7 && s.id !== "nida" && s.id !== "cnb_names")) queues.missing_sources.push(brief.slug);
  if (file.status === "needs_research") queues.incomplete.push(brief.slug);
  if (file.duplicates.length && file.family?.canonical == null) queues.duplicates.push({ ...brief, duplicates: file.duplicates.map((d) => d.slug) });
  if (file.lineage?.conflict) queues.lineage_conflicts.push({ ...brief, claims: file.lineage.claims.map((c) => ({ parents: c.parents.map((p) => p.name), count: c.count })) });
  for (const s of file.sellers) if (s.link.startsWith("broken")) queues.broken_links.push({ slug: row.slug, url: s.url, link: s.link });
  if (file.kind === "product" && row.slug.startsWith("au-")) queues.medical_outdated.push({ slug: row.slug, name: row.name, period: "SAS/AP supply 1 Jan–30 Jun 2026", review_after: "2027-01-31" });
}
for (const fam of families.values()) if (fam.cultivars.length > 1) counters.families_multi += 1;
for (let i = 0; i < BUCKETS; i += 1) writeJson(join(OUT, "d", `${i}.json`), buckets[i]);
const breeders = [...breederIndex.keys()];
writeJson(join(OUT, "index.json"), { v: INDEX_VERSION, built: TODAY, buckets: BUCKETS, count: cols.slug.length, terpenes: TERPS.map(([n]) => n), breeders, families: familyIndex.size, flags: F, cols });
const meta = {
  v: INDEX_VERSION,
  built: TODAY,
  counts: counters,
  ranks: RANKS,
  sources: Object.fromEntries(Object.entries(SOURCES).map(([id, s]) => [id, { rank: s.rank, label: s.label, url: s.url, note: s.note, license: s.license ?? null }])),
  renderer: images.renderer,
};
writeJson(join(OUT, "meta.json"), meta, true);
mkdirSync(join(OUT, "admin"), { recursive: true });
const cap = (list, n = 400) => ({ total: list.length, items: list.slice(0, n) });
writeJson(join(OUT, "admin", "queues.json"), {
  built: TODAY,
  images_missing: cap(queues.images_missing, 200),
  images_failed: cap(queues.images_failed),
  missing_sources: cap(queues.missing_sources, 200),
  incomplete: cap(queues.incomplete, 200),
  duplicates: cap(queues.duplicates),
  lineage_conflicts: cap(queues.lineage_conflicts),
  broken_links: cap(queues.broken_links),
  medical_outdated: cap(queues.medical_outdated, 50),
  jobs: readJson(join(DATA, "state.json"), { runs: [] }).runs.slice(-30),
});
writeJson(join(DATA, "report.json"), { built: TODAY, counts: counters, excluded: excludedBase, queues: Object.fromEntries(Object.entries(queues).map(([k, v]) => [k, v.length])) }, true);
console.log(JSON.stringify(counters, null, 1));

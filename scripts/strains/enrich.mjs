// Enrichment stages. Each stage reads cached raw sources, writes a committed
// artefact in data/strains, and appends a run record to data/strains/state.json.
//   node scripts/strains/enrich.mjs --stage listings
//   node scripts/strains/enrich.mjs --stage labs
//   node scripts/strains/enrich.mjs --stage links --limit 200     (resumable)
//   node scripts/strains/enrich.mjs --stage all
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CACHE, DATA, OUT, TODAY, args, cultivarKey, familyKeys, labKey, loadBase, nameKey, num, parseCsv, readJson, readMixedText, slugify, writeJson } from "./lib.mjs";

const opts = args();
const stage = opts.stage ?? "all";
const statePath = join(DATA, "state.json");
const state = readJson(statePath, { runs: [] });

function record(name, info) {
  state.runs.push({ stage: name, ran_at: new Date().toISOString(), ...info });
  state.runs = state.runs.slice(-200);
  writeJson(statePath, state, true);
  console.log(name, JSON.stringify(info));
}

function cachePath(file) {
  const path = join(CACHE, file);
  if (!existsSync(path)) throw new Error(`${path} is missing. Run scripts/strains/fetch-sources.mjs first.`);
  return path;
}

const decode = (value) =>
  String(value ?? "")
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function bounded(value, lo, hi, reasons, label) {
  const n = num(value);
  if (n === null) return null;
  if (n < lo || n > hi) {
    reasons[label] = (reasons[label] ?? 0) + 1;
    return null;
  }
  return Math.round(n * 100) / 100;
}

function pair(minValue, maxValue, lo, hi, reasons, label) {
  const a = bounded(minValue, lo, hi, reasons, label);
  const b = bounded(maxValue, lo, hi, reasons, label);
  if (a === null && b === null) return null;
  // Seller pages print 0 where a figure is simply absent.
  if (!a && !b) {
    reasons[`${label}_zero`] = (reasons[`${label}_zero`] ?? 0) + 1;
    return null;
  }
  const low = a ?? b;
  const high = b ?? a;
  if (low > high) {
    reasons[`${label}_inverted`] = (reasons[`${label}_inverted`] ?? 0) + 1;
    return null;
  }
  return [low, high];
}

const list = (value) =>
  decode(value)
    .split(/[,;/|]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item && item.length < 40);

const usDate = (value) => {
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(value ?? "");
  if (iso) return iso[1];
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(value ?? "");
  return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : null;
};

function stageListings() {
  const base = loadBase();
  const slugs = new Set(base.map((row) => row.slug));
  const out = {};
  const rejected = {};
  let rows = 0;
  let matched = 0;
  const unmatched = [];
  parseCsv(readMixedText(cachePath("ci-raw.csv")), (row) => {
    rows += 1;
    const slug = slugify(row.strain_name_original || row.strain_name_display);
    if (!slugs.has(slug)) {
      if (unmatched.length < 5000) unmatched.push(row.strain_name_original);
      return;
    }
    matched += 1;
    const listing = {
      url: row.source_url || null,
      seller: decode(row.seed_bank) || null,
      breeder: decode(row.breeder) || null,
      scraped: usDate(row.scraped_at),
      name: decode(row.strain_name_original),
      aka: decode(row.aka_strain_name) || null,
      parents: [decode(row.parent_1_display), decode(row.parent_2_display)].filter(Boolean),
      formula: decode(row.lineage_formula) || null,
      lineage_text: decode(row.lineage_description).slice(0, 300) || null,
      genetics_text: decode(row.genetics_description).slice(0, 400) || null,
      genetics: decode(row.genetics_type || row.category_type) || null,
      indica: bounded(row.indica_percentage, 0, 100, rejected, "indica_pct"),
      sativa: bounded(row.sativa_percentage, 0, 100, rejected, "sativa_pct"),
      effects: list(row.effects),
      flavors: list(row.flavors),
      terpenes: list(row.terpenes),
      harvest: decode(row.harvest_time) || null,
      thc: pair(row.thc_min, row.thc_max, 0, 40, rejected, "thc_pct"),
      cbd: pair(row.cbd_min, row.cbd_max, 0, 30, rejected, "cbd_pct"),
      flowering_days: pair(row.flowering_days_min, row.flowering_days_max, 35, 180, rejected, "flowering_days"),
      height_indoor_cm: pair(row.height_indoor_cm_min, row.height_indoor_cm_max, 15, 400, rejected, "height_indoor_cm"),
      height_outdoor_cm: pair(row.height_outdoor_cm_min, row.height_outdoor_cm_max, 30, 600, rejected, "height_outdoor_cm"),
      yield_indoor_g_m2: pair(row.yield_indoor_g_m2_min, row.yield_indoor_g_m2_max, 20, 1000, rejected, "yield_indoor_g_m2"),
      yield_outdoor_g_plant: pair(row.yield_outdoor_g_plant_min, row.yield_outdoor_g_plant_max, 20, 3000, rejected, "yield_outdoor_g_plant"),
      auto: row.is_auto_flowering === "True" ? true : row.is_auto_flowering === "False" ? false : null,
      feminized: row.is_feminized_flowering === "True" ? true : row.is_feminized_flowering === "False" ? false : null,
    };
    for (const key of Object.keys(listing)) {
      const value = listing[key];
      if (value === null || (Array.isArray(value) && value.length === 0)) delete listing[key];
    }
    (out[slug] ??= []).push(listing);
  });
  writeJson(join(DATA, "listings.json"), { source: "ci_strains", built: TODAY, records: out });
  writeJson(join(DATA, "listings-unmatched.json"), { note: "Listing rows whose name slug matches no archive record. Candidates for new records after review.", names: [...new Set(unmatched)].sort() }, true);
  record("listings", { rows, matched_rows: matched, records: Object.keys(out).length, unmatched_rows: rows - matched, rejected_values: rejected });
}

const LAB_SETS = [
  {
    source: "cannlytics_nv",
    file: "lab-nv.csv",
    state: "NV",
    name: (row) => row.product_name,
    keep: (row) => row.product_type === "Marijuana Flowers/Buds" || row.product_type === "Small/Popcorn Buds",
    date: (row) => (row.date_tested || "").slice(0, 10),
    sample: (row) => ({ id: row.sample_id || row.label || null, producer: row.producer || null, lab: row.lab || null }),
    analytes: {
      total_thc: "total_thc", thca: "thca", delta_9_thc: "delta_9_thc", total_cbd: "total_cbd", cbd: "cbd", cbda: "cbda", cbn: "cbn",
      total_terpenes: "total_terpenes", myrcene: "beta_myrcene", limonene: "d_limonene", caryophyllene: "beta_caryophyllene",
      "alpha-pinene": "alpha_pinene", "beta-pinene": "beta_pinene", humulene: "alpha_humulene", linalool: "linalool",
      terpinolene: "terpinolene", bisabolol: "alpha_bisabolol", "caryophyllene oxide": "caryophyllene_oxide",
    },
  },
  {
    source: "cannlytics_md",
    file: "lab-md.csv",
    state: "MD",
    name: (row) => row.strain_name,
    keep: (row) => row.product_type === "Buds",
    date: (row) => {
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(row.date_tested || "");
      return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
    },
    sample: (row) => ({ id: row.package_id || null, producer: null, lab: row.lab_id ? `lab ${row.lab_id}` : null }),
    analytes: { thca: "thca", delta_9_thc: "delta_9_thc", cbd: "cbd", cbda: "cbda", cbg: "cbg", cbn: "cbn", total_terpenes: "terpenes" },
  },
  {
    source: "cannlytics_hi",
    file: "lab-hi.csv",
    state: "HI",
    name: (row) => row.strain_name,
    keep: (row) => row.product_type === "Flower Lot",
    date: (row) => (row.date_tested || "").slice(0, 10),
    sample: (row) => ({ id: row.sample_id || row.batch_number || null, producer: row.producer || null, lab: null }),
    analytes: { thca: "thca", delta_9_thc: "delta_9_thc", cbd: "cbd", cbda: "cbda", cbg: "cbg", cbn: "cbn", total_cannabinoids: "total_cannabinoids" },
  },
];

const CANNABINOIDS = new Set(["total_thc", "thca", "delta_9_thc", "total_cbd", "cbd", "cbda", "cbg", "cbn", "total_cannabinoids"]);

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return Math.round((sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)) * 100) / 100;
}

function stageLabs() {
  const out = {};
  const info = {};
  const listings = readJson(join(DATA, "listings.json")).records;
  const wanted = new Set([...familyKeys(loadBase(), listings).values()].filter(Boolean));
  const unmatched = [];
  for (const set of LAB_SETS) {
    const groups = new Map();
    const excluded = { not_flower: 0, no_name: 0, all_zero: 0, implausible: 0 };
    let used = 0;
    parseCsv(readMixedText(cachePath(set.file)), (row) => {
      if (!set.keep(row)) return void (excluded.not_flower += 1);
      const raw = set.name(row);
      const key = labKey(raw);
      if (!key || key.length < 3 || !/[a-z]{3}/.test(key)) return void (excluded.no_name += 1);
      const values = {};
      let positive = 0;
      let bad = false;
      for (const [analyte, column] of Object.entries(set.analytes)) {
        const n = num(row[column]);
        if (n === null) continue;
        if (n < 0 || n > (CANNABINOIDS.has(analyte) ? 45 : 10)) bad = true;
        if (CANNABINOIDS.has(analyte) && n > 0) positive += 1;
        values[analyte] = n;
      }
      if (bad) return void (excluded.implausible += 1);
      if (!positive) return void (excluded.all_zero += 1);
      used += 1;
      let group = groups.get(key);
      if (!group) groups.set(key, (group = { names: new Map(), values: {}, dates: [], producers: new Set(), samples: [] }));
      group.names.set(raw, (group.names.get(raw) ?? 0) + 1);
      for (const [analyte, n] of Object.entries(values)) (group.values[analyte] ??= []).push(n);
      const date = set.date(row);
      if (date) group.dates.push(date);
      const sample = set.sample(row);
      if (sample.producer) group.producers.add(sample.producer);
      group.samples.push({ ...sample, date: date || null, name: raw, values });
    });
    let groupsKept = 0;
    let groupsUnmatched = 0;
    for (const [key, group] of groups) {
      if (!wanted.has(key)) {
        groupsUnmatched += 1;
        unmatched.push({ key, state: set.state, n: group.samples.length, name: [...group.names.keys()][0] });
        continue;
      }
      const n = group.samples.length;
      const analytes = {};
      for (const [analyte, values] of Object.entries(group.values)) {
        values.sort((a, b) => a - b);
        analytes[analyte] = { n: values.length, min: values[0], p25: quantile(values, 0.25), median: quantile(values, 0.5), p75: quantile(values, 0.75), max: values[values.length - 1] };
      }
      group.dates.sort();
      group.samples.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      const entry = {
        source: set.source,
        state: set.state,
        n,
        names: [...group.names.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count })),
        producers: group.producers.size,
        from: group.dates[0] ?? null,
        to: group.dates[group.dates.length - 1] ?? null,
        analytes,
        samples: group.samples.slice(0, 3),
      };
      (out[key] ??= []).push(entry);
      groupsKept += 1;
    }
    info[set.state] = { used_rows: used, name_groups_matched: groupsKept, name_groups_unmatched: groupsUnmatched, excluded };
  }
  writeJson(join(DATA, "labs.json"), { built: TODAY, note: "Aggregates of state lab results grouped by the cleaned product or strain name on the test record. They describe tested flower sold under that name.", keys: out });
  writeJson(join(DATA, "labs-unmatched.json"), { note: "Lab name groups that match no archive record. Research proposals are drawn from these.", groups: unmatched.sort((a, b) => b.n - a.n) });
  record("labs", info);
}

async function stageLinks() {
  const listings = readJson(join(DATA, "listings.json")).records;
  const linksPath = join(DATA, "links.json");
  const links = readJson(linksPath, { checked: {} });
  const urls = new Set(opts.slug ? [] : Object.values(SOURCE_URLS));
  for (const [slug, rows] of Object.entries(listings)) {
    if (opts.slug && slug !== opts.slug) continue;
    for (const row of rows) if (row.url) urls.add(row.url);
  }
  const todo = [...urls].filter((url) => !links.checked[url] || opts.recheck).slice(0, Number(opts.limit ?? 150));
  let ok = 0;
  let broken = 0;
  let failed = 0;
  const run = async (url) => {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 12000);
      let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctl.signal, headers: { "user-agent": "NARCODEX-linkcheck/1" } });
      if (res.status === 405 || res.status === 403) res = await fetch(url, { method: "GET", redirect: "follow", signal: ctl.signal, headers: { "user-agent": "NARCODEX-linkcheck/1" } });
      clearTimeout(timer);
      links.checked[url] = { status: res.status, ok: res.ok, checked: TODAY };
      if (res.ok) ok += 1;
      else broken += 1;
    } catch (error) {
      links.checked[url] = { status: 0, ok: false, error: String(error.name || error), checked: TODAY };
      failed += 1;
    }
  };
  for (let i = 0; i < todo.length; i += 8) await Promise.all(todo.slice(i, i + 8).map(run));
  writeJson(linksPath, links);
  record("links", { checked_now: todo.length, ok, broken, failed, total_known: urls.size, total_checked: Object.keys(links.checked).length });
}

// Works through the research queue a batch at a time. It only looks in cached
// sources and records what it checked; anything it finds is a proposal for
// review, never an automatic edit.
function stageResearch() {
  const indexPath = join(OUT, "index.json");
  if (!existsSync(indexPath)) throw new Error("Run build-strains.mjs first.");
  const index = readJson(indexPath);
  const researchPath = join(DATA, "research.json");
  const research = readJson(researchPath, { records: {} });
  const compact = (value) => nameKey(value).replace(/[^a-z0-9]/g, "");
  const labGroups = readJson(join(DATA, "labs-unmatched.json"), { groups: [] }).groups;
  const labByCompact = new Map();
  for (const group of labGroups) {
    const k = compact(group.key);
    if (k.length >= 4) (labByCompact.get(k) ?? labByCompact.set(k, []).get(k)).push(group);
  }
  const unmatchedNames = readJson(join(DATA, "listings-unmatched.json"), { names: [] }).names;
  const listingByCompact = new Map();
  for (const name of unmatchedNames) {
    const k = compact(cultivarKey(name));
    if (k.length >= 4) (listingByCompact.get(k) ?? listingByCompact.set(k, []).get(k)).push(name);
  }
  const { slug, name, complete, kind } = index.cols;
  const queue = [];
  for (let i = 0; i < slug.length; i += 1) {
    if (opts.slug) {
      if (slug[i] === opts.slug) queue.push(i);
      continue;
    }
    if (kind[i] !== 0 || complete[i] >= 25) continue;
    const prior = research.records[slug[i]];
    if (prior && !opts.recheck) continue;
    queue.push(i);
  }
  queue.sort((a, b) => complete[a] - complete[b] || name[a].localeCompare(name[b]));
  const batch = queue.slice(0, Number(opts.limit ?? 500));
  let found = 0;
  for (const i of batch) {
    const k = compact(cultivarKey(name[i]));
    const proposals = [];
    for (const group of labByCompact.get(k) ?? []) proposals.push({ type: "lab_group", state: group.state, key: group.key, n: group.n, example: group.name });
    for (const listing of listingByCompact.get(k) ?? []) proposals.push({ type: "listing_name", name: listing });
    if (proposals.length) found += 1;
    research.records[slug[i]] = {
      attempted: TODAY,
      checked: ["cannlytics_nv", "cannlytics_md", "cannlytics_hi", "ci_strains"],
      outcome: proposals.length ? "proposals_for_review" : "no_match_in_cached_sources",
      proposals: proposals.slice(0, 6),
    };
  }
  writeJson(researchPath, research);
  record("research", { queued: queue.length, processed: batch.length, with_proposals: found, remaining: queue.length - batch.length });
}

const SOURCE_URLS = {
  tga: "https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list",
  ct: "https://data.ct.gov/d/egd5-wb6r",
  nida: "https://nida.nih.gov/publications/drugfacts/cannabis-marijuana",
  ci: "https://github.com/Shannon-Goddard/ci-strains-pro",
  cannlytics: "https://huggingface.co/datasets/cannlytics/cannabis_results",
  cnb: "https://github.com/Lguyogiro/cnb_strns/blob/master/all_strain_names.txt",
};

if (stage === "listings" || stage === "all") stageListings();
if (stage === "labs" || stage === "all") stageLabs();
if (stage === "links") await stageLinks();
if (stage === "research") stageResearch();

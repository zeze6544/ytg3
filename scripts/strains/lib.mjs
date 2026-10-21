import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const MOBILE = join(ROOT, "apps", "mobile");
export const CACHE = join(ROOT, ".cache", "strains");
export const DATA = join(ROOT, "data", "strains");
export const OUT = join(MOBILE, "public", "strains");
export const TODAY = new Date().toISOString().slice(0, 10);

export function readJson(path, fallback) {
  if (!existsSync(path)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value, pretty = false) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, pretty ? `${JSON.stringify(value, null, 1)}\n` : JSON.stringify(value));
  renameSync(tmp, path);
  return path;
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function nameKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PACK = new Set([
  "feminized", "feminised", "femenized", "feminzed", "fem", "fems", "regular", "reg", "seeds", "seed", "strain", "strains",
  "cannabis", "marijuana", "photoperiod", "photo", "pack", "packs", "x1", "x3", "x5", "x10", "f", "female", "graines", "semillas",
]);
const AUTO = /\b(auto|autos|autoflower|autoflowers|autoflowering|autoflowered|automatic|autofem)\b/g;
const LAB_NOISE = new Set([
  "flower", "flowers", "bud", "buds", "bulk", "small", "smalls", "popcorn", "shake", "trim", "test", "batch", "marijuana", "marijuan",
  "lot", "eighth", "eighths", "quarter", "half", "oz", "g", "gram", "grams", "k", "a", "b", "c", "indoor", "outdoor", "greenhouse", "mix",
]);

export function autoFlag(name) {
  return new RegExp(AUTO.source).test(nameKey(name));
}

let breederPhrases = [];
// Only whole breeder names of two or more words are stripped globally, so a
// cultivar such as "Sensi Star" is never reduced to "star".
export function setBreederPhrases(list, protect) {
  breederPhrases = [...new Set(list.map(nameKey))]
    .filter((phrase) => phrase.split(" ").length >= 2 && phrase.length >= 6 && !protect.has(phrase) && !protect.has(stripPack(phrase)))
    .sort((a, b) => b.length - a.length);
}

function stripPack(key) {
  return key
    .split(" ")
    .filter((word) => word && !PACK.has(word))
    .join(" ");
}

// Single-word brand names are only stripped from the front ("Dinafem Blue
// Cheese"); stripping them from the end would turn "Blueberry Kush" into
// "blueberry" for a breeder called "Kush Cannabis Seeds".
function stripPhrases(key, phrases) {
  for (let pass = 0; pass < 2; pass += 1) {
    for (const phrase of phrases) {
      const multi = phrase.includes(" ");
      if (key.startsWith(`${phrase} `) && key.length - phrase.length > 3) key = key.slice(phrase.length + 1);
      else if (multi && key.endsWith(` ${phrase}`) && key.length - phrase.length > 3) key = key.slice(0, key.length - phrase.length - 1);
    }
  }
  return key;
}

export function cultivarKey(name, ownBreeders = []) {
  let key = nameKey(name).replace(AUTO, " ").replace(/\s+/g, " ").trim();
  const own = ownBreeders.filter(Boolean).flatMap((item) => {
    const full = nameKey(item);
    const bare = stripPack(full);
    return [full, bare.includes(" ") ? bare : ""].filter((phrase) => phrase.length >= 5);
  });
  key = stripPhrases(key, [...new Set(own)].sort((a, b) => b.length - a.length));
  key = stripPhrases(key, breederPhrases);
  key = stripPack(key);
  return key.trim() || nameKey(name);
}

export function labKey(product) {
  let key = nameKey(String(product).replace(/\([^)]*\)/g, " "));
  key = key
    .replace(/\b\d+(\.\d+)?\s*(g|gram|grams|oz|mg)\b/g, " ")
    .replace(/\b\d+ \d+ ?g\b/g, " ")
    .split(" ")
    .filter((word) => word && !LAB_NOISE.has(word))
    .join(" ");
  return stripPack(key.replace(AUTO, " ").replace(/\s+/g, " ").trim());
}

const BAD_PARENT = /(aroma|flavou?r|effect|balanced|ratio|unknown|undisclosed|secret|lineage|dominant|percent|thc|cbd|terpene|taste|smell|high\b|yield|indoor|outdoor|feminized|autoflower|ruderalis genetics|\?)/i;

export function cleanParent(value) {
  let text = String(value ?? "")
    .replace(/\((clone only|clone|cut|pheno|f\d|bx\d?|s\d|ibl|female|male|f)\)/gi, " ")
    .replace(/\b(f\d|bx\d?|s\d|ibl)\b/gi, " ")
    .replace(/^lineage:\s*/i, "")
    .replace(/[()[\]{}"]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s.,;:-]+|[\s.,;:-]+$/g, "")
    .trim();
  if (text.length < 2 || text.length > 40) return null;
  if (!/[a-z]/i.test(text)) return null;
  if (BAD_PARENT.test(text)) return null;
  if (/^(a|an|the|and|or|of|with|for|by|from)\b/i.test(text)) return null;
  if (text.split(" ").length > 5) return null;
  text = text.replace(/\b([a-z])/g, (m) => m.toUpperCase());
  return text;
}

export function splitCross(value) {
  const text = String(value ?? "").replace(/×/g, " x ");
  if (!/\sx\s/i.test(text)) return [];
  return text
    .split(/\s+x\s+/i)
    .map(cleanParent)
    .filter(Boolean);
}

const UTF8 = new TextDecoder("utf-8", { fatal: true });
const LATIN1 = new TextDecoder("latin1");

export function readMixedText(path) {
  const buf = readFileSync(path);
  const parts = [];
  let start = 0;
  for (let i = 0; i <= buf.length; i += 1) {
    if (i !== buf.length && buf[i] !== 10) continue;
    const line = buf.subarray(start, i);
    try {
      parts.push(UTF8.decode(line));
    } catch {
      parts.push(LATIN1.decode(line));
    }
    start = i + 1;
  }
  return parts.join("\n");
}

export function parseCsv(text, onRow) {
  let field = "";
  let row = [];
  let quoted = false;
  let header = null;
  const push = () => {
    row.push(field);
    field = "";
  };
  const end = () => {
    push();
    if (!header) header = row;
    else if (row.length > 1 || row[0] !== "") {
      const obj = {};
      for (let i = 0; i < header.length; i += 1) obj[header[i]] = row[i] ?? "";
      onRow(obj);
    }
    row = [];
  };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") push();
    else if (ch === "\n") end();
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) end();
  return header;
}

export function num(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function bucketOf(slug, buckets) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % buckets;
}

// Seller-page scrapes occasionally captured interstitials or headings as names.
const PAGE_CHROME = /^(age verification|seeds?|shop|home|cart|checkout|log ?in|sign ?in|untitled|test|n\/?a)$/i;
export const excludedBase = [];

export function loadBase() {
  excludedBase.length = 0;
  const archive = readJson(join(MOBILE, "src", "data", "archive.json"));
  const extra = readJson(join(MOBILE, "src", "data", "drugs-extra.json"));
  const max = readJson(join(DATA, "base", "strains-max.json"));
  const medical = readJson(join(DATA, "base", "medical-flower.json"));
  const rows = [];
  const seen = new Set();
  const add = (strain, origin) => {
    if (seen.has(strain.slug)) return;
    seen.add(strain.slug);
    if (PAGE_CHROME.test(strain.name)) return void excludedBase.push({ slug: strain.slug, name: strain.name, origin, reason: "scraped page text, not a cultivar name" });
    rows.push({ ...strain, origin });
  };
  for (const strain of archive.strains) add(strain, strain.thc_low != null ? "curated" : "namelist");
  for (const strain of extra.strains ?? []) add(strain, "namelist");
  for (const strain of max.strains) add(strain, "listing");
  for (const strain of medical.strains) add(strain, "registry");
  return rows;
}

const REG_NOISE = new Set([
  "whole", "ground", "flower", "flowers", "preroll", "prerolls", "pre", "roll", "rolls", "pack", "prepack", "minis", "mini", "smalls",
  "grnd", "select", "grind", "second", "cut", "single", "syringe", "sun", "grown", "pr", "prc", "fl", "med", "tc", "bulk", "popcorn",
  "shake", "indoor", "greenhouse", "joint", "joints", "bud", "buds", "infused", "the",
]);
const REG_BRANDS = ["curaleaf", "agl", "rythm", "grassroots", "savvy", "find", "good green", "rodeo", "all hours", "ctpharma", "theraplant", "fine fettle", "advanced grow labs"];

// Connecticut registrations put brand, form, weight, potency, type code and a
// batch number around the name: "Curaleaf Whole Flower 3.5g Jasper (H) 20987".
export function registryKey(name, brand) {
  let text = String(name)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bNDC:?\s*\d+/gi, " ")
    .replace(/\b(TC|T)?\s*\d+(\.\d+)?\s*%/gi, " ")
    .replace(/\bT\d+(\.\d+)?\b/gi, " ")
    .replace(/\b\d+(\.\d+)?\s*(g|gram|grams|oz|mg)\b(-med)?/gi, " ");
  let key = nameKey(text)
    .split(" ")
    .filter((w) => w && !REG_NOISE.has(w) && !(/^\d+$/.test(w) && w.length >= 3))
    .join(" ");
  const brands = [...REG_BRANDS, ...(brand ? [stripPack(nameKey(brand)).replace(/\b(llc|inc|co|corp|ltd)\b/g, "").trim()] : [])].filter((b) => b.length >= 3);
  for (const b of brands) if (key.startsWith(`${b} `)) key = key.slice(b.length + 1);
  const words = key.split(" ");
  while (words.length > 1 && /^[hisc]$/.test(words[words.length - 1])) words.pop();
  return stripPack(words.join(" ")).trim();
}

export function familyKeys(base, listings) {
  const breeders = [];
  for (const rows of Object.values(listings)) for (const row of rows) breeders.push(row.breeder, row.seller);
  for (const row of base) for (const product of row.products ?? []) breeders.push(product.brand);
  const protect = new Set(base.filter((row) => row.origin === "curated" || row.origin === "namelist").map((row) => nameKey(row.name)));
  setBreederPhrases(breeders.filter(Boolean), protect);
  const keys = new Map();
  for (const row of base) {
    const own = [];
    for (const listing of listings[row.slug] ?? []) own.push(listing.breeder, listing.seller);
    for (const product of row.products ?? []) own.push(product.brand);
    if (row.slug.startsWith("au-")) keys.set(row.slug, null);
    else if (row.origin === "registry") keys.set(row.slug, registryKey(row.name, row.products?.[0]?.brand) || null);
    else keys.set(row.slug, cultivarKey(row.name, own));
  }
  return keys;
}

export function args(argv = process.argv.slice(2)) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

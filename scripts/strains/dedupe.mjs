// Collapses strain records that are the same cultivar or the same registry
// filing listed again under a pack size, a seed-shop suffix, or a batch code.
// Listings from a dropped cultivar are kept on the record that remains.
import { nameKey, registryKey } from "./lib.mjs";

const ORIGIN_RANK = { curated: 0, namelist: 1, listing: 2, registry: 3 };

function autoOf(row, listings) {
  if (/\bauto/i.test(row.name)) return true;
  if (row.origin !== "listing") return false;
  const flags = (listings[row.slug] ?? []).filter((l) => l.auto !== undefined);
  if (!flags.length) return false;
  return flags.filter((l) => l.auto).length > flags.length / 2;
}

function breedersOf(slug, listings) {
  return [...new Set((listings[slug] ?? []).map((l) => l.breeder).filter(Boolean).map(nameKey))];
}

function productForm(name) {
  const text = name.toLowerCase();
  if (/pre[-\s]?roll|\bjoints?\b/.test(text)) return "preroll";
  if (/grind|ground|\bshake\b|popcorn/.test(text)) return "grind";
  if (/vape|cartridge|\bcart\b|syringe|\boil\b|edible|gumm/.test(text)) return "other";
  return "flower";
}

function roundNum(value) {
  if (value == null || Number.isNaN(Number(value))) return "";
  return String(Math.round(Number(value) * 100) / 100);
}

function pickCultivar(list, bySlug, familyKey) {
  return [...list].sort((a, b) => {
    const ra = bySlug.get(a);
    const rb = bySlug.get(b);
    const exactA = nameKey(ra.name) === familyKey ? 0 : 1;
    const exactB = nameKey(rb.name) === familyKey ? 0 : 1;
    return ORIGIN_RANK[ra.origin] - ORIGIN_RANK[rb.origin] || exactA - exactB || ra.name.length - rb.name.length || a.localeCompare(b);
  })[0];
}

function richness(row) {
  return (row.cannabinoids?.length ?? 0) * 3 + (row.terpene_profile?.length ?? 0) * 2 + (row.thc_low != null ? 4 : 0) + (row.summary?.length ?? 0) / 1000;
}

export function collapseDuplicates(base, listings, keys) {
  const bySlug = new Map(base.map((row) => [row.slug, row]));
  const dropTo = new Map();
  const names = new Map();
  let droppedCultivars = 0;
  let droppedProducts = 0;

  const families = new Map();
  for (const row of base) {
    if (row.origin === "registry") continue;
    const key = keys.get(row.slug);
    if (!key) continue;
    let fam = families.get(key);
    if (!fam) families.set(key, (fam = []));
    fam.push(row.slug);
  }
  for (const [key, slugs] of families) {
    const groups = new Map();
    for (const slug of slugs) {
      const breeders = breedersOf(slug, listings);
      const group = `${autoOf(bySlug.get(slug), listings) ? "auto" : "photo"}|${breeders.length === 1 ? breeders[0] : breeders.length ? "multi" : "none"}`;
      (groups.get(group) ?? groups.set(group, []).get(group)).push(slug);
    }
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      const keep = pickCultivar(list, bySlug, key);
      for (const slug of list) {
        if (slug === keep || dropTo.has(slug)) continue;
        dropTo.set(slug, keep);
        droppedCultivars += 1;
        const alias = names.get(keep) ?? [];
        alias.push(bySlug.get(slug).name);
        names.set(keep, alias);
      }
    }
  }

  const products = new Map();
  for (const row of base) {
    if (row.origin !== "registry" || dropTo.has(row.slug)) continue;
    const brand = row.products?.[0]?.brand ?? "";
    const ident = (row.slug.startsWith("au-") ? null : keys.get(row.slug)) || registryKey(row.name, brand);
    if (!ident) continue;
    const group = [ident, nameKey(brand), productForm(row.name), nameKey(row.name).split(" ")[0] ?? "", roundNum(row.thc_high), roundNum(row.cbd_high), row.slug.startsWith("au-") ? "au" : "ct"].join("|");
    (products.get(group) ?? products.set(group, []).get(group)).push(row);
  }
  for (const list of products.values()) {
    if (list.length < 2) continue;
    const keep = [...list].sort((a, b) => richness(b) - richness(a) || a.name.length - b.name.length || a.slug.localeCompare(b.slug))[0];
    for (const row of list) {
      if (row.slug === keep.slug) continue;
      dropTo.set(row.slug, keep.slug);
      droppedProducts += 1;
      const alias = names.get(keep.slug) ?? [];
      alias.push(row.name);
      names.set(keep.slug, alias);
    }
  }

  for (const [slug, keep] of dropTo) {
    const incoming = listings[slug] ?? [];
    if (incoming.length) {
      const have = new Set((listings[keep] ?? []).map((row) => row.url).filter(Boolean));
      const next = [...(listings[keep] ?? [])];
      for (const row of incoming) {
        if (row.url && have.has(row.url)) continue;
        next.push(row);
        if (row.url) have.add(row.url);
      }
      listings[keep] = next;
    }
    delete listings[slug];
  }

  return {
    base: base.filter((row) => !dropTo.has(row.slug)),
    names,
    droppedCultivars,
    droppedProducts,
  };
}

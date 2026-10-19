import raw from "@/data/archive.json";
import type { Drug, DrugClass, Strain } from "@/lib/types";

export type ArchiveDrug = Drug & { risk_classes?: string[] };

type Archive = {
  drugs: ArchiveDrug[];
  classes: DrugClass[];
  strains: Strain[];
  timeline: { id: string; year: number; title: string; description: string; category: string | null }[];
  refs: { id: string; drug_id: string; label: string; url: string | null }[];
  groups: Record<string, string[]>;
  rules: { left: string[]; right: string[]; severity: string; note: string }[];
};

const archive = raw as Archive;
const RANK: Record<string, number> = { unknown: 0, low: 1, moderate: 2, dangerous: 3, deadly: 4 };

export const LOCAL_DRUG_COUNT = archive.drugs.length;

function tagsOf(drug: { category: string; risk_classes?: string[] }) {
  return drug.risk_classes?.length ? drug.risk_classes : [drug.category];
}

function matches(drug: ArchiveDrug, token: string) {
  if (token.startsWith("group:")) return (archive.groups[token.slice(6)] ?? []).includes(drug.slug);
  if (drug.slug === token) return true;
  return tagsOf(drug).includes(token);
}

function sideMatches(drug: ArchiveDrug, tokens: string[]) {
  return tokens.some((token) => matches(drug, token));
}

export function localDrugs(opts?: { search?: string; category?: string; limit?: number }) {
  let rows = archive.drugs;
  const cat = opts?.category && opts.category !== "all" ? opts.category : "";
  if (cat) rows = rows.filter((drug) => tagsOf(drug).includes(cat));
  const term = opts?.search?.trim().toLowerCase() ?? "";
  if (term) {
    rows = rows.filter((drug) =>
      [drug.name, drug.slug, drug.summary, drug.chemistry, ...(drug.aliases ?? []), ...(drug.brand_names ?? []), ...(drug.street_names ?? [])]
        .join("\n")
        .toLowerCase()
        .includes(term),
    );
  }
  const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));
  return opts?.limit ? sorted.slice(0, opts.limit) : sorted;
}

export function localPopular(slugs: string[]) {
  const map = new Map(archive.drugs.map((drug) => [drug.slug, drug]));
  return slugs.map((slug) => map.get(slug)).filter(Boolean) as ArchiveDrug[];
}

export function localDrugBySlug(slug: string) {
  return archive.drugs.find((drug) => drug.slug === slug) ?? null;
}

export function localRefs(drugId: string) {
  return archive.refs.filter((ref) => ref.drug_id === drugId);
}

export function localClasses() {
  return [...archive.classes].sort((a, b) => a.name.localeCompare(b.name));
}

export function localStrains(opts?: { search?: string; type?: string }) {
  let rows = archive.strains;
  if (opts?.type && opts.type !== "all") rows = rows.filter((strain) => strain.type === opts.type);
  const term = opts?.search?.trim().toLowerCase() ?? "";
  if (term) {
    rows = rows.filter((strain) => `${strain.name}\n${strain.lineage ?? ""}`.toLowerCase().includes(term));
  }
  return [...rows].sort((a, b) => a.name.localeCompare(b.name));
}

export function localTimeline() {
  return [...archive.timeline].sort((a, b) => a.year - b.year);
}

export function localInteraction(aId: string, bId: string) {
  const a = archive.drugs.find((drug) => drug.id === aId);
  const b = archive.drugs.find((drug) => drug.id === bId);
  if (!a || !b || a.id === b.id) return null;
  let best: { severity: string; note: string } | null = null;
  for (const rule of archive.rules) {
    const hit = (sideMatches(a, rule.left) && sideMatches(b, rule.right)) || (sideMatches(b, rule.left) && sideMatches(a, rule.right));
    if (!hit) continue;
    if (!best || (RANK[rule.severity] ?? 0) > (RANK[best.severity] ?? 0)) {
      best = { severity: rule.severity, note: rule.note };
    }
  }
  return (
    best ?? {
      severity: "unknown",
      note: "This pair is not catalogued as a specific combination. Unknown means unknown. It does not mean safe.",
    }
  );
}

export function localRandom() {
  if (!archive.drugs.length) return null;
  return archive.drugs[Math.floor(Math.random() * archive.drugs.length)] ?? null;
}

export function localCounts() {
  return { drugs: archive.drugs.length, strains: archive.strains.length, classes: archive.classes.length };
}

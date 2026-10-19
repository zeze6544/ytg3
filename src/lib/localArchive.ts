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
const byId = new Map(archive.drugs.map((drug) => [drug.id, drug]));
const RANK: Record<string, number> = { unknown: 0, low: 1, moderate: 2, dangerous: 3, deadly: 4 };
const SEDATIVE = new Set(["opioid", "depressant", "benzodiazepine", "anaesthetic", "dissociative", "antipsychotic"]);
const ACTION: Record<string, string> = {
  opioid: "slows breathing",
  benzodiazepine: "deepens sedation and weakens protective reflexes",
  depressant: "sedates and can stop breathing",
  stimulant: "raises heart rate, blood pressure, and temperature",
  psychedelic: "changes perception and can bring panic or a racing heart",
  dissociative: "detaches awareness and can lose airway protection",
  cannabinoid: "changes attention and adds sedation",
  antidepressant: "changes serotonin signalling and can stay active for days",
  antipsychotic: "sedates and can drop blood pressure",
  anaesthetic: "can remove consciousness and breathing",
  inhalant: "can trigger a sudden heart rhythm",
  plant_fungi: "carries a species-specific poison that is not standardised",
  research_chemical: "imitates another class at a strength this file cannot measure",
  prescription: "can change bleeding, sedation, heart rhythm, hormones, or the level of another drug",
  otc: "can injure the liver, sedate, or add bleeding",
  withdrawn: "was removed from markets because it injures an organ",
  historical: "contains an old poison whose strength the bottle does not state",
  other: "can change sedation, heart rhythm, bleeding, or the level of another drug",
};

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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstFact(drug: ArchiveDrug) {
  const raw = (drug.mechanism || drug.summary || "").replace(/\s+/g, " ").trim();
  const stripped = raw.replace(new RegExp(`^${escapeRegExp(drug.name)}[.:]\\s*`, "i"), "");
  const sentences = stripped.split(/(?<=\.)\s+/).map((part) => part.trim()).filter(Boolean);
  let fact = "";
  for (const sentence of sentences) {
    const next = fact ? `${fact} ${sentence.endsWith(".") ? sentence : `${sentence}.`}` : sentence.endsWith(".") ? sentence : `${sentence}.`;
    if (fact && next.length > 180) break;
    fact = next.length > 180 ? `${next.slice(0, 170).replace(/\s+\S*$/, "")}.` : next;
    if (fact.length > 120) break;
  }
  return fact || ACTION[drug.category] || "acts on the body as this file describes";
}

function actionOf(drug: ArchiveDrug) {
  return ACTION[drug.category] ?? "changes how the body handles the other substance";
}

function isReversal(drug: ArchiveDrug) {
  if (["opioid", "benzodiazepine", "depressant", "dissociative", "stimulant"].includes(drug.category)) return false;
  const text = `${drug.mechanism ?? ""} ${drug.summary ?? ""}`;
  if (/vitamin k antagonist|\bnmda\b/i.test(text)) return false;
  return /opioid antagonist|benzodiazepine antagonist|antagonist medicine|opioid blocker|reversal agent|reverses heparin|wear off before|wears off before|before the opioid/i.test(text);
}

function pairFloor(a: ArchiveDrug, b: ArchiveDrug) {
  const hot = (drug: ArchiveDrug) => drug.category === "inhalant" || drug.category === "withdrawn" || drug.category === "research_chemical";
  if (hot(a) || hot(b)) return "dangerous";
  const sed = (drug: ArchiveDrug) => SEDATIVE.has(drug.category);
  if (sed(a) && sed(b)) return "dangerous";
  if ((a.category === "stimulant" && sed(b)) || (b.category === "stimulant" && sed(a))) return "dangerous";
  if (a.category === "stimulant" && b.category === "stimulant") return "dangerous";
  return "moderate";
}

function together(a: ArchiveDrug, b: ArchiveDrug) {
  const sed = (drug: ArchiveDrug) => SEDATIVE.has(drug.category);
  if (sed(a) && sed(b)) return `${a.name} and ${b.name} both deepen sedation, so breathing and protective reflexes fail more easily.`;
  if ((a.category === "stimulant" && sed(b)) || (b.category === "stimulant" && sed(a))) {
    const stimulant = a.category === "stimulant" ? a : b;
    const other = stimulant === a ? b : a;
    return `${stimulant.name} can hide the sedation from ${other.name}, and breathing can fail after that masking wears thin.`;
  }
  if (a.category === "stimulant" && b.category === "stimulant") return `${a.name} and ${b.name} both push heart rate, blood pressure, and temperature higher.`;
  if (a.category === "inhalant" || b.category === "inhalant") {
    const inhalant = a.category === "inhalant" ? a : b;
    const other = inhalant === a ? b : a;
    return `${inhalant.name} can trigger a sudden heart rhythm while ${other.name} is still acting.`;
  }
  if (a.category === "psychedelic" && b.category === "psychedelic") return `${a.name} and ${b.name} both change perception, so confusion, panic, and a racing heart can arrive together.`;
  if (a.category === "plant_fungi" || b.category === "plant_fungi") {
    const plant = a.category === "plant_fungi" ? a : b;
    const other = plant === a ? b : a;
    return `${plant.name} adds a species-specific poison on top of what ${other.name} already does.`;
  }
  if (a.category === "cannabinoid" || b.category === "cannabinoid") {
    const cannabis = a.category === "cannabinoid" ? a : b;
    const other = cannabis === a ? b : a;
    return `${cannabis.name} changes attention and adds sedation while ${other.name} ${actionOf(other)}.`;
  }
  return `${a.name} ${actionOf(a)}, while ${b.name} ${actionOf(b)}, so both reactions happen in the same hour.`;
}

function pairNote(a: ArchiveDrug, b: ArchiveDrug, ruleNote?: string) {
  const body = ruleNote ? `${ruleNote} ${together(a, b)}` : together(a, b);
  return `${a.name} with ${b.name}. ${body} ${a.name}: ${firstFact(a)} ${b.name}: ${firstFact(b)} This file has no dose.`;
}

function reversalNote(a: ArchiveDrug, b: ArchiveDrug) {
  if (isReversal(a) && isReversal(b)) {
    return `${a.name} with ${b.name}. Both can block part of another drug, and each can wear off on its own clock. Together they do not cancel into a safe state. ${a.name}: ${firstFact(a)} ${b.name}: ${firstFact(b)} This file has no dose.`;
  }
  const blocker = isReversal(a) ? a : b;
  const other = blocker === a ? b : a;
  return `${blocker.name} with ${other.name}. ${blocker.name} can block or reverse only part of ${other.name}, and only while ${blocker.name} is still acting. It can wear off first, and then ${other.name} can return. ${blocker.name} does not make ${other.name} safe. ${blocker.name}: ${firstFact(blocker)} ${other.name}: ${firstFact(other)} This file has no dose.`;
}

export function localInteraction(aId: string, bId: string) {
  const a = byId.get(aId);
  const b = byId.get(bId);
  if (!a || !b || a.id === b.id) return null;
  let best: { severity: string; note: string } | null = null;
  for (const rule of archive.rules) {
    const hit = (sideMatches(a, rule.left) && sideMatches(b, rule.right)) || (sideMatches(b, rule.left) && sideMatches(a, rule.right));
    if (!hit) continue;
    if (!best || (RANK[rule.severity] ?? 0) > (RANK[best.severity] ?? 0)) {
      best = { severity: rule.severity, note: rule.note };
    }
  }
  if (best) return { severity: best.severity, note: pairNote(a, b, best.note) };
  if (isReversal(a) || isReversal(b)) return { severity: "moderate", note: reversalNote(a, b) };
  return { severity: pairFloor(a, b), note: pairNote(a, b) };
}

export function localRandom() {
  if (!archive.drugs.length) return null;
  return archive.drugs[Math.floor(Math.random() * archive.drugs.length)] ?? null;
}

export function localCounts() {
  return { drugs: archive.drugs.length, strains: archive.strains.length, classes: archive.classes.length };
}

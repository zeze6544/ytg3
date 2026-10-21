import raw from "@/data/archive.json";
import extraRaw from "@/data/drugs-extra.json";
import { cleanNames, cleanProse } from "@/lib/reading";
import { CATEGORY_LABELS, type Drug, type DrugClass, type Strain } from "@/lib/types";

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

const extra = extraRaw as { drugs?: ArchiveDrug[]; refs?: Archive["refs"]; strains?: Strain[] };
const archive = {
  ...(raw as Archive),
  drugs: [...(raw as Archive).drugs, ...(extra.drugs ?? [])],
  refs: [...(raw as Archive).refs, ...(extra.refs ?? [])],
  strains: [...(raw as Archive).strains, ...(extra.strains ?? [])],
};
export const ARCHIVE_ORIGIN = "https://narcodex-archive.web.app";
let indexStamp = String((raw as { generated_at?: string }).generated_at ?? "");

export function archiveUrl(path: string) {
  const host = typeof window !== "undefined" ? window.location?.host : "";
  if (host) return path;
  return `${ARCHIVE_ORIGIN}${path}`;
}
const byId = new Map(archive.drugs.map((drug) => [drug.id, drug]));
const bySlug = new Map(archive.drugs.map((drug) => [drug.slug, drug]));
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
    rows = rows.filter((drug) => searchBlob(drug).includes(term));
  }
  const sorted = [...rows].sort((a, b) => {
    if (term) {
      const delta = searchRank(a, term) - searchRank(b, term);
      if (delta) return delta;
    } else {
      const delta = browseRank(a.name) - browseRank(b.name);
      if (delta) return delta;
    }
    return a.name.localeCompare(b.name);
  });
  return opts?.limit ? sorted.slice(0, opts.limit) : sorted;
}

function browseRank(name: string) {
  const trimmed = name.trim();
  if (!/^[A-Za-z]/.test(trimmed)) return 2;
  return /[a-z]/.test(trimmed) ? 0 : 1;
}

function searchBlob(drug: ArchiveDrug) {
  return [drug.name, drug.slug, cleanProse(drug.summary), cleanProse(drug.chemistry), ...cleanNames(drug.aliases), ...cleanNames(drug.brand_names), ...cleanNames(drug.street_names)]
    .join("\n")
    .toLowerCase();
}

function searchRank(drug: ArchiveDrug, term: string) {
  const name = drug.name.toLowerCase();
  if (name === term) return 0;
  if (name.startsWith(term)) return 1;
  const aliases = cleanNames(drug.aliases).map((alias) => alias.toLowerCase());
  if (aliases.some((alias) => alias === term)) return 2;
  if (name.includes(term)) return 3;
  if (aliases.some((alias) => alias.includes(term))) return 4;
  const streets = cleanNames(drug.street_names).map((street) => street.toLowerCase());
  const brands = cleanNames(drug.brand_names).map((brand) => brand.toLowerCase());
  if (streets.some((street) => street === term || street.includes(term)) || brands.some((brand) => brand === term || brand.includes(term))) return 5;
  if (drug.slug.includes(term)) return 6;
  return 7;
}

export function localPopular(slugs: string[]) {
  const map = new Map(archive.drugs.map((drug) => [drug.slug, drug]));
  return slugs.map((slug) => map.get(slug)).filter(Boolean) as ArchiveDrug[];
}

export function localDrugBySlug(slug: string) {
  return archive.drugs.find((drug) => drug.slug === slug) ?? null;
}

export function localNeighbors(slug: string, count = 5) {
  const drug = localDrugBySlug(slug);
  if (!drug) return [];
  const same = archive.drugs.filter((item) => item.category === drug.category && item.slug !== drug.slug);
  same.sort((a, b) => a.name.localeCompare(b.name));
  const next = same.findIndex((item) => item.name.localeCompare(drug.name) > 0);
  const at = next === -1 ? Math.max(0, same.length - count) : Math.max(0, next - 2);
  return same.slice(at, at + count);
}

export function localRefs(drugId: string) {
  return archive.refs.filter((ref) => ref.drug_id === drugId);
}

export function localClasses() {
  return [...archive.classes].sort((a, b) => a.name.localeCompare(b.name));
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

export function localIndexStamp() {
  return indexStamp;
}

export function localCategoryCounts() {
  const counts: Record<string, number> = {};
  for (const drug of archive.drugs) {
    for (const tag of tagsOf(drug)) counts[tag] = (counts[tag] ?? 0) + 1;
  }
  return counts;
}

const GROUP_LABEL: Record<string, string> = {
  maoi: "any MAOI",
  ssri: "any SSRI",
  snri: "any SNRI",
  tca: "any tricyclic antidepressant",
  serotonin: "any serotonergic substance in this group",
  triptan: "any triptan",
  "disulfiram-like": "any disulfiram-like medicine",
  nitrite: "any alkyl nitrite",
  nitrate: "any nitrate",
  pde5: "any PDE5 inhibitor",
  nsaid: "any NSAID",
  qt: "any QT-prolonging drug in this group",
  diuretic: "any diuretic",
  penicillin: "any penicillin",
  "beta-agonist": "any beta agonist",
  acei: "any ACE inhibitor",
  fluoroquinolone: "any fluoroquinolone",
  "sedating-antihistamine": "any sedating antihistamine",
  arb: "any ARB",
  dihydropyridine: "any dihydropyridine calcium-channel blocker",
  azole: "any azole antifungal",
  sulfonamide: "any sulfonamide",
  "contraceptive-hormone": "any hormonal contraceptive",
  corticosteroid: "any corticosteroid",
  "combined-contraceptive": "any combined contraceptive",
  xanthine: "any xanthine",
  sulfonylurea: "any sulfonylurea",
  statin: "any statin",
  "cardiac-glycoside": "any cardiac glycoside",
  doac: "any direct oral anticoagulant",
  heparin: "any heparin",
  vka: "any vitamin K antagonist",
  "alpha-blocker": "any alpha blocker",
  "potassium-sparing": "any potassium-sparing diuretic",
  "potassium-supplement": "any potassium supplement",
  "pethidine-product": "any pethidine product",
  "xanthine-oxidase": "any xanthine-oxidase inhibitor",
  "bleed-herb": "any bleeding-associated plant in this group",
  "statin-like": "any statin-like lipid drug",
  "beta-blocker": "any beta blocker",
};

export type RuleHit = {
  severity: string;
  note: string;
  other: string;
  examples: { slug: string; name: string }[];
  more: number;
  category: string | null;
};

function tokenLabel(token: string) {
  if (token.startsWith("group:")) return GROUP_LABEL[token.slice(6)] ?? `the ${token.slice(6)} group`;
  if (CATEGORY_LABELS[token]) return `any ${CATEGORY_LABELS[token].toLowerCase()}`;
  return bySlug.get(token)?.name ?? token;
}

function examplesFor(token: string, selfSlug: string) {
  const slugs = token.startsWith("group:")
    ? (archive.groups[token.slice(6)] ?? []).filter((slug) => slug !== selfSlug)
    : bySlug.has(token) && token !== selfSlug
      ? [token]
      : [];
  const rows = slugs.map((slug) => bySlug.get(slug)).filter((drug): drug is ArchiveDrug => Boolean(drug));
  return { shown: rows.slice(0, 8).map((drug) => ({ slug: drug.slug, name: drug.name })), more: Math.max(0, rows.length - 8) };
}

export function localRuleHits(slug: string): RuleHit[] {
  const drug = bySlug.get(slug);
  if (!drug) return [];
  const hits: (RuleHit & { index: number })[] = [];
  archive.rules.forEach((rule, index) => {
    const onLeft = sideMatches(drug, rule.left);
    const onRight = sideMatches(drug, rule.right);
    if (!onLeft && !onRight) return;
    const otherTokens = onLeft ? rule.right : rule.left;
    const category = otherTokens.find((token) => Boolean(CATEGORY_LABELS[token])) ?? null;
    const packed = otherTokens.map((token) => examplesFor(token, drug.slug));
    const examples = packed.flatMap((item) => item.shown);
    const seen = new Set<string>();
    const unique = examples.filter((item) => (seen.has(item.slug) ? false : (seen.add(item.slug), true)));
    hits.push({
      severity: rule.severity,
      note: rule.note,
      other: otherTokens.map(tokenLabel).join(" or "),
      examples: unique.slice(0, 8),
      more: packed.reduce((sum, item) => sum + item.more, 0) + Math.max(0, unique.length - 8),
      category,
      index,
    });
  });
  hits.sort((a, b) => (RANK[b.severity] ?? 0) - (RANK[a.severity] ?? 0) || a.index - b.index);
  return hits.map(({ index: _index, ...hit }) => hit);
}

export function localGroupsOf(slug: string) {
  return Object.entries(archive.groups)
    .filter(([, members]) => members.includes(slug))
    .map(([key]) => key)
    .sort();
}

export function localTimelineFor(name: string) {
  const needle = name.trim();
  if (needle.length < 3) return [];
  const re = new RegExp(`\\b${escapeRegExp(needle)}\\b`, "i");
  return archive.timeline.filter((event) => re.test(`${event.title}\n${event.description ?? ""}`));
}

let loading: Promise<void> | null = null;

function adoptBase(main: Archive & { generated_at?: string }, extraPart: { drugs?: ArchiveDrug[]; refs?: Archive["refs"]; strains?: Strain[] }) {
  archive.drugs = [...(main.drugs ?? []), ...(extraPart.drugs ?? [])];
  archive.classes = main.classes ?? [];
  archive.strains = [...(main.strains ?? []), ...(extraPart.strains ?? [])];
  archive.timeline = main.timeline ?? [];
  archive.refs = [...(main.refs ?? []), ...(extraPart.refs ?? [])];
  archive.groups = main.groups ?? {};
  archive.rules = main.rules ?? [];
  byId.clear();
  bySlug.clear();
  for (const drug of archive.drugs) {
    byId.set(drug.id, drug);
    bySlug.set(drug.slug, drug);
  }
  if (main.generated_at) indexStamp = main.generated_at;
}

async function loadMax() {
  if (typeof fetch !== "function") return;
  if (archive.drugs.length < 1000) {
    const [mainResponse, extraResponse] = await Promise.all([
      fetch(archiveUrl("/data/archive.json")),
      fetch(archiveUrl("/data/drugs-extra.json")),
    ]);
    if (!mainResponse.ok || !extraResponse.ok) throw new Error("archive files missing");
    adoptBase(await mainResponse.json(), await extraResponse.json());
  }
  const response = await fetch(archiveUrl("/catalogue/manifest.json"));
  if (!response.ok) throw new Error("catalogue manifest " + response.status);
  const manifest = (await response.json()) as { drugs?: string[] };
  for (const name of manifest.drugs ?? []) {
    const partResponse = await fetch(archiveUrl(`/catalogue/${name}`));
    if (!partResponse.ok) throw new Error("catalogue shard " + name);
    const part = (await partResponse.json()) as { drugs?: ArchiveDrug[]; refs?: Archive["refs"] };
    for (const drug of part.drugs ?? []) {
      if (bySlug.has(drug.slug)) continue;
      archive.drugs.push(drug);
      byId.set(drug.id, drug);
      bySlug.set(drug.slug, drug);
    }
    for (const ref of part.refs ?? []) archive.refs.push(ref);
  }
}

export function whenArchiveReady(): Promise<void> {
  if (!loading) {
    loading = loadMax().catch(() => {
      // The bundled catalogue still opens if a shard is missing.
    });
  }
  return loading;
}

if (typeof window !== "undefined") void whenArchiveReady();

export function localUnnamedFloor(drug: { name: string; category: string }) {
  if (drug.category === "inhalant") {
    return `${drug.name} is an inhalant. A pair with no stored rule is still treated as dangerous, because a sudden heart rhythm can arrive while the other substance is acting.`;
  }
  if (drug.category === "withdrawn") {
    return `${drug.name} is filed as withdrawn or as a toxic contaminant. A pair with no stored rule is still treated as dangerous.`;
  }
  if (drug.category === "research_chemical") {
    return `${drug.name} is filed as a research chemical. The material is often a different substance from the name, and a pair with no stored rule is still treated as dangerous.`;
  }
  if (SEDATIVE.has(drug.category)) {
    return `${drug.name} sedates. A second sedative with no stored rule is still treated as dangerous, because breathing and protective reflexes fail more easily. A stimulant beside it is also treated as dangerous, because the stimulant can hide that sedation.`;
  }
  if (drug.category === "stimulant") {
    return `${drug.name} raises heart rate, blood pressure, and temperature. A second stimulant is treated as dangerous. A sedative beside it is also treated as dangerous, because the stimulant can mask the sedation until breathing fails.`;
  }
  return `${drug.name} has a moderate floor when no stored rule names the pair. Moderate describes the pair. It is not permission to combine them.`;
}

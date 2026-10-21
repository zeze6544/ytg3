const FILLER_NAME = /listed under this catalogued name/i;
const TEMPLATE_STRAIN = /cannabis chemotype name, not a standardised medicine/i;

export function cleanNames(list?: Array<string | null> | null) {
  return (list ?? []).map((item) => (item ?? "").trim()).filter((item) => item && !FILLER_NAME.test(item));
}

const BOILERPLATE = [
  /^.+?\s+is filed here as a harm-reduction record\.\s*/i,
  /^.+?\s+is part of the public scientific and medical record\.\s*/i,
  /Legal and medical status have changed over time and still differ by country\.\s*/gi,
  /A substance name on the public FDA list\.\s*/gi,
  /A medicine name on a public listing\.\s*/gi,
  /A listing is not an approval and not permission\.\s*/gi,
  /It can still change sedation, heart rhythm, bleeding, or the level of another drug\.\s*/gi,
  /It is in this index because it can change bleeding, sedation, heart rhythm, hormones, or the level of another drug\.\s*/gi,
  /This file is not a regimen and has no dose\.\s*/gi,
  /This is not a dose, a source, or a reason to use it\.\s*/gi,
  /Listed under this catalogued name(?: when no (?:separate brand|slang name) is on the file)?\.?\s*/gi,
];

export function cleanProse(value?: string | null) {
  if (!value) return "";
  let text = value;
  for (const pattern of BOILERPLATE) text = text.replace(pattern, "");
  return text.replace(/\s+/g, " ").trim();
}

export function isTemplateStrainSummary(value?: string | null) {
  return TEMPLATE_STRAIN.test(value ?? "");
}

export function nameList(list?: Array<string | null> | null) {
  const names = cleanNames(list);
  return names.length ? names.join(", ") : undefined;
}

export function fileText(value?: string | null) {
  return cleanProse(value) || undefined;
}

export function rangePercent(low?: number | null, high?: number | null) {
  if (low == null && high == null) return "not on file";
  const fmt = (value: number) => (Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100));
  if (low != null && high != null && low !== high) return `${fmt(low)}–${fmt(high)}%`;
  return `${fmt((low ?? high) as number)}%`;
}

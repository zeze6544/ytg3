export type EvidenceQuality = "established" | "limited" | "anecdotal" | "disputed" | "unknown";
export type DrugCategory =
  | "opioid" | "stimulant" | "depressant" | "benzodiazepine" | "psychedelic"
  | "dissociative" | "cannabinoid" | "antidepressant" | "antipsychotic"
  | "anaesthetic" | "inhalant" | "plant_fungi" | "research_chemical"
  | "prescription" | "otc" | "withdrawn" | "historical" | "other";
export type StrainType = "indica" | "sativa" | "hybrid" | "ruderalis";

export interface Drug {
  id: string; slug: string; name: string; category: DrugCategory;
  aliases: string[] | null; brand_names: string[] | null; street_names: string[] | null;
  summary: string | null; history: string | null; legal_status: string | null; medical_status: string | null;
  chemistry: string | null; mechanism: string | null;
  onset: string | null; duration: string | null; half_life: string | null;
  effects: string[] | null; adverse_effects: string[] | null;
  acute_risks: string | null; chronic_risks: string | null; overdose_signs: string | null;
  dependence: string | null; tolerance: string | null; withdrawal: string | null;
  medical_uses: string | null; contraindications: string | null;
  testing: string | null; harm_reduction: string | null;
  evidence_quality: EvidenceQuality; discovered_year: number | null; featured: boolean;
}

export interface DrugClass { id: string; slug: string; name: string; description: string | null; color: string | null; }
export interface Strain {
  id: string; slug: string; name: string; type: StrainType; lineage: string | null;
  thc_low: number | null; thc_high: number | null; cbd_low: number | null; cbd_high: number | null;
  terpenes: string[] | null; effects: string[] | null; adverse: string[] | null;
  confidence: EvidenceQuality; summary: string | null;
}

export const CATEGORY_LABELS: Record<string, string> = {
  opioid: "Opioid", stimulant: "Stimulant", depressant: "Depressant", benzodiazepine: "Benzodiazepine",
  psychedelic: "Psychedelic", dissociative: "Dissociative", cannabinoid: "Cannabinoid",
  antidepressant: "Antidepressant", antipsychotic: "Antipsychotic", anaesthetic: "Anaesthetic",
  inhalant: "Inhalant", plant_fungi: "Plant / Fungi", research_chemical: "Research Chemical",
  prescription: "Prescription", otc: "OTC", withdrawn: "Withdrawn", historical: "Historical", other: "Other",
};
export type Tone = "phosphor" | "cyan" | "amber" | "red" | "purple";
export const CATEGORY_COLOR: Record<string, Tone> = {
  opioid: "red", stimulant: "amber", depressant: "cyan", benzodiazepine: "cyan",
  psychedelic: "purple", dissociative: "purple", cannabinoid: "phosphor",
  antidepressant: "cyan", antipsychotic: "cyan", anaesthetic: "amber",
  inhalant: "red", plant_fungi: "phosphor", research_chemical: "red",
  prescription: "cyan", otc: "amber", withdrawn: "red", historical: "amber", other: "phosphor",
};

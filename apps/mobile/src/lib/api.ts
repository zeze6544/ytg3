import { requireClient } from "@/lib/supabase";
import type { Drug, DrugClass, Strain } from "@/lib/types";

const POPULAR_SLUGS = [
  "alcohol-ethanol",
  "nicotine",
  "caffeine",
  "thc",
  "cocaine",
  "heroin",
  "methamphetamine",
  "mdma",
];

const LIST_COLUMNS =
  "id,slug,name,category,summary,evidence_quality,aliases,brand_names,street_names";

export async function fetchDrugs(opts?: { search?: string; category?: string; limit?: number }) {
  const sb = requireClient();
  const term = opts?.search?.trim() ?? "";
  const cat = opts?.category && opts.category !== "all" ? opts.category : null;
  if (term) {
    const { data, error } = await sb.rpc("search_drugs", { _term: term, _category: cat });
    if (error) throw error;
    const rows = (data ?? []) as Partial<Drug>[];
    return opts?.limit ? rows.slice(0, opts.limit) : rows;
  }
  let q = sb.from("drugs").select(LIST_COLUMNS).order("name");
  if (cat) q = q.eq("category", cat);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Partial<Drug>[];
}

export async function fetchPopularDrugs(): Promise<Partial<Drug>[]> {
  const sb = requireClient();
  const { data, error } = await sb.from("drugs").select(LIST_COLUMNS).in("slug", POPULAR_SLUGS);
  if (error) throw error;
  const rows = (data ?? []) as Partial<Drug>[];
  const map = new Map(rows.map((d) => [d.slug, d]));
  return POPULAR_SLUGS.map((slug) => map.get(slug)).filter(Boolean) as Partial<Drug>[];
}

export async function fetchDrugBySlug(slug: string): Promise<Drug | null> {
  const sb = requireClient();
  const { data, error } = await sb.from("drugs").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as Drug) ?? null;
}

export async function fetchDrugRefs(drugId: string) {
  const sb = requireClient();
  const { data, error } = await sb.from("drug_references").select("*").eq("drug_id", drugId);
  if (error) throw error;
  return (data ?? []) as { id: string; label: string; url: string | null }[];
}

export async function fetchClasses(): Promise<DrugClass[]> {
  const sb = requireClient();
  const { data, error } = await sb.from("drug_classes").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as DrugClass[];
}

export async function fetchStrains(opts?: { search?: string; type?: string }): Promise<Strain[]> {
  const sb = requireClient();
  let q = sb.from("strains").select("*").order("name");
  if (opts?.type && opts.type !== "all") q = q.eq("type", opts.type);
  if (opts?.search) {
    const term = opts.search.trim();
    if (term) q = q.or(`name.ilike.%${term}%,lineage.ilike.%${term}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Strain[];
}

export async function fetchTimeline() {
  const sb = requireClient();
  const { data, error } = await sb.from("timeline_events").select("*").order("year");
  if (error) throw error;
  return (data ?? []) as {
    id: string;
    year: number;
    title: string;
    description: string;
    category: string | null;
  }[];
}

export async function fetchInteraction(aId: string, bId: string) {
  const sb = requireClient();
  const { data, error } = await sb
    .from("drug_interactions")
    .select("*")
    .or(`and(drug_a_id.eq.${aId},drug_b_id.eq.${bId}),and(drug_a_id.eq.${bId},drug_b_id.eq.${aId})`)
    .maybeSingle();
  if (error) throw error;
  return data as { severity: string; note: string | null } | null;
}

export async function fetchRandomDrug(): Promise<Drug | null> {
  const sb = requireClient();
  const { count } = await sb.from("drugs").select("*", { count: "exact", head: true });
  if (!count) return null;
  const offset = Math.floor(Math.random() * count);
  const { data, error } = await sb.from("drugs").select("*").range(offset, offset).maybeSingle();
  if (error) throw error;
  return (data as Drug) ?? null;
}

export async function fetchCounts() {
  const sb = requireClient();
  const [drugs, strains, classes] = await Promise.all([
    sb.from("drugs").select("*", { count: "exact", head: true }),
    sb.from("strains").select("*", { count: "exact", head: true }),
    sb.from("drug_classes").select("*", { count: "exact", head: true }),
  ]);
  return {
    drugs: drugs.count ?? 0,
    strains: strains.count ?? 0,
    classes: classes.count ?? 0,
  };
}

export function filterStrains(
  rows: Strain[],
  terps: string[],
  mode: "any" | "all",
): Strain[] {
  if (terps.length === 0) return rows;
  return rows.filter((strain) => {
    const have = (strain.terpenes ?? []).filter(Boolean).map((t) => t.toLowerCase());
    if (mode === "all") return terps.every((t) => have.includes(t));
    return terps.some((t) => have.includes(t));
  });
}

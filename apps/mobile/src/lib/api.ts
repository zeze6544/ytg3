import {
  localCategoryCounts,
  localClasses,
  localCounts,
  localDrugBySlug,
  localDrugs,
  localInteraction,
  localPopular,
  localRandom,
  localRefs,
  localStrains,
  localTimeline,
} from "@/lib/localArchive";
import { supabase } from "@/lib/supabase";
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

const LIST_COLUMNS = "id,slug,name,category,summary,evidence_quality,aliases,brand_names,street_names";

async function remoteFirst<T>(load: (sb: NonNullable<typeof supabase>) => Promise<T | null | undefined>, fallback: T, accept: (value: T) => boolean): Promise<T> {
  if (!supabase) return fallback;
  try {
    const value = await load(supabase);
    if (value != null && accept(value)) return value;
  } catch {
    // Bundled catalogue covers a missing or empty live database.
  }
  return fallback;
}

export async function fetchDrugs(opts?: { search?: string; category?: string; limit?: number }) {
  return remoteFirst(async (sb) => {
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
  }, localDrugs(opts), (rows) => rows.length > 0);
}

export async function fetchPopularDrugs(): Promise<Partial<Drug>[]> {
  return remoteFirst(async (sb) => {
    const { data, error } = await sb.from("drugs").select(LIST_COLUMNS).in("slug", POPULAR_SLUGS);
    if (error) throw error;
    const rows = (data ?? []) as Partial<Drug>[];
    const map = new Map(rows.map((drug) => [drug.slug, drug]));
    return POPULAR_SLUGS.map((slug) => map.get(slug)).filter(Boolean) as Partial<Drug>[];
  }, localPopular(POPULAR_SLUGS), (rows) => rows.length > 0);
}

export async function fetchDrugBySlug(slug: string): Promise<Drug | null> {
  return remoteFirst(async (sb) => {
    const { data, error } = await sb.from("drugs").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return (data as Drug) ?? null;
  }, localDrugBySlug(slug), (drug) => Boolean(drug));
}

export async function fetchDrugRefs(drugId: string) {
  return remoteFirst(async (sb) => {
    const { data, error } = await sb.from("drug_references").select("*").eq("drug_id", drugId);
    if (error) throw error;
    return (data ?? []) as { id: string; label: string; url: string | null }[];
  }, localRefs(drugId), (rows) => rows.length > 0);
}

export function fetchCategoryCounts() {
  return localCategoryCounts();
}

export async function fetchClasses(): Promise<DrugClass[]> {
  return remoteFirst(async (sb) => {
    const { data, error } = await sb.from("drug_classes").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as DrugClass[];
  }, localClasses(), (rows) => rows.length > 0);
}

export async function fetchStrains(opts?: { search?: string; type?: string }): Promise<Strain[]> {
  return remoteFirst(async (sb) => {
    let q = sb.from("strains").select("*").order("name");
    if (opts?.type && opts.type !== "all") q = q.eq("type", opts.type);
    if (opts?.search) {
      const term = opts.search.trim();
      if (term) q = q.or(`name.ilike.%${term}%,lineage.ilike.%${term}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Strain[];
  }, localStrains(opts), (rows) => rows.length > 0);
}

export async function fetchTimeline() {
  return remoteFirst(async (sb) => {
    const { data, error } = await sb.from("timeline_events").select("*").order("year");
    if (error) throw error;
    return (data ?? []) as { id: string; year: number; title: string; description: string; category: string | null }[];
  }, localTimeline(), (rows) => rows.length > 0);
}

export async function fetchInteraction(aId: string, bId: string) {
  return remoteFirst(async (sb) => {
    const { data, error } = await sb
      .from("drug_interactions")
      .select("*")
      .or(`and(drug_a_id.eq.${aId},drug_b_id.eq.${bId}),and(drug_a_id.eq.${bId},drug_b_id.eq.${aId})`)
      .maybeSingle();
    if (error) throw error;
    return data as { severity: string; note: string | null } | null;
  }, localInteraction(aId, bId), (row) => Boolean(row));
}

export async function fetchRandomDrug(): Promise<Drug | null> {
  return remoteFirst(async (sb) => {
    const { count, error } = await sb.from("drugs").select("*", { count: "exact", head: true });
    if (error) throw error;
    if (!count) return null;
    const offset = Math.floor(Math.random() * count);
    const { data, error: rowError } = await sb.from("drugs").select("*").range(offset, offset).maybeSingle();
    if (rowError) throw rowError;
    return (data as Drug) ?? null;
  }, localRandom(), (drug) => Boolean(drug));
}

export async function fetchCounts() {
  return remoteFirst(async (sb) => {
    const [drugs, strains, classes] = await Promise.all([
      sb.from("drugs").select("*", { count: "exact", head: true }),
      sb.from("strains").select("*", { count: "exact", head: true }),
      sb.from("drug_classes").select("*", { count: "exact", head: true }),
    ]);
    if (drugs.error || strains.error || classes.error) throw drugs.error || strains.error || classes.error;
    return { drugs: drugs.count ?? 0, strains: strains.count ?? 0, classes: classes.count ?? 0 };
  }, localCounts(), (counts) => counts.drugs > 0);
}

export function filterStrains(rows: Strain[], terps: string[], mode: "any" | "all"): Strain[] {
  if (terps.length === 0) return rows;
  return rows.filter((strain) => {
    const have = (strain.terpenes ?? []).filter(Boolean).map((terp) => terp.toLowerCase());
    if (mode === "all") return terps.every((terp) => have.includes(terp));
    return terps.some((terp) => have.includes(terp));
  });
}

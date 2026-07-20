import { supabase } from "@/integrations/supabase/client";
import type { Drug, DrugClass, Strain } from "./types";

const sb: any = supabase;

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

export async function fetchDrugs(opts?: { search?: string; category?: string; limit?: number }) {
  const term = opts?.search?.trim() ?? "";
  const cat = opts?.category && opts.category !== "all" ? opts.category : null;
  if (term) {
    // Server-side function matches name/slug/summary/chemistry + aliases/brand/street case-insensitively.
    const { data, error } = await sb.rpc("search_drugs", { _term: term, _category: cat });
    if (error) throw error;
    const rows = (data ?? []) as Partial<Drug>[];
    return opts?.limit ? rows.slice(0, opts.limit) : rows;
  }
  let q = sb.from("drugs").select("id,slug,name,category,summary,evidence_quality,aliases,brand_names,street_names").order("name");
  if (cat) q = q.eq("category", cat);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Partial<Drug>[];
}

export async function fetchPopularDrugs(): Promise<Partial<Drug>[]> {
  const { data, error } = await sb
    .from("drugs")
    .select("id,slug,name,category,summary,evidence_quality,aliases,brand_names,street_names")
    .in("slug", POPULAR_SLUGS);
  if (error) throw error;
  const rows = (data ?? []) as Partial<Drug>[];
  const map = new Map(rows.map((d) => [d.slug, d]));
  return POPULAR_SLUGS.map((slug) => map.get(slug)).filter(Boolean) as Partial<Drug>[];
}

export async function fetchDrugBySlug(slug: string): Promise<Drug | null> {
  const { data, error } = await sb.from("drugs").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as Drug) ?? null;
}

export async function fetchDrugRefs(drugId: string) {
  const { data } = await sb.from("drug_references").select("*").eq("drug_id", drugId);
  return (data ?? []) as { id: string; label: string; url: string | null }[];
}

export async function fetchClasses(): Promise<DrugClass[]> {
  const { data, error } = await sb.from("drug_classes").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as DrugClass[];
}

export async function fetchStrains(opts?: { search?: string; type?: string }): Promise<Strain[]> {
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
  const { data, error } = await sb.from("timeline_events").select("*").order("year");
  if (error) throw error;
  return (data ?? []) as { id: string; year: number; title: string; description: string; category: string | null }[];
}

export async function fetchInteraction(aId: string, bId: string) {
  const { data } = await sb
    .from("drug_interactions")
    .select("*")
    .or(`and(drug_a_id.eq.${aId},drug_b_id.eq.${bId}),and(drug_a_id.eq.${bId},drug_b_id.eq.${aId})`)
    .maybeSingle();
  return data as { severity: string; note: string | null } | null;
}

export async function fetchRandomDrug(): Promise<Drug | null> {
  const { count } = await sb.from("drugs").select("*", { count: "exact", head: true });
  if (!count) return null;
  const offset = Math.floor(Math.random() * count);
  const { data } = await sb.from("drugs").select("*").range(offset, offset).maybeSingle();
  return data as Drug | null;
}

export async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data } = await sb.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

import { supabase } from "@/integrations/supabase/client";
import type { Drug, DrugClass, Strain } from "./types";
import {
  localClasses,
  localCounts,
  localDrugBySlug,
  localDrugs,
  localInteraction,
  localPopular,
  localRandom,
  localRefs,
  localStrainBySlug,
  localStrains,
  localTimeline,
  whenArchiveReady,
} from "./localArchive";

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

function remoteReady() {
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key);
}

async function remoteFirst<T>(load: () => Promise<T | null | undefined>, fallback: T, accept: (value: T) => boolean): Promise<T> {
  if (!remoteReady()) return fallback;
  try {
    const value = await load();
    if (value != null && accept(value)) return value;
  } catch {
    // The bundled catalogue stays available when the live database is empty or unreachable.
  }
  return fallback;
}

export async function fetchDrugs(opts?: { search?: string; category?: string; limit?: number }) {
  await whenArchiveReady();
  const fallback = localDrugs(opts);
  if (fallback.length > 0) return fallback;
  return remoteFirst(async () => {
    const term = opts?.search?.trim() ?? "";
    const cat = opts?.category && opts.category !== "all" ? opts.category : null;
    if (term) {
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
  }, fallback, (rows) => rows.length > 0);
}

export async function fetchPopularDrugs(): Promise<Partial<Drug>[]> {
  await whenArchiveReady();
  const fallback = localPopular(POPULAR_SLUGS);
  if (fallback.length > 0) return fallback;
  return remoteFirst(async () => {
    const { data, error } = await sb
      .from("drugs")
      .select("id,slug,name,category,summary,evidence_quality,aliases,brand_names,street_names")
      .in("slug", POPULAR_SLUGS);
    if (error) throw error;
    const rows = (data ?? []) as Partial<Drug>[];
    const map = new Map(rows.map((d) => [d.slug, d]));
    return POPULAR_SLUGS.map((slug) => map.get(slug)).filter(Boolean) as Partial<Drug>[];
  }, fallback, (rows) => rows.length > 0);
}

export async function fetchDrugBySlug(slug: string): Promise<Drug | null> {
  await whenArchiveReady();
  const fallback = localDrugBySlug(slug);
  if (fallback) return fallback;
  return remoteFirst(async () => {
    const { data, error } = await sb.from("drugs").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return (data as Drug) ?? null;
  }, fallback, (drug) => Boolean(drug));
}

export async function fetchDrugRefs(drugId: string) {
  const fallback = localRefs(drugId);
  return remoteFirst(async () => {
    const { data, error } = await sb.from("drug_references").select("*").eq("drug_id", drugId);
    if (error) throw error;
    return (data ?? []) as { id: string; label: string; url: string | null }[];
  }, fallback, (rows) => rows.length > 0);
}

export async function fetchClasses(): Promise<DrugClass[]> {
  return remoteFirst(async () => {
    const { data, error } = await sb.from("drug_classes").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as DrugClass[];
  }, localClasses(), (rows) => rows.length > 0);
}

export async function fetchStrainBySlug(slug: string): Promise<Strain | null> {
  await whenArchiveReady();
  return localStrainBySlug(slug);
}

export async function fetchStrains(opts?: { search?: string; type?: string }): Promise<Strain[]> {
  await whenArchiveReady();
  const local = localStrains(opts);
  if (local.length > 0) return local;
  return remoteFirst(async () => {
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
  return remoteFirst(async () => {
    const { data, error } = await sb.from("timeline_events").select("*").order("year");
    if (error) throw error;
    return (data ?? []) as { id: string; year: number; title: string; description: string; category: string | null }[];
  }, localTimeline(), (rows) => rows.length > 0);
}

export async function fetchInteraction(aId: string, bId: string) {
  const fallback = localInteraction(aId, bId);
  return remoteFirst(async () => {
    const { data, error } = await sb
      .from("drug_interactions")
      .select("*")
      .or(`and(drug_a_id.eq.${aId},drug_b_id.eq.${bId}),and(drug_a_id.eq.${bId},drug_b_id.eq.${aId})`)
      .maybeSingle();
    if (error) throw error;
    return data as { severity: string; note: string | null } | null;
  }, fallback, (row) => Boolean(row));
}

export async function fetchRandomDrug(): Promise<Drug | null> {
  await whenArchiveReady();
  const local = localRandom();
  if (local) return local;
  return remoteFirst(async () => {
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
  await whenArchiveReady();
  const local = localCounts();
  if (local.drugs > 0 || local.strains > 0) return local;
  return remoteFirst(async () => {
    const [drugs, strains, classes] = await Promise.all([
      sb.from("drugs").select("*", { count: "exact", head: true }),
      sb.from("strains").select("*", { count: "exact", head: true }),
      sb.from("drug_classes").select("*", { count: "exact", head: true }),
    ]);
    if (drugs.error || strains.error || classes.error) throw drugs.error || strains.error || classes.error;
    return { drugs: drugs.count ?? 0, strains: strains.count ?? 0, classes: classes.count ?? 0 };
  }, localCounts(), (counts) => counts.drugs > 0);
}

export async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId || !remoteReady()) return false;
  const { data } = await sb.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

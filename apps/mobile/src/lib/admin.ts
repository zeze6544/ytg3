import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";

// Same rule as the web archive: a signed-in user is an admin only when
// public.user_roles holds an 'admin' row for them. Row-level security on the
// strain tables enforces it again on the server for every write.
export function useIsAdmin() {
  const { user, loading } = useSession();
  const role = useQuery({
    queryKey: ["is-admin", user?.id ?? null],
    enabled: Boolean(supabase && user),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase!.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });
  return {
    configured: Boolean(supabase),
    user,
    loading: loading || (Boolean(user) && role.isLoading),
    isAdmin: role.data === true,
    error: role.error,
  };
}

export type StrainJobKind = "regen_image" | "not_duplicate" | "recheck_links" | "research";

export async function requestStrainJob(kind: StrainJobKind, slug: string, payload: Record<string, unknown> = {}) {
  if (!supabase) throw new Error("Sign-in is not configured on this build.");
  const { error } = await supabase.from("strain_jobs").insert({ kind, slug, payload });
  if (error) throw error;
}

export async function fetchStrainJobs() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("strain_jobs").select("id, kind, slug, status, error, created_at, finished_at").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []) as { id: string; kind: string; slug: string; status: string; error: string | null; created_at: string; finished_at: string | null }[];
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
type User = { id: string; email?: string | null };
import { isAdmin } from "./db";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      if (u) isAdmin(u.id).then(setAdmin);
      else setAdmin(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      setLoading(false);
      if (u) isAdmin(u.id).then(setAdmin);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { user, loading, isAdmin: admin };
}

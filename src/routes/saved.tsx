import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { Frame } from "@/components/narcodex/Frame";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved · NARCØDEX" }] }),
  component: Saved,
});

function Saved() {
  const { user, loading } = useSession();
  const [items, setItems] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const sb: any = supabase;
      const [s, h] = await Promise.all([
        sb.from("saved_entries").select("id, drug:drugs(slug,name,category), strain:strains(slug,name,type)").order("created_at", { ascending: false }),
        sb.from("view_history").select("id, drug:drugs(slug,name,category), viewed_at").order("viewed_at", { ascending: false }).limit(30),
      ]);
      setItems(s.data ?? []);
      setHistory(h.data ?? []);
    })();
  }, [user?.id]);

  if (loading) return <div className="text-xs uppercase tracking-widest text-muted-foreground">Booting…</div>;
  if (!user) return (
    <Frame title="ACCESS RESTRICTED" accent="red">
      <p className="text-sm">Sign in to access your saved files and recently viewed archive entries.</p>
      <Link to="/auth" className="mt-3 inline-block px-3 py-2 border border-cyan/60 text-cyan uppercase text-[11px] tracking-widest rounded-sm hover:bg-cyan/10">Log in / Register</Link>
    </Frame>
  );

  const savedCount = items.length;
  const badges = [
    { label: "ARCHIVIST", earned: savedCount >= 1, desc: "Save 1 file" },
    { label: "COLLECTOR", earned: savedCount >= 10, desc: "Save 10 files" },
    { label: "CARTOGRAPHER", earned: savedCount >= 25, desc: "Save 25 files" },
    { label: "SAFETY READER", earned: history.length >= 5, desc: "View 5 records" },
    { label: "DEEP RESEARCHER", earned: history.length >= 25, desc: "View 25 records" },
  ];

  return (
    <div className="space-y-4">
      <Frame title="BADGES" code="ACHV" accent="amber">
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <div key={b.label} className={`border p-2 rounded-sm ${b.earned ? "border-amber/70 text-amber amber-glow" : "border-border/40 text-muted-foreground opacity-60"}`}>
              <div className="font-display text-sm">◆ {b.label}</div>
              <div className="text-[10px] uppercase tracking-widest">{b.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">&gt; badges reward archival study only · never use.</div>
      </Frame>

      <Frame title="SAVED FILES" code="SAV" status={`${items.length}`}>
        {items.length === 0 ? <div className="text-xs text-muted-foreground uppercase tracking-widest">No saved entries.</div> : (
          <ul className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => {
              const item = i.drug ?? i.strain;
              if (!item) return null;
              return (
                <li key={i.id} className="panel-outline p-3 rounded-sm">
                  {i.drug ? (
                    <Link to="/drugs/$slug" params={{ slug: item.slug }} className="font-display text-phosphor phosphor-glow">{item.name}</Link>
                  ) : (
                    <span className="font-display text-phosphor">{item.name}</span>
                  )}
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{i.drug ? item.category : item.type}</div>
                </li>
              );
            })}
          </ul>
        )}
      </Frame>

      <Frame title="RECENTLY VIEWED" code="HIS">
        {history.length === 0 ? <div className="text-xs text-muted-foreground uppercase tracking-widest">No history.</div> : (
          <ul className="space-y-1 text-sm">
            {history.map((h) => h.drug && (
              <li key={h.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Link to="/drugs/$slug" params={{ slug: h.drug.slug }} className="text-phosphor hover:phosphor-glow truncate">&gt; {h.drug.name}</Link>
                <span className="text-[10px] text-muted-foreground shrink-0">{new Date(h.viewed_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Frame>
    </div>
  );
}

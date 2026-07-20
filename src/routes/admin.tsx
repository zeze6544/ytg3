import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { Frame } from "@/components/narcodex/Frame";
import { toast } from "sonner";
import { fetchDrugs } from "@/lib/db";

export const Route = createFileRoute("/admin")({ component: Admin });

const FIELDS = ["name","summary","mechanism","onset","duration","half_life","legal_status","medical_status","medical_uses","contraindications","acute_risks","chronic_risks","overdose_signs","dependence","tolerance","withdrawal","testing","harm_reduction","history","chemistry"] as const;

function Admin() {
  const { user, isAdmin, loading } = useSession();
  const [drugs, setDrugs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => { fetchDrugs().then(setDrugs); }, []);

  async function save() {
    if (!selected) return;
    setBusy(true);
    const patch: any = {};
    FIELDS.forEach((k) => { patch[k] = selected[k]; });
    const { error } = await (supabase as any).from("drugs").update(patch).eq("id", selected.id);
    setBusy(false);
    toast(error ? `Error: ${error.message}` : "Saved");
  }

  if (loading) return <div className="text-xs uppercase text-muted-foreground">…</div>;
  if (!user) return <Frame title="ADMIN" accent="red"><p className="text-sm">Sign in first. <Link to="/auth" className="text-cyan">/auth</Link></p></Frame>;

  if (!isAdmin) return (
    <Frame title="ADMIN GATE" accent="red">
      <p className="text-sm">You are signed in but not an administrator.</p>
      <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">&gt; Archive is sealed · admin role is locked to the founding operator.</p>
    </Frame>
  );

  const filtered = drugs.filter((d) => d.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <Frame title="ARCHIVE FILES" code="LST" accent="cyan">
        <input value={filter} onChange={(e)=>setFilter(e.target.value)} placeholder="FILTER..."
          className="w-full mb-2 bg-panel-2/40 border border-border/60 px-2 py-1 rounded-sm text-sm text-phosphor outline-none uppercase" />
        <ul className="max-h-[70vh] overflow-auto text-sm space-y-0.5">
          {filtered.map((d) => (
            <li key={d.id}>
              <button onClick={async () => {
                const { data } = await (supabase as any).from("drugs").select("*").eq("id", d.id).single();
                setSelected(data);
              }} className={`w-full text-left px-2 py-1 rounded-sm hover:bg-phosphor/10 truncate ${selected?.id === d.id ? "bg-phosphor/10 text-phosphor" : ""}`}>
                &gt; {d.name}
              </button>
            </li>
          ))}
        </ul>
      </Frame>

      <Frame title={selected ? `EDIT / ${selected.name}` : "SELECT A FILE"} accent="phosphor">
        {!selected ? <div className="text-xs uppercase text-muted-foreground">Pick a file from the archive list.</div> : (
          <div className="space-y-2">
            {FIELDS.map((k)=>(
              <label key={k} className="block">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.replace(/_/g, " ")}</span>
                <textarea value={selected[k] ?? ""} onChange={(e) => setSelected({ ...selected, [k]: e.target.value })}
                  rows={k === "summary" || k === "history" || k === "harm_reduction" ? 3 : 1}
                  className="w-full bg-panel-2/40 border border-border/60 px-2 py-1 rounded-sm text-sm text-phosphor outline-none" />
              </label>
            ))}
            <button disabled={busy} onClick={save} className="px-3 py-2 border border-phosphor/60 text-phosphor uppercase text-[11px] tracking-widest rounded-sm hover:bg-phosphor/10 disabled:opacity-50">{busy ? "…" : "▶ Save"}</button>
          </div>
        )}
      </Frame>
    </div>
  );
}

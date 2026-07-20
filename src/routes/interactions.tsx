import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchDrugs, fetchInteraction } from "@/lib/db";
import { Frame, Tag } from "@/components/narcodex/Frame";
import { useState } from "react";
import type { Tone } from "@/lib/types";

export const Route = createFileRoute("/interactions")({
  head: () => ({ meta: [
    { title: "Interaction Checker · NARCØDEX" },
    { name: "description", content: "Two-substance interaction checker. Severity-graded warnings for common combinations. Harm-reduction reference only." },
    { property: "og:title", content: "NARCØDEX Interaction Matrix" },
    { property: "og:description", content: "Check risk between two substances. Not medical advice." },
  ] }),
  component: Interactions,
});

const SEV: Record<string, { tone: Tone; label: string }> = {
  low: { tone: "phosphor", label: "LOW" },
  moderate: { tone: "amber", label: "MODERATE" },
  dangerous: { tone: "red", label: "DANGEROUS" },
  deadly: { tone: "red", label: "DEADLY" },
  unknown: { tone: "cyan", label: "UNKNOWN" },
};

function Picker({ label, value, onChange, drugs }: { label: string; value: string; onChange: (v: string) => void; drugs: any[] }) {
  return (
    <div className="border border-phosphor/40 p-3 rounded-sm bg-panel-2/40">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-panel border border-border/60 px-2 py-2 rounded-sm text-sm text-phosphor outline-none">
        <option value="">· select substance ·</option>
        {drugs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
    </div>
  );
}

function Interactions() {
  const drugs = useQuery({ queryKey: ["all-drug-ids"], queryFn: () => fetchDrugs() });
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const inter = useQuery({
    queryKey: ["interaction", a, b],
    queryFn: () => fetchInteraction(a, b),
    enabled: !!a && !!b && a !== b,
  });
  const sev = inter.data ? SEV[inter.data.severity] ?? SEV.unknown : null;

  return (
    <div className="space-y-4">
      <Frame title="INTERACTION MATRIX" code="DEX-04" status="TWO-SUBSTANCE MODE" accent="red">
        <div className="text-xs text-foreground/80 leading-relaxed">
          &gt; Select two substances. NARCØDEX reports catalogued interaction risk from the archive.
          <br/>&gt; A missing record is not evidence of safety.
        </div>
      </Frame>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch">
        <Picker label="SUBSTANCE A" value={a} onChange={setA} drugs={drugs.data ?? []} />
        <button
          type="button"
          onClick={() => { const t = a; setA(b); setB(t); }}
          disabled={!a && !b}
          className="self-center px-3 py-2 border border-purple/60 text-purple purple-glow uppercase text-[11px] tracking-widest rounded-sm hover:bg-purple/10 disabled:opacity-40"
          aria-label="Swap substances"
        >⇄ Swap</button>
        <Picker label="SUBSTANCE B" value={b} onChange={setB} drugs={drugs.data ?? []} />
      </div>
      {(a || b) && (
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
          <button onClick={() => { setA(""); setB(""); }} className="px-2 py-1 border border-red/50 text-red rounded-sm hover:bg-red/10">Clear</button>
        </div>
      )}

      <Frame title="RESULT" code="OUT" accent={sev?.tone ?? "phosphor"}>
        {!a || !b ? (
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Awaiting input…</div>
        ) : a === b ? (
          <div className="text-xs uppercase tracking-widest text-red">Same substance selected.</div>
        ) : inter.isLoading ? (
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Querying matrix…</div>
        ) : inter.data ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-3xl text-phosphor phosphor-glow">CLASSIFIED</span>
              <Tag tone={sev!.tone}>{sev!.label}</Tag>
            </div>
            <p className="mt-3 text-sm text-foreground/85">{inter.data.note}</p>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-3xl text-cyan cyan-glow">NO RECORD</span>
              <Tag tone="cyan">UNKNOWN</Tag>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              This combination is not catalogued. Assume unknown risk. Consult reagent kits, professionals, and vetted harm-reduction resources.
            </p>
          </div>
        )}
      </Frame>
    </div>
  );
}

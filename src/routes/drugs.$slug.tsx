import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchDrugBySlug, fetchDrugRefs } from "@/lib/db";
import { CATEGORY_COLOR, CATEGORY_LABELS, type Tone } from "@/lib/types";
import { Frame, Field, Tag } from "@/components/narcodex/Frame";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/drugs/$slug")({ component: Detail });

const EV_TONE: Record<string, Tone> = { established: "phosphor", limited: "cyan", anecdotal: "amber", disputed: "purple", unknown: "red" };

function Detail() {
  const { slug } = Route.useParams();
  const q = useQuery({ queryKey: ["drug", slug], queryFn: () => fetchDrugBySlug(slug) });
  const drug = q.data;
  const refs = useQuery({ queryKey: ["refs", drug?.id], queryFn: () => fetchDrugRefs(drug!.id), enabled: !!drug });
  const { user } = useSession();

  useEffect(() => {
    if (drug && user) {
      (supabase as any).from("view_history").insert({ user_id: user.id, drug_id: drug.id }).then(() => {});
    }
  }, [drug?.id, user?.id]);

  if (q.isLoading) return <div className="text-xs uppercase text-muted-foreground">Loading file...</div>;
  if (!drug) throw notFound();

  async function save() {
    if (!user) { toast("Sign in to save entries"); return; }
    const { error } = await (supabase as any).from("saved_entries").insert({ user_id: user.id, drug_id: drug!.id });
    toast(error ? `Error: ${error.message}` : "Saved to archive");
  }

  const catTone = CATEGORY_COLOR[drug.category] ?? "phosphor";

  return (
    <div className="space-y-4">
      <Frame accent={catTone}
        title={drug.name} code={`FILE-${drug.slug.toUpperCase().slice(0, 10)}`}
        status={drug.evidence_quality.toUpperCase()}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] items-start">
          <div className="min-w-0">
            <div className="font-display text-4xl sm:text-5xl text-phosphor phosphor-glow break-words">{drug.name}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Tag tone={catTone}>{CATEGORY_LABELS[drug.category]}</Tag>
              <Tag tone={EV_TONE[drug.evidence_quality]}>EVIDENCE: {drug.evidence_quality}</Tag>
              {drug.discovered_year && <Tag tone="amber">EST. {drug.discovered_year}</Tag>}
            </div>
            {drug.summary && <p className="mt-4 text-sm text-foreground/85 leading-relaxed">{drug.summary}</p>}
          </div>
          <div className="flex flex-row lg:flex-col gap-2">
            <button onClick={save} className="px-3 py-2 border border-phosphor/60 text-phosphor uppercase text-[11px] tracking-widest rounded-sm hover:bg-phosphor/10">◇ Save</button>
            <Link to="/interactions" className="px-3 py-2 border border-red/60 text-red uppercase text-[11px] tracking-widest rounded-sm hover:bg-red/10 text-center">↯ Interactions</Link>
          </div>
        </div>
      </Frame>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Frame title="NAMES & CLASSIFICATION" code="NAM" accent="cyan">
          <Field label="Aliases" value={drug.aliases?.filter(Boolean).join(", ") || undefined} />
          <Field label="Brand names" value={drug.brand_names?.filter(Boolean).join(", ") || undefined} />
          <Field label="Street names" value={drug.street_names?.filter(Boolean).join(", ") || undefined} />
          <Field label="Category" value={CATEGORY_LABELS[drug.category]} />
          <Field label="Chemistry" value={drug.chemistry} />
        </Frame>

        <Frame title="STATUS" code="LEG" accent="amber">
          <Field label="Legal" value={drug.legal_status} />
          <Field label="Medical" value={drug.medical_status} />
          <Field label="Medical uses" value={drug.medical_uses} />
          <Field label="Contraindications" value={drug.contraindications} />
        </Frame>

        <Frame title="PHARMACOLOGY" code="MEC" accent="purple">
          <Field label="Mechanism" value={drug.mechanism} />
          <Field label="Onset" value={drug.onset} />
          <Field label="Duration" value={drug.duration} />
          <Field label="Half-life" value={drug.half_life} />
        </Frame>

        <Frame title="EFFECTS" code="EFF" accent="phosphor">
          <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Reported</div>
          <div className="flex flex-wrap gap-1 mb-4">
            {(drug.effects ?? []).filter(Boolean).map((e) => <Tag key={e} tone="phosphor">{e}</Tag>)}
            {(!drug.effects || drug.effects.filter(Boolean).length === 0) && <span className="text-xs text-muted-foreground">· unknown ·</span>}
          </div>
          <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Adverse</div>
          <div className="flex flex-wrap gap-1">
            {(drug.adverse_effects ?? []).filter(Boolean).map((e) => <Tag key={e} tone="red">{e}</Tag>)}
            {(!drug.adverse_effects || drug.adverse_effects.filter(Boolean).length === 0) && <span className="text-xs text-muted-foreground">· unknown ·</span>}
          </div>
        </Frame>

        <Frame title="RISK PROFILE" code="RSK" accent="red">
          <Field label="Acute risks" value={drug.acute_risks} />
          <Field label="Chronic risks" value={drug.chronic_risks} />
          <Field label="Overdose signs" value={drug.overdose_signs} />
        </Frame>

        <Frame title="DEPENDENCE" code="DEP" accent="amber">
          <Field label="Dependence" value={drug.dependence} />
          <Field label="Tolerance" value={drug.tolerance} />
          <Field label="Withdrawal" value={drug.withdrawal} />
        </Frame>

        <Frame title="HARM REDUCTION" code="HR" accent="cyan">
          <Field label="Testing" value={drug.testing} />
          <Field label="Safer use" value={drug.harm_reduction} />
          <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            &gt; NARCØDEX does not provide dosing, sourcing, synthesis, or test-evasion instructions.
          </div>
        </Frame>

        <Frame title="HISTORY" code="HIS" accent="purple">
          <Field label="Year" value={drug.discovered_year ?? undefined} />
          <div className="mt-2 text-sm text-foreground/85 leading-relaxed">{drug.history ?? <span className="text-muted-foreground">· unknown ·</span>}</div>
        </Frame>
      </div>

      <Frame title="REFERENCES" code="REF">
        {(refs.data?.length ?? 0) === 0 ? (
          <div className="text-xs text-muted-foreground uppercase tracking-widest">No references catalogued.</div>
        ) : (
          <ul className="space-y-1 text-sm">
            {refs.data!.map((r) => (
              <li key={r.id}>&gt; {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="text-cyan cyan-glow underline break-all">{r.label}</a> : r.label}</li>
            ))}
          </ul>
        )}
      </Frame>
    </div>
  );
}

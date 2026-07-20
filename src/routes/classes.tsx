import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchClasses, fetchDrugs } from "@/lib/db";
import { Frame, Tag } from "@/components/narcodex/Frame";
import { CATEGORY_COLOR, CATEGORY_LABELS } from "@/lib/types";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [
    { title: "Drug Classes · NARCØDEX" },
    { name: "description", content: "Browse substances grouped by pharmacological class: opioids, stimulants, depressants, psychedelics, dissociatives, cannabinoids and more." },
    { property: "og:title", content: "NARCØDEX Class Index" },
    { property: "og:description", content: "Pharmacological classes with entry counts and cross-links into the archive." },
  ] }),
  component: Classes,
});

function Classes() {
  const cls = useQuery({ queryKey: ["classes"], queryFn: fetchClasses });
  const drugs = useQuery({ queryKey: ["drugs-all"], queryFn: () => fetchDrugs() });
  const counts = new Map<string, number>();
  (drugs.data ?? []).forEach((d) => counts.set(d.category!, (counts.get(d.category!) ?? 0) + 1));

  return (
    <div className="space-y-4">
      <Frame title="DRUG CLASS INDEX" code="DEX-05" accent="cyan">
        <p className="text-xs text-foreground/80">&gt; Substances grouped by pharmacological class.</p>
      </Frame>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {(cls.data ?? []).map((c) => (
          <Link key={c.slug} to="/database" search={{ cat: c.slug }}
            className="panel-outline p-4 rounded-sm hover:border-phosphor/60 transition">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-center">
              <div className="font-display text-xl text-phosphor truncate">{c.name}</div>
              <Tag tone={CATEGORY_COLOR[c.slug] ?? "phosphor"}>{counts.get(c.slug) ?? 0}</Tag>
            </div>
            <p className="mt-2 text-[11px] text-foreground/80 line-clamp-3">{c.description}</p>
            <div className="mt-2 text-[9px] uppercase tracking-widest text-cyan">{CATEGORY_LABELS[c.slug] ?? c.slug} · view files →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

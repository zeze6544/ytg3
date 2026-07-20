import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchTimeline } from "@/lib/db";
import { Frame, Tag } from "@/components/narcodex/Frame";

export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [
    { title: "History Timeline · NARCØDEX" },
    { name: "description", content: "Milestones in pharmacology, drug policy and psychoactive discovery · from opium poppies to modern research chemicals." },
    { property: "og:title", content: "NARCØDEX Historical Timeline" },
    { property: "og:description", content: "Key dates across pharmacology, prohibition and psychedelic science." },
  ] }),
  component: Timeline,
});

function Timeline() {
  const q = useQuery({ queryKey: ["timeline"], queryFn: fetchTimeline });
  return (
    <div className="space-y-4">
      <Frame title="HISTORICAL TIMELINE" code="DEX-06" accent="amber">
        <p className="text-xs text-foreground/80">&gt; Milestones in pharmacology, drug policy and psychoactive discovery.</p>
      </Frame>
      <ol className="relative border-l-2 border-phosphor/40 pl-6 space-y-3">
        {(q.data ?? []).map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[31px] top-2 w-3 h-3 bg-phosphor phosphor-glow rounded-full" />
            <div className="panel-outline p-3 rounded-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-xl text-phosphor phosphor-glow">{e.year}</span>
                <span className="text-sm text-foreground/90">{e.title}</span>
                {e.category && <Tag tone="cyan">{e.category}</Tag>}
              </div>
              {e.description && <p className="mt-1 text-[11px] text-muted-foreground">{e.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

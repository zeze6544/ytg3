import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchDrugs } from "@/lib/db";
import { CATEGORY_COLOR, CATEGORY_LABELS, type DrugCategory } from "@/lib/types";
import { Frame, Tag } from "@/components/narcodex/Frame";
import { useEffect, useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
});

export const Route = createFileRoute("/database")({
  head: () => ({
    meta: [
      { title: "Database · NARCØDEX" },
      { name: "description", content: "Searchable database of 360+ drugs across every major pharmacological category. Filter by opioid, stimulant, psychedelic, benzodiazepine and more." },
      { property: "og:title", content: "NARCØDEX Database" },
      { property: "og:description", content: "360+ drug files. Search, filter by class, evidence-graded." },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: Database,
});

const CATS: (DrugCategory | "all")[] = ["all","opioid","stimulant","depressant","benzodiazepine","psychedelic","dissociative","cannabinoid","antidepressant","antipsychotic","anaesthetic","inhalant","plant_fungi","research_chemical","prescription","otc","withdrawn","historical"];

function Database() {
  const nav = useNavigate({ from: "/database" });
  const { q: qParam, cat: catParam } = Route.useSearch();
  const [search, setSearch] = useState(qParam ?? "");
  const [cat, setCat] = useState<string>(catParam ?? "all");

  // Sync url -> state (back/forward, external links)
  useEffect(() => { setCat(catParam ?? "all"); }, [catParam]);
  useEffect(() => { setSearch(qParam ?? ""); }, [qParam]);

  const q = useQuery({ queryKey: ["drugs", search, cat], queryFn: () => fetchDrugs({ search, category: cat }) });

  function updateCat(v: string) {
    setCat(v);
    nav({ search: (prev: { q?: string; cat?: string }) => ({ ...prev, cat: v === "all" ? undefined : v }), replace: true });
  }
  function updateSearch(v: string) {
    setSearch(v);
    nav({ search: (prev: { q?: string; cat?: string }) => ({ ...prev, q: v || undefined }), replace: true });
  }

  return (
    <div className="space-y-4">
      <Frame title="SUBSTANCE DATABASE" code="DEX-02" status={`${q.data?.length ?? 0} results`}>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex items-center gap-2 border border-phosphor/40 bg-panel-2/40 px-3 py-2 rounded-sm min-w-0">
            <span className="text-phosphor phosphor-glow shrink-0">&gt;</span>
            <input
              value={search} onChange={(e) => updateSearch(e.target.value)}
              placeholder="SEARCH_QUERY..." spellCheck={false}
              className="w-full min-w-0 bg-transparent outline-none text-sm text-phosphor placeholder:text-muted-foreground uppercase tracking-wider"
            />
          </div>
          <select value={cat} onChange={(e) => updateCat(e.target.value)}
            className="border border-cyan/40 bg-panel-2/40 px-3 py-2 rounded-sm text-xs uppercase tracking-widest text-cyan">
            {CATS.map((c) => <option key={c} value={c}>{c === "all" ? "ALL CATEGORIES" : CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        {cat !== "all" && (
          <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest">
            <span className="text-muted-foreground">Filter:</span>
            <Tag tone={CATEGORY_COLOR[cat] ?? "phosphor"}>{CATEGORY_LABELS[cat] ?? cat}</Tag>
            <button onClick={() => updateCat("all")} className="text-red hover:red-glow">[ clear ]</button>
          </div>
        )}
      </Frame>

      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {q.isLoading && <div className="text-xs text-muted-foreground uppercase tracking-widest">Loading records...</div>}
        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <div className="text-xs text-muted-foreground uppercase tracking-widest sm:col-span-2 lg:col-span-3">No records match. Try clearing filters.</div>
        )}
        {(q.data ?? []).map((d) => (
          <Link key={d.slug} to="/drugs/$slug" params={{ slug: d.slug! }}
            className="panel-outline p-3 rounded-sm hover:border-phosphor/60 transition group">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-start">
              <div className="min-w-0">
                <div className="font-display text-lg text-phosphor group-hover:phosphor-glow truncate">{d.name}</div>
                {(d.aliases && d.aliases.filter(Boolean).length > 0) && (
                  <div className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">a.k.a. {d.aliases.filter(Boolean).join(", ")}</div>
                )}
              </div>
              <Tag tone={CATEGORY_COLOR[d.category!] ?? "phosphor"}>{CATEGORY_LABELS[d.category!]}</Tag>
            </div>
            <p className="mt-2 text-[11px] text-foreground/85 line-clamp-2">{d.summary}</p>
            <div className="mt-2 text-[9px] uppercase tracking-widest text-muted-foreground">EVIDENCE: <span className="text-phosphor">{d.evidence_quality}</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}

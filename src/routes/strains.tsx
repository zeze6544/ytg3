import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchStrains } from "@/lib/db";
import { Frame } from "@/components/narcodex/Frame";
import { NugMark } from "@/components/narcodex/NugMark";
import { rangePercent } from "@/lib/copy";
import { useEffect, useMemo, useState } from "react";
import type { Strain, StrainType } from "@/lib/types";

export const Route = createFileRoute("/strains")({
  head: () => ({
    meta: [
      { title: "Cannabis Strains · NARCØDEX" },
      { name: "description", content: "A searchable library of cannabis strains with lineage, THC and CBD ranges, terpene profiles, reported effects and honest confidence tiers." },
      { property: "og:title", content: "NARCØDEX Cannabis Strains" },
      { property: "og:description", content: "Search cannabis strains by name, lineage or terpene. Real ranges, real effects, real caveats." },
    ],
  }),
  component: Strains,
});

const TYPES: (StrainType | "all")[] = ["all", "indica", "sativa", "hybrid", "ruderalis", "unspecified"];

// Widely reported cannabis terpenes with plain language notes.
const TERPENES: { key: string; aroma: string; note: string }[] = [
  { key: "myrcene",       aroma: "earthy, musky, mango",        note: "The most common cannabis terpene. Reported as sedating and body heavy at higher levels." },
  { key: "limonene",      aroma: "citrus peel, lemon",           note: "Bright and lifting. Common in cultivars people reach for during the day." },
  { key: "caryophyllene", aroma: "black pepper, clove, wood",    note: "The only terpene that also binds the CB2 receptor. Often reported as calming without a heavy head." },
  { key: "pinene",        aroma: "pine forest, rosemary",         note: "Sharp and green. Sometimes reported to keep the head clearer." },
  { key: "linalool",      aroma: "lavender, floral",              note: "Soft, floral, and calming in most reports. Common in indica leaning cultivars." },
  { key: "humulene",      aroma: "hops, earthy",                  note: "Woody and dry. Shows up alongside caryophyllene in many kush lines." },
  { key: "terpinolene",   aroma: "fresh herbs, apple, citrus",    note: "Uplifting, complex nose. Common in Haze and Jack lineages." },
  { key: "ocimene",       aroma: "sweet herbs, basil, mango",     note: "Bright and slightly tropical. Often paired with terpinolene in sativa forward strains." },
  { key: "bisabolol",     aroma: "chamomile, honey",              note: "Gentle, floral, and mild. Often present at low percentages." },
  { key: "valencene",     aroma: "orange, sweet citrus",          note: "The signature citrus note in cultivars like Tangie." },
  { key: "nerolidol",     aroma: "fresh wood, apple bark",        note: "Soft, woody and sometimes described as slightly sedating." },
  { key: "guaiol",        aroma: "pine, rose",                    note: "Rare, herbal, and cool. Often paired with pinene." },
  { key: "phellandrene",  aroma: "mint, pine, citrus",            note: "Uncommon and sharp. Reported in a handful of eucalyptus scented cultivars." },
  { key: "camphene",      aroma: "damp pine, mothball",           note: "Cold and earthy. Present in small amounts across many strains." },
  { key: "geraniol",      aroma: "rose, peach",                   note: "Sweet, floral, and gentle. Common at low levels." },
];

function Strains() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [terps, setTerps] = useState<string[]>([]);
  const [mode, setMode] = useState<"any" | "all">("any");
  const [medical, setMedical] = useState(false);
  const [shown, setShown] = useState(48);

  const q = useQuery({ queryKey: ["strains", search, type], queryFn: () => fetchStrains({ search, type }) });

  const data = q.data ?? [];

  const filtered = useMemo(() => {
    let rows = data;
    if (medical) rows = rows.filter((strain) => (strain.products ?? []).length > 0);
    if (terps.length === 0) return rows;
    return rows.filter((s) => {
      const have = (s.terpenes ?? []).filter(Boolean).map((t) => t.toLowerCase());
      if (mode === "all") return terps.every((t) => have.includes(t));
      return terps.some((t) => have.includes(t));
    });
  }, [data, terps, mode, medical]);
  const page = filtered.slice(0, shown);

  function toggle(t: string) {
    setTerps((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  useEffect(() => {
    setShown(48);
  }, [search, type, terps, mode, medical]);

  return (
    <div className="space-y-4">
      <Frame title="CANNABIS STRAIN LIBRARY" code="DEX-03" status={`${filtered.length} of ${data.length}`} accent="phosphor">
        <p className="text-sm leading-relaxed text-foreground/90">
          Search by name. A percent is shown only when a source published one. Medical files are
          dried flower from the Australian TGA list for 1 January–30 June 2026, or a Connecticut
          flower registration. That is not a national United States formulary, and a product name
          is not a pedigree. The picture on each file is a generated mark, not a photograph.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex items-center gap-2 border border-phosphor/40 bg-panel-2/40 px-3 py-2 rounded-sm min-w-0">
            <span className="text-phosphor shrink-0">&gt;</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="strain name or lineage"
              className="w-full min-w-0 bg-transparent outline-none text-sm text-phosphor uppercase tracking-wider" spellCheck={false}/>
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="border border-cyan/40 bg-panel-2/40 px-3 py-2 rounded-sm text-xs uppercase tracking-widest text-cyan">
            {TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        </div>
      </Frame>

      <Frame title="TERPENE FILTER" code="TRP" accent="cyan" status={terps.length ? `${terps.length} selected` : "off"}>
        <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] uppercase tracking-widest">
          <span className="text-muted-foreground">match</span>
          <button onClick={() => setMode("any")}
            className={`px-2 py-1 rounded-sm border ${mode === "any" ? "border-cyan/70 bg-cyan/10 text-cyan cyan-glow" : "border-border/60 text-muted-foreground hover:border-cyan/40"}`}>any of</button>
          <button onClick={() => setMode("all")}
            className={`px-2 py-1 rounded-sm border ${mode === "all" ? "border-cyan/70 bg-cyan/10 text-cyan cyan-glow" : "border-border/60 text-muted-foreground hover:border-cyan/40"}`}>all of</button>
          <button onClick={() => { setMedical((value) => !value); setShown(48); }}
            className={`px-2 py-1 rounded-sm border ${medical ? "border-amber/70 bg-amber/10 text-amber" : "border-border/60 text-muted-foreground"}`}>medical files</button>
          {terps.length > 0 && (
            <button onClick={() => setTerps([])}
              className="ml-auto px-2 py-1 rounded-sm border border-red/50 text-red hover:bg-red/10">clear</button>
          )}
        </div>
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {TERPENES.map((t) => {
            const on = terps.includes(t.key);
            return (
              <button key={t.key} onClick={() => toggle(t.key)}
                className={`text-left panel-outline p-2 rounded-sm ${on ? "border-cyan/70 bg-cyan/10" : "hover:border-cyan/40"}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-display text-sm ${on ? "text-cyan cyan-glow" : "text-phosphor"}`}>◈ {t.key}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{t.aroma}</span>
                </div>
                <div className="mt-1 text-[11px] text-foreground/80 leading-snug">{t.note}</div>
              </button>
            );
          })}
        </div>
      </Frame>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {page.map((s: Strain) => (
          <Link key={s.slug} to="/strains/$slug" params={{ slug: s.slug }} className="border border-[#39ff14] bg-black p-1 hover:bg-[#39ff14]/5">
            <NugMark slug={s.slug} name={s.name} type={s.type} compact />
            <div className="px-1 pt-1 font-display text-sm uppercase leading-tight text-[#39ff14]">{s.name}</div>
            <div className="px-1 pb-1 text-[10px] uppercase tracking-wide text-[#39ff14]/80">
              THC {rangePercent(s.thc_low, s.thc_high)} | {s.type}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-xs uppercase tracking-widest text-muted-foreground text-center py-8">
            no strains match those filters. try fewer terpenes or a different search.
          </div>
        )}
        {shown < filtered.length ? (
          <button
            type="button"
            onClick={() => setShown((count) => count + 48)}
            className="col-span-full px-3 py-3 border border-phosphor/50 text-phosphor uppercase text-[11px] tracking-widest rounded-sm hover:bg-phosphor/10"
          >
            Show {Math.min(48, filtered.length - shown)} more · {filtered.length - shown} remaining
          </button>
        ) : null}
      </div>
    </div>
  );
}

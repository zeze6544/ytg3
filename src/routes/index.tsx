import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Frame, Tag } from "@/components/narcodex/Frame";
import { fetchCounts, fetchPopularDrugs, fetchRandomDrug } from "@/lib/db";
import { fileText } from "@/lib/copy";
import { CATEGORY_COLOR, CATEGORY_LABELS } from "@/lib/types";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<{ drugs: number; strains: number; classes: number } | null>(null);
  const featured = useQuery({ queryKey: ["home-featured"], queryFn: fetchPopularDrugs });

  useEffect(() => {
    fetchCounts().then(setCounts).catch(() => setCounts(null));
  }, []);

  async function surprise() {
    const r = await fetchRandomDrug();
    if (r) navigate({ to: "/drugs/$slug", params: { slug: r.slug } });
  }

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      <Frame title="ARCHIVE // BOOT" code="MAIN" status="ONLINE" className="lg:col-span-2" accent="phosphor">
        <div className="font-display text-[clamp(2.5rem,9vw,5.5rem)] leading-none text-phosphor phosphor-glow">
          NARC<span className="text-cyan cyan-glow">Ø</span>DEX<span className="cursor ml-2" />
        </div>
        <div className="mt-2 text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">
          &gt; a public library for substances · <Link to="/read-only" className="text-amber amber-glow hover:underline">read only</Link>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/90">
          A public file of drugs, cannabis strains, and interactions. A number is shown only when
          a source published it. Nothing here is a dose, a sale, or a reason to use a substance.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/database" className="px-3 py-2 border border-phosphor/60 text-phosphor phosphor-glow rounded-sm text-xs uppercase tracking-widest hover:bg-phosphor/10">Browse the database</Link>
          <Link to="/interactions" className="px-3 py-2 border border-red/60 text-red red-glow rounded-sm text-xs uppercase tracking-widest hover:bg-red/10">Check interactions</Link>
          <Link to="/strains" className="px-3 py-2 border border-cyan/60 text-cyan cyan-glow rounded-sm text-xs uppercase tracking-widest hover:bg-cyan/10">Cannabis strains</Link>
          <button onClick={surprise} className="px-3 py-2 border border-purple/60 text-purple purple-glow rounded-sm text-xs uppercase tracking-widest hover:bg-purple/10">Surprise me ↯</button>
        </div>
      </Frame>

      <Frame title="INDEX // STATS" code="DEX-STAT" accent="cyan">
        <ul className="grid grid-cols-3 gap-2 text-center">
          {[
            { k: "DRUGS", v: counts?.drugs ?? "·", c: "text-phosphor phosphor-glow" },
            { k: "STRAINS", v: counts?.strains ?? "·", c: "text-cyan cyan-glow" },
            { k: "CLASSES", v: counts?.classes ?? "·", c: "text-amber amber-glow" },
          ].map((s) => (
            <li key={s.k} className="border border-border/60 p-2 rounded-sm bg-panel-2/40">
              <div className={`font-display text-2xl sm:text-3xl ${s.c}`}>{s.v}</div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">{s.k}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 text-[10px] text-muted-foreground uppercase tracking-widest">
          <div>&gt; evidence tiers on every entry</div>
          <div>&gt; interaction matrix loaded</div>
          <div>&gt; harm reduction filter: <span className="text-phosphor">ON</span></div>
        </div>
      </Frame>

      <Frame title="FEATURED FILES" code="F-01" accent="amber" className="lg:col-span-3">
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {(featured.data ?? []).map((d) => (
            <Link key={d.slug} to="/drugs/$slug" params={{ slug: d.slug! }} className="group panel-outline p-3 rounded-sm hover:border-phosphor/60 transition-colors">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-start">
                <span className="font-display text-lg text-phosphor group-hover:phosphor-glow truncate">{d.name}</span>
                <Tag tone={CATEGORY_COLOR[d.category!] ?? "phosphor"}>{CATEGORY_LABELS[d.category!]}</Tag>
              </div>
              {fileText(d.summary) ? <div className="mt-2 text-[11px] text-muted-foreground line-clamp-2">{fileText(d.summary)}</div> : null}
            </Link>
          ))}
        </div>
      </Frame>

      <Frame title="TRANSMISSION" code="MOTD" accent="red" className="lg:col-span-3">
        <div className="marquee">
          <div className="marquee-track text-red red-glow text-xs uppercase tracking-widest">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="pr-12">
                ⚠ never mix opioids with benzodiazepines or alcohol&nbsp;&nbsp;·&nbsp;&nbsp; ⚠ a reagent colour is not a clearance&nbsp;&nbsp;·&nbsp;&nbsp; ⚠ fentanyl and nitazenes still show up in other supplies&nbsp;&nbsp;·&nbsp;&nbsp; ⚠ this archive has no dose&nbsp;&nbsp;·&nbsp;&nbsp; ⚠ if you are not sure, do not take it&nbsp;&nbsp;·&nbsp;&nbsp; ⚠ NARCØDEX does not tell anyone to use drugs&nbsp;&nbsp;·&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>
      </Frame>
    </div>
  );
}

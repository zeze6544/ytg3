import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchStrainBySlug } from "@/lib/db";
import { Frame, Tag } from "@/components/narcodex/Frame";
import { NugMark } from "@/components/narcodex/NugMark";
import { cleanProse, isTemplateStrainSummary, rangePercent } from "@/lib/copy";
import type { Tone } from "@/lib/types";

export const Route = createFileRoute("/strains/$slug")({
  head: () => ({
    meta: [
      { title: "Strain file · NARCØDEX" },
      { name: "description", content: "A cannabis strain file: labelled cannabinoids, terpenes when a registry published them, and a generated terminal mark that is not a photograph." },
    ],
  }),
  component: StrainFile,
});

const TYPE_TONE: Record<string, Tone> = {
  indica: "purple",
  sativa: "amber",
  hybrid: "cyan",
  ruderalis: "phosphor",
  unspecified: "cyan",
};
const EV_TONE: Record<string, Tone> = {
  established: "phosphor",
  limited: "cyan",
  anecdotal: "amber",
  disputed: "purple",
  unknown: "red",
};

function StrainFile() {
  const { slug } = Route.useParams();
  const query = useQuery({ queryKey: ["strain", slug], queryFn: () => fetchStrainBySlug(slug) });
  if (query.isLoading) return <div className="text-xs uppercase tracking-widest text-muted-foreground">Opening file…</div>;
  const strain = query.data;
  if (!strain) throw notFound();
  const summary = cleanProse(strain.summary);
  const showSummary = summary && !isTemplateStrainSummary(strain.summary);
  const namedTerpenes = (strain.terpenes ?? []).filter(Boolean);
  const measured = strain.terpene_profile ?? [];
  const effects = (strain.effects ?? []).filter((item) => item && !/varies by person and batch/i.test(item));

  return (
    <div className="space-y-4">
      <Frame title={strain.name} code="STRAIN" accent={TYPE_TONE[strain.type] ?? "phosphor"} status={strain.type}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] items-start">
          <div className="border border-phosphor/40">
            <NugMark slug={strain.slug} name={strain.name} type={strain.type} />
          </div>
          <div className="min-w-0 space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl text-phosphor break-words">{strain.name}</h1>
            <div className="flex flex-wrap gap-1">
              <Tag tone={TYPE_TONE[strain.type] ?? "phosphor"}>{strain.type}</Tag>
              <Tag tone={EV_TONE[strain.confidence] ?? "cyan"}>{strain.confidence}</Tag>
            </div>
            <p className="text-sm text-red leading-relaxed">
              Not medical advice. Not a dose. The mark above is generated from the name. It is not a photograph of this flower.
            </p>
            {showSummary ? <p className="text-sm leading-relaxed text-foreground/90">{summary}</p> : null}
            <Link to="/strains" className="inline-block text-[11px] uppercase tracking-widest text-cyan">
              ← Strain index
            </Link>
          </div>
        </div>
      </Frame>

      <div className="grid gap-4 lg:grid-cols-2">
        <Frame title="CANNABINOIDS" code="CB" accent="phosphor">
          <Row label="THC" value={rangePercent(strain.thc_low, strain.thc_high)} />
          <Row label="CBD" value={rangePercent(strain.cbd_low, strain.cbd_high)} />
          {(strain.cannabinoids ?? []).map((item) => (
            <Row key={item.name} label={item.name} value={`${item.percent}%`} />
          ))}
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            A percent on this file is a published label or one registry filing. The next batch can differ.
          </p>
        </Frame>

        <Frame title="TERPENES" code="TRP" accent="cyan">
          {measured.length > 0
            ? measured.map((item) => <Row key={item.name} label={item.name} value={`${item.percent}%`} />)
            : namedTerpenes.length > 0
              ? namedTerpenes.map((name) => <Row key={name} label={name} value="percentage not on file" />)
              : <p className="text-sm text-muted-foreground">No terpene assay is stored on this file.</p>}
        </Frame>

        <Frame title="MEDICAL BRANDS" code="RX" accent="amber">
          {(strain.products ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No medical seller is stored for this name.</p>
          ) : (
            <div className="space-y-3">
              {strain.products?.map((product) => (
                <div key={`${product.region}-${product.brand}-${product.product}`} className="border-b border-border/40 pb-2">
                  <div className="text-sm text-phosphor">{product.brand}</div>
                  <div className="text-[12px] text-foreground/90">{product.region === "AU" ? "Australia" : product.region === "US" ? "Connecticut, United States" : product.region} · {product.form || "flower"} · {product.product}</div>
                  <div className="text-[11px] text-muted-foreground">
                    THC {product.thc_label || "not on the label"} · CBD {product.cbd_label || "not on the label"}
                  </div>
                  {product.source ? <div className="text-[11px] leading-relaxed text-muted-foreground">{product.source}</div> : null}
                  {product.source_url ? (
                    <a href={product.source_url} className="text-[11px] text-cyan" target="_blank" rel="noreferrer">
                      Source record
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Frame>

        <Frame title="FILE" code="META" accent="purple">
          <Row label="Lineage" value={strain.lineage || "not on file"} />
          {strain.assay_note ? <p className="mt-2 text-[12px] leading-relaxed text-foreground/85">{strain.assay_note}</p> : null}
          {effects.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {effects.map((effect) => <Tag key={effect}>{effect}</Tag>)}
            </div>
          ) : null}
          {(strain.adverse ?? []).filter(Boolean).length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {strain.adverse?.filter(Boolean).map((effect) => <Tag key={effect} tone="red">{effect}</Tag>)}
            </div>
          ) : null}
        </Frame>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-2 border-b border-border/40 py-1.5 text-sm">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-foreground/90 break-words">{value}</div>
    </div>
  );
}

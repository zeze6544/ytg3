import { colors, fonts, toneColor, type Tone } from "@/constants/theme";
import { NugMark } from "@/components/NugMark";
import { Banner, FinePrint, Screen, Status, Tag, breakWord } from "@/components/ui";
import { specimenCode } from "@/lib/nugRender";
import { KIND_NAMES, fetchStrainFile, loadStrainMeta, strainRowBySlug, type Measurement, type Named, type RangeField, type SourceRef, type StrainFile, type StrainMeta, type TerpMeasure } from "@/lib/strainIndex";
import { useQuery } from "@tanstack/react-query";
import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";

const KIND_LABEL: Record<Measurement["kind"], string> = {
  lab_aggregate: "State lab results",
  registry: "Registry filing",
  label: "Label claim",
  listing_claim: "Seller listing claim",
  legacy: "Legacy range · no recorded source",
};
const KIND_TONE: Record<Measurement["kind"], Tone> = { lab_aggregate: "amber", registry: "amber", label: "amber", listing_claim: "cyan", legacy: "red" };
const STATUS_TONE: Record<string, Tone> = { documented: "phosphor", partial: "amber", needs_research: "red" };
const ORIGIN_LABEL: Record<string, string> = {
  curated: "Legacy curated file",
  namelist: "Name in circulation (cnb_strns list)",
  listing: "Seed-bank listing record",
  registry: "Registry product record",
};
const CLASS_ADVERSE = [
  "Fast heart rate",
  "Impaired attention, memory, and coordination",
  "Anxiety or paranoia",
  "Psychotic symptoms at high doses in some people",
  "Cannabis use disorder with regular use",
];

const body = { fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 } as const;
const muted = { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 } as const;
const label = { fontFamily: fonts.body, color: colors.cyan, fontSize: 11, letterSpacing: 1 } as const;

function Section({ n, title, code, tone = "phosphor", children, startOpen = true }: { n: number; title: string; code: string; tone?: Tone; children: ReactNode; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <View style={{ borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: open ? 1 : 0, borderBottomColor: colors.line }}
      >
        <Text numberOfLines={1} style={{ flex: 1, fontFamily: fonts.display, color: toneColor[tone], fontSize: 22 }}>
          {open ? "▾" : "▸"} {String(n).padStart(2, "0")} {title}
        </Text>
        <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 10 }}>{code}</Text>
      </Pressable>
      {open ? <View style={{ padding: 12, gap: 10 }}>{children}</View> : null}
    </View>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <View style={{ gap: 2, paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Text style={label}>{k}</Text>
      {typeof children === "string" ? <Text style={[body, breakWord]}>{children}</Text> : children}
    </View>
  );
}

function Missing({ children = "not on file" }: { children?: string }) {
  return <Text style={[muted, breakWord, { fontStyle: "italic" }]}>{children}</Text>;
}

function NameLink({ item }: { item: Named | { name: string; slug: string | null } }) {
  if (!item.slug) return <Text style={[body, breakWord]}>{item.name} <Text style={muted}>(no archive file)</Text></Text>;
  return (
    <Link href={`/strain/${item.slug}`} asChild>
      <Pressable accessibilityRole="link">
        <Text style={[body, breakWord, { color: colors.phosphor, textDecorationLine: "underline" }]}>{item.name}</Text>
      </Pressable>
    </Link>
  );
}

function resolveSource(file: StrainFile, meta: StrainMeta | undefined, key: string): SourceRef & { label: string } {
  const hit = file.sources.find((s) => s.url === key) ?? file.sources.find((s) => s.id === key && !s.url);
  const m = meta?.sources[hit?.id ?? key];
  return { id: hit?.id ?? key, rank: hit?.rank ?? m?.rank ?? 8, label: hit?.label ?? m?.label ?? key, url: hit?.url ?? m?.url ?? null, date: hit?.date ?? null, link: hit?.link };
}

function Cite({ file, meta, k }: { file: StrainFile; meta?: StrainMeta; k: string }) {
  const s = resolveSource(file, meta, k);
  const text = `[R${s.rank}] ${s.label}${s.date ? ` · ${s.date}` : ""}${s.link && s.link !== "ok" && s.link !== "unchecked" ? ` · ${s.link}` : ""}`;
  if (!s.url) return <Text style={[muted, breakWord, { color: s.rank >= 8 ? colors.red : colors.amber }]}>{text}</Text>;
  return (
    <Text accessibilityRole="link" onPress={() => Linking.openURL(s.url!)} style={[muted, breakWord, { color: colors.amber, textDecorationLine: "underline" }]}>
      {text} ↗
    </Text>
  );
}

function pct(v: number | undefined | null) {
  if (v === undefined || v === null) return "—";
  return `${v < 1 ? v.toFixed(2) : v.toFixed(1)}%`;
}

function RangeBar({ low, high, p25, median, p75, scale }: { low: number; high: number; p25?: number; median?: number; p75?: number; scale: number }) {
  const x = (v: number) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%` as const;
  return (
    <View style={{ height: 14, backgroundColor: "#000", borderWidth: 1, borderColor: colors.line, position: "relative", overflow: "hidden" }}>
      <View style={{ position: "absolute", top: 6, height: 1, left: x(low), width: `${Math.max(0.5, ((high - low) / scale) * 100)}%`, backgroundColor: colors.muted }} />
      {p25 !== undefined && p75 !== undefined ? (
        <View style={{ position: "absolute", top: 2, height: 9, left: x(p25), width: `${Math.max(0.8, ((p75 - p25) / scale) * 100)}%`, backgroundColor: colors.phosphor, opacity: 0.45 }} />
      ) : null}
      {median !== undefined ? <View style={{ position: "absolute", top: 0, bottom: 0, width: 2, left: x(median), backgroundColor: colors.phosphor }} /> : null}
    </View>
  );
}

function MeasureBlock({ file, meta, m, scale }: { file: StrainFile; meta?: StrainMeta; m: Measurement | TerpMeasure; scale: number }) {
  const name = "analyte" in m ? m.analyte : m.name;
  const low = m.low ?? m.median ?? 0;
  const high = m.high ?? m.median ?? 0;
  const quantitative = m.kind === "lab_aggregate" && m.median !== undefined;
  return (
    <View style={{ gap: 4, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 6 }}>
        <Text style={[body, { color: colors.phosphor }]}>{name}</Text>
        <Text style={body}>
          {quantitative ? `median ${pct(m.median)} · IQR ${pct(m.p25)}–${pct(m.p75)} · range ${pct(low)}–${pct(high)}` : low === high ? pct(low) : `${pct(low)}–${pct(high)}`}
        </Text>
      </View>
      {quantitative ? <RangeBar low={low} high={high} p25={m.p25} median={m.median} p75={m.p75} scale={scale} /> : null}
      <Text style={[muted, breakWord]}>
        <Text style={{ color: toneColor[KIND_TONE[m.kind]] }}>{KIND_LABEL[m.kind]}</Text>
        {m.n ? ` · n=${m.n}` : ""} · {m.unit} · {m.context}
      </Text>
      {"implausible" in m && m.implausible ? <Text style={[muted, { color: colors.red }]}>Above 40%: implausible for dried flower. Shown exactly as filed.</Text> : null}
      <Cite file={file} meta={meta} k={m.source} />
    </View>
  );
}

function Range({ file, meta, field, unit }: { file: StrainFile; meta?: StrainMeta; field: RangeField; unit: string }) {
  if (!field) return <Missing />;
  return (
    <View style={{ gap: 2 }}>
      <Text style={body}>
        {field.low === field.high ? `${field.low} ${unit}` : `${field.low}–${field.high} ${unit}`}
        <Text style={muted}> · {field.listings} listing{field.listings === 1 ? "" : "s"}{field.differ ? " · sellers disagree" : ""}</Text>
      </Text>
      {field.sources.map((s) => <Cite key={s} file={file} meta={meta} k={s} />)}
    </View>
  );
}

function LineageNode({ item, tone = "cyan", self = false }: { item: Named; tone?: Tone; self?: boolean }) {
  const content = (
    <View style={{ borderWidth: 1, borderColor: self ? colors.phosphor : toneColor[tone], paddingHorizontal: 8, paddingVertical: 6, backgroundColor: self ? "#0b2412" : "#000", maxWidth: 220 }}>
      <Text numberOfLines={3} style={[breakWord, { fontFamily: fonts.body, fontSize: 12, color: self ? colors.phosphor : item.slug ? toneColor[tone] : colors.muted }]}>
        {item.name}
        {!self && !item.slug ? " ·" : ""}
      </Text>
    </View>
  );
  if (self || !item.slug) return content;
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`Open ${item.name}`} onPress={() => router.push(`/strain/${item.slug}`)} style={Platform.OS === "web" ? ({ cursor: "pointer" } as object) : undefined}>
      {content}
    </Pressable>
  );
}

function LineageTree({ file }: { file: StrainFile }) {
  const lin = file.lineage;
  const tier = (children: ReactNode, caption: string) => (
    <View style={{ gap: 4 }}>
      <Text style={label}>{caption}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{children}</View>
    </View>
  );
  return (
    <View style={{ gap: 8 }}>
      {lin && lin.grandparents.length
        ? tier(
            lin.grandparents.flatMap((g) => g.parents.map((p) => <LineageNode key={`${g.of}-${p.name}`} item={p} tone="purple" />)),
            "GRANDPARENTS (AS LISTED FOR EACH PARENT)",
          )
        : null}
      {lin ? tier(lin.parents.map((p) => <LineageNode key={p.name} item={p} />), "PARENTS") : null}
      {lin ? <Text style={[muted, { textAlign: "center" }]}>│ ×</Text> : null}
      <View style={{ flexDirection: "row" }}>
        <LineageNode item={{ name: file.name, slug: file.slug }} self />
      </View>
      {file.children.length ? (
        <>
          <Text style={[muted, { textAlign: "center" }]}>│</Text>
          {tier(file.children.map((c) => <LineageNode key={c.slug} item={c} tone="phosphor" />), `LISTED AS A PARENT OF (${file.children_total})`)}
        </>
      ) : null}
    </View>
  );
}

export default function StrainScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const key = String(slug ?? "");
  const file = useQuery({ queryKey: ["strain-file", key], queryFn: () => fetchStrainFile(key), enabled: Boolean(key), staleTime: Infinity });
  const row = useQuery({ queryKey: ["strain-row", key], queryFn: () => strainRowBySlug(key), enabled: Boolean(key), staleTime: Infinity });
  const metaQ = useQuery({ queryKey: ["strain-meta"], queryFn: loadStrainMeta, staleTime: Infinity });
  const meta = metaQ.data;
  const [allSources, setAllSources] = useState(false);

  if (file.isLoading) {
    return (
      <Screen>
        <Status>Opening file…</Status>
      </Screen>
    );
  }
  if (file.error) {
    return (
      <Screen>
        <Banner>{`This file could not be read: ${file.error instanceof Error ? file.error.message : "unknown error"}.`}</Banner>
      </Screen>
    );
  }
  const f = file.data;
  if (!f) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Not found" }} />
        <Status>No strain file has this address.</Status>
      </Screen>
    );
  }
  const product = f.kind === "product";
  const kindName = row.data ? KIND_NAMES[row.data.kind] : f.kind;
  const lab = f.cannabinoids.filter((m) => m.kind === "lab_aggregate");
  const filed = f.cannabinoids.filter((m) => m.kind === "registry" || m.kind === "label");
  const claims = f.cannabinoids.filter((m) => m.kind === "listing_claim");
  const legacy = f.cannabinoids.filter((m) => m.kind === "legacy");
  const terpMeasured = f.terpenes.measured;
  const terpScale = Math.max(0.5, ...terpMeasured.filter((t) => t.name !== "total terpenes").map((t) => t.p75 ?? t.median ?? 0)) * 1.4;
  const sources = allSources ? f.sources : f.sources.slice(0, 10);

  return (
    <Screen>
      <Stack.Screen options={{ title: f.name }} />
      <NugMark slug={f.slug} id={f.id} name={f.name} type={f.type} stored={f.image.status === "stored"} />
      <Text style={[breakWord, { fontFamily: fonts.display, color: colors.phosphor, fontSize: 34, lineHeight: 38 }]}>{f.name}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        <Tag tone="cyan">{f.type}</Tag>
        <Tag tone={product ? "amber" : "phosphor"}>{kindName}</Tag>
        <Tag tone={STATUS_TONE[f.status]}>{`${f.completeness}% ${f.status.replace("_", " ")}`}</Tag>
        {f.lineage?.conflict ? <Tag tone="red">lineage disputed</Tag> : null}
        {f.duplicates.length ? <Tag tone="red">suspected duplicate</Tag> : null}
      </View>
      <Banner>Not medical advice. Not a dose. Figures describe what a source printed or a lab measured on a sample; the next batch can differ.</Banner>

      <Section n={1} title="IDENTITY" code="ID">
        <Row k="NAME">{f.name}</Row>
        <Row k="ALIASES">
          {f.aliases.length ? f.aliases.map((a) => (
            <View key={a.name}>
              <Text style={body}>{a.name}</Text>
              <Cite file={f} meta={meta} k={a.source} />
            </View>
          )) : <Missing>no alias on file</Missing>}
        </Row>
        <Row k="CLASSIFICATION">
          <Text style={body}>{f.type === "unspecified" ? "unspecified" : `${f.type} (as filed)`}</Text>
          {f.genetics.length ? <Text style={muted}>Seller wording: {f.genetics.join("; ")}</Text> : null}
        </Row>
        <Row k={product ? "PRODUCER / SPONSOR" : "BREEDER"}>
          {product ? f.producer ? <Text style={body}>{f.producer}</Text> : <Missing /> : f.breeders.length ? (
            <Text style={[body, breakWord]}>{f.breeders.map((b) => `${b.name}${b.listings > 1 ? ` (${b.listings} listings)` : ""}`).join(" · ")}</Text>
          ) : <Missing>no breeder on file</Missing>}
          {f.breeders.length > 1 ? <Text style={muted}>Several breeders release a seed line under this name. They are not assumed to be the same genetics.</Text> : null}
        </Row>
        <Row k="RECORD ORIGIN">{ORIGIN_LABEL[f.origin] ?? f.origin}</Row>
        <Row k="NAME FAMILY">
          {f.family?.canonical ? (
            <Text style={body}>Variant of <NameLink item={f.family.canonical} /></Text>
          ) : f.family && f.family.variant_total ? (
            <Text style={body}>Canonical file for “{f.family.key}”</Text>
          ) : (
            <Missing>no related name on file</Missing>
          )}
          {f.family && f.family.variants.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {f.family.variants.slice(0, 12).map((v) => <NameLink key={v.slug} item={v} />)}
              {f.family.variant_total > 12 ? <Text style={muted}>+{f.family.variant_total - 12} more</Text> : null}
            </View>
          ) : null}
          <Text style={muted}>Variants share a cleaned name. They are linked, never merged.</Text>
        </Row>
        {f.duplicates.length ? (
          <Row k="SUSPECTED DUPLICATES">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{f.duplicates.map((d) => <NameLink key={d.slug} item={d} />)}</View>
            <Text style={muted}>Same cleaned name, same autoflower flag, same or no breeder. Queued for review; not merged.</Text>
          </Row>
        ) : null}
        <Row k="SPECIMEN ID">{`${specimenCode(f.id)} · archive id ${f.id}`}</Row>
        <Row k="LAST DATED EVIDENCE">{f.updated ?? "no dated source"}</Row>
        <Row k="COMPLETENESS">{`${f.completeness} / 100 · ${f.status.replace("_", " ")}`}</Row>
      </Section>

      {product ? null : (
        <Section n={2} title="GENETICS & LINEAGE" code="GEN" tone="purple">
          {f.lineage ? (
            <>
              <LineageTree file={f} />
              <Text style={[muted, breakWord]}>
                Status: {f.lineage.status === "seller-listed" ? "listed by sellers, not verified by a breeder statement or genetic test" : f.lineage.status === "legacy" ? "legacy entry with no recorded source" : "set by admin review"}.
              </Text>
              {f.lineage.conflict ? <Banner tone="amber">Sources disagree on the parents. Every claim is listed below.</Banner> : null}
              {f.lineage.claims.map((c, i) => (
                <View key={i} style={{ gap: 2, paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.line }}>
                  <Text style={[body, breakWord]}>
                    {c.parents.map((p) => p.name).join(" × ")}
                    <Text style={muted}> · {c.count} source{c.count === 1 ? "" : "s"}{c.own ? "" : " · from a variant listing"}</Text>
                  </Text>
                  {c.sources.map((s) => <Cite key={s} file={f} meta={meta} k={s} />)}
                </View>
              ))}
            </>
          ) : (
            <>
              <Missing>No parents on file. Pedigree is not guessed from the name.</Missing>
              {f.children.length ? <LineageTree file={f} /> : null}
            </>
          )}
        </Section>
      )}

      <Section n={3} title="CANNABINOIDS" code="CB" tone="amber">
        {f.cannabinoids.length === 0 ? <Missing>No cannabinoid figure with a source is on file.</Missing> : null}
        {lab.length ? (
          <View style={{ gap: 4 }}>
            <Text style={label}>LAB RESULTS FOR FLOWER SOLD UNDER THIS NAME</Text>
            <Text style={muted}>Aggregated tested lots from state traceability data. They describe product on shelves, not the cultivar. Bars: line = range, block = middle half, tick = median, scale 0–35%.</Text>
            {lab.map((m, i) => <MeasureBlock key={`lab-${i}`} file={f} meta={meta} m={m} scale={35} />)}
          </View>
        ) : null}
        {filed.length ? (
          <View style={{ gap: 4 }}>
            <Text style={label}>{f.slug.startsWith("au-") ? "TGA LABEL STRENGTH" : "AS FILED ON THE REGISTRATION"}</Text>
            {filed.map((m, i) => <MeasureBlock key={`f-${i}`} file={f} meta={meta} m={m} scale={35} />)}
          </View>
        ) : null}
        {claims.length ? (
          <View style={{ gap: 4 }}>
            <Text style={label}>SELLER LISTING CLAIMS</Text>
            <Text style={muted}>Printed on seed-bank pages. Not an assay.</Text>
            {claims.map((m, i) => <MeasureBlock key={`c-${i}`} file={f} meta={meta} m={m} scale={35} />)}
          </View>
        ) : null}
        {legacy.length ? (
          <View style={{ gap: 4 }}>
            <Text style={[label, { color: colors.red }]}>LEGACY RANGE</Text>
            {legacy.map((m, i) => <MeasureBlock key={`l-${i}`} file={f} meta={meta} m={m} scale={35} />)}
          </View>
        ) : null}
        <Text style={muted}>Not on file unless listed: {["THC", "THCA", "CBD", "CBDA", "CBG", "CBGA", "CBC", "CBN"].filter((a) => !f.cannabinoids.some((m) => m.analyte.toUpperCase().includes(a.replace("Δ9-", "")))).join(", ") || "none"}.</Text>
      </Section>

      <Section n={4} title="TERPENES" code="TRP" tone="cyan">
        {terpMeasured.length ? (
          <View style={{ gap: 4 }}>
            <Text style={label}>MEASURED</Text>
            {terpMeasured.map((m, i) => <MeasureBlock key={`t-${i}`} file={f} meta={meta} m={m} scale={m.name === "total terpenes" ? 5 : terpScale} />)}
          </View>
        ) : (
          <Missing>No measured terpene percentage is on file.</Missing>
        )}
        {f.terpenes.mentioned.length ? (
          <View style={{ gap: 6 }}>
            <Text style={label}>MENTIONED WITHOUT A PERCENTAGE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {f.terpenes.mentioned.map((t) => <Tag key={t.name} tone={t.kind === "legacy" ? "red" : "cyan"}>{`${t.name}${t.kind === "legacy" ? " · legacy" : " · seller"}`}</Tag>)}
            </View>
            <Text style={muted}>A mention is descriptive. It is not a measurement and is not charted.</Text>
          </View>
        ) : null}
      </Section>

      {product ? null : (
        <Section n={5} title="BOTANICAL CHARACTERISTICS" code="BOT">
          <Text style={muted}>Seller-stated growing figures. Not measured by this archive.</Text>
          <Row k="FLOWERING TIME"><Range file={f} meta={meta} field={f.botany?.flowering_days ?? null} unit="days" /></Row>
          <Row k="INDICA SHARE (SELLER)"><Range file={f} meta={meta} field={f.botany?.indica_pct ?? null} unit="%" /></Row>
          <Row k="HEIGHT INDOORS"><Range file={f} meta={meta} field={f.botany?.height_indoor_cm ?? null} unit="cm" /></Row>
          <Row k="HEIGHT OUTDOORS"><Range file={f} meta={meta} field={f.botany?.height_outdoor_cm ?? null} unit="cm" /></Row>
          <Row k="HARVEST">{f.botany?.harvest.length ? f.botany.harvest.join(" · ") : <Missing />}</Row>
          <Row k="FLOWERING HABIT">{f.botany?.auto === true ? "autoflowering (seller)" : f.botany?.auto === false ? "photoperiod (seller)" : <Missing />}</Row>
          <Row k="SEED TYPE">{f.botany?.feminized === true ? "feminized seed offered" : f.botany?.feminized === false ? "regular seed" : <Missing />}</Row>
        </Section>
      )}

      <Section n={6} title="AROMA & FLAVOUR" code="ARO" tone="cyan">
        {f.aroma.length ? (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{f.aroma.map((a) => <Tag key={a.name} tone="cyan">{`${a.name}${a.listings > 1 ? ` ×${a.listings}` : ""}`}</Tag>)}</View>
            <Text style={muted}>Words printed by sellers. Never inferred from the name.</Text>
            {[...new Set(f.aroma.flatMap((a) => a.sources))].slice(0, 3).map((s) => <Cite key={s} file={f} meta={meta} k={s} />)}
          </>
        ) : (
          <Missing>No sourced aroma description is on file.</Missing>
        )}
      </Section>

      <Section n={7} title="EFFECTS & ADVERSE EFFECTS" code="FX" tone="red">
        <Text style={label}>REPORTED EFFECTS · ANECDOTAL</Text>
        {f.effects.length ? (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{f.effects.map((e) => <Tag key={e.name}>{e.name}</Tag>)}</View>
            <Text style={muted}>Seller marketing words. Not clinical findings, and not a promise about any batch.</Text>
            {[...new Set(f.effects.flatMap((e) => e.sources))].slice(0, 3).map((s) => <Cite key={s} file={f} meta={meta} k={s} />)}
          </>
        ) : (
          <Missing>No sourced effect report is on file.</Missing>
        )}
        <Text style={[label, { color: colors.red }]}>ADVERSE EFFECTS · CLASS-LEVEL</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{CLASS_ADVERSE.map((a) => <Tag key={a} tone="red">{a}</Tag>)}</View>
        <Text style={muted}>These apply to cannabis in general. No source on file ties a specific risk to this name.</Text>
        <Cite file={f} meta={meta} k="nida" />
      </Section>

      <Section n={8} title={product ? "PRODUCER & FILING" : "BREEDER & CULTIVATION"} code="SRC" startOpen={!product}>
        {f.sellers.length ? (
          f.sellers.map((s, i) => (
            <View key={`${s.url}-${i}`} style={{ gap: 2, paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.line }}>
              <Text style={[body, breakWord]}>
                {s.breeder ?? "breeder not stated"} <Text style={muted}>via {s.seller ?? "unknown seller"}{s.scraped ? ` · scraped ${s.scraped}` : ""}</Text>
              </Text>
              {s.url ? (
                <Text accessibilityRole="link" onPress={() => Linking.openURL(s.url!)} style={[muted, breakWord, { color: s.link.startsWith("broken") ? colors.red : colors.cyan, textDecorationLine: "underline" }]}>
                  {s.url} {s.link === "ok" ? "· link checked" : s.link.startsWith("broken") ? `· ${s.link}` : "· link not yet checked"}
                </Text>
              ) : null}
            </View>
          ))
        ) : (
          <Missing>{product ? "Producer details are in the filing below." : "No breeder or seller listing is on file."}</Missing>
        )}
        {f.seller_total > f.sellers.length ? <Text style={muted}>+{f.seller_total - f.sellers.length} more listings</Text> : null}
        {f.descriptions.map((d, i) => (
          <View key={i} style={{ gap: 2, borderLeftWidth: 2, borderLeftColor: colors.line, paddingLeft: 8 }}>
            <Text style={[body, breakWord, { color: colors.muted }]}>“{d.text}”</Text>
            <Text style={muted}>Seller copy, quoted unverified.</Text>
          </View>
        ))}
        {!product ? <Text style={muted}>No grow-yield or cultivation advice is given here.</Text> : null}
      </Section>

      <Section n={9} title="AUSTRALIAN MEDICAL REFERENCES" code="AU-RX" tone="amber">
        <Text style={[body, breakWord]}>
          {f.medical.au === "tga_product"
            ? "This is a product line on the TGA medicinal cannabis product list. It is sponsor-declared and names no cultivar."
            : "The TGA medicinal cannabis product list names sponsors, label strengths, and pack sizes. It does not name cultivars, so this file is not linked to any Australian product. A cultivar name is not a registered medicine."}
        </Text>
        <Cite file={f} meta={meta} k="tga" />
        {f.medical.products.map((p) => (
          <View key={`${p.brand}-${p.product}`} style={{ gap: 2, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line }}>
            <Text style={[body, { color: colors.amber }]}>{p.brand}</Text>
            <Text style={[body, breakWord]}>{p.region === "AU" ? "Australia" : "Connecticut, United States"} · {p.form || "flower"} · {p.product}</Text>
            <Text style={muted}>THC {p.thc_label || "not on the label"} · CBD {p.cbd_label || "not on the label"}</Text>
            <Text style={[muted, breakWord]}>{p.source}</Text>
          </View>
        ))}
        {f.medical.registry_products.length ? (
          <View style={{ gap: 4 }}>
            <Text style={label}>CONNECTICUT REGISTRY PRODUCTS USING THIS NAME ({f.medical.registry_total})</Text>
            <Text style={muted}>Each is one registered product. Its figures belong to that product, not to this cultivar.</Text>
            {f.medical.registry_products.map((p) => (
              <Text key={p.slug} style={[body, breakWord]}>
                <NameLink item={p} /> <Text style={muted}>{p.brand ?? ""}{p.thc != null ? ` · THC as filed ${p.thc}%` : ""}</Text>
              </Text>
            ))}
          </View>
        ) : null}
      </Section>

      <Section n={10} title="SOURCES & EVIDENCE" code="EVD" tone="amber">
        <Text style={muted}>Ranked 1 (regulatory) to 8 (unsourced). Disagreements stay visible in each section.</Text>
        {sources.map((s, i) => {
          const m = meta?.sources[s.id];
          return (
            <View key={`${s.url ?? s.id}-${i}`} style={{ gap: 2, paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.line }}>
              <Cite file={f} meta={meta} k={s.url ?? s.id} />
              <Text style={[muted, breakWord]}>{meta?.ranks[String(s.rank)] ?? ""}{m?.license ? ` · ${m.license}` : ""}{!s.url && m?.note ? ` · ${m.note}` : ""}</Text>
            </View>
          );
        })}
        {f.sources.length > 10 ? (
          <Pressable accessibilityRole="button" onPress={() => setAllSources((v) => !v)}>
            <Text style={{ fontFamily: fonts.body, color: colors.cyan, fontSize: 13, paddingVertical: 6 }}>{allSources ? "Show fewer" : `Show all ${f.sources.length} sources`}</Text>
          </Pressable>
        ) : null}
        <Text style={label}>OPEN QUESTIONS</Text>
        {f.questions.length ? f.questions.map((q) => <Text key={q} style={[body, breakWord]}>› {q}</Text>) : <Missing>none recorded</Missing>}
        <Text style={label}>RESEARCH QUEUE</Text>
        {f.research ? (
          <Text style={[body, breakWord]}>
            Checked {f.research.attempted}: {f.research.outcome.replaceAll("_", " ")}
            {f.research.proposals.length ? ` (${f.research.proposals.length} candidate match${f.research.proposals.length === 1 ? "" : "es"} awaiting review)` : ""}.
          </Text>
        ) : (
          <Missing>{f.status === "needs_research" ? "queued, not yet checked" : "not queued"}</Missing>
        )}
      </Section>
      <FinePrint />
    </Screen>
  );
}

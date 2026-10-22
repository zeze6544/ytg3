import { colors, fonts, toneColor, type Tone } from "@/constants/theme";
import { ChipScroller, ChipWrap, FinePrint, LoadMore, PageTitle, QueryError, SearchField, Status, Tag, breakWord, useScreenInsets } from "@/components/ui";
import { NugMark } from "@/components/NugMark";
import { DEFAULT_QUERY, KIND_NAMES, queryStrains, type StrainQuery, type StrainRow } from "@/lib/strainIndex";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { FlatList, Pressable, Text, TextInput, View, useWindowDimensions } from "react-native";

const PAGE = 24;
const TYPES = ["all", "hybrid", "indica", "sativa", "ruderalis", "unspecified"] as const;
const TERPS = ["myrcene", "limonene", "caryophyllene", "pinene", "linalool", "humulene", "terpinolene", "ocimene", "bisabolol", "nerolidol"];
const SORTS: [StrainQuery["sort"], string][] = [
  ["name", "A–Z"],
  ["updated", "recently updated"],
  ["complete", "completeness"],
  ["sources", "most sources"],
  ["lineage", "lineage depth"],
];
const CHEM: [StrainQuery["chem"], string][] = [
  ["any", "any"],
  ["lab", "lab results"],
  ["registry", "registry filing"],
  ["listing", "seller claim"],
  ["legacy", "legacy range"],
  ["none", "none on file"],
];
const STATUS: [StrainQuery["status"], string][] = [
  ["any", "any"],
  ["documented", "documented"],
  ["partial", "partial"],
  ["needs_research", "needs research"],
];
const EVIDENCE: [StrainQuery["evidence"], string][] = [
  ["any", "any"],
  ["3", "regulatory or lab"],
  ["6", "database or better"],
];
const LINEAGE: [StrainQuery["lineage"], string][] = [
  ["any", "any"],
  ["has", "parents on file"],
  ["conflict", "conflicting"],
  ["none", "none on file"],
];
const IMAGE: [StrainQuery["image"], string][] = [
  ["any", "any"],
  ["stored", "stored asset"],
  ["device", "device render"],
  ["failed", "failed"],
];

function useDebounced<T>(value: T, ms: number) {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setOut(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return out;
}

function Chip({ on, tone = "cyan", onPress, children }: { on: boolean; tone?: Tone; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress}>
      <Tag filled={on} tone={on ? "phosphor" : tone}>
        {children}
      </Tag>
    </Pressable>
  );
}

function Group({ label, children, scroll = false }: { label: string; children: ReactNode; scroll?: boolean }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 18 }}>{label}</Text>
      {scroll ? <ChipScroller>{children}</ChipScroller> : <ChipWrap>{children}</ChipWrap>}
    </View>
  );
}

const STATUS_TONE: Record<string, Tone> = { documented: "phosphor", partial: "amber", needs_research: "red" };
const statusOf = (complete: number) => (complete >= 60 ? "documented" : complete >= 25 ? "partial" : "needs_research");

export default function StrainsScreen() {
  const insets = useScreenInsets(true);
  const { width } = useWindowDimensions();
  const content = Math.min(width - 40, 720);
  const columns = content >= 640 ? 2 : 1;
  const [q, setQ] = useState<StrainQuery>(DEFAULT_QUERY);
  const [searchText, setSearchText] = useState("");
  const [breederText, setBreederText] = useState("");
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const search = useDebounced(searchText, 220);
  const breeder = useDebounced(breederText, 300);
  const query = { ...q, search, breeder };
  const set = <K extends keyof StrainQuery>(key: K, value: StrainQuery[K]) => setQ((prev) => ({ ...prev, [key]: value }));
  const result = useQuery({
    queryKey: ["strain-index", query, shown],
    queryFn: () => queryStrains(query, shown),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
  const data = result.data;
  const filtered = JSON.stringify(query) !== JSON.stringify(DEFAULT_QUERY);
  const activeFilters = Object.entries(query).filter(([k, v]) => k !== "sort" && k !== "terpMode" && JSON.stringify(v) !== JSON.stringify(DEFAULT_QUERY[k as keyof StrainQuery])).length;

  const queryKey = JSON.stringify(query);
  const [shownFor, setShownFor] = useState(queryKey);
  if (shownFor !== queryKey) {
    setShownFor(queryKey);
    setShown(PAGE);
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ ...insets, gap: 16 }}
      data={data?.rows ?? []}
      key={columns}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? { gap: 14 } : undefined}
      keyExtractor={(item) => item.slug}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={12}
      windowSize={7}
      ListHeaderComponent={
        <View style={{ gap: 16 }}>
          <PageTitle>Strains</PageTitle>
          <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 17, lineHeight: 28 }]}>
            Cultivar files and registry product files. Every figure names its source. A missing figure says so. The pictures are illustrative renders, one per file, not photographs.
          </Text>
          <SearchField value={searchText} onChangeText={setSearchText} placeholder="Name, alias, parent, or breeder" />
          <Group label="Type" scroll>
            {TYPES.map((item) => (
              <Chip key={item} on={q.type === item} onPress={() => set("type", item)}>
                {item}
                {item !== "all" && data?.facets.type[item] !== undefined ? ` ${data.facets.type[item].toLocaleString()}` : ""}
              </Chip>
            ))}
          </Group>
          <Group label="Sort" scroll>
            {SORTS.map(([value, label]) => (
              <Chip key={value} on={q.sort === value} tone="purple" onPress={() => set("sort", value)}>
                {label}
              </Chip>
            ))}
          </Group>
          <Pressable accessibilityRole="button" onPress={() => setOpen((v) => !v)} style={{ minHeight: 48, justifyContent: "center" }}>
            <Text style={{ fontFamily: fonts.body, fontWeight: "600", color: colors.cyan, fontSize: 16, lineHeight: 24 }}>
              {open ? "Hide filters" : "More filters"}
              {activeFilters ? ` · ${activeFilters} on` : ""}
            </Text>
          </Pressable>
          {open ? (
            <View style={{ gap: 18, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 16, backgroundColor: colors.panel }}>
              <Group label="Kind of file">
                {(["all", "cultivar", "product"] as const).map((item) => (
                  <Chip key={item} on={q.kind === item} onPress={() => set("kind", item)}>
                    {item === "product" ? "registry product" : item}
                    {item !== "all" && data?.facets.kind[item] !== undefined ? ` ${data.facets.kind[item].toLocaleString()}` : ""}
                  </Chip>
                ))}
              </Group>
              <Group label="How complete the file is">
                {STATUS.map(([value, label]) => (
                  <Chip key={value} on={q.status === value} tone={value === "any" ? "cyan" : STATUS_TONE[value]} onPress={() => set("status", value)}>
                    {label}
                    {value !== "any" && data?.facets.status[value] !== undefined ? ` ${data.facets.status[value].toLocaleString()}` : ""}
                  </Chip>
                ))}
              </Group>
              <Group label="Cannabinoid figures">
                {CHEM.map(([value, label]) => (
                  <Chip key={value} on={q.chem === value} onPress={() => set("chem", value)}>
                    {label}
                  </Chip>
                ))}
              </Group>
              <Group label="Terpenes, measured or only mentioned">
                {TERPS.map((terp) => (
                  <Chip
                    key={terp}
                    on={q.terps.includes(terp)}
                    tone="amber"
                    onPress={() => set("terps", q.terps.includes(terp) ? q.terps.filter((t) => t !== terp) : [...q.terps, terp])}
                  >
                    {terp}
                  </Chip>
                ))}
                <Chip on={q.terpMode === "all"} tone="purple" onPress={() => set("terpMode", q.terpMode === "all" ? "any" : "all")}>
                  {q.terpMode === "all" ? "match all" : "match any"}
                </Chip>
              </Group>
              <Group label="Best evidence on the file">
                {EVIDENCE.map(([value, label]) => (
                  <Chip key={value} on={q.evidence === value} tone="amber" onPress={() => set("evidence", value)}>
                    {label}
                  </Chip>
                ))}
              </Group>
              <Group label="Lineage">
                {LINEAGE.map(([value, label]) => (
                  <Chip key={value} on={q.lineage === value} onPress={() => set("lineage", value)}>
                    {label}
                  </Chip>
                ))}
              </Group>
              <Group label="Registry and duplicates">
                <Chip on={q.medical} tone="amber" onPress={() => set("medical", !q.medical)}>
                  registry or TGA association
                </Chip>
                <Chip on={q.duplicates} tone="red" onPress={() => set("duplicates", !q.duplicates)}>
                  suspected duplicates
                </Chip>
              </Group>
              <Group label="Specimen image">
                {IMAGE.map(([value, label]) => (
                  <Chip key={value} on={q.image === value} onPress={() => set("image", value)}>
                    {label}
                  </Chip>
                ))}
              </Group>
              <View style={{ gap: 10 }}>
                <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 18 }}>Breeder or producer</Text>
                <TextInput
                  value={breederText}
                  onChangeText={setBreederText}
                  placeholder="For example, Sensi Seeds"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg, color: colors.text, fontFamily: fonts.body, fontSize: 17, lineHeight: 24, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, minHeight: 52 }}
                />
              </View>
            </View>
          ) : null}
          {result.isLoading ? (
            <Status>Loading the strain index…</Status>
          ) : data ? (
            <Status>
              {data.matched === data.total
                ? `${data.total.toLocaleString()} files.`
                : `${data.matched.toLocaleString()} of ${data.total.toLocaleString()} files match.`}
              {data.matched > data.rows.length ? ` Showing ${data.rows.length.toLocaleString()}.` : ""}
            </Status>
          ) : null}
          {result.error ? <QueryError error={result.error} /> : null}
          {data && data.matched === 0 ? <Status>No file matches these filters.</Status> : null}
        </View>
      }
      ListFooterComponent={
        <View style={{ gap: 10 }}>
          {data && shown < data.matched ? (
            <LoadMore label={`Show ${Math.min(PAGE, data.matched - shown)} more`} onPress={() => setShown((count) => count + PAGE)} />
          ) : null}
          {filtered ? (
            <LoadMore
              label="Clear filters"
              onPress={() => {
                setQ(DEFAULT_QUERY);
                setSearchText("");
                setBreederText("");
              }}
            />
          ) : null}
          <FinePrint />
        </View>
      }
      renderItem={({ item }) => <StrainCard item={item} />}
    />
  );
}

function StrainCard({ item }: { item: StrainRow }) {
  const status = statusOf(item.complete);
  const kind = KIND_NAMES[item.kind] ?? "cultivar";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.type}, ${kind}`}
      onPress={() => router.push(`/strain/${item.slug}`)}
      style={{ flex: 1, minWidth: 0, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, borderRadius: 14, padding: 16, gap: 10 }}
    >
      <NugMark slug={item.slug} id={item.id} name={item.name} type={item.type} stored={item.image === 1} compact />
      <Text numberOfLines={3} style={[breakWord, { fontFamily: fonts.display, fontWeight: "700", color: colors.phosphor, fontSize: 22, lineHeight: 28 }]}>
        {item.name}
      </Text>
      {item.aliases.length ? (
        <Text numberOfLines={2} style={[breakWord, { fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 18 }]}>
          Also called {item.aliases.join(", ")}
        </Text>
      ) : null}
      <Text numberOfLines={3} style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 15, lineHeight: 22 }]}>
        {item.type} · {kind}
        {item.breeder ? ` · ${item.breeder}` : ""}
      </Text>
      <Text style={{ fontFamily: fonts.body, color: toneColor[STATUS_TONE[status]], fontSize: 13, lineHeight: 18 }}>
        {item.complete}% complete · {status.replaceAll("_", " ")}
        {item.rank <= 3 ? " · stronger evidence" : ""}
      </Text>
    </Pressable>
  );
}

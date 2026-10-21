import { colors, fonts, toneColor, type Tone } from "@/constants/theme";
import { ChipWrap, FinePrint, LoadMore, PageTitle, QueryError, SearchField, Status, Tag, breakWord, useScreenInsets } from "@/components/ui";
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

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: fonts.body, color: colors.cyan, fontSize: 11, letterSpacing: 1 }}>{label}</Text>
      <ChipWrap>{children}</ChipWrap>
    </View>
  );
}

const STATUS_TONE: Record<string, Tone> = { documented: "phosphor", partial: "amber", needs_research: "red" };
const statusOf = (complete: number) => (complete >= 60 ? "documented" : complete >= 25 ? "partial" : "needs_research");

export default function StrainsScreen() {
  const insets = useScreenInsets(true);
  const { width } = useWindowDimensions();
  const columns = width >= 980 ? 5 : width >= 720 ? 4 : width >= 480 ? 3 : 2;
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
      contentContainerStyle={{ ...insets, gap: 10 }}
      data={data?.rows ?? []}
      key={columns}
      numColumns={columns}
      columnWrapperStyle={{ gap: 8 }}
      keyExtractor={(item) => item.slug}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={12}
      windowSize={7}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <PageTitle>STRAINS</PageTitle>
          <Text style={[breakWord, { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }]}>
            Cultivar files and registry product files. Every figure names its source; a missing figure says so. Specimen images are illustrative renders, unique per file, not photographs.
          </Text>
          <SearchField value={searchText} onChangeText={setSearchText} placeholder="Name, alias, parent, or breeder" />
          <Group label="TYPE">
            {TYPES.map((item) => (
              <Chip key={item} on={q.type === item} onPress={() => set("type", item)}>
                {item}
                {item !== "all" && data?.facets.type[item] !== undefined ? ` ${data.facets.type[item].toLocaleString()}` : ""}
              </Chip>
            ))}
          </Group>
          <Group label="SORT">
            {SORTS.map(([value, label]) => (
              <Chip key={value} on={q.sort === value} tone="purple" onPress={() => set("sort", value)}>
                {label}
              </Chip>
            ))}
          </Group>
          <Pressable accessibilityRole="button" onPress={() => setOpen((v) => !v)} style={{ paddingVertical: 6 }}>
            <Text style={{ fontFamily: fonts.bodyMedium, color: colors.cyan, fontSize: 13 }}>
              {open ? "▾" : "▸"} MORE FILTERS{activeFilters ? ` · ${activeFilters} active` : ""}
            </Text>
          </Pressable>
          {open ? (
            <View style={{ gap: 10, borderWidth: 1, borderColor: colors.line, padding: 10 }}>
              <Group label="FILE KIND">
                {(["all", "cultivar", "product"] as const).map((item) => (
                  <Chip key={item} on={q.kind === item} onPress={() => set("kind", item)}>
                    {item === "product" ? "registry product" : item}
                    {item !== "all" && data?.facets.kind[item] !== undefined ? ` ${data.facets.kind[item].toLocaleString()}` : ""}
                  </Chip>
                ))}
              </Group>
              <Group label="COMPLETENESS">
                {STATUS.map(([value, label]) => (
                  <Chip key={value} on={q.status === value} tone={value === "any" ? "cyan" : STATUS_TONE[value]} onPress={() => set("status", value)}>
                    {label}
                    {value !== "any" && data?.facets.status[value] !== undefined ? ` ${data.facets.status[value].toLocaleString()}` : ""}
                  </Chip>
                ))}
              </Group>
              <Group label="CANNABINOID DATA">
                {CHEM.map(([value, label]) => (
                  <Chip key={value} on={q.chem === value} onPress={() => set("chem", value)}>
                    {label}
                  </Chip>
                ))}
              </Group>
              <Group label="TERPENE (MEASURED OR MENTIONED)">
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
              <Group label="BEST EVIDENCE">
                {EVIDENCE.map(([value, label]) => (
                  <Chip key={value} on={q.evidence === value} tone="amber" onPress={() => set("evidence", value)}>
                    {label}
                  </Chip>
                ))}
              </Group>
              <Group label="LINEAGE">
                {LINEAGE.map(([value, label]) => (
                  <Chip key={value} on={q.lineage === value} onPress={() => set("lineage", value)}>
                    {label}
                  </Chip>
                ))}
              </Group>
              <Group label="MEDICAL / REGISTRY">
                <Chip on={q.medical} tone="amber" onPress={() => set("medical", !q.medical)}>
                  registry or TGA association
                </Chip>
                <Chip on={q.duplicates} tone="red" onPress={() => set("duplicates", !q.duplicates)}>
                  suspected duplicates
                </Chip>
              </Group>
              <Group label="IMAGE STATUS">
                {IMAGE.map(([value, label]) => (
                  <Chip key={value} on={q.image === value} onPress={() => set("image", value)}>
                    {label}
                  </Chip>
                ))}
              </Group>
              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: fonts.body, color: colors.cyan, fontSize: 11, letterSpacing: 1 }}>BREEDER OR PRODUCER</Text>
                <TextInput
                  value={breederText}
                  onChangeText={setBreederText}
                  placeholder="e.g. Sensi Seeds"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ borderWidth: 1, borderColor: colors.line, color: colors.phosphor, fontFamily: fonts.body, fontSize: 14, padding: 10 }}
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
      style={{ flex: 1, minWidth: 0, borderWidth: 1, borderColor: colors.phosphor, backgroundColor: "#000", padding: 4, gap: 4 }}
    >
      <NugMark slug={item.slug} id={item.id} name={item.name} type={item.type} stored={item.image === 1} compact />
      <Text numberOfLines={3} style={[breakWord, { fontFamily: fonts.display, color: colors.phosphor, fontSize: 16, lineHeight: 18 }]}>
        {item.name}
      </Text>
      {item.aliases.length ? (
        <Text numberOfLines={1} style={[breakWord, { fontFamily: fonts.body, color: colors.muted, fontSize: 9 }]}>
          aka {item.aliases.join(", ")}
        </Text>
      ) : null}
      <Text numberOfLines={2} style={[breakWord, { fontFamily: fonts.body, color: colors.cyan, fontSize: 9 }]}>
        {item.type} · {kind}
        {item.breeder ? ` · ${item.breeder}` : ""}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
        <Text style={{ fontFamily: fonts.body, color: toneColor[STATUS_TONE[status]], fontSize: 9 }}>
          {item.complete}% {status.replace("_", " ")}
        </Text>
        {item.rank <= 3 ? <Text style={{ fontFamily: fonts.body, color: colors.amber, fontSize: 9 }}>◆ R{item.rank}</Text> : null}
      </View>
    </Pressable>
  );
}

import { colors, fonts } from "@/constants/theme";
import { ChipWrap, FileCard, FinePrint, LoadMore, MissingArchive, NameRow, PageTitle, QueryError, SearchField, Status, Tag, breakWord, useScreenInsets } from "@/components/ui";
import { NugMark } from "@/components/NugMark";
import { fetchStrains, filterStrains } from "@/lib/api";
import { isTemplateStrainSummary, rangePercent } from "@/lib/reading";
import { TERPENES } from "@/lib/reagents";
import { archiveConfigured } from "@/lib/supabase";
import { EVIDENCE_TONE, STRAIN_TONE, type StrainType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

const TYPES = ["all", "indica", "sativa", "hybrid", "ruderalis", "unspecified"] as const;
const PAGE = 24;

export default function StrainsScreen() {
  const insets = useScreenInsets(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const [terps, setTerps] = useState<string[]>([]);
  const [mode, setMode] = useState<"any" | "all">("any");
  const [medical, setMedical] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const query = useQuery({
    queryKey: ["strains", search, type],
    queryFn: () => fetchStrains({ search, type }),
    enabled: archiveConfigured,
  });
  const matches = useMemo(() => {
    const filtered = filterStrains(query.data ?? [], terps, mode);
    return medical ? filtered.filter((strain) => (strain.products ?? []).length > 0) : filtered;
  }, [query.data, terps, mode, medical]);
  const rows = matches.slice(0, shown);
  const filtered = Boolean(search.trim() || type !== "all" || terps.length || medical);

  useEffect(() => {
    setShown(PAGE);
  }, [search, type, terps, mode, medical]);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ ...insets, gap: 10 }}
      data={rows}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <PageTitle>STRAINS</PageTitle>
          {archiveConfigured ? null : <MissingArchive />}
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }}>
            A percent is shown only when a source published one. Medical files are Australian TGA dried flower for January–June 2026, or a Connecticut flower registration. The mark is not a photograph.
          </Text>
          <SearchField value={search} onChangeText={setSearch} placeholder="Name or lineage" />
          <ChipWrap>
            {TYPES.map((item) => {
              const on = type === item;
              return (
                <Pressable key={item} onPress={() => setType(item)}>
                  <Tag filled={on} tone={on ? "phosphor" : "cyan"}>
                    {item}
                  </Tag>
                </Pressable>
              );
            })}
          </ChipWrap>
          <ChipWrap>
            <Pressable onPress={() => setMedical((value) => !value)}>
              <Tag filled={medical} tone={medical ? "amber" : "phosphor"}>
                medical files
              </Tag>
            </Pressable>
            <Pressable onPress={() => setMode("any")}>
              <Tag filled={mode === "any"} tone={mode === "any" ? "cyan" : "phosphor"}>
                any terpene
              </Tag>
            </Pressable>
            <Pressable onPress={() => setMode("all")}>
              <Tag filled={mode === "all"} tone={mode === "all" ? "cyan" : "phosphor"}>
                all terpenes
              </Tag>
            </Pressable>
          </ChipWrap>
          <ChipWrap>
            {TERPENES.map((terp) => {
              const on = terps.includes(terp.key);
              return (
                <Pressable
                  key={terp.key}
                  onPress={() =>
                    setTerps((prev) => (prev.includes(terp.key) ? prev.filter((item) => item !== terp.key) : [...prev, terp.key]))
                  }
                >
                  <Tag filled={on} tone={on ? "amber" : "cyan"}>
                    {terp.key}
                  </Tag>
                </Pressable>
              );
            })}
          </ChipWrap>
          {query.isLoading ? (
            <Status>Loading cultivars…</Status>
          ) : (
            <Status>{matches.length > rows.length ? `Showing ${rows.length} of ${matches.length}.` : `${rows.length} cultivars.`}</Status>
          )}
          {query.error ? <QueryError error={query.error} /> : null}
        </View>
      }
      ListFooterComponent={
        <View style={{ gap: 10 }}>
          {shown < matches.length ? (
            <LoadMore label={`Show ${Math.min(PAGE, matches.length - shown)} more`} onPress={() => setShown((count) => count + PAGE)} />
          ) : null}
          {filtered ? (
            <LoadMore label="Clear filters" onPress={() => { setSearch(""); setType("all"); setTerps([]); setMode("any"); setMedical(false); }} />
          ) : null}
          <FinePrint />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/strain/${item.slug}`)}
          style={{ borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 12, borderRadius: 4, gap: 8 }}
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            <NugMark slug={item.slug} name={item.name} type={item.type} compact />
            <View style={{ flex: 1, gap: 6 }}>
              <NameRow name={item.name} tag={item.type} tone={STRAIN_TONE[item.type as StrainType] ?? "phosphor"} />
              <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 12, lineHeight: 18 }]}>
                THC {rangePercent(item.thc_low, item.thc_high)} · CBD {rangePercent(item.cbd_low, item.cbd_high)}
              </Text>
              {(item.terpene_profile ?? []).slice(0, 3).map((terp) => (
                <Text key={terp.name} style={{ fontFamily: fonts.body, color: colors.cyan, fontSize: 11 }}>
                  {terp.name} {terp.percent}%
                </Text>
              ))}
            </View>
          </View>
          {item.summary && !isTemplateStrainSummary(item.summary) ? (
            <Text numberOfLines={3} style={[breakWord, { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }]}>{item.summary}</Text>
          ) : null}
          <Tag tone={EVIDENCE_TONE[item.confidence] ?? "cyan"}>{item.confidence === "unknown" ? "class record" : item.confidence}</Tag>
        </Pressable>
      )}
    />
  );
}

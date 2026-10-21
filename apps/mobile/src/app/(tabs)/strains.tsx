import { colors, fonts } from "@/constants/theme";
import { ChipWrap, FinePrint, LoadMore, MissingArchive, PageTitle, QueryError, SearchField, Status, Tag, breakWord, useScreenInsets } from "@/components/ui";
import { NugMark } from "@/components/NugMark";
import { fetchStrains, filterStrains } from "@/lib/api";
import { rangePercent } from "@/lib/reading";
import { TERPENES } from "@/lib/reagents";
import { archiveConfigured } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";

const TYPES = ["all", "indica", "sativa", "hybrid", "ruderalis", "unspecified"] as const;
const PAGE = 24;

export default function StrainsScreen() {
  const insets = useScreenInsets(true);
  const { width } = useWindowDimensions();
  const columns = width >= 980 ? 5 : width >= 720 ? 4 : width >= 480 ? 3 : 2;
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
      key={columns}
      numColumns={columns}
      columnWrapperStyle={{ gap: 8 }}
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
          style={{ flex: 1, borderWidth: 1, borderColor: "#39ff14", backgroundColor: "#000", padding: 4, gap: 4 }}
        >
          <NugMark slug={item.slug} name={item.name} type={item.type} compact />
          <Text numberOfLines={2} style={[breakWord, { fontFamily: fonts.display, color: "#39ff14", fontSize: 16, lineHeight: 18 }]}>{item.name}</Text>
          <Text style={{ fontFamily: fonts.body, color: "#39ff14", fontSize: 10 }}>
            THC {rangePercent(item.thc_low, item.thc_high)} | {item.type}
          </Text>
        </Pressable>
      )}
    />
  );
}

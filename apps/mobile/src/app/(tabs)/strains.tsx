import { colors, fonts } from "@/constants/theme";
import { ChipWrap, FileCard, FinePrint, LoadMore, MissingArchive, NameRow, PageTitle, QueryError, SearchField, Status, Tag, breakWord, useScreenInsets } from "@/components/ui";
import { fetchStrains, filterStrains } from "@/lib/api";
import { TERPENES } from "@/lib/reagents";
import { archiveConfigured } from "@/lib/supabase";
import { EVIDENCE_TONE, STRAIN_TONE, type StrainType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

const TYPES = ["all", "indica", "sativa", "hybrid", "ruderalis"] as const;
const PAGE = 24;

export default function StrainsScreen() {
  const insets = useScreenInsets(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const [terps, setTerps] = useState<string[]>([]);
  const [mode, setMode] = useState<"any" | "all">("any");
  const [shown, setShown] = useState(PAGE);
  const query = useQuery({
    queryKey: ["strains", search, type],
    queryFn: () => fetchStrains({ search, type }),
    enabled: archiveConfigured,
  });
  const matches = useMemo(() => filterStrains(query.data ?? [], terps, mode), [query.data, terps, mode]);
  const rows = matches.slice(0, shown);
  const filtered = Boolean(search.trim() || type !== "all" || terps.length);

  useEffect(() => {
    setShown(PAGE);
  }, [search, type, terps, mode]);

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
            Reported chemotypes, not a single grower or batch. Most confidence tags stay anecdotal on purpose. This is not a recommendation to use cannabis.
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
            <LoadMore label="Clear filters" onPress={() => { setSearch(""); setType("all"); setTerps([]); setMode("any"); }} />
          ) : null}
          <FinePrint />
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 12, borderRadius: 4, gap: 6 }}>
          <NameRow name={item.name} tag={item.type} tone={STRAIN_TONE[item.type as StrainType] ?? "phosphor"} />
          {item.lineage ? (
            <Text style={[breakWord, { fontFamily: fonts.body, color: colors.muted, fontSize: 11, lineHeight: 16 }]}>{item.lineage}</Text>
          ) : null}
          <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 12, lineHeight: 18 }]}>
            THC {item.thc_low ?? "?"}–{item.thc_high ?? "?"}%   CBD {item.cbd_low ?? "?"}–{item.cbd_high ?? "?"}%
          </Text>
          <ChipWrap>
            {(item.effects ?? []).filter(Boolean).map((effect) => (
              <Tag key={effect}>{effect}</Tag>
            ))}
            {(item.adverse ?? []).filter(Boolean).map((effect) => (
              <Tag key={effect} tone="red">
                {effect}
              </Tag>
            ))}
          </ChipWrap>
          {item.summary ? (
            <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 12, lineHeight: 18 }]}>{item.summary}</Text>
          ) : null}
          <Tag tone={EVIDENCE_TONE[item.confidence] ?? "cyan"}>{item.confidence === "unknown" ? "class record" : item.confidence}</Tag>
        </View>
      )}
    />
  );
}

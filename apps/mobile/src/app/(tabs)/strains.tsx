import { colors, fonts } from "@/constants/theme";
import { MissingArchive, QueryError, Status, Tag } from "@/components/ui";
import { fetchStrains, filterStrains } from "@/lib/api";
import { TERPENES } from "@/lib/reagents";
import { archiveConfigured } from "@/lib/supabase";
import { EVIDENCE_TONE, STRAIN_TONE, type StrainType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const TYPES = ["all", "indica", "sativa", "hybrid", "ruderalis"] as const;

export default function StrainsScreen() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const [terps, setTerps] = useState<string[]>([]);
  const [mode, setMode] = useState<"any" | "all">("any");
  const query = useQuery({
    queryKey: ["strains", search, type],
    queryFn: () => fetchStrains({ search, type }),
    enabled: archiveConfigured,
  });
  const rows = useMemo(() => filterStrains(query.data ?? [], terps, mode), [query.data, terps, mode]);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
      data={rows}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 40 }}>STRAINS</Text>
          {archiveConfigured ? null : <MissingArchive />}
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }}>
            Reported chemotypes, not a single grower or batch. Most confidence tags stay anecdotal on purpose. This is not a recommendation to use cannabis.
          </Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Name or lineage"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            style={{ borderWidth: 1, borderColor: colors.phosphor, color: colors.phosphor, fontFamily: fonts.body, padding: 12 }}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {TYPES.map((item) => (
              <Pressable key={item} onPress={() => setType(item)}>
                <Tag tone={type === item ? "phosphor" : "cyan"}>{item}</Tag>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => setMode("any")}><Tag tone={mode === "any" ? "cyan" : "phosphor"}>any terpene</Tag></Pressable>
            <Pressable onPress={() => setMode("all")}><Tag tone={mode === "all" ? "cyan" : "phosphor"}>all terpenes</Tag></Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {TERPENES.map((terp) => (
              <Pressable
                key={terp.key}
                onPress={() =>
                  setTerps((prev) => (prev.includes(terp.key) ? prev.filter((item) => item !== terp.key) : [...prev, terp.key]))
                }
              >
                <Tag tone={terps.includes(terp.key) ? "amber" : "cyan"}>{terp.key}</Tag>
              </Pressable>
            ))}
          </ScrollView>
          {query.isLoading ? <Status>Loading cultivars…</Status> : <Status>{rows.length} shown</Status>}
          {query.error ? <QueryError error={query.error} /> : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, padding: 12, borderRadius: 4, gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 26, flex: 1 }}>{item.name}</Text>
            <Tag tone={STRAIN_TONE[item.type as StrainType] ?? "phosphor"}>{item.type}</Tag>
          </View>
          {item.lineage ? <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 11 }}>{item.lineage}</Text> : null}
          <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 12 }}>
            THC {item.thc_low ?? "?"}–{item.thc_high ?? "?"}%   CBD {item.cbd_low ?? "?"}–{item.cbd_high ?? "?"}%
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {(item.effects ?? []).filter(Boolean).map((effect) => (
              <Tag key={effect}>{effect}</Tag>
            ))}
            {(item.adverse ?? []).filter(Boolean).map((effect) => (
              <Tag key={effect} tone="red">{effect}</Tag>
            ))}
          </View>
          {item.summary ? <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 12, lineHeight: 18 }}>{item.summary}</Text> : null}
          <Tag tone={EVIDENCE_TONE[item.confidence] ?? "cyan"}>{item.confidence}</Tag>
        </View>
      )}
    />
  );
}

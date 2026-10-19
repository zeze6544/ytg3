import { colors, fonts } from "@/constants/theme";
import { Action, Frame, MissingArchive, QueryError, Screen, Status, Tag } from "@/components/ui";
import { fetchCounts, fetchPopularDrugs, fetchRandomDrug } from "@/lib/api";
import { archiveConfigured } from "@/lib/supabase";
import { CATEGORY_LABELS, CATEGORY_TONE } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

const WARNINGS =
  "Never mix opioids with benzodiazepines or alcohol  ·  Test your batch  ·  Fentanyl contamination is still everywhere  ·  If you are not sure, do not  ·  NARCØDEX does not tell anyone to use drugs  ·  ";

export default function HomeScreen() {
  const counts = useQuery({ queryKey: ["counts"], queryFn: fetchCounts, enabled: archiveConfigured });
  const featured = useQuery({ queryKey: ["featured"], queryFn: fetchPopularDrugs, enabled: archiveConfigured });

  async function surprise() {
    const row = await fetchRandomDrug();
    if (row) router.push(`/drug/${row.slug}`);
  }

  return (
    <Screen>
      <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 58, lineHeight: 58 }}>
        NARC<Text style={{ color: colors.cyan }}>Ø</Text>DEX
      </Text>
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 11, letterSpacing: 1 }}>
        A PUBLIC LIBRARY FOR SUBSTANCES
      </Text>
      {archiveConfigured ? null : <MissingArchive />}
      <Frame title="BOOT" code="MAIN">
        <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }}>
          Honest files on drugs, cannabis strains, interactions, and history. Every entry says what
          is known, how well it is known, and how people stay safer. Nothing here is dosing advice,
          a sale, or a green light.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Action label="Browse files" onPress={() => router.push("/files")} />
          <Action label="Check a mix" tone="red" onPress={() => router.push("/mix")} />
          <Action label="Surprise file" tone="purple" disabled={!archiveConfigured} onPress={() => void surprise()} />
        </View>
      </Frame>

      <Frame title="INDEX" code="STAT" tone="cyan">
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            ["DRUGS", counts.data?.drugs],
            ["STRAINS", counts.data?.strains],
            ["CLASSES", counts.data?.classes],
          ].map(([label, value]) => (
            <View key={String(label)} style={{ flex: 1, borderWidth: 1, borderColor: colors.line, padding: 8 }}>
              <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 32 }}>
                {value ?? "·"}
              </Text>
              <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 10 }}>{label}</Text>
            </View>
          ))}
        </View>
      </Frame>

      <Frame title="FEATURED FILES" code="F-01" tone="amber">
        {featured.isLoading ? <Status>Loading files…</Status> : null}
        {featured.error ? <QueryError error={featured.error} /> : null}
        {(featured.data ?? []).map((drug) => (
          <Pressable key={drug.slug} onPress={() => router.push(`/drug/${drug.slug}`)} style={{ gap: 4, paddingVertical: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 24, flex: 1 }} numberOfLines={1}>
                {drug.name}
              </Text>
              <Tag tone={CATEGORY_TONE[drug.category ?? "other"] ?? "phosphor"}>
                {CATEGORY_LABELS[drug.category ?? "other"]}
              </Tag>
            </View>
            {drug.summary ? (
              <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12 }} numberOfLines={2}>
                {drug.summary}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </Frame>

      <Frame title="TRANSMISSION" code="MOTD" tone="red">
        <Text style={{ fontFamily: fonts.body, color: colors.red, fontSize: 12, lineHeight: 18 }}>{WARNINGS}</Text>
      </Frame>
    </Screen>
  );
}

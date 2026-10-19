import { colors, fonts } from "@/constants/theme";
import { Action, Frame, MissingArchive, NameRow, QueryError, Screen, Status, Wordmark } from "@/components/ui";
import { fetchCounts, fetchPopularDrugs, fetchRandomDrug } from "@/lib/api";
import { archiveConfigured } from "@/lib/supabase";
import { CATEGORY_LABELS, CATEGORY_TONE } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

const WARNINGS =
  "Never mix opioids with benzodiazepines or alcohol  ·  Test your batch  ·  Fentanyl contamination is still everywhere  ·  If you are not sure, do not  ·  NARCØDEX does not tell anyone to use drugs  ·  ";

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const counts = useQuery({ queryKey: ["counts"], queryFn: fetchCounts, enabled: archiveConfigured });
  const featured = useQuery({ queryKey: ["featured"], queryFn: fetchPopularDrugs, enabled: archiveConfigured });
  const statSize = width < 360 ? 22 : 28;
  const subSize = width < 380 ? 10 : 11;

  async function surprise() {
    const row = await fetchRandomDrug();
    if (row) router.push(`/drug/${row.slug}`);
  }

  return (
    <Screen safeTop>
      <Wordmark />
      <View style={{ height: 1, width: 72, backgroundColor: colors.line }} />
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: subSize, letterSpacing: 0.2 }}>
        A PUBLIC LIBRARY FOR SUBSTANCES
      </Text>
      {archiveConfigured ? null : <MissingArchive />}
      <Frame title="BOOT" code="MAIN">
        <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }}>
          Honest files on drugs, cannabis strains, interactions, and history. Every entry says what
          is known, how well it is known, and how people stay safer. Nothing here is dosing advice,
          a sale, or a green light.
        </Text>
        <View style={{ gap: 8 }}>
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
            <View key={String(label)} style={{ flex: 1, minWidth: 0, borderWidth: 1, borderColor: colors.line, padding: 8 }}>
              <Text
                numberOfLines={1}
                style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: statSize, minWidth: 0 }}
              >
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
            <NameRow
              name={drug.name ?? "Untitled"}
              tag={CATEGORY_LABELS[drug.category ?? "other"]}
              tone={CATEGORY_TONE[drug.category ?? "other"] ?? "phosphor"}
            />
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

import { colors, fonts } from "@/constants/theme";
import { Action, FileCard, FinePrint, Frame, MissingArchive, NameRow, Prose, QueryError, Screen, Status, Wordmark } from "@/components/ui";
import { fetchCounts, fetchPopularDrugs, fetchRandomDrug } from "@/lib/api";
import { blurb } from "@/lib/reading";
import { readRecent, type RecentFile } from "@/lib/recent";
import { archiveConfigured } from "@/lib/supabase";
import { CATEGORY_LABELS, CATEGORY_TONE } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

const LINES = [
  "Never mix opioids with benzodiazepines or alcohol.",
  "Test a batch. A reagent colour is not a dose and not a clearance.",
  "Fentanyl and nitazenes still show up in supplies that were not sold as opioids.",
  "If you are not sure what it is, do not take it.",
  "This archive does not tell anyone to use drugs.",
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const counts = useQuery({ queryKey: ["counts"], queryFn: fetchCounts, enabled: archiveConfigured });
  const featured = useQuery({ queryKey: ["featured"], queryFn: fetchPopularDrugs, enabled: archiveConfigured });
  const [recent, setRecent] = useState<RecentFile[]>([]);
  const statSize = width < 360 ? 22 : 28;
  const subSize = width < 380 ? 10 : 11;

  useFocusEffect(useCallback(() => { setRecent(readRecent()); }, []));

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
        <Prose>
          Honest files on drugs, cannabis strains, interactions, and history. Files opens on a common shelf. Letters and All open the rest of the index. Nothing here is dosing advice, a sale, or a green light.
        </Prose>
        <View style={{ gap: 8 }}>
          <Action label="Browse files" onPress={() => router.push("/files")} />
          <Action label="Check a mix" tone="red" onPress={() => router.push("/mix")} />
          <Action label="Surprise file" tone="purple" disabled={!archiveConfigured} onPress={() => void surprise()} />
        </View>
      </Frame>

      <Frame title="INDEX" code="STAT" tone="cyan">
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            ["DRUGS", counts.data?.drugs, "/files"],
            ["STRAINS", counts.data?.strains, "/strains"],
            ["CLASSES", counts.data?.classes, "/classes"],
          ].map(([label, value, href]) => (
            <Pressable
              key={String(label)}
              accessibilityRole="button"
              onPress={() => router.push(href as "/files")}
              style={{ flex: 1, minWidth: 0, borderWidth: 1, borderColor: colors.line, padding: 8, minHeight: 64 }}
            >
              <Text numberOfLines={1} style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: statSize, minWidth: 0 }}>
                {value ?? "·"}
              </Text>
              <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 10 }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Frame>

      {recent.length ? (
        <Frame title="ON THIS DEVICE" code="LAST" tone="purple">
          {recent.map((file) => (
            <Pressable key={file.slug} accessibilityRole="button" onPress={() => router.push(`/drug/${file.slug}`)} style={{ minHeight: 36, justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 14 }}>{file.name}</Text>
            </Pressable>
          ))}
        </Frame>
      ) : null}

      <Frame title="OPEN THESE" code="GO" tone="cyan">
        {[
          ["/classes", "Classes", "What each pharmacological group does"],
          ["/timeline", "Timeline", "Years, not a lecture"],
          ["/reagents", "Reagents", "Colour checks and what they miss"],
          ["/saved", "Saved", "Bookmarks, plus files opened on this device"],
        ].map(([href, label, note]) => (
          <Pressable key={href} accessibilityRole="button" onPress={() => router.push(href as "/classes")} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 24, lineHeight: 26 }}>{label}</Text>
            <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12 }}>{note}</Text>
          </Pressable>
        ))}
      </Frame>

      <Frame title="FEATURED FILES" code="F-01" tone="amber">
        {featured.isLoading ? <Status>Loading files…</Status> : null}
        {featured.error ? <QueryError error={featured.error} /> : null}
        {(featured.data ?? []).map((drug) => (
          <FileCard key={drug.slug} onPress={() => router.push(`/drug/${drug.slug}`)}>
            <NameRow
              name={drug.name ?? "Untitled"}
              tag={CATEGORY_LABELS[drug.category ?? "other"]}
              tone={CATEGORY_TONE[drug.category ?? "other"] ?? "phosphor"}
            />
            {drug.summary ? (
              <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }} numberOfLines={3}>
                {blurb(drug.summary, 180)}
              </Text>
            ) : null}
          </FileCard>
        ))}
      </Frame>

      <Frame title="TRANSMISSION" code="MOTD" tone="red">
        {LINES.map((line) => (
          <Text key={line} style={{ fontFamily: fonts.body, color: colors.red, fontSize: 13, lineHeight: 19 }}>
            {line}
          </Text>
        ))}
      </Frame>
      <FinePrint />
    </Screen>
  );
}

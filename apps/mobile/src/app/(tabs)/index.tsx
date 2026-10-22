import { colors, fonts } from "@/constants/theme";
import { Action, FileCard, FinePrint, Frame, Lead, MissingArchive, NameRow, Prose, QueryError, Screen, Status, Wordmark } from "@/components/ui";
import { fetchCounts, fetchPopularDrugs, fetchRandomDrug } from "@/lib/api";
import { localIndexStamp } from "@/lib/localArchive";
import { blurb } from "@/lib/reading";
import { readRecent, type RecentFile } from "@/lib/recent";
import { archiveConfigured } from "@/lib/supabase";
import { CATEGORY_LABELS, CATEGORY_TONE } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

function formatCount(value?: number) {
  if (value === undefined) return "·";
  return value.toLocaleString("en-US");
}

function Destination({
  label,
  count,
  note,
  onPress,
  tone,
}: {
  label: string;
  count?: number;
  note: string;
  onPress: () => void;
  tone?: "red";
}) {
  const accent = tone === "red" ? colors.red : colors.phosphor;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: tone === "red" || pressed ? accent : colors.line,
        backgroundColor: pressed ? colors.panel2 : colors.panel,
        borderRadius: 14,
        padding: 18,
        gap: 8,
        minHeight: 96,
      })}
    >
      <Text style={{ fontFamily: fonts.body, color: tone === "red" ? colors.red : colors.muted, fontSize: 13, lineHeight: 18 }}>{label}</Text>
      {count !== undefined ? (
        <Text style={{ fontFamily: fonts.display, fontWeight: "700", color: accent, fontSize: 36, lineHeight: 44 }}>{formatCount(count)}</Text>
      ) : null}
      <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 16, lineHeight: 24 }}>{note}</Text>
    </Pressable>
  );
}

const LINES = [
  "Never mix opioids with benzodiazepines or alcohol.",
  "Test a batch. A reagent colour is not a dose and not a clearance.",
  "Fentanyl and nitazenes still show up in supplies that were not sold as opioids.",
  "If you are not sure what it is, do not take it.",
  "This archive does not tell anyone to use drugs.",
];

export default function HomeScreen() {
  const counts = useQuery({ queryKey: ["counts"], queryFn: fetchCounts, enabled: archiveConfigured });
  const featured = useQuery({ queryKey: ["featured"], queryFn: fetchPopularDrugs, enabled: archiveConfigured });
  const [recent, setRecent] = useState<RecentFile[]>([]);
  const stamp = localIndexStamp();

  useFocusEffect(useCallback(() => { setRecent(readRecent()); }, []));

  async function surprise() {
    const row = await fetchRandomDrug();
    if (row) router.push(`/drug/${row.slug}`);
  }

  return (
    <Screen safeTop>
      <Wordmark />
      <Lead>
        A harm-reduction reference for adults. It describes substances, risks, and interactions. It is not medical advice, and it does not tell anyone to use drugs.
      </Lead>
      {archiveConfigured ? null : <MissingArchive />}

      <Destination
        label="Substances"
        count={counts.data?.drugs}
        note="Search a name, an alias, or a street name."
        onPress={() => router.push("/files")}
      />
      <Destination
        label="Cannabis strains"
        count={counts.data?.strains}
        note="Cultivars and registry products. A missing figure stays blank."
        onPress={() => router.push("/strains")}
      />
      <Destination
        label="Mix check"
        note="See what two substances do together. No result is not a green light."
        onPress={() => router.push("/mix")}
        tone="red"
      />

      <View style={{ gap: 12 }}>
        <Action label="Open a random substance" tone="purple" disabled={!archiveConfigured} onPress={() => void surprise()} />
        <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 14, lineHeight: 22 }}>
          {counts.isError ? "The index could not be counted." : counts.data ? "Index ready." : "Index still loading."}
          {stamp ? ` Last update ${stamp}.` : ""}
          {counts.data ? ` ${formatCount(counts.data.classes)} classes.` : ""}
        </Text>
      </View>

      {recent.length ? (
        <Frame title="Opened on this device" tone="purple">
          {recent.map((file) => (
            <Pressable key={file.slug} accessibilityRole="button" onPress={() => router.push(`/drug/${file.slug}`)} style={{ minHeight: 48, justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 16, lineHeight: 24 }}>{file.name}</Text>
            </Pressable>
          ))}
        </Frame>
      ) : null}

      <Frame title="Also in the archive" tone="cyan">
        {[
          ["/classes", "Classes", "What each pharmacological group does in the body."],
          ["/timeline", "Timeline", "A short history of the archive."],
          ["/reagents", "Reagents", "Colour checks, and what a colour cannot prove."],
        ].map(([href, label, note]) => (
          <Pressable key={href} accessibilityRole="button" onPress={() => router.push(href as "/classes")} style={{ minHeight: 64, justifyContent: "center", gap: 4 }}>
            <Text style={{ fontFamily: fonts.display, fontWeight: "700", color: colors.phosphor, fontSize: 26, lineHeight: 32 }}>{label}</Text>
            <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 24 }}>{note}</Text>
          </Pressable>
        ))}
      </Frame>

      <Frame title="Start here" tone="amber">
        {featured.isLoading ? <Status>Loading a few common files…</Status> : null}
        {featured.error ? <QueryError error={featured.error} /> : null}
        {(featured.data ?? []).map((drug) => (
          <FileCard key={drug.slug} onPress={() => router.push(`/drug/${drug.slug}`)}>
            <NameRow
              name={drug.name ?? "Untitled"}
              tag={CATEGORY_LABELS[drug.category ?? "other"]}
              tone={CATEGORY_TONE[drug.category ?? "other"] ?? "phosphor"}
            />
            {blurb(drug.summary, 180) ? (
              <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 24 }} numberOfLines={3}>
                {blurb(drug.summary, 180)}
              </Text>
            ) : null}
          </FileCard>
        ))}
      </Frame>

      <Frame title="Read this first" tone="red">
        {LINES.map((line) => (
          <Text key={line} style={{ fontFamily: fonts.body, color: colors.text, fontSize: 16, lineHeight: 26 }}>
            {line}
          </Text>
        ))}
        <Prose>Nothing here is dosing advice, a sale, or permission.</Prose>
      </Frame>
      <FinePrint />
    </Screen>
  );
}

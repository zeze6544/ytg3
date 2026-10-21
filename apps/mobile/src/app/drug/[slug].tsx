import { colors, fonts } from "@/constants/theme";
import { Action, Banner, ChipScroller, Field, FileCard, FinePrint, Frame, QueryError, Screen, Status, Tag, breakWord, type Scroller } from "@/components/ui";
import { fetchDrugBySlug, fetchDrugRefs, fetchNeighbors } from "@/lib/api";
import { readingFor } from "@/lib/briefing";
import { localGroupsOf, localRuleHits, localTimelineFor, localUnnamedFloor } from "@/lib/localArchive";
import { blurb, fileText, nameList } from "@/lib/reading";
import { rememberFile } from "@/lib/recent";
import { useSession } from "@/lib/session";
import { requireClient } from "@/lib/supabase";
import { CATEGORY_LABELS, CATEGORY_TONE, EVIDENCE_TONE } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Linking, Platform, Pressable, Text, View, useWindowDimensions } from "react-native";

export default function DrugScreen() {
  const { width } = useWindowDimensions();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useSession();
  const [note, setNote] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["drug", slug],
    queryFn: () => fetchDrugBySlug(slug),
    enabled: Boolean(slug),
  });
  const drug = query.data;
  const refs = useQuery({
    queryKey: ["refs", drug?.id],
    queryFn: () => fetchDrugRefs(drug!.id),
    enabled: Boolean(drug?.id),
  });
  const neighbors = useQuery({
    queryKey: ["neighbors", slug],
    queryFn: () => fetchNeighbors(String(slug)),
    enabled: Boolean(slug),
  });
  const scroller = useRef<Scroller>(null);
  const spots = useRef<Record<string, number>>({});

  useEffect(() => {
    if (drug?.slug && drug.name) rememberFile({ slug: drug.slug, name: drug.name });
  }, [drug?.slug, drug?.name]);

  useEffect(() => {
    if (!drug || !user) return;
    requireClient()
      .from("view_history")
      .insert({ user_id: user.id, drug_id: drug.id })
      .then(() => {});
  }, [drug?.id, user?.id]);

  async function save() {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (!drug) return;
    const { error } = await requireClient().from("saved_entries").insert({ user_id: user.id, drug_id: drug.id });
    setNote(error ? error.message : "Saved to your archive.");
  }

  if (query.isLoading) {
    return (
      <Screen>
        <Status>Loading file…</Status>
      </Screen>
    );
  }
  if (query.error) {
    return (
      <Screen>
        <QueryError error={query.error} />
      </Screen>
    );
  }
  if (!drug) {
    return (
      <Screen>
        <Status>File not found.</Status>
      </Screen>
    );
  }

  function jump(key: string) {
    const node = typeof document !== "undefined" ? document.getElementById(`spot-${key}`) : null;
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    scroller.current?.scrollTo({ y: Math.max(0, (spots.current[key] ?? 0) - 12), animated: true });
  }

  const long = drug.name.length > 24;
  const titleSize = long ? (width < 360 ? 26 : 30) : width < 360 ? 34 : 40;

  return (
    <Screen ref={scroller}>
      <Stack.Screen options={{ title: drug.name }} />
      <Text style={[breakWord, { fontFamily: fonts.display, color: colors.phosphor, fontSize: titleSize, lineHeight: titleSize + 6 }]}>
        {drug.name}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        <Tag tone={CATEGORY_TONE[drug.category] ?? "phosphor"}>{CATEGORY_LABELS[drug.category]}</Tag>
        <Tag tone={EVIDENCE_TONE[drug.evidence_quality] ?? "cyan"}>
          evidence: {drug.evidence_quality === "unknown" ? "class record" : drug.evidence_quality}
        </Tag>
        {drug.discovered_year ? <Tag tone="amber">est. {drug.discovered_year}</Tag> : null}
      </View>
      <Banner>Not medical advice. Not a dose, a source, or a reason to use this substance.</Banner>
      <Action label={user ? "Save" : "Sign in to save"} onPress={() => void save()} />
      <Action
        label="Check a mix with this file"
        tone="red"
        onPress={() => router.push({ pathname: "/mix", params: { drug: drug.id, name: drug.name } })}
      />
      <Action
        label={`More ${CATEGORY_LABELS[drug.category] ?? "files"}`}
        tone="cyan"
        onPress={() => router.push({ pathname: "/files", params: { cat: drug.category } })}
      />
      {note ? <Status>{note}</Status> : null}
      <ChipScroller sticky>
        {[
          ["overview", "Overview"],
          ["pharm", "Pharmacology"],
          ["risk", "Risks"],
          ["mixes", "Interactions"],
          ["history", "History"],
        ].map(([key, label]) => (
          <Pressable key={key} accessibilityRole="button" onPress={() => jump(key)} style={{ minHeight: 36, justifyContent: "center" }}>
            <Tag tone={key === "risk" || key === "mixes" ? "red" : "cyan"}>{label}</Tag>
          </Pressable>
        ))}
      </ChipScroller>

      <View nativeID="spot-overview" style={spotStyle} onLayout={(event) => { spots.current.overview = event.nativeEvent.layout.y; }}>
        {fileText(drug.acute_risks) ? (
          <Text style={[breakWord, { fontFamily: fonts.bodyMedium, color: colors.red, fontSize: 14, lineHeight: 21 }]}>{blurb(drug.acute_risks, 180)}</Text>
        ) : null}
        {fileText(drug.summary) ? (
          <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 14, lineHeight: 21 }]}>{fileText(drug.summary)}</Text>
        ) : null}
        <Frame title="EFFECTS" code="EFF">
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 10 }}>REPORTED</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {(drug.effects ?? []).filter(Boolean).map((effect) => (
              <Tag key={effect}>{effect}</Tag>
            ))}
          </View>
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 10 }}>ADVERSE</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {(drug.adverse_effects ?? []).filter(Boolean).map((effect) => (
              <Tag key={effect} tone="red">{effect}</Tag>
            ))}
          </View>
        </Frame>
        <Frame title="NAMES" code="NAM" tone="cyan">
          <Field label="Aliases" value={nameList(drug.aliases)} />
          <Field label="Brand names" value={nameList(drug.brand_names)} />
          <Field label="Street names" value={nameList(drug.street_names)} />
          <Field label="Chemistry" value={fileText(drug.chemistry)} />
        </Frame>
      </View>
      <View nativeID="spot-pharm" style={spotStyle} onLayout={(event) => { spots.current.pharm = event.nativeEvent.layout.y; }}>
        <Frame title="PHARMACOLOGY" code="MEC" tone="purple">
          <Field label="Mechanism" value={fileText(drug.mechanism)} />
          <Field label="Onset" value={fileText(drug.onset)} />
          <Field label="Duration" value={fileText(drug.duration)} />
          <Field label="Half-life" value={fileText(drug.half_life)} />
        </Frame>
      </View>
      <View nativeID="spot-risk" style={spotStyle} onLayout={(event) => { spots.current.risk = event.nativeEvent.layout.y; }}>
        <Frame title="RISKS" code="RSK" tone="red">
          <Field label="Acute" value={fileText(drug.acute_risks)} />
          <Field label="Chronic" value={fileText(drug.chronic_risks)} />
          <Field label="Overdose signs" value={fileText(drug.overdose_signs)} />
          <Field label="Contraindications" value={fileText(drug.contraindications)} />
        </Frame>
        <Frame title="DEPENDENCE" code="DEP" tone="amber">
          <Field label="Dependence" value={fileText(drug.dependence)} />
          <Field label="Tolerance" value={fileText(drug.tolerance)} />
          <Field label="Withdrawal" value={fileText(drug.withdrawal)} />
        </Frame>
        <Frame title="HARM REDUCTION" code="HR" tone="cyan">
          <Field label="Testing" value={fileText(drug.testing)} />
          <Field label="Safer context" value={fileText(drug.harm_reduction)} />
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 11, lineHeight: 16 }}>
            NARCØDEX does not provide dosing, sourcing, synthesis, or test-evasion instructions.
          </Text>
        </Frame>
        <ReadRecord category={drug.category} groups={localGroupsOf(drug.slug)} />
      </View>
      <View nativeID="spot-mixes" style={spotStyle} onLayout={(event) => { spots.current.mixes = event.nativeEvent.layout.y; }}>
        <MixRecord drug={drug} />
      </View>
      <View nativeID="spot-history" style={spotStyle} onLayout={(event) => { spots.current.history = event.nativeEvent.layout.y; }}>
        <Frame title="HISTORY" code="HIS" tone="purple">
          <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }]}>
            {fileText(drug.history) ?? "· see the class record ·"}
          </Text>
        </Frame>
        <TimelineRecord name={drug.name} />
      </View>
      <Frame title="STATUS" code="LEG" tone="amber">
        <Field label="Legal" value={drug.legal_status} />
        <Field label="Medical" value={drug.medical_status} />
        <Field label="Medical uses" value={drug.medical_uses} />
      </Frame>
      <Frame title="REFERENCES" code="REF">
        {(refs.data ?? []).length === 0 ? <Status>No references catalogued.</Status> : null}
        {(refs.data ?? []).map((ref) => (
          <Text
            key={ref.id}
            accessibilityRole={ref.url ? "link" : "text"}
            onPress={() => ref.url && Linking.openURL(ref.url)}
            style={{ fontFamily: fonts.body, color: ref.url ? colors.cyan : colors.text, fontSize: 14, lineHeight: 22, minHeight: 32 }}
          >
            {ref.label}
          </Text>
        ))}
      </Frame>
      {(neighbors.data ?? []).length ? (
        <Frame title="NEAR THIS NAME" code="NEAR" tone="amber">
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }}>
            Other {CATEGORY_LABELS[drug.category] ?? "files"} filed beside this name. Nearness is alphabetical, not a statement that they are interchangeable.
          </Text>
          {(neighbors.data ?? []).map((item) => (
            <FileCard key={item.slug} onPress={() => router.push(`/drug/${item.slug}`)}>
              <Text style={[breakWord, { fontFamily: fonts.display, color: colors.phosphor, fontSize: 24, lineHeight: 28 }]}>{item.name}</Text>
            </FileCard>
          ))}
        </Frame>
      ) : null}
      <FinePrint />
    </Screen>
  );
}

const SEV_TONE = { deadly: "red", dangerous: "red", moderate: "amber", low: "phosphor", unknown: "cyan" } as const;
const spotStyle = Platform.OS === "web" ? ({ gap: 12, scrollMarginTop: 56 } as const) : { gap: 12 };

function MixRecord({ drug }: { drug: { slug: string; name: string; category: string } }) {
  const hits = localRuleHits(drug.slug);
  const floor = localUnnamedFloor(drug);
  const deadly = hits.filter((hit) => hit.severity === "deadly");
  const dangerous = hits.filter((hit) => hit.severity === "dangerous");
  return (
    <Frame title="KNOWN MIXES" code="MIX" tone="red">
      <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 14, lineHeight: 21 }]}>
        {hits.length
          ? `${hits.length} stored rules name ${drug.name}. ${deadly.length} deadly, ${dangerous.length} dangerous. A pair with no stored rule is still described below, and it is not a clearance.`
          : `No stored rule names ${drug.name} directly. The mix checker still describes a pair. That description is not a clearance.`}
      </Text>
      <Text style={[breakWord, { fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 20 }]}>{floor}</Text>
      {hits.map((hit) => (
        <View key={`${hit.severity}-${hit.other}-${hit.note}`} style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <Tag tone={SEV_TONE[hit.severity as keyof typeof SEV_TONE] ?? "cyan"}>{hit.severity}</Tag>
            <Text style={[breakWord, { fontFamily: fonts.bodyMedium, color: colors.phosphor, fontSize: 13, lineHeight: 18, flex: 1 }]}>{hit.other}</Text>
          </View>
          <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 14, lineHeight: 21 }]}>{hit.note}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {hit.examples.map((item) => (
              <Pressable key={item.slug} accessibilityRole="button" onPress={() => router.push(`/drug/${item.slug}`)} style={{ minHeight: 32, justifyContent: "center" }}>
                <Text style={{ fontFamily: fonts.body, color: colors.cyan, fontSize: 13 }}>{item.name}</Text>
              </Pressable>
            ))}
            {hit.more ? <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 32 }}>and {hit.more} more</Text> : null}
          </View>
          {hit.category ? (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/files", params: { cat: hit.category! } })} style={{ minHeight: 32, justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.body, color: colors.amber, fontSize: 12 }}>Open every {CATEGORY_LABELS[hit.category] ?? hit.category} file</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </Frame>
  );
}

function ReadRecord({ category, groups }: { category: string; groups: string[] }) {
  const chapters = readingFor(category, groups);
  if (!chapters.length) return null;
  return (
    <View style={{ gap: 10 }}>
      {chapters.map((chapter) => (
        <Frame key={chapter.id} title={chapter.title} code="READ" tone="cyan">
          {chapter.paragraphs.map((paragraph) => (
            <Text key={paragraph.slice(0, 48)} style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 14, lineHeight: 22 }]}>
              {paragraph}
            </Text>
          ))}
        </Frame>
      ))}
    </View>
  );
}

function TimelineRecord({ name }: { name: string }) {
  const events = localTimelineFor(name);
  if (!events.length) return null;
  return (
    <Frame title="IN THE TIMELINE" code="YEAR" tone="amber">
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }}>
        Events whose text names {name}. The year is context, not a recipe.
      </Text>
      {events.map((event) => (
        <View key={event.id} style={{ gap: 4 }}>
          <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 22 }}>{event.year}</Text>
          <Text style={[breakWord, { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 14, lineHeight: 20 }]}>{event.title}</Text>
          <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }]}>{event.description}</Text>
        </View>
      ))}
    </Frame>
  );
}

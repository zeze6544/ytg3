import { colors, fonts } from "@/constants/theme";
import { Action, Banner, Field, Frame, QueryError, Screen, Status, Tag, breakWord } from "@/components/ui";
import { fetchDrugBySlug, fetchDrugRefs } from "@/lib/api";
import { useSession } from "@/lib/session";
import { requireClient } from "@/lib/supabase";
import { CATEGORY_LABELS, CATEGORY_TONE, EVIDENCE_TONE } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Text, View, useWindowDimensions } from "react-native";

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

  const long = drug.name.length > 24;
  const titleSize = long ? (width < 360 ? 26 : 30) : width < 360 ? 34 : 40;

  return (
    <Screen>
      <Stack.Screen options={{ title: drug.name }} />
      <Text style={[breakWord, { fontFamily: fonts.display, color: colors.phosphor, fontSize: titleSize, lineHeight: titleSize + 6 }]}>
        {drug.name}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        <Tag tone={CATEGORY_TONE[drug.category] ?? "phosphor"}>{CATEGORY_LABELS[drug.category]}</Tag>
        <Tag tone={EVIDENCE_TONE[drug.evidence_quality] ?? "cyan"}>evidence: {drug.evidence_quality}</Tag>
        {drug.discovered_year ? <Tag tone="amber">est. {drug.discovered_year}</Tag> : null}
      </View>
      {drug.summary ? (
        <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 14, lineHeight: 21 }]}>{drug.summary}</Text>
      ) : null}
      <Banner>Not medical advice. Not a dose, a source, or a reason to use this substance.</Banner>
      <Action label="Save" onPress={() => void save()} />
      {note ? <Status>{note}</Status> : null}

      <Frame title="NAMES" code="NAM" tone="cyan">
        <Field label="Aliases" value={drug.aliases?.filter(Boolean).join(", ")} />
        <Field label="Brand names" value={drug.brand_names?.filter(Boolean).join(", ")} />
        <Field label="Street names" value={drug.street_names?.filter(Boolean).join(", ")} />
        <Field label="Chemistry" value={drug.chemistry} />
      </Frame>
      <Frame title="STATUS" code="LEG" tone="amber">
        <Field label="Legal" value={drug.legal_status} />
        <Field label="Medical" value={drug.medical_status} />
        <Field label="Medical uses" value={drug.medical_uses} />
        <Field label="Contraindications" value={drug.contraindications} />
      </Frame>
      <Frame title="PHARMACOLOGY" code="MEC" tone="purple">
        <Field label="Mechanism" value={drug.mechanism} />
        <Field label="Onset" value={drug.onset} />
        <Field label="Duration" value={drug.duration} />
        <Field label="Half-life" value={drug.half_life} />
      </Frame>
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
      <Frame title="RISK" code="RSK" tone="red">
        <Field label="Acute" value={drug.acute_risks} />
        <Field label="Chronic" value={drug.chronic_risks} />
        <Field label="Overdose signs" value={drug.overdose_signs} />
      </Frame>
      <Frame title="DEPENDENCE" code="DEP" tone="amber">
        <Field label="Dependence" value={drug.dependence} />
        <Field label="Tolerance" value={drug.tolerance} />
        <Field label="Withdrawal" value={drug.withdrawal} />
      </Frame>
      <Frame title="HARM REDUCTION" code="HR" tone="cyan">
        <Field label="Testing" value={drug.testing} />
        <Field label="Safer context" value={drug.harm_reduction} />
        <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 11, lineHeight: 16 }}>
          NARCØDEX does not provide dosing, sourcing, synthesis, or test-evasion instructions.
        </Text>
      </Frame>
      <Frame title="HISTORY" code="HIS" tone="purple">
        <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }]}>
          {drug.history ?? "· unknown ·"}
        </Text>
      </Frame>
      <Frame title="REFERENCES" code="REF">
        {(refs.data ?? []).length === 0 ? <Status>No references catalogued.</Status> : null}
        {(refs.data ?? []).map((ref) => (
          <Text
            key={ref.id}
            onPress={() => ref.url && Linking.openURL(ref.url)}
            style={{ fontFamily: fonts.body, color: ref.url ? colors.cyan : colors.text, fontSize: 13 }}
          >
            {ref.label}
          </Text>
        ))}
      </Frame>
    </Screen>
  );
}

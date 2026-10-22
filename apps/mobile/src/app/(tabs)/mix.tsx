import { colors, fonts, toneColor, type Tone } from "@/constants/theme";
import { FinePrint, Frame, Lead, MissingArchive, PageTitle, QueryError, Screen, SearchField, Status, Tag, breakWord } from "@/components/ui";
import { fetchDrugs, fetchInteraction } from "@/lib/api";
import { cleanNames, cleanProse } from "@/lib/reading";
import { archiveConfigured } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SEV: Record<string, { tone: Tone; label: string; gloss: string }> = {
  low: { tone: "phosphor", label: "Low", gloss: "Mildest stored rank. This is not a clearance." },
  moderate: { tone: "amber", label: "Moderate", gloss: "Both substances still act. This is not permission to combine them." },
  dangerous: { tone: "red", label: "Dangerous", gloss: "This pair can injure." },
  deadly: { tone: "red", label: "Deadly", gloss: "This pair can kill." },
  unknown: { tone: "cyan", label: "Unknown", gloss: "The checker has no rank for this pair." },
};

const RANKS = ["low", "moderate", "dangerous", "deadly"] as const;

type Pick = { id: string; name: string };

const KNOWN_PAIRS = [
  ["Alcohol", "Heroin"],
  ["Naloxone", "Heroin"],
  ["Prazosin", "Sildenafil"],
] as const;

export default function MixScreen() {
  const params = useLocalSearchParams<{ drug?: string; name?: string }>();
  const drugs = useQuery({ queryKey: ["drug-index"], queryFn: () => fetchDrugs(), enabled: archiveConfigured });
  const [a, setA] = useState<Pick | null>(null);
  const [b, setB] = useState<Pick | null>(null);
  const [which, setWhich] = useState<"a" | "b" | null>(null);
  const [pairNote, setPairNote] = useState<string | null>(null);

  useEffect(() => {
    if (typeof params.drug === "string" && typeof params.name === "string" && params.drug && params.name) {
      setA({ id: params.drug, name: params.name });
    }
  }, [params.drug, params.name]);

  function openPair(left: string, right: string) {
    if (drugs.isLoading || !drugs.data) {
      setPairNote("The index is still opening. Try that pair again in a moment.");
      return;
    }
    const find = (name: string) => drugs.data?.find((drug) => drug.name === name && drug.id);
    const first = find(left);
    const second = find(right);
    if (!first?.id || !first.name || !second?.id || !second.name) {
      setPairNote("Those two names are not both in the index.");
      return;
    }
    setPairNote(null);
    setA({ id: first.id, name: first.name });
    setB({ id: second.id, name: second.name });
  }
  const interaction = useQuery({
    queryKey: ["interaction", a?.id, b?.id],
    queryFn: () => fetchInteraction(a!.id, b!.id),
    enabled: archiveConfigured && !!a && !!b && a.id !== b.id,
  });

  const sev = interaction.data ? (SEV[interaction.data.severity] ?? SEV.unknown) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <Screen safeTop>
      <PageTitle tone="red">Mix check</PageTitle>
      <Lead>Pick two substances. The note says what each one does, and what they do together. This is not medical advice and not a dosing tool.</Lead>
      {archiveConfigured ? null : <MissingArchive />}
      <PickerButton label="First substance" value={a?.name} onPress={() => setWhich("a")} />
      <PickerButton label="Second substance" value={b?.name} onPress={() => setWhich("b")} />
      <View style={{ flexDirection: "row", gap: 18, minHeight: 44, alignItems: "center" }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const nextA = b;
            setB(a);
            setA(nextA);
          }}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ fontFamily: fonts.body, color: colors.purple, fontSize: 16 }}>Swap</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setA(null); setB(null); }} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.body, color: colors.cyan, fontSize: 16 }}>Clear</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {KNOWN_PAIRS.map(([left, right]) => (
          <Pressable key={`${left}-${right}`} accessibilityRole="button" onPress={() => openPair(left, right)} style={{ minHeight: 36, justifyContent: "center" }}>
            <Tag tone="amber">{left} + {right}</Tag>
          </Pressable>
        ))}
      </View>
      {pairNote ? <Status>{pairNote}</Status> : null}

      <Frame title="Result" tone={sev?.tone ?? "phosphor"}>
        {!a || !b ? <Status>Choose two substances to see the pair.</Status> : null}
        {a && b && a.id === b.id ? <Status>Those are the same substance. Choose a second one.</Status> : null}
        {interaction.isLoading ? <Status>Checking the pair…</Status> : null}
        {interaction.error ? <QueryError error={interaction.error} /> : null}
        {a && b && a.id !== b.id && !interaction.isLoading && interaction.data ? (
          <View style={{ gap: 16 }}>
            <View accessibilityLabel={`Severity ${sev?.label ?? "unknown"}`} style={{ flexDirection: "row", gap: 8 }}>
              {RANKS.map((rank) => {
                const active = interaction.data?.severity === rank;
                const meta = SEV[rank];
                return (
                  <View key={rank} style={{ flex: 1, minWidth: 0, height: 8, borderRadius: 4, backgroundColor: active ? toneColor[meta.tone] : colors.line }} />
                );
              })}
            </View>
            <Text style={{ fontFamily: fonts.display, fontWeight: "700", color: toneColor[sev?.tone ?? "phosphor"], fontSize: 40, lineHeight: 48 }}>
              {sev?.label}
            </Text>
            <Text style={[breakWord, { fontFamily: fonts.body, fontWeight: "600", color: toneColor[sev?.tone ?? "phosphor"], fontSize: 18, lineHeight: 28 }]}>
              {sev?.gloss}
            </Text>
            <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 16, lineHeight: 26 }]}>
              {interaction.data.note || "This pair is catalogued. No further note is stored."}
            </Text>
          </View>
        ) : null}
        {a && b && a.id !== b.id && !interaction.isLoading && !interaction.data && !interaction.error ? (
          <View style={{ gap: 8 }}>
            <Tag tone="amber">No stored pair</Tag>
            <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 16, lineHeight: 26 }]}>
              The checker could not build a pair note for these two names. Treat both substances as acting in the same hour. This file has no dose.
            </Text>
          </View>
        ) : null}
      </Frame>
      {a && b && a.id !== b.id && interaction.data ? (
        <View style={{ gap: 10 }}>
          <SubstanceFacts drug={(drugs.data ?? []).find((drug) => drug.id === a.id)} />
          <SubstanceFacts drug={(drugs.data ?? []).find((drug) => drug.id === b.id)} />
        </View>
      ) : null}
      <Text style={[breakWord, { fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 24 }]}>
        Low, moderate, dangerous, and deadly describe the pair. None of those words means the mix is safe.
      </Text>
      <FinePrint />

    </Screen>
      <SubstanceModal
        open={which !== null}
        drugs={drugs.data ?? []}
        loading={drugs.isLoading}
        error={drugs.error}
        onClose={() => setWhich(null)}
        onPick={(pick) => {
          if (which === "a") setA(pick);
          if (which === "b") setB(pick);
          setWhich(null);
        }}
      />
    </View>
  );
}

function SubstanceFacts({
  drug,
}: {
  drug?: { name?: string | null; acute_risks?: string | null; overdose_signs?: string | null; harm_reduction?: string | null; contraindications?: string | null; testing?: string | null };
}) {
  if (!drug?.name) return null;
  return (
    <Frame title={drug.name} tone="amber">
      <Fact label="Acute" value={drug.acute_risks} />
      <Fact label="Overdose signs" value={drug.overdose_signs} />
      <Fact label="Harm reduction" value={drug.harm_reduction} />
      <Fact label="Contraindications" value={drug.contraindications} />
      <Fact label="Testing" value={drug.testing} />
    </Frame>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  const text = cleanProse(value);
  if (!text) return null;
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: fonts.body, fontWeight: "600", color: colors.muted, fontSize: 13, lineHeight: 18 }}>{label}</Text>
      <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 17, lineHeight: 28 }]}>{text}</Text>
    </View>
  );
}

function PickerButton({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  const size = value && value.length > 22 ? 20 : 26;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : `${label}, choose a substance`}
      onPress={onPress}
      style={{ borderWidth: 1, borderColor: colors.line, padding: 14, borderRadius: 14, backgroundColor: colors.panel, minHeight: 72, gap: 4 }}
    >
      <Text style={{ fontFamily: fonts.body, fontWeight: "600", color: colors.muted, fontSize: 13, lineHeight: 18 }}>{label}</Text>
      <Text numberOfLines={3} style={[breakWord, { fontFamily: fonts.display, fontWeight: "700", color: colors.phosphor, fontSize: size, lineHeight: size + 6 }]}>
        {value ?? "Choose a substance"}
      </Text>
    </Pressable>
  );
}

function SubstanceModal({
  open,
  drugs,
  loading,
  error,
  onClose,
  onPick,
}: {
  open: boolean;
  drugs: { id?: string; name?: string | null; aliases?: string[] | null; brand_names?: string[] | null; street_names?: string[] | null }[];
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onPick: (pick: Pick) => void;
}) {
  const insets = useSafeAreaInsets();
  const [term, setTerm] = useState("");
  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    const rows = drugs.filter((drug) => {
      if (!drug.id || !drug.name) return false;
      if (!q) return true;
      const names = [drug.name, ...cleanNames(drug.aliases), ...cleanNames(drug.brand_names), ...cleanNames(drug.street_names)].map((item) => item.toLowerCase());
      return names.some((item) => item.includes(q));
    });
    if (!q) return rows.slice(0, 80);
    const rank = (drug: (typeof rows)[number]) => {
      const name = drug.name!.toLowerCase();
      if (name === q) return 0;
      if (cleanNames(drug.aliases).some((item) => item.toLowerCase() === q)) return 1;
      if (cleanNames(drug.brand_names).concat(cleanNames(drug.street_names)).some((item) => item.toLowerCase() === q)) return 2;
      if (name.startsWith(q)) return 3;
      return 4;
    };
    return [...rows].sort((a, b) => rank(a) - rank(b) || a.name!.localeCompare(b.name!)).slice(0, 80);
  }, [drugs, term]);
  const matchCount = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return drugs.length;
    return drugs.filter((drug) => [drug.name, ...cleanNames(drug.aliases), ...cleanNames(drug.brand_names), ...cleanNames(drug.street_names)].some((item) => item?.toLowerCase().includes(q))).length;
  }, [drugs, term]);

  if (!open) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        backgroundColor: colors.bg,
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 12,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 }}>
        <Text numberOfLines={2} style={[breakWord, { flex: 1, fontFamily: fonts.display, fontWeight: "700", color: colors.phosphor, fontSize: 22, lineHeight: 28 }]}>Choose a substance</Text>
        <Pressable accessibilityRole="button" onPress={onClose} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8, flexShrink: 0 }}>
          <Text style={{ fontFamily: fonts.body, fontWeight: "600", color: colors.red, fontSize: 16 }}>Close</Text>
        </Pressable>
      </View>
      <SearchField value={term} onChangeText={setTerm} placeholder="Name, alias, or street name" />
      {loading ? <Status>Loading the index…</Status> : (
        <Status>
          {term.trim()
            ? `Showing ${filtered.length} of ${matchCount}.`
            : `Showing ${filtered.length} of ${drugs.length}. Type to search the rest.`}
        </Status>
      )}
      {error ? <QueryError error={error} /> : null}
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 72 }}
        data={filtered}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={!loading ? <Status>No names match. Try the catalogued name.</Status> : undefined}
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => onPick({ id: item.id!, name: item.name! })}
            style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, minHeight: 44 }}
          >
            <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 17, lineHeight: 26 }]}>{item.name}</Text>
            {term.trim() && item.name && !item.name.toLowerCase().includes(term.trim().toLowerCase()) ? (
              <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 22 }}>
                {cleanNames(item.aliases).concat(cleanNames(item.brand_names), cleanNames(item.street_names)).find((alias) => alias.toLowerCase().includes(term.trim().toLowerCase()))}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

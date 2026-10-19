import { colors, fonts, type Tone } from "@/constants/theme";
import { Banner, Frame, MissingArchive, PageTitle, QueryError, Screen, SearchField, Status, Tag, breakWord } from "@/components/ui";
import { fetchDrugs, fetchInteraction } from "@/lib/api";
import { archiveConfigured } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SEV: Record<string, { tone: Tone; label: string }> = {
  low: { tone: "phosphor", label: "LOW" },
  moderate: { tone: "amber", label: "MODERATE" },
  dangerous: { tone: "red", label: "DANGEROUS" },
  deadly: { tone: "red", label: "DEADLY" },
  unknown: { tone: "cyan", label: "UNKNOWN" },
};

type Pick = { id: string; name: string };

export default function MixScreen() {
  const drugs = useQuery({ queryKey: ["drug-index"], queryFn: () => fetchDrugs(), enabled: archiveConfigured });
  const [a, setA] = useState<Pick | null>(null);
  const [b, setB] = useState<Pick | null>(null);
  const [which, setWhich] = useState<"a" | "b" | null>(null);
  const interaction = useQuery({
    queryKey: ["interaction", a?.id, b?.id],
    queryFn: () => fetchInteraction(a!.id, b!.id),
    enabled: archiveConfigured && !!a && !!b && a.id !== b.id,
  });

  const sev = interaction.data ? (SEV[interaction.data.severity] ?? SEV.unknown) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <Screen safeTop>
      <PageTitle tone="red">MIX CHECK</PageTitle>
      {archiveConfigured ? null : <MissingArchive />}
      <Banner>
        Select two substances. The result names what each one does and what they do together. This is not medical advice and not a dosing tool.
      </Banner>
      <PickerButton label="SUBSTANCE A" value={a?.name} onPress={() => setWhich("a")} />
      <PickerButton label="SUBSTANCE B" value={b?.name} onPress={() => setWhich("b")} />
      <Pressable
        onPress={() => {
          const nextA = b;
          setB(a);
          setA(nextA);
        }}
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        <Text style={{ fontFamily: fonts.body, color: colors.purple, letterSpacing: 1 }}>SWAP</Text>
      </Pressable>

      <Frame title="RESULT" code="OUT" tone={sev?.tone ?? "phosphor"}>
        {!a || !b ? <Status>Awaiting two substances.</Status> : null}
        {a && b && a.id === b.id ? <Status>Same substance selected.</Status> : null}
        {interaction.isLoading ? <Status>Querying the matrix…</Status> : null}
        {interaction.error ? <QueryError error={interaction.error} /> : null}
        {a && b && a.id !== b.id && !interaction.isLoading && interaction.data ? (
          <View style={{ gap: 8 }}>
            <Tag tone={sev?.tone}>{sev?.label}</Tag>
            <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 14, lineHeight: 20 }]}>
              {interaction.data.note || "Catalogued. No further note is stored."}
            </Text>
          </View>
        ) : null}
        {a && b && a.id !== b.id && !interaction.isLoading && !interaction.data && !interaction.error ? (
          <View style={{ gap: 8 }}>
            <Tag tone="amber">PAIR</Tag>
            <Text style={[breakWord, { fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 18 }]}>
              The checker could not build a pair note for these two names. Treat both substances as acting in the same hour. This file has no dose.
            </Text>
          </View>
        ) : null}
      </Frame>

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

function PickerButton({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  const size = value && value.length > 22 ? 20 : 26;
  return (
    <Pressable
      onPress={onPress}
      style={{ borderWidth: 1, borderColor: colors.line, padding: 12, borderRadius: 4, backgroundColor: colors.panel, minHeight: 72 }}
    >
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 10, letterSpacing: 1 }}>{label}</Text>
      <Text numberOfLines={3} style={[breakWord, { fontFamily: fonts.display, color: colors.phosphor, fontSize: size, lineHeight: size + 4 }]}>
        {value ?? "Select"}
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
  drugs: { id?: string; name?: string | null }[];
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onPick: (pick: Pick) => void;
}) {
  const insets = useSafeAreaInsets();
  const [term, setTerm] = useState("");
  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return drugs.filter((drug) => drug.id && drug.name && (!q || drug.name.toLowerCase().includes(q))).slice(0, 80);
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
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
        <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 28 }}>SELECT</Text>
        <Pressable onPress={onClose} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }}>
          <Text style={{ fontFamily: fonts.body, color: colors.red, letterSpacing: 1 }}>CLOSE</Text>
        </Pressable>
      </View>
      <SearchField value={term} onChangeText={setTerm} placeholder="Filter by name" />
      {loading ? <Status>Loading the index…</Status> : null}
      {error ? <QueryError error={error} /> : null}
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 72 }}
        data={filtered}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPick({ id: item.id!, name: item.name! })}
            style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, minHeight: 44 }}
          >
            <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 14, lineHeight: 20 }]}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

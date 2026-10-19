import { colors, fonts, type Tone } from "@/constants/theme";
import { Banner, Frame, MissingArchive, QueryError, Screen, Status, Tag } from "@/components/ui";
import { fetchDrugs, fetchInteraction } from "@/lib/api";
import { archiveConfigured } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";

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
    <Screen>
      <Text style={{ fontFamily: fonts.display, color: colors.red, fontSize: 40 }}>MIX CHECK</Text>
      {archiveConfigured ? null : <MissingArchive />}
      <Banner>
        Select two substances. A missing record is not evidence of safety. This is not medical advice and not a dosing tool.
      </Banner>
      <PickerButton label="SUBSTANCE A" value={a?.name} onPress={() => setWhich("a")} />
      <PickerButton label="SUBSTANCE B" value={b?.name} onPress={() => setWhich("b")} />
      <Pressable
        onPress={() => {
          const nextA = b;
          setB(a);
          setA(nextA);
        }}
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
            <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 14, lineHeight: 20 }}>
              {interaction.data.note || "Catalogued. No further note is stored."}
            </Text>
          </View>
        ) : null}
        {a && b && a.id !== b.id && !interaction.isLoading && !interaction.data && !interaction.error ? (
          <View style={{ gap: 8 }}>
            <Tag tone="cyan">UNKNOWN</Tag>
            <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 18 }}>
              This combination is not catalogued. Assume unknown risk. A blank result is not a clearance.
            </Text>
          </View>
        ) : null}
      </Frame>

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
    </Screen>
  );
}

function PickerButton({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ borderWidth: 1, borderColor: colors.line, padding: 12, borderRadius: 4, backgroundColor: colors.panel }}>
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 10, letterSpacing: 1 }}>{label}</Text>
      <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 28 }}>{value ?? "Select"}</Text>
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
  const [term, setTerm] = useState("");
  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return drugs.filter((drug) => drug.id && drug.name && (!q || drug.name.toLowerCase().includes(q))).slice(0, 80);
  }, [drugs, term]);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16, paddingTop: 48, gap: 10 }}>
        <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 32 }}>SELECT</Text>
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder="Filter by name"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: colors.cyan, color: colors.text, fontFamily: fonts.body, padding: 10 }}
        />
        {loading ? <Status>Loading the index…</Status> : null}
        {error ? <QueryError error={error} /> : null}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id!}
          renderItem={({ item }) => (
            <Pressable onPress={() => onPick({ id: item.id!, name: item.name! })} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <Text style={{ fontFamily: fonts.body, color: colors.text }}>{item.name}</Text>
            </Pressable>
          )}
        />
        <Pressable onPress={onClose}>
          <Text style={{ fontFamily: fonts.body, color: colors.red, letterSpacing: 1 }}>CLOSE</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

import { colors, fonts } from "@/constants/theme";
import { NugMark } from "@/components/NugMark";
import { Banner, Field, FinePrint, Frame, Screen, Status, Tag, breakWord } from "@/components/ui";
import { fetchStrainBySlug } from "@/lib/api";
import { cleanProse, isTemplateStrainSummary, rangePercent } from "@/lib/reading";
import { EVIDENCE_TONE, STRAIN_TONE, type StrainType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { Linking, Text, View } from "react-native";

export default function StrainScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useQuery({
    queryKey: ["strain", slug],
    queryFn: () => fetchStrainBySlug(String(slug)),
    enabled: Boolean(slug),
  });
  const strain = query.data;
  if (query.isLoading) {
    return (
      <Screen>
        <Status>Opening file…</Status>
      </Screen>
    );
  }
  if (!strain) {
    return (
      <Screen>
        <Status>File not found.</Status>
      </Screen>
    );
  }
  const summary = cleanProse(strain.summary);
  const showSummary = Boolean(summary) && !isTemplateStrainSummary(strain.summary);
  const named = (strain.terpenes ?? []).filter(Boolean);
  const measured = strain.terpene_profile ?? [];
  const effects = (strain.effects ?? []).filter((item) => item && !/varies by person and batch/i.test(item));

  return (
    <Screen>
      <Stack.Screen options={{ title: strain.name }} />
      <NugMark slug={strain.slug} name={strain.name} type={strain.type} />
      <Text style={[breakWord, { fontFamily: fonts.display, color: colors.phosphor, fontSize: 36, lineHeight: 40 }]}>{strain.name}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        <Tag tone={STRAIN_TONE[strain.type as StrainType] ?? "phosphor"}>{strain.type}</Tag>
        <Tag tone={EVIDENCE_TONE[strain.confidence] ?? "cyan"}>{strain.confidence}</Tag>
      </View>
      <Banner>Not medical advice. Not a dose. The plate is the terminal reference. It is not a photograph of this batch.</Banner>
      {showSummary ? <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 14, lineHeight: 21 }]}>{summary}</Text> : null}
      <Frame title="CANNABINOIDS" code="CB">
        <Field label="THC" value={rangePercent(strain.thc_low, strain.thc_high)} />
        <Field label="CBD" value={rangePercent(strain.cbd_low, strain.cbd_high)} />
        {(strain.cannabinoids ?? []).map((item) => (
          <Field key={item.name} label={item.name} value={`${item.percent}%`} />
        ))}
        <Text style={[breakWord, { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }]}>
          A percent here is a published label or one registry filing. The next batch can differ.
        </Text>
      </Frame>
      <Frame title="TERPENES" code="TRP" tone="cyan">
        {measured.length > 0 ? (
          measured.map((item) => <Field key={item.name} label={item.name} value={`${item.percent}%`} />)
        ) : named.length > 0 ? (
          named.map((item) => <Field key={item} label={item} value="percentage not on file" />)
        ) : (
          <Status>No terpene assay is stored on this file.</Status>
        )}
      </Frame>
      <Frame title="MEDICAL BRANDS" code="RX" tone="amber">
        {(strain.products ?? []).length === 0 ? <Status>No medical seller is stored for this name.</Status> : null}
        {(strain.products ?? []).map((product) => (
          <View key={`${product.region}-${product.brand}-${product.product}`} style={{ gap: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line }}>
            <Text style={[breakWord, { fontFamily: fonts.bodyMedium, color: colors.phosphor, fontSize: 14 }]}>{product.brand}</Text>
            <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 18 }]}>
              {product.region === "AU" ? "Australia" : product.region === "US" ? "Connecticut, United States" : product.region} · {product.form || "flower"} · {product.product}
            </Text>
            <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12 }}>
              THC {product.thc_label || "not on the label"} · CBD {product.cbd_label || "not on the label"}
            </Text>
            {product.source ? <Text style={[breakWord, { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }]}>{product.source}</Text> : null}
            {product.source_url ? (
              <Text onPress={() => Linking.openURL(product.source_url!)} style={{ fontFamily: fonts.body, color: colors.cyan, fontSize: 13, minHeight: 32 }}>
                Source record
              </Text>
            ) : null}
          </View>
        ))}
      </Frame>
      <Frame title="FILE" code="META" tone="purple">
        <Field label="Lineage" value={strain.lineage || "not on file"} />
        {strain.assay_note ? <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }]}>{strain.assay_note}</Text> : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {effects.map((effect) => <Tag key={effect}>{effect}</Tag>)}
          {(strain.adverse ?? []).filter(Boolean).map((effect) => <Tag key={effect} tone="red">{effect}</Tag>)}
        </View>
      </Frame>
      <FinePrint />
    </Screen>
  );
}

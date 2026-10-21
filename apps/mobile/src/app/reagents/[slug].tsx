import { colors, fonts } from "@/constants/theme";
import { Frame, Screen, Status, Tag, breakWord } from "@/components/ui";
import { KITS } from "@/lib/reagents";
import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function ReagentKitScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const kit = KITS.find((item) => item.slug === slug);
  if (!kit) {
    return (
      <Screen>
        <Status>Kit not found.</Status>
      </Screen>
    );
  }
  return (
    <Screen>
      <Stack.Screen options={{ title: kit.name }} />
      <Text style={[breakWord, { fontFamily: fonts.display, fontWeight: "700", color: colors.cyan, fontSize: 34, lineHeight: 42 }]}>{kit.name}</Text>
      <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 17, lineHeight: 28 }}>{kit.blurb}</Text>
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 24 }}>{kit.use}</Text>
      <Frame title="Colours">
        {kit.rows.map((row) => (
          <View key={row.substance} style={{ gap: 8, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line }}>
            <Text style={{ fontFamily: fonts.body, fontWeight: "600", color: colors.phosphor, fontSize: 17, lineHeight: 26 }}>{row.substance}</Text>
            <Tag tone={row.tone}>{row.color}</Tag>
            {row.note ? <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 24 }}>{row.note}</Text> : null}
          </View>
        ))}
      </Frame>
    </Screen>
  );
}

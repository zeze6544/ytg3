import { colors, fonts } from "@/constants/theme";
import { Frame, Screen, Status, Tag } from "@/components/ui";
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
      <Text style={{ fontFamily: fonts.display, color: colors.cyan, fontSize: 42 }}>{kit.name}</Text>
      <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }}>{kit.blurb}</Text>
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }}>{kit.use}</Text>
      <Frame title="COLOURS" code={kit.slug.slice(0, 4).toUpperCase()}>
        {kit.rows.map((row) => (
          <View key={row.substance} style={{ gap: 4, paddingVertical: 6 }}>
            <Text style={{ fontFamily: fonts.body, color: colors.phosphor, fontSize: 13 }}>{row.substance}</Text>
            <Tag tone={row.tone}>{row.color}</Tag>
            {row.note ? <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12 }}>{row.note}</Text> : null}
          </View>
        ))}
      </Frame>
    </Screen>
  );
}

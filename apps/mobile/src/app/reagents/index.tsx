import { colors, fonts } from "@/constants/theme";
import { Banner, Frame, Screen } from "@/components/ui";
import { KITS, READ_ORDER } from "@/lib/reagents";
import { router } from "expo-router";
import { Pressable, Text } from "react-native";

export default function ReagentsScreen() {
  return (
    <Screen>
      <Banner tone="amber">
        Colour reactions never fully identify a substance, and they never tell you a dose. A matching colour is not a green light.
      </Banner>
      <Frame title="READ ORDER" code="RGT">
        {READ_ORDER.map((line, index) => (
          <Text key={line} style={{ fontFamily: fonts.body, color: colors.text, fontSize: 12, lineHeight: 18 }}>
            {String(index + 1).padStart(2, "0")}  {line}
          </Text>
        ))}
      </Frame>
      {KITS.map((kit) => (
        <Pressable
          key={kit.slug}
          onPress={() => router.push(`/reagents/${kit.slug}`)}
          style={{ borderWidth: 1, borderColor: colors.line, padding: 12, backgroundColor: colors.panel, borderRadius: 4, gap: 4 }}
        >
          <Text style={{ fontFamily: fonts.display, color: colors.cyan, fontSize: 28 }}>{kit.name}</Text>
          <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 12, lineHeight: 18 }}>{kit.blurb}</Text>
        </Pressable>
      ))}
      <Frame title="LIMITS" code="RTFM" tone="red">
        <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 12, lineHeight: 18 }}>
          Colours vary with light, temperature, sample size, and reagent age. A positive reaction does not tell you the amount. Fentanyl-contaminated MDMA can still look like MDMA on Marquis. No reagent detects everything.
        </Text>
      </Frame>
    </Screen>
  );
}

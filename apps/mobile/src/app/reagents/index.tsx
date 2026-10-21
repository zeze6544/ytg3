import { colors, fonts } from "@/constants/theme";
import { Banner, FileCard, Frame, Prose, Screen } from "@/components/ui";
import { KITS, READ_ORDER } from "@/lib/reagents";
import { router } from "expo-router";
import { Text } from "react-native";

export default function ReagentsScreen() {
  return (
    <Screen>
      <Banner tone="amber">
        Colour reactions never fully identify a substance, and they never tell you a dose. A matching colour is not a green light.
      </Banner>
      <Frame title="Read this order">
        {READ_ORDER.map((line, index) => (
          <Text key={line} style={{ fontFamily: fonts.body, color: colors.text, fontSize: 17, lineHeight: 28 }}>
            {index + 1}. {line}
          </Text>
        ))}
      </Frame>
      {KITS.map((kit) => (
        <FileCard key={kit.slug} onPress={() => router.push(`/reagents/${kit.slug}`)}>
          <Text style={{ fontFamily: fonts.display, fontWeight: "700", color: colors.cyan, fontSize: 28, lineHeight: 34 }}>{kit.name}</Text>
          <Prose>{kit.blurb}</Prose>
        </FileCard>
      ))}
      <Frame title="Limits" tone="red">
        <Prose>
          Colours vary with light, temperature, sample size, and reagent age. A positive reaction does not tell you the amount. Fentanyl-contaminated MDMA can still look like MDMA on Marquis. No reagent detects everything.
        </Prose>
      </Frame>
    </Screen>
  );
}

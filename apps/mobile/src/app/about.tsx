import { colors, fonts } from "@/constants/theme";
import { Frame, Screen, Wordmark } from "@/components/ui";
import { Text } from "react-native";

export default function AboutScreen() {
  return (
    <Screen>
      <Wordmark />
      <Frame title="WHAT THIS IS" code="README">
        <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }}>
          A personal archive of substances, strains, interactions, and history. It is written for people who want the evidence without the scare story, and for people looking after someone else. Evidence tiers sit on the entries so you can see how firm the record is.
        </Text>
        <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }}>
          It is not medical advice. Talk to a clinician, a pharmacist, or a harm-reduction service when a decision is medical. If someone is in immediate danger, contact local emergency services.
        </Text>
      </Frame>
      <Frame title="WHAT THIS IS NOT" code="NO" tone="red">
        <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }}>
          Not a shop. Not a dose calculator. Not synthesis instructions. Not a guide to obtaining a substance. Not a reason to use one. Every mix names what each substance does in the body. That description is not permission to combine them.
        </Text>
      </Frame>
    </Screen>
  );
}

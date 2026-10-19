import { colors, fonts } from "@/constants/theme";
import { Action, Frame } from "@/components/ui";
import { useGate } from "@/lib/gate";
import { Redirect } from "expo-router";
import { Text } from "react-native";
import { Screen } from "@/components/ui";

export default function GateScreen() {
  const gate = useGate();
  if (gate.accepted) return <Redirect href="/" />;

  return (
    <Screen contentContainerStyle={{ padding: 16, paddingTop: 72, gap: 14 }}>
      <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 64, lineHeight: 64 }}>
        NARC<Text style={{ color: colors.cyan }}>Ø</Text>DEX
      </Text>
      <Frame title="ADULT ARCHIVE" code="18+" tone="amber">
        <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }}>
          NARCØDEX is a harm-reduction reference for adults. It describes substances, risks,
          interactions, and history. It is not medical advice, not a dosing tool, and not a place
          to buy, make, or hide anything. It does not tell anyone to use drugs.
        </Text>
        <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }}>
          If someone is unresponsive, not breathing, or you think they have taken too much, contact
          local emergency services. Do not wait on this app.
        </Text>
      </Frame>
      <Action label="I am 18 or older. Enter the archive" onPress={() => void gate.accept()} />
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 11, lineHeight: 16 }}>
        If you are under 18, close the app. The archive stays locked until an adult confirms.
      </Text>
    </Screen>
  );
}

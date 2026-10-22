import { colors, fonts } from "@/constants/theme";
import { Action, Frame, Lead, Prose, Screen, Wordmark } from "@/components/ui";
import { useGate } from "@/lib/gate";
import { Redirect, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";

function safeNext(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/gate") || path.includes("://") || path.includes("\\")) return "/";
  return path;
}

export default function GateScreen() {
  const gate = useGate();
  const params = useLocalSearchParams<{ next?: string }>();
  if (gate.accepted) return <Redirect href={safeNext(params.next) as "/"} />;

  return (
    <Screen safeTop>
      <Wordmark />
      <Lead>An adult harm-reduction archive. You confirm your age before any file opens.</Lead>
      <Frame title="What this is" tone="amber">
        <Prose>
          NARCØDEX describes substances, risks, interactions, and history. It is not medical advice, not a dosing tool, and not a place to buy, make, or hide anything. It does not tell anyone to use drugs.
        </Prose>
        <Prose>
          If someone is unresponsive, not breathing, or you think they have taken too much, contact local emergency services. Do not wait on this app.
        </Prose>
      </Frame>
      <Action label="I am 18 or older. Enter the archive" onPress={() => void gate.accept()} />
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 24 }}>
        If you are under 18, close the app. The archive stays locked until an adult confirms.
      </Text>
    </Screen>
  );
}

import { colors, fonts } from "@/constants/theme";
import { Frame, Prose, Screen } from "@/components/ui";
import { Linking, Text } from "react-native";

export default function SupportScreen() {
  return (
    <Screen>
      <Frame title="Support" tone="cyan">
        <Prose>
          For a correction, a broken file, or an account deletion, open an issue on the archive repository. This app cannot give medical advice.
        </Prose>
        <Text
          accessibilityRole="link"
          onPress={() => Linking.openURL("https://github.com/zeze6544/ytg3/issues")}
          style={{ fontFamily: fonts.body, fontWeight: "600", color: colors.cyan, fontSize: 17, lineHeight: 28 }}
        >
          github.com/zeze6544/ytg3/issues
        </Text>
        <Text style={{ fontFamily: fonts.body, color: colors.red, fontSize: 17, lineHeight: 28 }}>
          If someone is unresponsive or you think they have taken too much, contact local emergency services. Do not wait on a reply from the archive.
        </Text>
      </Frame>
    </Screen>
  );
}

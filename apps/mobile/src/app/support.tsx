import { colors, fonts } from "@/constants/theme";
import { Frame, Screen } from "@/components/ui";
import { Linking, Text } from "react-native";

export default function SupportScreen() {
  return (
    <Screen>
      <Frame title="SUPPORT" code="HELP" tone="cyan">
        <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }}>
          For a correction, a broken file, or an account deletion, open an issue on the archive repository. This app cannot give medical advice.
        </Text>
        <Text
          onPress={() => Linking.openURL("https://github.com/zeze6544/ytg3/issues")}
          style={{ fontFamily: fonts.body, color: colors.cyan, fontSize: 13 }}
        >
          github.com/zeze6544/ytg3/issues
        </Text>
        <Text style={{ fontFamily: fonts.body, color: colors.red, fontSize: 13, lineHeight: 20 }}>
          If someone is unresponsive or you think they have taken too much, contact local emergency services. Do not wait on a reply from the archive.
        </Text>
      </Frame>
    </Screen>
  );
}

import { colors, fonts } from "@/constants/theme";
import { Frame, Screen } from "@/components/ui";
import { Text } from "react-native";

export default function PrivacyScreen() {
  return (
    <Screen>
      <Frame title="PRIVACY" code="POL">
        <Text style={copy}>
          Browsing the public archive does not require an account. NARCØDEX does not run advertising and does not sell personal information.
        </Text>
        <Text style={copy}>
          If you create an account, we store your email address, a user id, the files you save, and a private list of files you open while signed in. That data is used only to show you those lists. It is stored with our database provider, Supabase. You can sign out on the Access screen. To delete an account, write to the support address and ask.
        </Text>
        <Text style={copy}>
          The app does not request location, contacts, photos, camera, or tracking permission. Reference links, if you tap them, open in the system browser.
        </Text>
      </Frame>
    </Screen>
  );
}

const copy = { fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 };

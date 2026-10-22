import { Frame, Prose, Screen } from "@/components/ui";
import { accountsEnabled } from "@/lib/supabase";

export default function PrivacyScreen() {
  return (
    <Screen>
      <Frame title="Privacy">
        <Prose>
          Browsing the public archive does not require an account. NARCØDEX does not run advertising and does not sell personal information.
        </Prose>
        {accountsEnabled ? (
          <Prose>
            An optional account stores an email address, the files you save, and a private list of files you open while signed in. That list is only used to show those files back to you. You can sign out from the account screen.
          </Prose>
        ) : (
          <Prose>
            This build does not create accounts. Files you open are remembered on this device so the home screen can show them again. That list stays in the browser. Clearing site data removes it.
          </Prose>
        )}
        <Prose>
          The archive does not request location, contacts, photos, or camera access. A reference link, if you tap one, opens in the browser.
        </Prose>
      </Frame>
    </Screen>
  );
}

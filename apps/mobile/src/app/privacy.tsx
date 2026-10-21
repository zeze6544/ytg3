import { Frame, Prose, Screen } from "@/components/ui";

export default function PrivacyScreen() {
  return (
    <Screen>
      <Frame title="Privacy">
        <Prose>
          Browsing the public archive does not require an account. NARCØDEX does not run advertising and does not sell personal information.
        </Prose>
        <Prose>
          If you create an account, we store your email address, a user id, the files you save, and a private list of files you open while signed in. That data is used only to show you those lists. It is stored with our database provider, Supabase. You can sign out on the Account screen. To delete an account, write to the support address and ask.
        </Prose>
        <Prose>
          The app does not request location, contacts, photos, camera, or tracking permission. Reference links, if you tap them, open in the system browser.
        </Prose>
      </Frame>
    </Screen>
  );
}

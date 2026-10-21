import { colors, fonts } from "@/constants/theme";
import { Action, FileCard, Frame, Lead, PageTitle, Prose, Screen, breakWord } from "@/components/ui";
import { useIsAdmin } from "@/lib/admin";
import { useSession } from "@/lib/session";
import { router } from "expo-router";
import { Text } from "react-native";

const LINKS = [
  { href: "/classes", label: "Classes", note: "Pharmacological groups, and what each one does in the body." },
  { href: "/timeline", label: "Timeline", note: "A short history of the archive." },
  { href: "/reagents", label: "Reagents", note: "Colour checks, and what a colour cannot prove." },
  { href: "/saved", label: "Saved", note: "Bookmarks, and files opened on this device." },
  { href: "/about", label: "About", note: "What this app is, and what it is not." },
  { href: "/privacy", label: "Privacy", note: "What an account stores." },
  { href: "/support", label: "Support", note: "How to reach the archive." },
] as const;

export default function MoreScreen() {
  const { user } = useSession();
  const { isAdmin } = useIsAdmin();
  return (
    <Screen safeTop>
      <PageTitle>More</PageTitle>
      <Lead>Classes, history, reagents, and how this archive works on a phone.</Lead>
      <Frame title="Android app" tone="cyan">
        <Prose>
          The Android app is this same archive. It is not on the Play Store, and this site cannot host the install file. The file does not install on an iPhone.
        </Prose>
      </Frame>
      <Frame title="iPhone" tone="amber">
        <Prose>
          There is no signed iPhone app on this site. Safari can download a file. It cannot install an unsigned app, and a free Apple ID cannot install an IPA from the browser. Use this archive in the browser, or add it to the Home Screen from Share.
        </Prose>
      </Frame>
      <Frame title="Account" tone="cyan">
        <Prose>
          {user?.email ?? "You are browsing without an account. The public archive does not require one. Files you open are remembered on this device until you clear the browser."}
        </Prose>
        <Action label={user ? "Account" : "Sign in"} tone="cyan" onPress={() => router.push("/auth")} />
      </Frame>
      {LINKS.map((link) => (
        <FileCard key={link.href} onPress={() => router.push(link.href)}>
          <Text style={[breakWord, { fontFamily: fonts.display, fontWeight: "700", color: colors.phosphor, fontSize: 26, lineHeight: 32 }]}>{link.label}</Text>
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 24 }}>{link.note}</Text>
        </FileCard>
      ))}
      {isAdmin ? (
        <FileCard onPress={() => router.push("/admin/strains")}>
          <Text style={[breakWord, { fontFamily: fonts.display, fontWeight: "700", color: colors.red, fontSize: 26, lineHeight: 32 }]}>Strain maintenance</Text>
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 24 }}>Admin queues: images, duplicates, lineage, sources.</Text>
        </FileCard>
      ) : null}
    </Screen>
  );
}

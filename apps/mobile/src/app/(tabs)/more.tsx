import { colors, fonts } from "@/constants/theme";
import { FileCard, Frame, PageTitle, Prose, Screen, breakWord } from "@/components/ui";
import { useIsAdmin } from "@/lib/admin";
import { useSession } from "@/lib/session";
import { router } from "expo-router";
import { Pressable, Text } from "react-native";

const LINKS = [
  { href: "/classes", label: "Classes", note: "Pharmacological groups" },
  { href: "/timeline", label: "Timeline", note: "History of the archive" },
  { href: "/reagents", label: "Reagents", note: "Colour checks and their limits" },
  { href: "/saved", label: "Saved", note: "Account bookmarks and files opened on this device" },
  { href: "/about", label: "About", note: "What this app is, and is not" },
  { href: "/privacy", label: "Privacy", note: "What an account stores" },
  { href: "/support", label: "Support", note: "How to reach the archive" },
] as const;

export default function MoreScreen() {
  const { user } = useSession();
  const { isAdmin } = useIsAdmin();
  return (
    <Screen safeTop>
      <PageTitle>MORE</PageTitle>
      <Frame title="IPHONE" code="IOS" tone="amber">
        <Prose>
          There is no signed iPhone app on this site. Safari can download a file. It cannot install an unsigned app, and a free Apple ID cannot install an IPA from the browser. Use this archive in the browser.
        </Prose>
      </Frame>
      <Frame title="ACCOUNT" code="AUTH" tone="cyan">
        <Prose>
          {user?.email ?? "Browsing without an account. The public archive does not require one. Files you open are remembered on this device until you clear the browser."}
        </Prose>
        <Pressable onPress={() => router.push("/auth")} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.body, color: colors.cyan, letterSpacing: 1 }}>
            {user ? "ACCOUNT" : "SIGN IN"}
          </Text>
        </Pressable>
      </Frame>
      {LINKS.map((link) => (
        <FileCard key={link.href} onPress={() => router.push(link.href)}>
          <Text style={[breakWord, { fontFamily: fonts.display, color: colors.phosphor, fontSize: 26, lineHeight: 28 }]}>{link.label}</Text>
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12 }}>{link.note}</Text>
        </FileCard>
      ))}
      {isAdmin ? (
        <FileCard onPress={() => router.push("/admin/strains")}>
          <Text style={[breakWord, { fontFamily: fonts.display, color: colors.red, fontSize: 26, lineHeight: 28 }]}>Strain maintenance</Text>
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12 }}>Admin queues: images, duplicates, lineage, sources</Text>
        </FileCard>
      ) : null}
    </Screen>
  );
}

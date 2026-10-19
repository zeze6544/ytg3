import { colors, fonts } from "@/constants/theme";
import { Frame, Screen } from "@/components/ui";
import { useSession } from "@/lib/session";
import { router } from "expo-router";
import { Pressable, Text } from "react-native";

const LINKS = [
  { href: "/classes", label: "Classes", note: "Pharmacological groups" },
  { href: "/timeline", label: "Timeline", note: "History of the archive" },
  { href: "/reagents", label: "Reagents", note: "Colour checks and their limits" },
  { href: "/saved", label: "Saved", note: "Bookmarks and reading history" },
  { href: "/about", label: "About", note: "What this app is, and is not" },
  { href: "/privacy", label: "Privacy", note: "What an account stores" },
  { href: "/support", label: "Support", note: "How to reach the archive" },
] as const;

export default function MoreScreen() {
  const { user } = useSession();
  return (
    <Screen>
      <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 40 }}>MORE</Text>
      <Frame title="ACCOUNT" code="AUTH" tone="cyan">
        <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 13 }}>
          {user?.email ?? "Browsing without an account. The public archive does not require one."}
        </Text>
        <Pressable onPress={() => router.push("/auth")}>
          <Text style={{ fontFamily: fonts.body, color: colors.cyan, letterSpacing: 1 }}>
            {user ? "ACCOUNT" : "SIGN IN"}
          </Text>
        </Pressable>
      </Frame>
      {LINKS.map((link) => (
        <Pressable
          key={link.href}
          onPress={() => router.push(link.href)}
          style={{ borderWidth: 1, borderColor: colors.line, padding: 14, borderRadius: 4, backgroundColor: colors.panel }}
        >
          <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 28 }}>{link.label}</Text>
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12 }}>{link.note}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

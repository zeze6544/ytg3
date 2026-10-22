import { colors, fonts } from "@/constants/theme";
import { FileCard, Lead, PageTitle, Screen, breakWord } from "@/components/ui";
import { useIsAdmin } from "@/lib/admin";
import { router } from "expo-router";
import { Text } from "react-native";

const LINKS = [
  { href: "/classes", label: "Classes", note: "Pharmacological groups, and what each one does in the body." },
  { href: "/timeline", label: "Timeline", note: "A short history of the archive." },
  { href: "/reagents", label: "Reagents", note: "Colour checks, and what a colour cannot prove." },
  { href: "/saved", label: "Saved", note: "Bookmarks, and files opened on this device." },
  { href: "/about", label: "About", note: "What this app is, and what it is not." },
  { href: "/privacy", label: "Privacy", note: "What an account stores." },
] as const;

export default function MoreScreen() {
  const { isAdmin } = useIsAdmin();
  return (
    <Screen safeTop>
      <PageTitle>More</PageTitle>
      <Lead>Classes, history, reagents, and how this archive works on a phone.</Lead>
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

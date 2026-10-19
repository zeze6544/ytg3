import { colors, fonts } from "@/constants/theme";
import { QueryError, Screen, Status, Tag, breakWord } from "@/components/ui";
import { fetchClasses, fetchDrugs } from "@/lib/api";
import { CATEGORY_TONE } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text } from "react-native";

export default function ClassesScreen() {
  const classes = useQuery({ queryKey: ["classes"], queryFn: fetchClasses });
  const drugs = useQuery({ queryKey: ["drugs", "", "all"], queryFn: () => fetchDrugs() });
  const counts = new Map<string, number>();
  (drugs.data ?? []).forEach((drug) => {
    const tags = drug.risk_classes?.length ? drug.risk_classes : drug.category ? [drug.category] : [];
    tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
  });

  return (
    <Screen>
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12 }}>
        Substances grouped by pharmacological class.
      </Text>
      {classes.isLoading ? <Status>Loading classes…</Status> : null}
      {classes.error ? <QueryError error={classes.error} /> : null}
      {(classes.data ?? []).map((item) => (
        <Pressable
          key={item.id}
          onPress={() => router.push("/files")}
          style={{ borderWidth: 1, borderColor: colors.line, padding: 12, borderRadius: 4, backgroundColor: colors.panel, gap: 6 }}
        >
          <Text style={[breakWord, { fontFamily: fonts.display, color: colors.phosphor, fontSize: 28, lineHeight: 32 }]}>{item.name}</Text>
          <Tag tone={CATEGORY_TONE[item.slug] ?? "phosphor"}>{counts.get(item.slug) ?? 0} files</Tag>
          {item.description ? (
            <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 12, lineHeight: 18 }}>{item.description}</Text>
          ) : null}
        </Pressable>
      ))}
    </Screen>
  );
}

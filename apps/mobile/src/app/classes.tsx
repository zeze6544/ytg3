import { colors, fonts } from "@/constants/theme";
import { FileCard, Prose, QueryError, Screen, Status, Tag, breakWord } from "@/components/ui";
import { fetchCategoryCounts, fetchClasses } from "@/lib/api";
import { readingFor } from "@/lib/briefing";
import { CATEGORY_TONE } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Text } from "react-native";

export default function ClassesScreen() {
  const classes = useQuery({ queryKey: ["classes"], queryFn: fetchClasses });
  const counts = fetchCategoryCounts();

  return (
    <Screen>
      <Prose>
        Each class is a way the substance acts. Open one to see only those files. A class label is not a dose and not a reason to use it.
      </Prose>
      {classes.isLoading ? <Status>Loading classes…</Status> : null}
      {classes.error ? <QueryError error={classes.error} /> : null}
      {(classes.data ?? []).map((item) => (
        <FileCard key={item.id} onPress={() => router.push({ pathname: "/files", params: { cat: item.slug } })}>
          <Text style={[breakWord, { fontFamily: fonts.display, fontWeight: "700", color: colors.phosphor, fontSize: 28, lineHeight: 34 }]}>{item.name}</Text>
          <Tag tone={CATEGORY_TONE[item.slug] ?? "phosphor"}>{counts[item.slug] ?? 0} files</Tag>
          {item.description ? (
            <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 17, lineHeight: 28 }}>{item.description}</Text>
          ) : null}
          {(readingFor(item.slug, [])[0]?.paragraphs ?? []).map((paragraph) => (
            <Text key={paragraph.slice(0, 40)} style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 17, lineHeight: 28 }]}>
              {paragraph}
            </Text>
          ))}
        </FileCard>
      ))}
    </Screen>
  );
}

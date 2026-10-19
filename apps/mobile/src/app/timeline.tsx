import { colors, fonts } from "@/constants/theme";
import { QueryError, Screen, Status, Tag, breakWord } from "@/components/ui";
import { fetchTimeline } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

export default function TimelineScreen() {
  const query = useQuery({ queryKey: ["timeline"], queryFn: fetchTimeline });
  return (
    <Screen>
      <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }}>
        Milestones in pharmacology, policy, and psychoactive history.
      </Text>
      {query.isLoading ? <Status>Loading timeline…</Status> : null}
      {query.error ? <QueryError error={query.error} /> : null}
      {(query.data ?? []).map((event) => (
        <View key={event.id} style={{ borderLeftWidth: 2, borderLeftColor: colors.phosphor, paddingLeft: 12, gap: 4 }}>
          <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 28 }}>{event.year}</Text>
          <Text style={[breakWord, { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 14, lineHeight: 20 }]}>{event.title}</Text>
          {event.category ? <Tag tone="cyan">{event.category}</Tag> : null}
          {event.description ? (
            <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }}>{event.description}</Text>
          ) : null}
        </View>
      ))}
    </Screen>
  );
}

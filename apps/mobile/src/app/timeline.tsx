import { colors, fonts } from "@/constants/theme";
import { ChipScroller, Prose, QueryError, Screen, SearchField, Status, Tag, breakWord } from "@/components/ui";
import { fetchTimeline } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function TimelineScreen() {
  const query = useQuery({ queryKey: ["timeline"], queryFn: fetchTimeline });
  const [search, setSearch] = useState("");
  const [century, setCentury] = useState<string>("all");
  const events = query.data ?? [];
  const centuries = useMemo(() => {
    const set = new Set(events.map((event) => `${Math.floor(event.year / 100) * 100}`));
    return ["all", ...[...set].sort()];
  }, [events]);
  const rows = events.filter((event) => {
    const term = search.trim().toLowerCase();
    const text = `${event.year} ${event.title} ${event.description ?? ""}`.toLowerCase();
    if (term && !text.includes(term)) return false;
    if (century !== "all" && Math.floor(event.year / 100) * 100 !== Number(century)) return false;
    return true;
  });

  return (
    <Screen>
      <Prose>Milestones in pharmacology, policy, and psychoactive history. The year is context, not a recipe.</Prose>
      <SearchField value={search} onChangeText={setSearch} placeholder="Year or event" />
      <ChipScroller>
        {centuries.map((item) => {
          const on = century === item;
          return (
            <Pressable key={item} accessibilityRole="button" onPress={() => setCentury(item)} style={{ minHeight: 36, justifyContent: "center" }}>
              <Tag filled={on} tone={on ? "phosphor" : "cyan"}>{item === "all" ? "All years" : `${item}s`}</Tag>
            </Pressable>
          );
        })}
      </ChipScroller>
      {query.isLoading ? <Status>Loading timeline…</Status> : <Status>{rows.length} events</Status>}
      {query.error ? <QueryError error={query.error} /> : null}
      {rows.map((event) => (
        <View key={event.id} style={{ borderLeftWidth: 3, borderLeftColor: colors.phosphor, paddingLeft: 16, gap: 8 }}>
          <Text style={{ fontFamily: fonts.display, fontWeight: "700", color: colors.phosphor, fontSize: 28, lineHeight: 34 }}>{event.year}</Text>
          <Text style={[breakWord, { fontFamily: fonts.body, fontWeight: "600", color: colors.text, fontSize: 17, lineHeight: 26 }]}>{event.title}</Text>
          {event.category ? <Tag tone="cyan">{event.category}</Tag> : null}
          {event.description ? (
            <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 16, lineHeight: 26 }}>{event.description}</Text>
          ) : null}
        </View>
      ))}
      {!query.isLoading && rows.length === 0 ? <Status>No events match.</Status> : null}
    </Screen>
  );
}
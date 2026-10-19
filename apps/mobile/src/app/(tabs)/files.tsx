import { colors, fonts } from "@/constants/theme";
import { ChipWrap, MissingArchive, NameRow, PageTitle, QueryError, SearchField, Status, Tag, useScreenInsets } from "@/components/ui";
import { fetchDrugs } from "@/lib/api";
import { archiveConfigured } from "@/lib/supabase";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_TONE, type DrugCategory } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

export default function FilesScreen() {
  const insets = useScreenInsets(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("all");
  const query = useQuery({
    queryKey: ["drugs", search, cat],
    queryFn: () => fetchDrugs({ search, category: cat }),
    enabled: archiveConfigured,
  });
  const matches = query.data ?? [];
  const rows = matches.slice(0, 60);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ ...insets, gap: 8 }}
      data={rows}
      keyExtractor={(item) => item.id ?? item.slug ?? item.name ?? "row"}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 10, marginBottom: 8 }}>
          <PageTitle>FILES</PageTitle>
          {archiveConfigured ? null : <MissingArchive />}
          <SearchField value={search} onChangeText={setSearch} placeholder="Search the archive" />
          <ChipWrap>
            {CATEGORIES.map((item) => {
              const on = cat === item;
              return (
                <Pressable key={item} onPress={() => setCat(item)}>
                  <Tag filled={on} tone={on ? "phosphor" : "cyan"}>
                    {item === "all" ? "All" : CATEGORY_LABELS[item]}
                  </Tag>
                </Pressable>
              );
            })}
          </ChipWrap>
          {query.isLoading ? (
            <Status>Loading records…</Status>
          ) : (
            <Status>
              {matches.length > rows.length ? `${rows.length} shown · ${matches.length} match` : `${rows.length} results`}
            </Status>
          )}
          {query.error ? <QueryError error={query.error} /> : null}
        </View>
      }
      ListEmptyComponent={archiveConfigured && !query.isLoading ? <Status>No records match.</Status> : undefined}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => item.slug && router.push(`/drug/${item.slug}`)}
          style={{ borderWidth: 1, borderColor: colors.line, padding: 12, borderRadius: 4, gap: 6, backgroundColor: colors.panel }}
        >
          <NameRow
            name={item.name ?? "Untitled"}
            tag={CATEGORY_LABELS[item.category ?? "other"]}
            tone={CATEGORY_TONE[item.category as DrugCategory] ?? "phosphor"}
          />
          {item.summary ? (
            <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12 }} numberOfLines={3}>
              {item.summary}
            </Text>
          ) : null}
        </Pressable>
      )}
    />
  );
}

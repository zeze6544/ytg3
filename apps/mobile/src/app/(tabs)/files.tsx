import { colors, fonts } from "@/constants/theme";
import { ChipScroller, FileCard, FinePrint, LoadMore, MissingArchive, NameRow, PageTitle, QueryError, SearchField, Status, Tag, useScreenInsets } from "@/components/ui";
import { fetchDrugs } from "@/lib/api";
import { blurb } from "@/lib/reading";
import { archiveConfigured } from "@/lib/supabase";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_TONE, type DrugCategory } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

const PAGE = 40;

export default function FilesScreen() {
  const insets = useScreenInsets(true);
  const params = useLocalSearchParams<{ cat?: string }>();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [shown, setShown] = useState(PAGE);
  const query = useQuery({
    queryKey: ["drugs", term, cat],
    queryFn: () => fetchDrugs({ search: term, category: cat }),
    enabled: archiveConfigured,
  });
  const matches = query.data ?? [];
  const rows = matches.slice(0, shown);

  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 140);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const next = typeof params.cat === "string" ? params.cat : "";
    if (next && (CATEGORIES as string[]).includes(next)) setCat(next);
  }, [params.cat]);

  useEffect(() => {
    setShown(PAGE);
  }, [term, cat]);

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
          <SearchField value={search} onChangeText={setSearch} placeholder="Name, alias, or street name" />
          <ChipScroller>
            {CATEGORIES.map((item) => {
              const on = cat === item;
              return (
                <Pressable key={item} accessibilityRole="button" onPress={() => setCat(item)} style={{ minHeight: 36, justifyContent: "center" }}>
                  <Tag filled={on} tone={on ? "phosphor" : "cyan"}>
                    {item === "all" ? "All" : CATEGORY_LABELS[item]}
                  </Tag>
                </Pressable>
              );
            })}
          </ChipScroller>
          {query.isLoading ? (
            <Status>Loading records…</Status>
          ) : (
            <Status>
              {cat !== "all" ? `${CATEGORY_LABELS[cat] ?? cat}. ` : ""}
              {matches.length > rows.length ? `Showing ${rows.length} of ${matches.length}.` : `${rows.length} results.`}
            </Status>
          )}
          {query.error ? <QueryError error={query.error} /> : null}
        </View>
      }
      ListEmptyComponent={
        archiveConfigured && !query.isLoading ? (
          <View style={{ gap: 8 }}>
            <Status>No records match.</Status>
            <LoadMore label="Clear the filter" onPress={() => { setSearch(""); setCat("all"); }} />
          </View>
        ) : undefined
      }
      ListFooterComponent={
        <View style={{ gap: 10, marginTop: 8 }}>
          {shown < matches.length ? (
            <LoadMore
              label={`Show ${Math.min(PAGE, matches.length - shown)} more`}
              onPress={() => setShown((count) => count + PAGE)}
            />
          ) : null}
          <FinePrint />
        </View>
      }
      renderItem={({ item }) => (
        <FileCard onPress={() => item.slug && router.push(`/drug/${item.slug}`)}>
          <NameRow
            name={item.name ?? "Untitled"}
            tag={CATEGORY_LABELS[item.category ?? "other"]}
            tone={CATEGORY_TONE[item.category as DrugCategory] ?? "phosphor"}
          />
          {item.summary ? (
            <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 18 }} numberOfLines={3}>
              {blurb(item.summary)}
            </Text>
          ) : null}
        </FileCard>
      )}
    />
  );
}

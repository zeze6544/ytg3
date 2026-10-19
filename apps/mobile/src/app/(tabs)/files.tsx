import { colors, fonts } from "@/constants/theme";
import { MissingArchive, QueryError, Status, Tag } from "@/components/ui";
import { fetchDrugs } from "@/lib/api";
import { archiveConfigured } from "@/lib/supabase";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_TONE, type DrugCategory } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function FilesScreen() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("all");
  const query = useQuery({
    queryKey: ["drugs", search, cat],
    queryFn: () => fetchDrugs({ search, category: cat }),
    enabled: archiveConfigured,
  });

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 8 }}
      data={query.data ?? []}
      keyExtractor={(item) => item.id ?? item.slug ?? item.name ?? "row"}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 10, marginBottom: 8 }}>
          <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 40 }}>FILES</Text>
          {archiveConfigured ? null : <MissingArchive />}
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="SEARCH THE ARCHIVE"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              borderWidth: 1,
              borderColor: colors.phosphor,
              color: colors.phosphor,
              fontFamily: fonts.body,
              padding: 12,
              borderRadius: 4,
            }}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {CATEGORIES.map((item) => {
              const on = cat === item;
              return (
                <Pressable key={item} onPress={() => setCat(item)}>
                  <Tag tone={on ? "phosphor" : "cyan"}>{item === "all" ? "All" : CATEGORY_LABELS[item]}</Tag>
                </Pressable>
              );
            })}
          </ScrollView>
          {query.isLoading ? <Status>Loading records…</Status> : <Status>{query.data?.length ?? 0} results</Status>}
          {query.error ? <QueryError error={query.error} /> : null}
        </View>
      }
      ListEmptyComponent={archiveConfigured && !query.isLoading ? <Status>No records match.</Status> : undefined}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => item.slug && router.push(`/drug/${item.slug}`)}
          style={{ borderWidth: 1, borderColor: colors.line, padding: 12, borderRadius: 4, gap: 6, backgroundColor: colors.panel }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <Text style={{ fontFamily: fonts.display, color: colors.phosphor, fontSize: 26, flex: 1 }} numberOfLines={1}>
              {item.name}
            </Text>
            <Tag tone={CATEGORY_TONE[item.category as DrugCategory] ?? "phosphor"}>
              {CATEGORY_LABELS[item.category ?? "other"]}
            </Tag>
          </View>
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

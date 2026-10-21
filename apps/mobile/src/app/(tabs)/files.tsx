import { colors, fonts } from "@/constants/theme";
import { ChipWrap, FileCard, FinePrint, Lead, LoadMore, MissingArchive, NameRow, PageTitle, QueryError, SearchField, Status, Tag, useScreenInsets } from "@/components/ui";
import { fetchCommonDrugs, fetchDrugs } from "@/lib/api";
import { blurb } from "@/lib/reading";
import { archiveConfigured } from "@/lib/supabase";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_TONE, type DrugCategory } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

const PAGE = 40;
const LETTERS = ["common", "all", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), "#"];

function initial(name: string) {
  const letter = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(letter) ? letter : "#";
}

export default function FilesScreen() {
  const insets = useScreenInsets(true);
  const params = useLocalSearchParams<{ cat?: string }>();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [shelf, setShelf] = useState("common");
  const [shown, setShown] = useState(PAGE);
  const commonShelf = shelf === "common" && !term;
  const query = useQuery({
    queryKey: ["drugs", term, cat, commonShelf ? "common" : "index"],
    queryFn: async () => {
      if (!commonShelf) return fetchDrugs({ search: term, category: cat });
      const rows = await fetchCommonDrugs();
      return cat === "all" ? rows : rows.filter((drug) => drug.category === cat);
    },
    enabled: archiveConfigured,
  });
  const pool = query.data ?? [];
  const matches = !term && shelf !== "common" && shelf !== "all" ? pool.filter((drug) => initial(drug.name ?? "") === shelf) : pool;
  const rows = matches.slice(0, shown);

  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 140);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const next = typeof params.cat === "string" ? params.cat : "";
    if (next && (CATEGORIES as string[]).includes(next)) {
      setCat(next);
      setShelf("all");
    }
  }, [params.cat]);

  useEffect(() => {
    setShown(PAGE);
  }, [term, cat, shelf]);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ ...insets, gap: 16 }}
      data={rows}
      keyExtractor={(item) => item.id ?? item.slug ?? item.name ?? "row"}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 8 }}>
          <PageTitle>Substances</PageTitle>
          <Lead>Search a name, an alias, or a street name. Each file describes risks. None of them is a dose.</Lead>
          {archiveConfigured ? null : <MissingArchive />}
          <SearchField value={search} onChangeText={setSearch} placeholder="Name, alias, or street name" />
          <ChipWrap>
            {LETTERS.map((item) => {
              const on = shelf === item && !term;
              const label = item === "common" ? "Common" : item === "all" ? "All" : item;
              return (
                <Pressable key={item} accessibilityRole="button" onPress={() => { setShelf(item); setSearch(""); }} style={{ minHeight: 44, justifyContent: "center" }}>
                  <Tag filled={on} tone={on ? "amber" : "phosphor"}>{label}</Tag>
                </Pressable>
              );
            })}
          </ChipWrap>
          <ChipWrap>
            {CATEGORIES.map((item) => {
              const on = cat === item;
              return (
                <Pressable key={item} accessibilityRole="button" onPress={() => setCat(item)} style={{ minHeight: 44, justifyContent: "center" }}>
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
              {term ? `Search. ` : commonShelf ? "Common shelf. " : shelf !== "all" && shelf !== "common" ? `Names starting with ${shelf}. ` : ""}
              {cat !== "all" ? `${CATEGORY_LABELS[cat] ?? cat}. ` : ""}
              {matches.length > rows.length ? `Showing ${rows.length} of ${matches.length}.` : `${rows.length} files.`}
              {commonShelf && !term ? " All and the letters open the rest of the index." : ""}
            </Status>
          )}
          {query.error ? <QueryError error={query.error} /> : null}
        </View>
      }
      ListEmptyComponent={
        archiveConfigured && !query.isLoading ? (
          <View style={{ gap: 8 }}>
            <Status>No records match.</Status>
            <LoadMore label="Back to the common shelf" onPress={() => { setSearch(""); setCat("all"); setShelf("common"); }} />
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
          {blurb(item.acute_risks, 220) || blurb(item.summary) ? (
            <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 15, lineHeight: 24 }} numberOfLines={3}>
              {blurb(item.acute_risks, 220) || blurb(item.summary)}
            </Text>
          ) : null}
        </FileCard>
      )}
    />
  );
}

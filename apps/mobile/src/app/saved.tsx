import { colors, fonts } from "@/constants/theme";
import { Frame, Screen, Status, Tag, breakWord } from "@/components/ui";
import { useSession } from "@/lib/session";
import { requireClient } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

type SavedRow = {
  id: string;
  drug: { slug: string; name: string; category: string } | null;
  strain: { slug: string; name: string; type: string } | null;
};
type HistoryRow = {
  id: string;
  viewed_at: string;
  drug: { slug: string; name: string; category: string } | null;
};

async function loadSaved() {
  const sb = requireClient();
  const [saved, history] = await Promise.all([
    sb
      .from("saved_entries")
      .select("id, drug:drugs(slug,name,category), strain:strains(slug,name,type)")
      .order("created_at", { ascending: false }),
    sb
      .from("view_history")
      .select("id, viewed_at, drug:drugs(slug,name,category)")
      .order("viewed_at", { ascending: false })
      .limit(30),
  ]);
  if (saved.error) throw saved.error;
  if (history.error) throw history.error;
  return {
    saved: (saved.data ?? []) as unknown as SavedRow[],
    history: (history.data ?? []) as unknown as HistoryRow[],
  };
}

export default function SavedScreen() {
  const { user, loading } = useSession();
  const query = useQuery({ queryKey: ["saved", user?.id], queryFn: loadSaved, enabled: Boolean(user) });

  if (loading) {
    return (
      <Screen>
        <Status>Opening your account…</Status>
      </Screen>
    );
  }
  if (!user) {
    return <Screen />;
  }

  const savedCount = query.data?.saved.length ?? 0;
  const historyCount = query.data?.history.length ?? 0;
  const badges = [
    { label: "Archivist", earned: savedCount >= 1, desc: "Save 1 file" },
    { label: "Collector", earned: savedCount >= 10, desc: "Save 10 files" },
    { label: "Cartographer", earned: savedCount >= 25, desc: "Save 25 files" },
    { label: "Safety reader", earned: historyCount >= 5, desc: "Open 5 records" },
    { label: "Deep researcher", earned: historyCount >= 25, desc: "Open 25 records" },
  ];

  return (
    <Screen>
      <Frame title="Reading marks" tone="amber">
        <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 24 }}>
          These marks count files you save and open. They do not mark use.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {badges.map((badge) => (
            <Tag key={badge.label} tone={badge.earned ? "amber" : "cyan"}>
              {badge.earned ? badge.label : badge.desc}
            </Tag>
          ))}
        </View>
      </Frame>
      {query.isLoading ? <Status>Loading your files…</Status> : null}
      {(query.data?.saved ?? []).map((item) => {
        const file = item.drug ?? item.strain;
        if (!file) return null;
        return (
          <Pressable key={item.id} accessibilityRole="button" onPress={() => item.drug && router.push(`/drug/${item.drug.slug}`)} style={{ minHeight: 48, justifyContent: "center" }}>
            <Text style={[breakWord, { fontFamily: fonts.display, fontWeight: "700", color: colors.phosphor, fontSize: 26, lineHeight: 32 }]}>{file.name}</Text>
          </Pressable>
        );
      })}
      {(query.data?.saved.length ?? 0) === 0 && !query.isLoading ? <Status>No saved entries.</Status> : null}
      <Frame title="Recent">
        {(query.data?.history ?? []).map((item) =>
          item.drug ? (
            <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(`/drug/${item.drug!.slug}`)} style={{ minHeight: 48, justifyContent: "center" }}>
              <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 17, lineHeight: 28 }]}>{item.drug.name}</Text>
            </Pressable>
          ) : null,
        )}
      </Frame>
    </Screen>
  );
}

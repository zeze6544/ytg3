import { colors, fonts } from "@/constants/theme";
import { Action, Frame, Screen, Status, Tag, breakWord } from "@/components/ui";
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
        <Status>Booting…</Status>
      </Screen>
    );
  }
  if (!user) {
    return (
      <Screen>
        <Frame title="ACCESS" tone="red">
          <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 20 }}>
            Sign in to keep saved files and a private reading history. The public archive stays open without an account.
          </Text>
          <Action label="Sign in" tone="cyan" onPress={() => router.push("/auth")} />
        </Frame>
      </Screen>
    );
  }

  const savedCount = query.data?.saved.length ?? 0;
  const historyCount = query.data?.history.length ?? 0;
  const badges = [
    { label: "ARCHIVIST", earned: savedCount >= 1, desc: "Save 1 file" },
    { label: "COLLECTOR", earned: savedCount >= 10, desc: "Save 10 files" },
    { label: "CARTOGRAPHER", earned: savedCount >= 25, desc: "Save 25 files" },
    { label: "SAFETY READER", earned: historyCount >= 5, desc: "Open 5 records" },
    { label: "DEEP RESEARCHER", earned: historyCount >= 25, desc: "Open 25 records" },
  ];

  return (
    <Screen>
      <Frame title="BADGES" code="ACHV" tone="amber">
        <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 11 }}>
          Badges mark reading. They do not mark use.
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
          <Pressable key={item.id} onPress={() => item.drug && router.push(`/drug/${item.drug.slug}`)}>
            <Text style={[breakWord, { fontFamily: fonts.display, color: colors.phosphor, fontSize: 26, lineHeight: 30 }]}>{file.name}</Text>
          </Pressable>
        );
      })}
      {(query.data?.saved.length ?? 0) === 0 && !query.isLoading ? <Status>No saved entries.</Status> : null}
      <Frame title="RECENT" code="HIS">
        {(query.data?.history ?? []).map((item) =>
          item.drug ? (
            <Pressable key={item.id} onPress={() => router.push(`/drug/${item.drug!.slug}`)}>
              <Text style={[breakWord, { fontFamily: fonts.body, color: colors.text, fontSize: 13, lineHeight: 18 }]}>{item.drug.name}</Text>
            </Pressable>
          ) : null,
        )}
      </Frame>
    </Screen>
  );
}

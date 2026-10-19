import { colors, fonts } from "@/constants/theme";
import { useGate } from "@/lib/gate";
import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WebTabLayout() {
  const gate = useGate();
  const insets = useSafeAreaInsets();
  if (!gate.loading && !gate.accepted) return <Redirect href="/gate" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.line,
          height: 52 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarItemStyle: { flex: 1, minWidth: 0, paddingHorizontal: 0 },
        tabBarActiveTintColor: colors.phosphor,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 10, letterSpacing: 0 },
        tabBarIcon: () => null,
        tabBarIconStyle: { display: "none", width: 0, height: 0 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="files" options={{ title: "Files" }} />
      <Tabs.Screen name="mix" options={{ title: "Mix" }} />
      <Tabs.Screen name="strains" options={{ title: "Strains" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}

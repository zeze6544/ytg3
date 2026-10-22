import { colors, fonts } from "@/constants/theme";
import { useGate } from "@/lib/gate";
import { Redirect, Tabs, usePathname } from "expo-router";
import { Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabLabel({ color, children }: { color: string; children: string }) {
  const { width } = useWindowDimensions();
  const size = width < 360 ? 13 : 14;
  return (
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={{ color, fontFamily: fonts.body, fontWeight: "600", fontSize: size, lineHeight: size + 4, textAlign: "center", width: "100%" }}>
      {children}
    </Text>
  );
}

export default function WebTabLayout() {
  const gate = useGate();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const path = usePathname();
  const filesTitle = width < 520 ? "Drugs" : "Substances";
  if (!gate.loading && !gate.accepted) {
    return <Redirect href={{ pathname: "/gate", params: { next: path.startsWith("/") && !path.startsWith("/gate") ? path : "/" } }} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.line,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarItemStyle: { flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingHorizontal: 2, paddingVertical: 4, minWidth: 0 },
        tabBarActiveTintColor: colors.phosphor,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabel: ({ color, children }) => <TabLabel color={String(color)}>{String(children)}</TabLabel>,
        tabBarIcon: () => null,
        tabBarIconStyle: { display: "none", width: 0, height: 0 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="files" options={{ title: filesTitle }} />
      <Tabs.Screen name="mix" options={{ title: "Mix" }} />
      <Tabs.Screen name="strains" options={{ title: "Strains" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}

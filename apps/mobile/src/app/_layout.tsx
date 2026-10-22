import "@/global.css";
import { colors, fonts } from "@/constants/theme";
import { GateProvider, useGate } from "@/lib/gate";
import { whenArchiveReady } from "@/lib/localArchive";
import { SessionProvider } from "@/lib/session";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, Redirect, Stack, ThemeProvider, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, type ReactNode } from "react";
import { Text, View, useWindowDimensions } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const archiveTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.panel,
    text: colors.text,
    border: colors.line,
    primary: colors.phosphor,
    notification: colors.red,
  },
};

function ArchiveHeaderTitle({ children, tintColor }: { children: string; tintColor?: unknown }) {
  const { width } = useWindowDimensions();
  return (
    <Text
      numberOfLines={1}
      style={{
        fontFamily: fonts.display,
        fontWeight: "700",
        fontSize: 18,
        lineHeight: 24,
        color: typeof tintColor === "string" ? tintColor : colors.phosphor,
        maxWidth: Math.min(width - 88, 560),
      }}
    >
      {children}
    </Text>
  );
}

const headerOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.phosphor,
  headerTitle: ArchiveHeaderTitle,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

function safeNext(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/gate") || path.includes("://") || path.includes("\\")) return "/";
  return path;
}

function RootStack() {
  const gate = useGate();
  const path = usePathname();
  if (gate.loading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <>
      {gate.accepted || path === "/gate" ? null : <Redirect href={{ pathname: "/gate", params: { next: safeNext(path) } }} />}
      <Stack screenOptions={headerOptions}>
      <Stack.Screen name="gate" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="drug/[slug]" options={{ title: "Substance" }} />
      <Stack.Screen name="strain/[slug]" options={{ title: "Strain" }} />
      <Stack.Screen name="classes" options={{ title: "Classes" }} />
      <Stack.Screen name="timeline" options={{ title: "Timeline" }} />
      <Stack.Screen name="reagents/index" options={{ title: "Reagents" }} />
      <Stack.Screen name="reagents/[slug]" options={{ title: "Reagent" }} />
      <Stack.Screen name="saved" options={{ title: "Saved" }} />
      <Stack.Screen name="auth" options={{ title: "Account" }} />
      <Stack.Screen name="about" options={{ title: "About" }} />
      <Stack.Screen name="privacy" options={{ title: "Privacy" }} />
      <Stack.Screen name="support" options={{ title: "Support" }} />
      <Stack.Screen name="admin/strains" options={{ title: "Maintenance" }} />
    </Stack>
    </>
  );
}

function ArchiveGate({ children }: { children: ReactNode }) {
  const gate = useGate();
  const [archiveReady, setArchiveReady] = useState(false);

  useEffect(() => {
    void whenArchiveReady().finally(() => setArchiveReady(true));
  }, []);

  if (gate.loading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (gate.accepted && !archiveReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: colors.phosphor, fontFamily: fonts.display, fontWeight: "700", fontSize: 28, lineHeight: 36, textAlign: "center" }}>
          Opening the archive
        </Text>
      </View>
    );
  }
  return children;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync();
    setReady(true);
  }, []);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GateProvider>
        <SessionProvider>
          <ArchiveGate>
          <ThemeProvider value={archiveTheme}>
            <StatusBar style="light" />
            <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center" }}>
              <View style={{ flex: 1, width: "100%", maxWidth: 760, backgroundColor: colors.bg }}>
                <RootStack />
              </View>
            </View>
          </ThemeProvider>
          </ArchiveGate>
        </SessionProvider>
      </GateProvider>
    </QueryClientProvider>
  );
}


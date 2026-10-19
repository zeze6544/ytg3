import "@/global.css";
import { colors, fonts } from "@/constants/theme";
import { GateProvider, useGate } from "@/lib/gate";
import { SessionProvider } from "@/lib/session";
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { VT323_400Regular, useFonts } from "@expo-google-fonts/vt323";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, Redirect, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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
        fontSize: 22,
        color: typeof tintColor === "string" ? tintColor : colors.phosphor,
        maxWidth: Math.min(width - 96, 320),
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

function RootStack() {
  const gate = useGate();
  if (gate.loading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <>
      {gate.accepted ? null : <Redirect href="/gate" />}
      <Stack screenOptions={headerOptions}>
      <Stack.Screen name="gate" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="drug/[slug]" options={{ title: "FILE" }} />
      <Stack.Screen name="classes" options={{ title: "CLASSES" }} />
      <Stack.Screen name="timeline" options={{ title: "TIMELINE" }} />
      <Stack.Screen name="reagents/index" options={{ title: "REAGENTS" }} />
      <Stack.Screen name="reagents/[slug]" options={{ title: "KIT" }} />
      <Stack.Screen name="saved" options={{ title: "SAVED" }} />
      <Stack.Screen name="auth" options={{ title: "ACCESS" }} />
      <Stack.Screen name="about" options={{ title: "ABOUT" }} />
      <Stack.Screen name="privacy" options={{ title: "PRIVACY" }} />
      <Stack.Screen name="support" options={{ title: "SUPPORT" }} />
    </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    VT323_400Regular,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      setReady(true);
    }
  }, [fontsLoaded, fontError]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GateProvider>
        <SessionProvider>
          <ThemeProvider value={archiveTheme}>
            <StatusBar style="light" />
            <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center" }}>
              <View style={{ flex: 1, width: "100%", maxWidth: 480, backgroundColor: colors.bg }}>
                <RootStack />
              </View>
            </View>
          </ThemeProvider>
        </SessionProvider>
      </GateProvider>
    </QueryClientProvider>
  );
}


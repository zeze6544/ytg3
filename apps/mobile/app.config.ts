import type { ExpoConfig } from "expo/config";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://kmqfeknqejdiszirfrkj.supabase.co";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "";

const config: ExpoConfig = {
  name: "NARCØDEX",
  slug: "narcodex",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "narcodex",
  userInterfaceStyle: "dark",
  backgroundColor: "#07140c",
  ios: {
    bundleIdentifier: "com.narcodex.archive",
    buildNumber: "1",
    supportsTablet: false,
    icon: "./assets/images/icon.png",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDisplayName: "NARCØDEX",
    },
  },
  android: {
    package: "com.narcodex.archive",
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: "#07140c",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
  },
  web: {
    output: "single",
    favicon: "./assets/images/favicon.png",
    name: "NARCØDEX",
    shortName: "NARCØDEX",
    description: "Adult harm-reduction reference for substances, risks, and interactions.",
    lang: "en",
    themeColor: "#07140c",
    backgroundColor: "#07140c",
    display: "standalone",
    orientation: "portrait",
    startUrl: "/",
    barStyle: "black",
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#07140c",
        image: "./assets/images/splash-icon.png",
        imageWidth: 220,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    supabaseUrl,
    supabaseKey,
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
};

export default config;

import { Platform } from "react-native";

export const colors = {
  bg: "#0c1611",
  panel: "#15261c",
  panel2: "#1c3326",
  line: "#3c6248",
  phosphor: "#d6f56a",
  cyan: "#8ee7ff",
  amber: "#ffd27a",
  red: "#ff8d7a",
  purple: "#e0b0ff",
  text: "#f4f7ef",
  muted: "#c5d4bc",
} as const;

export const space = {
  page: 20,
  section: 22,
  card: 18,
  stack: 12,
} as const;

export type Tone = "phosphor" | "cyan" | "amber" | "red" | "purple";

export const toneColor: Record<Tone, string> = {
  phosphor: colors.phosphor,
  cyan: colors.cyan,
  amber: colors.amber,
  red: colors.red,
  purple: colors.purple,
};

/** Readable UI sans. Web maps "System" onto the platform stack. iOS omits a family so San Francisco is used. */
export const sans = Platform.OS === "web" ? "System" : Platform.OS === "android" ? "sans-serif" : undefined;

export const fonts = {
  mark: "VT323_400Regular",
  display: sans,
  body: sans,
  bodyMedium: sans,
} as const;

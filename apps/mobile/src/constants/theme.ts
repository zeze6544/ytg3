export const colors = {
  bg: "#07140c",
  panel: "#102117",
  panel2: "#16301f",
  line: "#2f5a38",
  phosphor: "#c6ff4a",
  cyan: "#5ee2ff",
  amber: "#ffc14a",
  red: "#ff5c4a",
  purple: "#d58bff",
  text: "#e7ffc4",
  muted: "#8eae86",
} as const;

export type Tone = "phosphor" | "cyan" | "amber" | "red" | "purple";

export const toneColor: Record<Tone, string> = {
  phosphor: colors.phosphor,
  cyan: colors.cyan,
  amber: colors.amber,
  red: colors.red,
  purple: colors.purple,
};

export const fonts = {
  display: "VT323_400Regular",
  body: "JetBrainsMono_400Regular",
  bodyMedium: "JetBrainsMono_500Medium",
} as const;

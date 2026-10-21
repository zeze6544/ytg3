import { Platform } from "react-native";

export type RecentFile = { slug: string; name: string };

const KEY = "narcodex.recent.v1";
const memory: RecentFile[] = [];

function readStored(): RecentFile[] {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return memory;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is RecentFile => Boolean(item && typeof item.slug === "string" && typeof item.name === "string"));
  } catch {
    return [];
  }
}

export function readRecent() {
  return readStored().slice(0, 8);
}

export function rememberFile(file: RecentFile) {
  const next = [file, ...readStored().filter((item) => item.slug !== file.slug)].slice(0, 8);
  memory.splice(0, memory.length, ...next);
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // A full browser store should not block the file.
    }
  }
}

// Copies the class and group chapters from the mobile reader into JSON
// the native app build can store. It does not change those chapters.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const source = fs.readFileSync(path.join(root, "apps/mobile/src/lib/briefing.ts"), "utf8");
const body = source
  .replace(/export type Chapter[\s\S]*?\n\n/, "")
  .replace(/: Record<string, Chapter>/g, "")
  .replace(/export function readingFor[\s\S]*$/, "")
  .replace("const CLASSES", "export const CLASSES")
  .replace("const GROUPS", "export const GROUPS");
const temp = path.join("/tmp", "narcodex-briefing.mjs");
fs.writeFileSync(temp, body);
const mod = await import(pathToFileURL(temp).href);
const out = {
  source: "apps/mobile/src/lib/briefing.ts",
  classes: mod.CLASSES,
  groups: mod.GROUPS,
};
const dest = path.join(root, "ios/Resources/Briefing.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`classes ${Object.keys(out.classes).length} groups ${Object.keys(out.groups).length} bytes ${fs.statSync(dest).size}`);

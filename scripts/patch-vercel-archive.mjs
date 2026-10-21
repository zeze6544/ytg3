import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const configPath = resolve(import.meta.dirname, "../.vercel/output/config.json");
if (!existsSync(configPath)) {
  console.error("No .vercel/output/config.json — run the production build first.");
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
// Serve the current NARCØDEX web app (the Expo build on Firebase) instead of
// the older TanStack archive. Same-origin proxy so every subdomain matches
// https://narcodex-archive.web.app without copying the catalogue into this deploy.
config.routes = [
  { src: "/", dest: "https://narcodex-archive.web.app/" },
  { src: "/(.*)", dest: "https://narcodex-archive.web.app/$1" },
];
writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
console.log("Production routes now proxy https://narcodex-archive.web.app");

import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "apps/mobile/dist");
const out = join(root, ".vercel/output");
const staticDir = join(out, "static");

rmSync(staticDir, { recursive: true, force: true });
mkdirSync(staticDir, { recursive: true });
cpSync(dist, staticDir, { recursive: true });
rmSync(join(staticDir, "install.html"), { force: true });

writeFileSync(
  join(out, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: "filesystem" },
        { src: "/strains/(.*)", dest: "https://narcodex-archive.web.app/strains/$1" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2,
  ) + "\n",
);

console.log("wrote", out);

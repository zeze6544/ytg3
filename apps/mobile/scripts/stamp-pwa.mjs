import { copyFileSync, existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

// Surge skips any path named node_modules. Expo writes fonts there, and a
// missing font file leaves the first screen blank.
const bundledModules = join(dist, "assets", "node_modules");
const vendor = join(dist, "assets", "vendor");
if (existsSync(bundledModules)) {
  if (existsSync(vendor)) rmSync(vendor, { recursive: true, force: true });
  renameSync(bundledModules, vendor);
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

for (const file of walk(dist)) {
  if (!/\.(js|css|html|json|map|webmanifest)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  if (!text.includes("/assets/node_modules/")) continue;
  writeFileSync(file, text.replaceAll("/assets/node_modules/", "/assets/vendor/"));
}

const indexPath = join(dist, "index.html");
let html = readFileSync(indexPath, "utf8");
const tags = `
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="apple-mobile-web-app-title" content="NARCØDEX" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
`;
if (!html.includes("viewport-fit=cover")) {
  html = html.replace(
    /<meta name="viewport" content="[^"]*"\s*\/?>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
  );
}
if (!html.includes("apple-mobile-web-app-capable")) {
  html = html.replace("</head>", `${tags}</head>`);
}
writeFileSync(indexPath, html);
copyFileSync(indexPath, join(dist, "200.html"));
console.log("stamped", indexPath);

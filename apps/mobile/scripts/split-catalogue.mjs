import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.resolve(here, "..");
const root = path.resolve(mobile, "../..");
const outDir = path.join(mobile, "assets/catalogue-parts");
const limit = 1024 * 1024;

function split(source, prefix) {
  const data = fs.readFileSync(source);
  const names = [];
  let start = 0;
  let index = 0;
  while (start < data.length) {
    let end = Math.min(start + limit, data.length);
    if (end < data.length) {
      while (end > start && data[end] >= 128) end -= 1;
      if (end === start) end = Math.min(start + limit, data.length);
    }
    const name = `${prefix}-${String(index).padStart(3, "0")}.catalogue`;
    fs.writeFileSync(path.join(outDir, name), data.subarray(start, end));
    names.push(name);
    start = end;
    index += 1;
  }
  return names;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const archive = split(path.join(root, "src/data/archive.json"), "archive");
const extra = split(path.join(root, "src/data/drugs-extra.json"), "extra");

function requires(names) {
  return names.map((name) => `  require("../../assets/catalogue-parts/${name}"),`).join("\n");
}

const moduleSource = `import { Asset } from "expo-asset";

const archiveParts = [
${requires(archive)}
];

const extraParts = [
${requires(extra)}
];

async function readParts(ids: number[]) {
  const pieces: string[] = [];
  for (const id of ids) {
    const asset = Asset.fromModule(id);
    await asset.downloadAsync();
    const uri = asset.localUri;
    if (!uri) throw new Error("A catalogue part is missing from this app.");
    const response = await fetch(uri);
    if (!response.ok) throw new Error("A catalogue part could not be read.");
    pieces.push(await response.text());
  }
  return pieces.join("");
}

export async function loadBundledCatalogue() {
  return {
    main: JSON.parse(await readParts(archiveParts)),
    extra: JSON.parse(await readParts(extraParts)),
  };
}
`;

fs.writeFileSync(path.join(mobile, "src/lib/bundledCatalogue.android.ts"), moduleSource);
const joined = Buffer.concat([...archive, ...extra].map((name) => fs.readFileSync(path.join(outDir, name))));
const original = Buffer.concat([
  fs.readFileSync(path.join(root, "src/data/archive.json")),
  fs.readFileSync(path.join(root, "src/data/drugs-extra.json")),
]);
if (!joined.equals(original)) {
  throw new Error("catalogue parts do not round-trip");
}
console.log(`archive parts ${archive.length}, extra parts ${extra.length}`);

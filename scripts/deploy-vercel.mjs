#!/usr/bin/env bun
/**
 * Deploy NARCØDEX to Vercel and attach multiple production subdomains/aliases.
 *
 * Required:
 *   VERCEL_TOKEN
 *
 * Optional:
 *   VERCEL_ORG_ID / VERCEL_TEAM_ID
 *   VERCEL_PROJECT_ID / VERCEL_PROJECT_NAME (default: narcodex or domains.json)
 *   VERCEL_ALIASES  — comma-separated hostnames to alias onto the prod deploy
 *                     e.g. "www.example.com,app.example.com,api.example.com"
 *                     (falls back to domains.json aliases, ignoring *.example.com)
 *   VERCEL_PROD     — "1" (default) for production, "0" for preview
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("Missing VERCEL_TOKEN. Create one at https://vercel.com/account/tokens");
  process.exit(1);
}

const teamId = process.env.VERCEL_ORG_ID || process.env.VERCEL_TEAM_ID || "";
const root = resolve(import.meta.dirname, "..");
const vercelDir = resolve(root, ".vercel");
mkdirSync(vercelDir, { recursive: true });

function loadDomainsFile() {
  const path = resolve(root, "domains.json");
  if (!existsSync(path)) return { aliases: [], project: null };
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    const aliases = Array.isArray(raw.aliases)
      ? raw.aliases.map((s) => String(s).trim()).filter(Boolean)
      : [];
    // Ignore placeholder example.com hosts unless explicitly forced.
    const filtered = aliases.filter(
      (h) => !h.endsWith(".example.com") || process.env.VERCEL_ALLOW_EXAMPLE === "1",
    );
    return { aliases: filtered, project: raw.project ? String(raw.project) : null };
  } catch (err) {
    console.warn(`Could not parse domains.json: ${err.message}`);
    return { aliases: [], project: null };
  }
}

const domainsFile = loadDomainsFile();
const projectName =
  process.env.VERCEL_PROJECT_NAME ||
  process.env.VERCEL_PROJECT_ID ||
  domainsFile.project ||
  "narcodex";
const aliases = (
  process.env.VERCEL_ALIASES ||
  domainsFile.aliases.join(",") ||
  ""
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const production = process.env.VERCEL_PROD !== "0";

function vercel(args, { inherit = true } = {}) {
  const full = ["--yes", "--token", token, ...args];
  if (teamId) full.push("--scope", teamId);
  console.log(`> vercel ${args.join(" ")}`);
  const result = spawnSync("npx", ["--yes", "vercel@latest", ...full], {
    cwd: root,
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
    env: { ...process.env, VERCEL_TOKEN: token },
  });
  if (result.status !== 0) {
    if (!inherit) {
      console.error(result.stderr || result.stdout);
    }
    process.exit(result.status ?? 1);
  }
  return result;
}

function vercelCapture(args) {
  const full = ["--yes", "--token", token, ...args];
  if (teamId) full.push("--scope", teamId);
  console.log(`> vercel ${args.join(" ")}`);
  const result = spawnSync("npx", ["--yes", "vercel@latest", ...full], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, VERCEL_TOKEN: token },
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  return (result.stdout || "").trim();
}

// Ensure a linked project exists for non-interactive deploys.
const projectJsonPath = resolve(vercelDir, "project.json");
if (!existsSync(projectJsonPath)) {
  console.log(`Linking / creating Vercel project "${projectName}"…`);
  const linkArgs = ["link", "--project", projectName];
  vercel(linkArgs, { inherit: true });
}

const hasPrebuilt = existsSync(resolve(vercelDir, "output", "config.json"));
if (!hasPrebuilt) {
  console.log("No .vercel/output found — running bun run build…");
  const build = spawnSync("bun", ["run", "build"], {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
    env: process.env,
  });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const deployArgs = ["deploy", "--prebuilt"];
if (production) deployArgs.push("--prod");

const url = vercelCapture(deployArgs);
console.log(`\nDeployed: ${url}`);

if (aliases.length === 0) {
  console.log(
    "No custom subdomains configured. Skipping alias attach.\n" +
      "Edit domains.json or set VERCEL_ALIASES=www.example.com,app.example.com",
  );
  process.exit(0);
}

for (const host of aliases) {
  console.log(`\nAttaching alias: ${host}`);
  // Register domain on the project (idempotent enough for CLI use), then point alias.
  const add = spawnSync(
    "npx",
    [
      "--yes",
      "vercel@latest",
      "--yes",
      "--token",
      token,
      ...(teamId ? ["--scope", teamId] : []),
      "domains",
      "add",
      host,
      projectName,
    ],
    {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
      env: { ...process.env, VERCEL_TOKEN: token },
    },
  );
  if (add.status !== 0) {
    const msg = `${add.stderr || ""}${add.stdout || ""}`;
    if (!/already|exists|configured/i.test(msg)) {
      console.error(msg);
      process.exit(add.status ?? 1);
    }
    console.log(`  (domain already on project)`);
  }
  vercel(["alias", "set", url, host], { inherit: true });
}

console.log("\nDone. Live on:");
for (const host of aliases) console.log(`  https://${host}`);
console.log(`  ${url}`);

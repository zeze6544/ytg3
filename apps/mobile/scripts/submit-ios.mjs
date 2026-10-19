import { createSign } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "EXPO_TOKEN",
  "EXPO_PUBLIC_SUPABASE_KEY",
  "ASC_API_KEY_ID",
  "ASC_ISSUER_ID",
  "ASC_PRIVATE_KEY",
  "APPLE_TEAM_ID",
  "APPLE_REVIEW_FIRST_NAME",
  "APPLE_REVIEW_LAST_NAME",
  "APPLE_REVIEW_EMAIL",
  "APPLE_REVIEW_PHONE",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing credentials: ${missing.join(", ")}`);
  console.error("Add them in the agent environment, then run npm run submit:ios from apps/mobile.");
  process.exit(1);
}

const keyDir = mkdtempSync(join(tmpdir(), "narcodex-asc-"));
const keyPath = join(keyDir, "AuthKey.p8");
writeFileSync(keyPath, process.env.ASC_PRIVATE_KEY.replace(/\\n/g, "\n"));

function appleToken() {
  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: process.env.ASC_API_KEY_ID.trim(), typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: process.env.ASC_ISSUER_ID.trim(),
    iat: now,
    exp: now + 600,
    aud: "appstoreconnect-v1",
  })).toString("base64url");
  const sign = createSign("SHA256");
  sign.update(`${header}.${payload}`);
  sign.end();
  const signature = sign.sign({
    key: process.env.ASC_PRIVATE_KEY.replace(/\\n/g, "\n"),
    dsaEncoding: "ieee-p1363",
  });
  return `${header}.${payload}.${signature.toString("base64url")}`;
}

async function apple(path, init) {
  const response = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${appleToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

async function ensureAppStoreApp() {
  if (process.env.ASC_APP_ID?.trim()) return process.env.ASC_APP_ID.trim();
  const bundleId = "com.narcodex.archive";
  const listed = await apple(`/v1/apps?filter[bundleId]=${bundleId}`);
  const existing = listed.body?.data?.[0]?.id;
  if (existing) return existing;

  await apple("/v1/bundleIds", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "bundleIds",
        attributes: { identifier: bundleId, name: "NARCØDEX", platform: "IOS" },
      },
    }),
  });

  const created = await apple("/v1/apps", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "apps",
        attributes: {
          bundleId,
          name: "NARCØDEX",
          primaryLocale: "en-US",
          sku: "narcodex-archive-ios",
        },
      },
    }),
  });
  const id = created.body?.data?.id;
  if (!id) {
    console.error("Could not create the App Store record.", created.status, JSON.stringify(created.body));
    process.exit(1);
  }
  return id;
}

const easPath = join(root, "eas.json");
const storePath = join(root, "store.config.json");
const easOriginal = readFileSync(easPath, "utf8");
const storeOriginal = readFileSync(storePath, "utf8");

function restore() {
  writeFileSync(easPath, easOriginal);
  writeFileSync(storePath, storeOriginal);
  rmSync(keyDir, { recursive: true, force: true });
}

const env = {
  ...process.env,
  EXPO_ASC_API_KEY_PATH: keyPath,
  EXPO_ASC_KEY_ID: process.env.ASC_API_KEY_ID.trim(),
  EXPO_ASC_ISSUER_ID: process.env.ASC_ISSUER_ID.trim(),
  EXPO_APPLE_TEAM_ID: process.env.APPLE_TEAM_ID.trim(),
  EXPO_APPLE_TEAM_TYPE: process.env.EXPO_APPLE_TEAM_TYPE?.trim() || "INDIVIDUAL",
};

function run(args) {
  const result = spawnSync("npx", ["--yes", "eas-cli@latest", ...args], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    restore();
    process.exit(result.status ?? 1);
  }
}

const ascAppId = await ensureAppStoreApp();
const eas = JSON.parse(easOriginal);
eas.build.production.env = {
  EXPO_PUBLIC_SUPABASE_URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://kmqfeknqejdiszirfrkj.supabase.co",
  EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY,
};
eas.submit.production.ios = {
  appleTeamId: process.env.APPLE_TEAM_ID.trim(),
  ascAppId,
  ascApiKeyPath: keyPath,
  ascApiKeyId: process.env.ASC_API_KEY_ID.trim(),
  ascApiKeyIssuerId: process.env.ASC_ISSUER_ID.trim(),
};
writeFileSync(easPath, JSON.stringify(eas, null, 2) + "\n");

const store = JSON.parse(storeOriginal);
store.apple.review = {
  firstName: process.env.APPLE_REVIEW_FIRST_NAME.trim(),
  lastName: process.env.APPLE_REVIEW_LAST_NAME.trim(),
  email: process.env.APPLE_REVIEW_EMAIL.trim(),
  phone: process.env.APPLE_REVIEW_PHONE.trim(),
  demoRequired: false,
  notes:
    "NARCØDEX is an educational harm-reduction reference for adults. It does not sell substances, does not link to sellers, does not calculate doses, and does not provide synthesis or sourcing instructions. It does not encourage use. On first launch, confirm you are 18 or older. Sign-in is optional. Open Files and search for caffeine, then open the monograph. The Mix tab compares two catalogued substances. A missing interaction is unknown, not safe. Please rate the app 17+ for frequent substance references. This is not a medical device.",
};
writeFileSync(storePath, JSON.stringify(store, null, 2) + "\n");

run(["init", "--non-interactive", "--force"]);
run(["build", "--platform", "ios", "--profile", "production", "--non-interactive", "--auto-submit"]);
run(["metadata:push", "--non-interactive"]);
restore();

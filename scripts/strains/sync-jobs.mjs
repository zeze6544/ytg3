// Runs admin-requested strain jobs, then rebuilds the index.
// Jobs come from public.strain_jobs (inserted by admins through the app; RLS
// limits inserts to the admin role) or from a local JSON file for offline use.
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/strains/sync-jobs.mjs
//   node scripts/strains/sync-jobs.mjs --local data/strains/jobs.json
// The service-role key is read from the environment of the machine running the
// pipeline. It is never bundled into the app.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DATA, ROOT, args, readJson, writeJson } from "./lib.mjs";

const opts = args();
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const localPath = opts.local ? join(ROOT, opts.local) : null;

async function rest(path, init = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", prefer: "return=representation", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${path} ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function loadJobs() {
  if (localPath) {
    const file = readJson(localPath, { jobs: [] });
    return file.jobs.filter((job) => job.status === "queued");
  }
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or pass --local <file>.");
  return rest("strain_jobs?status=eq.queued&order=created_at.asc&limit=200");
}

async function finish(job, status, error = null) {
  if (localPath) {
    const file = readJson(localPath, { jobs: [] });
    const hit = file.jobs.find((item) => item.id === job.id);
    if (hit) Object.assign(hit, { status, error, finished_at: new Date().toISOString() });
    writeJson(localPath, file, true);
    return;
  }
  await rest(`strain_jobs?id=eq.${job.id}`, { method: "PATCH", body: JSON.stringify({ status, error, finished_at: new Date().toISOString() }) });
}

function run(script, argv) {
  const res = spawnSync(process.execPath, ["--max-old-space-size=8192", join(ROOT, "scripts", "strains", script), ...argv], { stdio: "inherit", env: { ...process.env, NODE_NO_WARNINGS: "1" } });
  if (res.status !== 0) throw new Error(`${script} exited ${res.status}`);
}

const jobs = await loadJobs();
console.log(`${jobs.length} queued job(s)`);
const regen = [];
let needsBuild = false;
for (const job of jobs) {
  try {
    if (!/^[a-z0-9-]+$/.test(job.slug)) throw new Error("invalid slug");
    if (job.kind === "regen_image") regen.push(job);
    else if (job.kind === "not_duplicate") {
      const other = String(job.payload?.other ?? "");
      if (!/^[a-z0-9-]+$/.test(other)) throw new Error("payload.other must be a slug");
      const path = join(DATA, "review.json");
      const review = readJson(path, { not_duplicates: [], lineage_overrides: {} });
      const pair = [job.slug, other].sort();
      if (!review.not_duplicates.some((p) => p[0] === pair[0] && p[1] === pair[1])) review.not_duplicates.push(pair);
      writeJson(path, review, true);
      needsBuild = true;
      await finish(job, "done");
    } else if (job.kind === "research") {
      run("enrich.mjs", ["--stage", "research", "--slug", job.slug, "--recheck"]);
      needsBuild = true;
      await finish(job, "done");
    } else if (job.kind === "recheck_links") {
      run("enrich.mjs", ["--stage", "links", "--slug", job.slug, "--recheck"]);
      needsBuild = true;
      await finish(job, "done");
    } else throw new Error(`unknown job kind ${job.kind}`);
  } catch (error) {
    await finish(job, "failed", String(error.message ?? error));
  }
}
if (regen.length) {
  try {
    run("gen-images.mjs", ["--regen", regen.map((job) => job.slug).join(",")]);
    const manifest = readJson(join(DATA, "images.json"), { assets: {} });
    for (const job of regen) {
      const asset = manifest.assets[`s_${job.slug}`];
      await finish(job, asset?.status === "stored" ? "done" : "failed", asset?.status === "stored" ? null : asset?.error ?? "no such record");
    }
    needsBuild = true;
  } catch (error) {
    for (const job of regen) await finish(job, "failed", String(error.message ?? error));
  }
}
if (needsBuild && existsSync(join(DATA, "listings.json"))) run("build-strains.mjs", []);
console.log("done");

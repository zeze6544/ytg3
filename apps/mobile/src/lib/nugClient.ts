import { Platform } from "react-native";
import { NUG_RENDERER_VERSION, renderNug, type NugSize } from "@/lib/nugRender";
import { encodeNugPng, toBase64 } from "@/lib/nugPng";
import { archiveUrl } from "@/lib/localArchive";

// Specimen images resolve in this order: a stored asset from the batch
// generator, a cached on-device render, then a fresh render from the same
// deterministic geometry. Renders are queued one at a time on idle so a page
// of cards never blocks input, and each slug renders once per session.

export type NugSource = { uri: string; origin: "stored" | "device" };

const LIMIT = 260;
const memory = new Map<string, NugSource>();
const pending = new Map<string, Promise<NugSource>>();
const queue: (() => void)[] = [];
let running = false;
const CACHE_NAME = `narcodex-nug-v${NUG_RENDERER_VERSION}`;

function remember(key: string, value: NugSource) {
  memory.delete(key);
  memory.set(key, value);
  while (memory.size > LIMIT) {
    const [oldest, entry] = memory.entries().next().value as [string, NugSource];
    memory.delete(oldest);
    if (entry.uri.startsWith("blob:") && typeof URL !== "undefined") URL.revokeObjectURL(entry.uri);
  }
}

function idle(fn: () => void) {
  const g = globalThis as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void };
  if (typeof g.requestIdleCallback === "function") g.requestIdleCallback(fn, { timeout: 400 });
  else setTimeout(fn, 16);
}

function pump() {
  if (running) return;
  const job = queue.shift();
  if (!job) return;
  running = true;
  idle(() => {
    try {
      job();
    } finally {
      running = false;
      pump();
    }
  });
}

function storedUrl(slug: string, size: NugSize) {
  return archiveUrl(`/strains/img/${size === "thumb" ? "t" : "d"}/${encodeURIComponent(slug)}.png?v=${NUG_RENDERER_VERSION}`);
}

async function fromCacheStorage(key: string): Promise<string | null> {
  if (Platform.OS !== "web" || typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(key);
    if (!hit) return null;
    return URL.createObjectURL(await hit.blob());
  } catch {
    return null;
  }
}

async function toCacheStorage(key: string, bytes: Uint8Array) {
  if (Platform.OS !== "web" || typeof caches === "undefined") return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(key, new Response(new Blob([bytes as BlobPart], { type: "image/png" })));
  } catch {
    // Private windows can refuse Cache Storage; the memory cache still holds it.
  }
}

function renderToUri(id: string, size: NugSize, type: string | null | undefined, cacheKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    queue.push(() => {
      try {
        const image = renderNug(id, size, type);
        const bytes = encodeNugPng(image.width, image.height, image.data);
        if (Platform.OS === "web" && typeof Blob !== "undefined" && typeof URL !== "undefined") {
          void toCacheStorage(cacheKey, bytes);
          resolve(URL.createObjectURL(new Blob([bytes as BlobPart], { type: "image/png" })));
        } else resolve(`data:image/png;base64,${toBase64(bytes)}`);
      } catch (error) {
        reject(error);
      }
    });
    pump();
  });
}

export function peekNug(slug: string, size: NugSize) {
  return memory.get(`${size}:${slug}`) ?? null;
}

export function loadNug(opts: { slug: string; id: string; type?: string | null; size: NugSize; stored: boolean }): Promise<NugSource> {
  const key = `${opts.size}:${opts.slug}`;
  const hit = memory.get(key);
  if (hit) return Promise.resolve(hit);
  const inflight = pending.get(key);
  if (inflight) return inflight;
  const job = (async (): Promise<NugSource> => {
    if (opts.stored) return { uri: storedUrl(opts.slug, opts.size), origin: "stored" };
    const cacheKey = `/nug-cache/v${NUG_RENDERER_VERSION}/${opts.size}/${opts.slug}.png`;
    const cached = await fromCacheStorage(cacheKey);
    if (cached) return { uri: cached, origin: "device" };
    return { uri: await renderToUri(opts.id, opts.size, opts.type, cacheKey), origin: "device" };
  })();
  pending.set(key, job);
  return job.then(
    (value) => {
      pending.delete(key);
      remember(key, value);
      return value;
    },
    (error) => {
      pending.delete(key);
      throw error;
    },
  );
}

// A stored asset that fails to load (missing on this deploy) falls back to the
// on-device render of the same geometry rather than to any shared image.
export function loadNugFallback(opts: { slug: string; id: string; type?: string | null; size: NugSize }) {
  memory.delete(`${opts.size}:${opts.slug}`);
  return loadNug({ ...opts, stored: false });
}

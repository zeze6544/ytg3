import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Pin Nitro to Vercel so local + CLI builds match production.
  // Cloudflare Workers (wrangler) is no longer the deploy target.
  nitro: {
    preset: "vercel",
  },
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});

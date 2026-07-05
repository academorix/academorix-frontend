import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/** Resolve a path relative to this config file. */
const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/**
 * Reads the workspace `package.json` to expose its version as
 * `__ACADEMORIX_VERSION__` via Vite's `define` — used by
 * `src/lib/http/device.ts` to send `X-Client: academorix-web/<version>`.
 */
const pkg = JSON.parse(readFileSync(resolvePath("./package.json"), "utf-8")) as {
  version?: string;
};
const version = pkg.version ?? "dev";

export default defineConfig({
  // Env files live in a dedicated folder instead of the package root.
  envDir: resolvePath("./environments"),
  envPrefix: "VITE_",

  plugins: [react(), tailwindcss()],

  define: {
    __ACADEMORIX_VERSION__: JSON.stringify(version),
  },

  resolve: {
    alias: {
      "@": resolvePath("./src"),
    },
  },

  server: {
    port: 3000,
    host: true,
    strictPort: false,
  },

  preview: {
    port: 4173,
    host: true,
  },

  build: {
    outDir: "dist",
    target: "es2022",
    sourcemap: true,
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Core React runtime — changes rarely, cache aggressively.
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) {
            return "react-vendor";
          }

          // Refine + TanStack Query data layer.
          if (/[\\/]node_modules[\\/](@refinedev|@tanstack)[\\/]/.test(id)) {
            return "refine-vendor";
          }

          // Realtime transport (Reverb speaks the Pusher protocol via Echo).
          if (/[\\/]node_modules[\\/](laravel-echo|pusher-js)[\\/]/.test(id)) {
            return "realtime-vendor";
          }

          return undefined;
        },
      },
    },
  },

  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
    },
  },
});

/// <reference types="vitest/config" />
/**
 * @file vite.config.ts
 * @module @academorix/dashboard/vite.config
 *
 * @description
 * Root Vite entry — thin adaptor over the `@stackra/vite` orchestrator.
 *
 * ## Layout
 *
 *  1. **Plugin registry** — the source of truth for the *ordered* plugin
 *     list lives in `src/config/vite.config.ts` as the exported
 *     `viteConfig: IViteConfigOptions`. This file spreads that registry
 *     and adds one more plugin (`vite-plugin-pwa`) that is app-only,
 *     because a PWA manifest is not a framework-level concern.
 *  2. **Non-plugin Vite options** — env, aliases, `define`, `build`
 *     rollup config, and Vitest all live here because they are the
 *     app's cosmetic Vite surface, not the framework wiring.
 *  3. **Version + project-root defines** — `__ACADEMORIX_VERSION__`
 *     (build id, shipped on `X-Client: academorix-web/<v>` in every API
 *     call and the PWA update toast) and `__STACKRA_ROOT__` (absolute
 *     filesystem path to the project root, read by `Path.setRoot(...)`
 *     in `main.tsx` so browser code never needs `node:fs`).
 *
 * ## Why the `@stackra/vite` orchestrator
 *
 * `@stackra/vite`'s `defineConfig(...)` walks a typed plugin *map* (each
 * entry is an `{ enabled, factory, options }` envelope) and folds it
 * into a normal Vite `UserConfig`. Toggling a plugin off is a one-flag
 * change; ordering is preserved by insertion. The framework wiring
 * ships with `previewAnnotations` → `react-swc` (with TS decorators for
 * `@Injectable()` / `@Module()`) → `tailwind` → `router` (subdomain
 * middleware + startup banner + prerender walk).
 *
 * The Vitest triple-slash directive at the top augments Vite's
 * `UserConfig` type with the `test` field so this file typechecks
 * cleanly.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "@stackra/vite";
import { VitePWA } from "vite-plugin-pwa";

import { PWA_PLUGIN_OPTIONS } from "./src/config/pwa.config";
import { viteConfig } from "./src/config/vite.config";

/**
 * Resolve a path relative to this config file. `fileURLToPath` (instead
 * of `__dirname`) keeps this ESM-native — `__dirname` is not defined in
 * `"type": "module"` packages.
 */
const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/**
 * Read the workspace `package.json` so its version can be inlined into
 * the bundle as `__ACADEMORIX_VERSION__`.
 */
const pkg = JSON.parse(readFileSync(resolvePath("./package.json"), "utf-8")) as {
  version?: string;
};
const version = pkg.version ?? "dev";

export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Plugins (registry)
  |--------------------------------------------------------------------------
  |
  | Spread the framework plugin registry from `src/config/vite.config.ts`
  | (previewAnnotations → react → tailwind → router) and append the app-
  | only `vite-plugin-pwa` at the end. Insertion order is preserved by
  | `resolvePlugins(...)` in `@stackra/vite`, so PWA runs LAST — after
  | every source transform is complete.
  |
  */
  plugins: {
    ...viteConfig.plugins,
    pwa: {
      enabled: true,
      factory: VitePWA,
      options: PWA_PLUGIN_OPTIONS,
    },
  },

  /*
  |--------------------------------------------------------------------------
  | optimizeDeps (framework registry)
  |--------------------------------------------------------------------------
  |
  | Force-include HeroUI + Iconify in Vite's dep pre-bundle. Sourced from
  | the framework registry so a follow-on package that grows a new heavy
  | dep can pin it once and every app inherits.
  |
  */
  optimizeDeps: viteConfig.optimizeDeps,

  /*
  |--------------------------------------------------------------------------
  | envDir / envPrefix / base
  |--------------------------------------------------------------------------
  |
  | Env files live under `environments/` (not the package root) — mirrors
  | how `apps/landing-page` splits its env by tier. Only `VITE_*` keys
  | reach the browser. `base: '/'` matches every deployment target
  | (Vercel, custom domain, subdomain).
  |
  */
  envDir: resolvePath("./environments"),
  envPrefix: "VITE_",
  base: "/",

  /*
  |--------------------------------------------------------------------------
  | Global defines
  |--------------------------------------------------------------------------
  |
  | Build-time constants replaced verbatim in the bundle.
  |
  |  - `__ACADEMORIX_VERSION__` — the workspace `package.json` version.
  |    Consumed by the HTTP client (`X-Client: academorix-web/<v>`) and
  |    the PWA update toast (users see what build they are on).
  |  - `__STACKRA_ROOT__` — absolute filesystem path to the project root
  |    (this file's directory). Consumed at app boot by
  |    `Path.setRoot(...)` from `@stackra/support` so every downstream
  |    `Path.getRoot()` reads a fixed value without touching `node:fs`
  |    from the browser.
  |
  | Vite's `define` contract requires each value to be a self-serialising
  | literal — hence the `JSON.stringify(...)` wrapper.
  |
  */
  define: {
    __ACADEMORIX_VERSION__: JSON.stringify(version),
    __STACKRA_ROOT__: JSON.stringify(resolvePath(".")),
  },

  /*
  |--------------------------------------------------------------------------
  | Oxc transformer (default settings)
  |--------------------------------------------------------------------------
  |
  | Vite 8 uses Oxc as the JS/TS/JSX transformer, but we drive React
  | fast-refresh via `@vitejs/plugin-react-swc` from the framework
  | plugin registry (that's the entry with `tsDecorators: true`). Set
  | `oxc: undefined` here so Vite falls back to the plugin.
  |
  */
  oxc: undefined,

  /*
  |--------------------------------------------------------------------------
  | Path aliases
  |--------------------------------------------------------------------------
  |
  | `@` → `./src` mirrors the `paths` block in `tsconfig.json`. Both
  | places need the mapping — Vite for bundling, tsc for typechecking.
  |
  */
  resolve: {
    alias: {
      "@": resolvePath("./src"),
    },
  },

  /*
  |--------------------------------------------------------------------------
  | Dev server (merge with framework registry)
  |--------------------------------------------------------------------------
  |
  | The framework registry sets `host: '0.0.0.0'`, `port: 3000`, and
  | `allowedHosts: true` (needed for remote dev environments like
  | Codespaces / ngrok). Add `strictPort: false` so Vite gracefully
  | picks the next open port when 3000 is busy.
  |
  */
  server: {
    ...viteConfig.server,
    strictPort: false,
  },

  /*
  |--------------------------------------------------------------------------
  | Preview server (`vite preview`)
  |--------------------------------------------------------------------------
  |
  | Serves the built `dist/` locally to smoke-test production output.
  | Distinct port from the dev server so both can run side by side.
  |
  */
  preview: {
    port: 4173,
    host: true,
    strictPort: false,
  },

  /*
  |--------------------------------------------------------------------------
  | Build
  |--------------------------------------------------------------------------
  */
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: true,
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
    minify: true,
    cssMinify: "lightningcss",
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        /**
         * Manual vendor splits. Each rule carves a stable, rarely-
         * changing library into its own chunk so the browser can reuse
         * the cache across app deploys. Ordering: check the most
         * specific patterns first (heroui-pro before heroui-oss). Every
         * rule uses `[\\/]` for path separators to stay portable
         * across POSIX + Windows pnpm layouts.
         */
        manualChunks(id: string): string | undefined {
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) {
            return "react-vendor";
          }
          if (/[\\/]node_modules[\\/]@heroui-pro[\\/]/.test(id)) {
            return "heroui-pro-vendor";
          }
          if (
            /[\\/]node_modules[\\/](@heroui|react-aria-components|@react-aria|@react-stately|@react-types)[\\/]/.test(
              id,
            )
          ) {
            return "heroui-oss-vendor";
          }
          if (/[\\/]node_modules[\\/](@refinedev|@tanstack)[\\/]/.test(id)) {
            return "refine-vendor";
          }
          if (/[\\/]node_modules[\\/](laravel-echo|pusher-js)[\\/]/.test(id)) {
            return "realtime-vendor";
          }
          if (/[\\/]node_modules[\\/](recharts|d3-|victory-)[\\/]/.test(id)) {
            return "charts-vendor";
          }
          if (/[\\/]node_modules[\\/]@tiptap[\\/]/.test(id)) {
            return "editor-vendor";
          }
          if (/[\\/]node_modules[\\/](motion|framer-motion)[\\/]/.test(id)) {
            return "motion-vendor";
          }
          return undefined;
        },
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | Vitest
  |--------------------------------------------------------------------------
  |
  | Kept co-located so we don't fight two duplicate resolve/alias setups.
  | The `test` field is typed via the `vitest/config` triple-slash
  | reference at the top of this file.
  |
  */
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
        // Service-worker registration hook — exercised only in prod
        // builds via a Playwright smoke test.
        "src/pwa/register-sw.ts",
      ],
    },
  },
});

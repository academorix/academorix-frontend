/**
 * @file vite.config.ts
 * @module vite.config
 *
 * @description
 * Production-grade Vite configuration for the Academorix tenant SPA
 * (`@academorix/dashboard`).
 *
 * ## Layout
 *
 *  1. **Env + version** — read from `environments/` and `package.json`.
 *  2. **Plugins** — React + Tailwind v4 + PWA (Workbox service worker).
 *     The PWA options are a single import from `src/config/pwa.config.ts`
 *     so the manifest, icons, shortcuts, runtime caching, and Arabic
 *     translations are one grep away.
 *  3. **Path aliases** — `@` → `./src`.
 *  4. **Dev server** — port + HMR conventions.
 *  5. **Preview** — production-parity local preview.
 *  6. **Build** — code-splitting, minification, hashed filenames, sourcemaps.
 *  7. **Test (vitest)** — jsdom + coverage config.
 *
 * ## Source of truth for PWA + Manifest
 *
 *  - Manifest content (name, icons, shortcuts, translations, brand colors)
 *    lives in `src/config/pwa.config.ts` → `buildManifest()`.
 *  - Workbox runtime caching lives in `src/config/pwa.config.ts` →
 *    `WORKBOX_OPTIONS`.
 *  - Arabic + future locale strings live in `src/config/i18n.config.ts` →
 *    `PWA_MANIFEST_TRANSLATIONS`, consumed by `buildManifest()`.
 *
 * Every downstream consumer (the Vite plugin below, the Tauri desktop
 * shell in future, admin surfaces, e2e snapshots) reads the same values.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

import { PWA_PLUGIN_OPTIONS } from "./src/config/pwa.config";

/**
 * Resolve a path relative to this config file. Using `fileURLToPath` (instead
 * of `path.resolve(__dirname, …)`) keeps the config ESM-native — `__dirname`
 * is not defined in `"type": "module"` packages.
 */
const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/**
 * Reads the workspace `package.json` to expose its version as
 * `__ACADEMORIX_VERSION__` via Vite's `define`. Consumed by
 * `src/lib/http/device.ts` (sends `X-Client: academorix-web/<version>` on
 * every backend call) and by the PWA update toast (so users see which build
 * they are being upgraded from).
 */
const pkg = JSON.parse(readFileSync(resolvePath("./package.json"), "utf-8")) as {
  version?: string;
};
const version = pkg.version ?? "dev";

export default defineConfig(() => {
  /**
   * Config is expressed as a function form (not a static object) so we
   * retain access to Vite's runtime `mode` if we ever need it for a future
   * branch (e.g. sourcemap tier, per-tier PWA cache names). Today the
   * `mode` value flows implicitly through `import.meta.env.PROD` at runtime
   * and through the `VitePWA.devOptions.enabled` flag at build time; the
   * function form keeps the door open without ceremony.
   */

  return {
    /*
     * ------------------------------------------------------------------------
     * Environment
     * ------------------------------------------------------------------------
     */

    /**
     * Env files live in `environments/` instead of the package root. That
     * keeps the SPA's local secrets out of the workspace root and mirrors how
     * `apps/landing-page` splits its env by tier.
     */
    envDir: resolvePath("./environments"),

    /**
     * Only `VITE_*` keys are exposed to the browser bundle. Anything without
     * this prefix stays server-side (harmless because this is a pure SPA, but
     * it keeps the surface area explicit).
     */
    envPrefix: "VITE_",

    /**
     * Base public path. `/` is correct because the SPA is served from the
     * site root on every deployment target (Vercel, custom domain, subdomain).
     * If we ever host the SPA under a subpath, this is the single knob to
     * change — Vite rewrites every asset URL through it.
     */
    base: "/",

    /*
     * ------------------------------------------------------------------------
     * Plugins
     * ------------------------------------------------------------------------
     */
    plugins: [
      /**
       * `@vitejs/plugin-react` — React 19 support with the automatic JSX
       * runtime and Fast Refresh in dev. No custom babel config needed; the
       * plugin defaults are correct for React 19 + TS.
       */
      react(),

      /**
       * `@tailwindcss/vite` — Tailwind CSS v4 uses the Vite plugin (not
       * PostCSS) for the fastest incremental rebuilds. Theme tokens come from
       * `src/styles/globals.css` via `@import "tailwindcss"`.
       */
      tailwindcss(),

      /**
       * `vite-plugin-pwa` — options come verbatim from
       * `src/config/pwa.config.ts` (see file docblock). Everything about
       * the manifest, icons, Arabic translations, and Workbox runtime
       * caching lives there so this file stays about the Vite pipeline.
       *
       * See also:
       *   - `src/pwa/register-sw.ts`      — React registration hook.
       *   - `src/pwa/pwa-update-toast.tsx` — user-facing update UX.
       *   - `vercel.json`                  — SPA rewrite + SW cache headers.
       *   - `public/favicon.svg`           — master vector for the icon set.
       */
      VitePWA(PWA_PLUGIN_OPTIONS),
    ],

    /*
     * ------------------------------------------------------------------------
     * Global defines
     * ------------------------------------------------------------------------
     * Constants replaced verbatim at build time — cheap way to inject build
     * metadata into the runtime without a config module.
     */
    define: {
      __ACADEMORIX_VERSION__: JSON.stringify(version),
    },

    /*
     * ------------------------------------------------------------------------
     * Oxc transformer
     * ------------------------------------------------------------------------
     * Vite 8 uses Oxc (Rust-based) as the JS/TS/JSX transformer, replacing
     * esbuild from earlier Vite versions. We keep the default JSX config
     * (`@vitejs/plugin-react` handles React 19 fast refresh) and add no
     * global JSX injection.
     *
     * Console/debugger stripping in production is delegated to Oxc-minify
     * (invoked automatically by `build.minify: true`), which drops
     * `debugger` statements by default and does dead-code elimination.
     */
    oxc: undefined,

    /*
     * ------------------------------------------------------------------------
     * Path aliases
     * ------------------------------------------------------------------------
     * `@` → `./src` mirrors the `paths` block in `tsconfig.json`. Aliases must
     * be declared in BOTH places (Vite for bundling, TS for typechecking).
     */
    resolve: {
      alias: {
        "@": resolvePath("./src"),
      },
    },

    /*
     * ------------------------------------------------------------------------
     * Dev server
     * ------------------------------------------------------------------------
     */
    server: {
      /**
       * Port 3000 — free, memorable, matches the Next.js marketing app's
       * default so devs can run both side by side (marketing on 3001).
       */
      port: 3000,

      /**
       * `host: true` binds `0.0.0.0`, exposing the dev server on the LAN.
       * Handy for testing on a real phone / a tablet on the same wifi.
       */
      host: true,

      /**
       * `strictPort: false` lets Vite auto-increment if 3000 is busy. We
       * prefer stability over convenience but this is the low-friction
       * default; flip to `true` if you want CI to fail on port conflicts.
       */
      strictPort: false,
    },

    /*
     * ------------------------------------------------------------------------
     * Preview server (`vite preview`)
     * ------------------------------------------------------------------------
     * Serves the built `dist/` locally to smoke-test production output. Uses
     * a distinct port from `server` so you can run `vite dev` and `vite
     * preview` side by side (comparing prod vs dev behaviour).
     */
    preview: {
      port: 4173,
      host: true,
      strictPort: false,
    },

    /*
     * ------------------------------------------------------------------------
     * Build
     * ------------------------------------------------------------------------
     */
    build: {
      /** Emit into `dist/` under the package root. */
      outDir: "dist",

      /** Clean `dist/` on every build. Prevents stale hashed files leaking. */
      emptyOutDir: true,

      /**
       * Target ES2022 — every browser in the "≥ 2 years" support window
       * ships native `Object.hasOwn`, `Array.prototype.at`, top-level
       * `await`, private class fields, error `.cause`, etc. Prevents Vite
       * from emitting compat shims we don't need.
       */
      target: "es2022",

      /**
       * Emit sourcemaps in every mode. Storage is cheap and prod stacktraces
       * are worthless without them. Vercel doesn't expose them publicly by
       * default; Sentry/Datadog upload them for symbolication.
       */
      sourcemap: true,

      /** Split CSS per-chunk so route-level styles load lazily too. */
      cssCodeSplit: true,

      /**
       * Report gzip'd size on stdout. Slows the build ~5% but the info is
       * gold when investigating bundle bloat.
       */
      reportCompressedSize: true,

      /**
       * Bump the chunk-size warning threshold above the default 500 KB. Some
       * of our vendor chunks (react-vendor, refine-vendor) exceed that
       * intentionally — we'd rather see warnings when a real regression
       * pushes an app chunk over 1 MB gzip.
       */
      chunkSizeWarningLimit: 1000,

      /**
       * Assets below 4 KB are inlined as base64 into the referencing JS/CSS.
       * Reduces waterfall requests on cold loads at the cost of some
       * duplication. 4 KB is Vite's default; tuned per-project as needed.
       */
      assetsInlineLimit: 4096,

      /**
       * Minify with the default Rust minifier (Oxc-minify, shipped with
       * Vite 8 via Rolldown). Much faster than esbuild/Terser and produces
       * comparable output.
       */
      minify: true,

      /**
       * Minify CSS with lightningcss (Rust-based, faster than Oxc/esbuild
       * CSS minifiers and produces smaller output for our Tailwind v4 +
       * HeroUI Pro stylesheet). Requires the `lightningcss` peer dep, which
       * is bundled with Vite 8.
       */
      cssMinify: "lightningcss",

      /**
       * Polyfill `<link rel="modulepreload">` for Safari 11-15 users. Adds
       * <1 KB and materially improves TTI on cold loads.
       */
      modulePreload: {
        polyfill: true,
      },

      /**
       * Rollup output options — control chunking + filename hashing.
       */
      rollupOptions: {
        output: {
          /**
           * Cache-bust every emitted file with a content hash. Combined with
           * long `Cache-Control: immutable` headers (Vercel default for
           * `/assets/*`), users get instant subsequent loads.
           *
           * Filenames intentionally scoped under `assets/` so the CDN can
           * apply blanket immutable caching to that path only.
           */
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",

          /**
           * Manual vendor splits. Each rule below carves a stable, rarely-
           * changing library into its own chunk so the browser can reuse the
           * cache across app deploys.
           *
           * Ordering: check the most specific patterns first (heroui-pro
           * before heroui-oss). Every rule uses `[\\/]` for path separators
           * to stay portable across Windows/POSIX pnpm layouts.
           */
          manualChunks(id: string) {
            // Core React runtime — every SPA needs it, rarely changes.
            if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) {
              return "react-vendor";
            }

            // HeroUI Pro — the largest single third-party surface. Splitting
            // it out means UI-only changes don't invalidate the app bundle.
            if (/[\\/]node_modules[\\/]@heroui-pro[\\/]/.test(id)) {
              return "heroui-pro-vendor";
            }

            // HeroUI OSS + React Aria Components — companion foundation.
            if (
              /[\\/]node_modules[\\/](@heroui|react-aria-components|@react-aria|@react-stately|@react-types)[\\/]/.test(
                id,
              )
            ) {
              return "heroui-oss-vendor";
            }

            // Refine + TanStack Query data layer.
            if (/[\\/]node_modules[\\/](@refinedev|@tanstack)[\\/]/.test(id)) {
              return "refine-vendor";
            }

            // Realtime transport (Reverb speaks the Pusher protocol via Echo).
            if (/[\\/]node_modules[\\/](laravel-echo|pusher-js)[\\/]/.test(id)) {
              return "realtime-vendor";
            }

            // Charts (Recharts + d3 satellites) — heavy, only used on
            // dashboards. Splitting keeps the initial bundle lean.
            if (/[\\/]node_modules[\\/](recharts|d3-|victory-)[\\/]/.test(id)) {
              return "charts-vendor";
            }

            // Rich-text stack (Tiptap). Only loaded on editor routes.
            if (/[\\/]node_modules[\\/]@tiptap[\\/]/.test(id)) {
              return "editor-vendor";
            }

            // Motion / Framer Motion — animation runtime.
            if (/[\\/]node_modules[\\/](motion|framer-motion)[\\/]/.test(id)) {
              return "motion-vendor";
            }

            // Everything else falls through to the default entry chunk.
            return undefined;
          },
        },
      },
    },

    /*
     * ------------------------------------------------------------------------
     * Vitest
     * ------------------------------------------------------------------------
     * Test config lives here (rather than a separate `vitest.config.ts`) so
     * we don't fight two duplicate resolve/alias setups. `defineConfig`
     * comes from `vitest/config` — Vite-native.
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
          // The PWA registration hook is tightly coupled to the browser
          // service-worker API and is exercised only in production. Cover it
          // with a Playwright smoke test instead.
          "src/pwa/register-sw.ts",
        ],
      },
    },
  };
});

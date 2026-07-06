/**
 * @file vite.config.ts
 * @module vite.config
 *
 * @description
 * Production-grade Vite configuration for the Academorix tenant SPA
 * (`@academorix/dashboard`). The file is intentionally verbose so every option
 * below documents the reason it exists — a Vite config is a load-bearing piece
 * of infrastructure and drift here silently degrades the shipped bundle.
 *
 * Layout of the config:
 * 1. **Env + version** — read from `environments/` and `package.json`.
 * 2. **Plugins** — React + Tailwind v4 + PWA (Workbox service worker).
 * 3. **Path aliases** — `@` → `./src`.
 * 4. **Dev server** — port + HMR conventions.
 * 5. **Preview** — production-parity local preview.
 * 6. **Build** — code-splitting, minification, hashed filenames, sourcemaps.
 * 7. **Test (vitest)** — jsdom + coverage config.
 *
 * The PWA plugin is opinionated on purpose. See §Plugins below for the full
 * ADR (why `prompt` over `autoUpdate`, why `NetworkFirst` for the API, etc.).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

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
       * ----------------------------------------------------------------------
       * `vite-plugin-pwa` — Progressive Web App (Workbox service worker)
       * ----------------------------------------------------------------------
       *
       * WHY:
       * - The dashboard is a long-lived work-tool users leave open for hours.
       *   A service worker gives us (a) instant subsequent loads (precache),
       *   (b) resilient reads for reference data while offline, (c) a proper
       *   installable app on desktop + mobile that competes with native.
       *
       * ADRs baked into the config below:
       *
       * • `registerType: "prompt"` (NOT `"autoUpdate"`).
       *   Business apps can hold unsaved form state. We refuse to silently
       *   reload the page underneath the user. Instead the app shows a HeroUI
       *   toast ("New version available — Refresh") wired through
       *   `virtual:pwa-register/react` → `useRegisterSW`.
       *
       * • `injectRegister: null`.
       *   We register the SW ourselves inside React (see `src/pwa/`), because
       *   we need the `needRefresh` / `offlineReady` React state to drive the
       *   toast UI. Letting the plugin inject a `<script>` in `index.html`
       *   would fire the registration before React is mounted and we'd lose
       *   that hook.
       *
       * • `strategies: "generateSW"`.
       *   Workbox generates the SW from `workbox` options below. We do NOT
       *   need `injectManifest` (custom SW file) — every runtime-caching rule
       *   we want is expressible declaratively.
       *
       * • `workbox.navigateFallback: "/index.html"` + `navigateFallbackDenylist`.
       *   Standard SPA rewrite for cold offline loads — matches the Vercel
       *   rewrite in `vercel.json`. The denylist excludes `/api/*` so an
       *   offline fetch to the backend fails cleanly instead of returning
       *   the HTML shell (which would break `mock-data-provider.load()`'s
       *   HTML-not-JSON guard).
       *
       * • Runtime caching strategies:
       *   – `/api/*`             → NetworkFirst with 5s timeout, so users get
       *                             fresh data online but a stale copy while
       *                             offline. 200 responses only, 1h max age.
       *   – Fonts (CSS + files)  → StaleWhileRevalidate (safe: fonts are
       *                             pinned by URL, mutations are rare).
       *   – Images                → CacheFirst with a 60-entry LRU + 30d TTL.
       *   – App shell JS/CSS      → Precached at build time via
       *                             `globPatterns`.
       *
       * • `devOptions.enabled: false`.
       *   Never register a SW in dev. It ruins HMR (the SW intercepts fetches
       *   and Vite loses control). `mode = development` in the runtime hook
       *   also short-circuits on this.
       *
       * SEE ALSO:
       * - `src/pwa/register-sw.ts`      — React registration hook.
       * - `src/pwa/pwa-update-toast.tsx` — user-facing update UX.
       * - `vercel.json`                  — SPA rewrite + SW cache headers.
       * - `public/favicon.svg`           — master vector referenced by
       *                                    manifest icons.
       */
      VitePWA({
        strategies: "generateSW",
        registerType: "prompt",
        injectRegister: null,

        /**
         * Files that the plugin should include in the precache manifest. The
         * defaults cover JS/CSS/HTML/SVG; we add font files explicitly because
         * a self-hosted webfont in `public/fonts/` would otherwise fall to
         * runtime caching only.
         *
         * `globIgnores` deliberately excludes JSON fixture data — those are
         * mock-only and huge; we don't want them precached in production
         * where `VITE_API_MOCK=false`. The build never emits `data/` when
         * mocks are off, but keeping the ignore future-proofs the config.
         */
        includeAssets: ["favicon.svg", "favicon.ico", "robots.txt", "apple-touch-icon.png"],
        includeManifestIcons: true,

        /**
         * Web App Manifest. This is the metadata browsers use for the install
         * prompt, home-screen icon, splash screen, and shortcuts menu. Every
         * field below is intentional — do not remove one without checking
         * https://developer.mozilla.org/en-US/docs/Web/Manifest first.
         */
        manifest: {
          /** Full product name shown on the install prompt + splash screen. */
          name: "Academorix — Academy Operations",

          /** Short name (≤12 chars is ideal) for the home-screen icon. */
          short_name: "Academorix",

          /** One-line pitch. Shown in some install prompts + store listings. */
          description:
            "Academorix — the operating system for modern academies. Manage athletes, teams, sessions, matches, payments, and safeguarding from one place.",

          /** Sanctioned locale — helps browsers pick the right typography. */
          lang: "en",

          /** LTR by default; runtime i18n switches `<html dir>` at load. */
          dir: "ltr",

          /**
           * `standalone` renders without the browser chrome (address bar,
           * tabs) — the "app" feel. We deliberately avoid `fullscreen` which
           * hides the status bar and clashes with mobile safe-areas.
           */
          display: "standalone",

          /** Fallback list — if `standalone` isn't supported, try these. */
          display_override: ["window-controls-overlay", "standalone", "minimal-ui", "browser"],

          /** Vertical for phones, natural on tablets/desktops. */
          orientation: "any",

          /**
           * `theme_color` — used for the address bar tint on mobile Chrome/
           * Edge, the title-bar tint in installed PWAs, and the splash screen
           * top strip. This tracks HeroUI Pro's default accent (sky blue).
           * Kept in sync with the `<meta name="theme-color">` in index.html.
           */
          theme_color: "#0EA5E9",

          /**
           * `background_color` — splash screen background before the app
           * paints. White to match the default light-mode canvas so there is
           * no dark→light flash.
           */
          background_color: "#FFFFFF",

          /**
           * `scope` + `start_url` — required for the app to be installable.
           * `scope: "/"` lets the SW control every route; `start_url` opens
           * the workspace picker (which redirects to the appropriate landing
           * page once auth resolves).
           *
           * We embed a `source=pwa` query param on `start_url` so analytics
           * can distinguish installed-app opens from tab opens.
           */
          scope: "/",
          start_url: "/?source=pwa",

          /** Store-listing category hints. */
          categories: ["business", "productivity", "sports"],

          /**
           * Icons — referenced from the served origin. The manifest MUST list
           * at least one icon of each of these forms for full install
           * support:
           *   • 192×192 PNG (`purpose: "any"`) — Android launcher standard.
           *   • 512×512 PNG (`purpose: "any"`) — Android splash + Windows.
           *   • 512×512 PNG (`purpose: "maskable"`) — Android adaptive icons
           *     (the OS crops to a circle/squircle; we bleed the graphic
           *     into the safe zone).
           *   • SVG (`purpose: "any"`, `sizes: "any"`) — scalable fallback +
           *     favicon.
           *
           * The PNGs are generated on demand by
           * `pnpm --filter @academorix/dashboard generate-pwa-assets`, which
           * rasterizes `favicon.svg` via `@vite-pwa/assets-generator`. Until
           * that runs, browsers gracefully fall back to the SVG icon.
           *
           * NOTE: filenames match the `minimal-2023` preset defaults so
           * consumers don't need to remember custom names.
           */
          icons: [
            {
              src: "/favicon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any",
            },
            {
              src: "/pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],

          /**
           * App shortcuts — right-click on the installed app (Windows/Android
           * long-press, macOS dock context menu) exposes these as jump links.
           * Curated to the four screens most-loaded during a shift.
           */
          shortcuts: [
            {
              name: "Dashboard",
              short_name: "Home",
              description: "Overview of today's activity + KPIs",
              url: "/dashboard?source=pwa-shortcut",
              icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
            },
            {
              name: "Athletes",
              short_name: "Athletes",
              description: "Roster + registration + safeguarding",
              url: "/athletes?source=pwa-shortcut",
              icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
            },
            {
              name: "Sessions",
              short_name: "Sessions",
              description: "Training sessions + attendance",
              url: "/sessions?source=pwa-shortcut",
              icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
            },
            {
              name: "Command Palette",
              short_name: "Search",
              description: "Jump anywhere with ⌘K",
              url: "/?command=open&source=pwa-shortcut",
              icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
            },
          ],
        },

        /**
         * Workbox generation options — control what the plugin bakes into
         * the emitted `sw.js`.
         */
        workbox: {
          /**
           * Precache manifest inputs. `**\/*.{js,css,html,ico,png,svg,webp}`
           * covers every asset Vite emits. We deliberately DO NOT precache
           * source maps (they can be > 1 MB each) and DO NOT precache the
           * mock JSON fixtures.
           */
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
          globIgnores: ["**/data/**", "**/*.map"],

          /**
           * Some routes (e.g. `/dashboard/athletes/{id}`) are dynamic and
           * cannot be precached individually — the SW should serve
           * `/index.html` for any navigation request that isn't precached.
           * `navigateFallbackDenylist` keeps the fallback OUT of `/api/*`
           * paths so a failed API call surfaces the real network error, not
           * the SPA shell.
           */
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [
            /^\/api\//, // Backend API — never fall back to the SPA shell.
            /^\/sw\.js$/, // The service worker itself.
            /^\/workbox-.*\.js$/, // Workbox runtime chunks.
            /^\/manifest\.webmanifest$/, // Manifest — must be served as-is.
          ],

          /**
           * Runtime caching — everything that isn't precached goes through
           * these rules on request. Order matters: the first matching entry
           * wins.
           */
          runtimeCaching: [
            {
              // -----------------------------------------------------------------
              // Backend API — NetworkFirst
              // -----------------------------------------------------------------
              // Users need fresh data. When online, the browser talks to the
              // network; if the network fails or times out (5s), it falls back
              // to the cached copy. Cached responses expire after 1h so we
              // never serve dangerously stale content.
              urlPattern: ({ url }) =>
                url.pathname.startsWith("/api/") && url.origin === self.location.origin,
              handler: "NetworkFirst",
              method: "GET",
              options: {
                cacheName: "academorix-api-v1",
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60, // 1 hour
                  purgeOnQuotaError: true,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // -----------------------------------------------------------------
              // Same-origin images — CacheFirst
              // -----------------------------------------------------------------
              // Images (avatars, thumbnails, badges) rarely change and are
              // heavy. Cache aggressively; LRU-evict past 100 entries.
              urlPattern: ({ request, url }) =>
                request.destination === "image" && url.origin === self.location.origin,
              handler: "CacheFirst",
              options: {
                cacheName: "academorix-images-v1",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                  purgeOnQuotaError: true,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // -----------------------------------------------------------------
              // Google Fonts stylesheet — StaleWhileRevalidate
              // -----------------------------------------------------------------
              // Even though we self-host in production, some HeroUI Pro chart
              // stubs pull Inter from fonts.googleapis.com in dev. Cache it
              // safely; the stylesheet is tiny.
              urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "google-fonts-stylesheets-v1",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
              },
            },
            {
              // -----------------------------------------------------------------
              // Google Fonts files — CacheFirst
              // -----------------------------------------------------------------
              // Font binaries are content-hashed by Google, so a CacheFirst
              // strategy with a long TTL is safe.
              urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-webfonts-v1",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],

          /**
           * Delete every cache from previous Workbox versions on activate.
           * Prevents "why is my SW still serving last week's build" bugs.
           */
          cleanupOutdatedCaches: true,

          /**
           * `clientsClaim: true` means the new SW immediately controls every
           * open tab as soon as it activates. Combined with `skipWaiting:
           * false` and our `prompt` register type, the sequence is:
           *   1. New SW installs in the background.
           *   2. React's `needRefresh` state flips to `true`.
           *   3. User clicks "Refresh" in the toast.
           *   4. We call `updateSW(true)` which triggers `skipWaiting()` and
           *      then reloads — at which point `clientsClaim` puts the new
           *      SW in control immediately.
           */
          clientsClaim: true,
          skipWaiting: false,

          /**
           * Max precached asset size. 5 MB is generous but keeps us from
           * accidentally precaching a huge JSON blob if the mock data ever
           * ends up in the build output.
           */
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

          /** Never emit sourcemaps for the SW itself. */
          sourcemap: false,
        },

        /**
         * Dev-mode behaviour. We deliberately keep the SW OFF during `vite
         * dev` because it interferes with HMR (the SW would intercept module
         * requests). The dev experience matters more than testing the SW
         * locally; we validate PWA behaviour against `vite build && vite
         * preview` and in Vercel preview deploys instead.
         */
        devOptions: {
          enabled: false,
          type: "module",
          navigateFallback: "index.html",
          suppressWarnings: true,
        },
      }),
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
       *
       * NOTE: Vite 8 replaced esbuild with Oxc/Rolldown as the primary
       * transformer + minifier. `"esbuild"` is still accepted as a legacy
       * value but internally maps to Oxc. Setting `true` picks the built-in
       * default and side-steps the compat shim.
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
     * Oxc transformer
     * ------------------------------------------------------------------------
     * Vite 8 uses Oxc (Rust-based) as the JS/TS/JSX transformer, replacing
     * esbuild from earlier Vite versions. We keep the default JSX config
     * (`@vitejs/plugin-react` handles React 19 fast refresh) and add no
     * global JSX injection.
     *
     * Console/debugger stripping in production is delegated to Oxc-minify
     * (invoked automatically by `build.minify: true` above), which drops
     * `debugger` statements by default. If we ever want to also strip
     * `console.log`/`.info`/etc., migrate to `build.minifyOptions =
     * { compress: { dropConsole: true } }` when Vite exposes that key.
     * For now the calls survive but with our custom logging discipline
     * that's fine.
     */
    oxc: undefined,

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

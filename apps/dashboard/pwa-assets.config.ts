/**
 * @file pwa-assets.config.ts
 * @module pwa-assets.config
 *
 * @description
 * Declarative configuration for `@vite-pwa/assets-generator` — the CLI that
 * rasterizes `public/favicon.svg` into every PNG icon referenced by the Web
 * App Manifest and the `<link rel="apple-touch-icon">` tag.
 *
 * ## When this runs
 *
 * NEVER at build time. The generator is a **manual** developer step invoked
 * via:
 *
 *   pnpm --filter @academorix/dashboard generate-pwa-assets
 *
 * Keeping icon generation out of CI avoids installing `sharp` (a native
 * binary that's slow to install and platform-sensitive) on every build. The
 * generated PNGs are committed to the repo alongside `favicon.svg`.
 *
 * ## When to rerun
 *
 * - Whenever `public/favicon.svg` changes (new brand color, new glyph).
 * - Whenever we bump the `minimal-2023` preset (new required icon size).
 *
 * ## Output layout
 *
 * The `minimal-2023` preset emits, all into `public/`:
 *
 *   favicon.ico              — 32×32 legacy IE / bookmark bar icon.
 *   apple-touch-icon.png     — 180×180 iOS home-screen (never maskable).
 *   pwa-64x64.png            — Smallest manifest icon; used at high DPI.
 *   pwa-192x192.png          — Android launcher standard.
 *   pwa-512x512.png          — Android splash + Windows tile.
 *   maskable-icon-512x512.png — Adaptive icon (safe zone = inner 80%).
 *
 * Each file is content-hashed by Vite's build so long-term caching is safe.
 *
 * ## Docs
 *
 * https://vite-pwa-org.netlify.app/assets-generator/
 */

import { defineConfig, minimal2023Preset as preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  /**
   * Header written at the top of the generated `index.html` snippet that the
   * CLI emits in stdout. We don't actually use that snippet (our `index.html`
   * is hand-authored — see the docblock at the top of `index.html` for the
   * links that must stay in sync with this preset), but the header helps
   * anyone running the CLI understand where the output came from.
   */
  headLinkOptions: {
    preset: "2023",
  },

  /**
   * The rasterization preset. `minimal-2023` matches the Web App Manifest
   * baseline recommended by MDN + web.dev in 2023 and is the source of truth
   * for our `manifest.icons` in `vite.config.ts`.
   *
   * If we ever add PWA push notifications or badging, revisit this to add
   * `badge` + notification icons.
   */
  preset,

  /**
   * Master SVG. Path is relative to this config file's directory
   * (`apps/dashboard/`). The generator overwrites raster outputs in-place
   * next to this source file — do not point at a temp directory.
   */
  images: ["public/favicon.svg"],
});

/**
 * @file pwa-assets.config.ts
 * @module pwa-assets.config
 *
 * @description
 * Declarative configuration for `@vite-pwa/assets-generator` — the CLI that
 * rasterizes `public/academorix-icon-tile.png` (the brand-provided app
 * tile) into every PNG icon referenced by the Web App Manifest and the
 * `<link rel="apple-touch-icon">` tag.
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
 * generated PNGs are committed to the repo alongside the master tile.
 *
 * ## Master image
 *
 * `public/academorix-icon-tile.png` is the 1024×1024 designed app tile
 * shipped by the brand team (see `/brand/academorix-icon-tile.png` at the
 * monorepo root). It's opaque with the brand background baked in — the
 * right choice for maskable Android adaptive icons (which crop to a
 * circle, so the safe zone must be visible) and iOS home screen tiles
 * (which don't support transparency at all).
 *
 * The same source drives the landing-page's PWA icons — both apps stay
 * visually consistent by design.
 *
 * ## When to rerun
 *
 * - Whenever `public/academorix-icon-tile.png` changes (new brand color,
 *   new glyph, new mark).
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
   * for our `MANIFEST_ICONS` in `src/config/pwa.config.ts`.
   *
   * If we ever add PWA push notifications or badging, revisit this to add
   * `badge` + notification icons.
   */
  preset,

  /**
   * Master image. Path is relative to this config file's directory
   * (`apps/dashboard/`). The generator writes raster outputs into the same
   * `public/` folder as this source — do not point at a temp directory.
   *
   * PNG input at 1024×1024 gives sharp enough downscales for every size in
   * the `minimal-2023` preset (largest emitted is 512×512).
   */
  images: ["public/academorix-icon-tile.png"],
});

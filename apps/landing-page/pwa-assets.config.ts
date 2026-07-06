/**
 * @file pwa-assets.config.ts
 * @module pwa-assets.config
 *
 * @description
 * Declarative configuration for `@vite-pwa/assets-generator` — the CLI
 * that rasterizes `public/favicon.svg` into every PNG icon referenced
 * by the Web App Manifest (see `src/config/pwa.config.ts`) and the
 * `<link rel="apple-touch-icon">` iOS home-screen icon.
 *
 * ## When this runs
 *
 * NEVER at build time. The generator is a **manual** developer step
 * invoked via:
 *
 *   pnpm --filter @academorix/landing-page generate-pwa-assets
 *
 * Keeping icon generation out of CI avoids installing `sharp` (a
 * native binary that's slow to install and platform-sensitive) on
 * every Vercel build. The generated PNGs are committed to the repo
 * alongside `favicon.svg` and served from `public/` as static assets.
 *
 * ## When to rerun
 *
 *   - Whenever `public/academorix-icon-tile.png` changes (new brand
 *     colour, new glyph, new lockup).
 *   - Whenever we bump the `minimal-2023` preset (new required icon
 *     size — check Web App Manifest MDN for additions).
 *
 * ## Master image
 *
 * `public/academorix-icon-tile.png` is the 1024×1024 designed app tile
 * shipped by the brand team (see `/brand/academorix-icon-tile.png` in
 * the monorepo root). It's opaque with the brand background baked in
 * — that's what we want for maskable Android adaptive icons (which
 * crop to a circle, so the safe zone must be visible) and iOS home
 * screen tiles (which don't support transparency at all). If a proper
 * SVG master ships later, swap it in without touching consumers —
 * `PWA_ICONS` in `src/config/pwa.config.ts` references file names, not
 * this source.
 *
 * ## Output layout
 *
 * The `minimal-2023` preset emits, all into `public/`:
 *
 *   favicon.ico                — 32×32 legacy IE + bookmark bar.
 *   apple-touch-icon.png       — 180×180 iOS home-screen (never maskable).
 *   pwa-64x64.png              — Smallest manifest icon; used at high DPI.
 *   pwa-192x192.png            — Android launcher standard.
 *   pwa-512x512.png            — Android splash + Windows tile.
 *   maskable-icon-512x512.png  — Adaptive icon (safe zone = inner 80%).
 *
 * Every file is content-hashed by Vercel's static asset pipeline once
 * committed, so long-term caching is safe.
 *
 * ## Docs
 *
 * https://vite-pwa-org.netlify.app/assets-generator/
 */

import { defineConfig, minimal2023Preset as preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  /**
   * Header written at the top of the generated `<head>` snippet the
   * CLI emits in stdout. We don't consume that snippet — our
   * `<link rel="manifest">` is emitted via the Next Metadata API
   * (`generateMetadata` in `src/app/[locale]/layout.tsx`) — but the
   * header helps anyone running the CLI understand what preset
   * produced the output.
   */
  headLinkOptions: {
    preset: "2023",
  },

  /**
   * The rasterization preset. `minimal-2023` matches the Web App
   * Manifest baseline recommended by MDN + web.dev in 2023 and is
   * the source of truth for `PWA_ICONS` in
   * `src/config/pwa.config.ts`.
   */
  preset,

  /**
   * Master image. Path is relative to this config file's directory
   * (`apps/landing-page/`). The generator writes raster outputs into
   * the same `public/` folder as this source — do not point at a
   * temp directory.
   *
   * PNG input at 1024×1024 gives sharp enough downscales for every
   * size in the `minimal-2023` preset (largest emitted is 512×512).
   */
  images: ["public/academorix-icon-tile.png"],
});

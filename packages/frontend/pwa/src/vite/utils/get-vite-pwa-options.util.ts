/**
 * @file get-vite-pwa-options.util.ts
 * @module @stackra/pwa/vite/utils
 * @description Build the options object passed to `VitePWA(...)`.
 *
 *   Composes `buildManifest` + `getRuntimeCaching` behind a single
 *   flat input. The return type is `Record<string, unknown>` at the
 *   boundary — we deliberately don't depend on `vite-plugin-pwa`'s
 *   types because that would drag its peer deps into every
 *   consumer's typecheck. The caller performs the cast at the call
 *   site.
 */

import { buildManifest } from "../../manifest";
import { getRuntimeCaching } from "../../workbox";
import { DEFAULT_NAVIGATE_FALLBACK_DENYLIST } from "../constants";
import type { IGetVitePwaOptionsInput } from "../interfaces";

/**
 * Compose a `vite-plugin-pwa` options object.
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { VitePWA } from 'vite-plugin-pwa';
 * import { getVitePwaOptions } from '@stackra/pwa/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     VitePWA(getVitePwaOptions({
 *       manifest: { name: 'Stackra', shortName: 'Stackra', ... },
 *     }) as VitePWAOptions),
 *   ],
 * });
 * ```
 *
 * @param input - Manifest + workbox knobs.
 * @returns A `VitePWAOptions`-shaped object typed as
 *   `Record<string, unknown>`.
 */
export function getVitePwaOptions(input: IGetVitePwaOptionsInput): Record<string, unknown> {
  const {
    manifest,
    runtimeCaching,
    registerType = "prompt",
    precacheGlobs = ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
    navigateFallback = "index.html",
    navigateFallbackDenylist = DEFAULT_NAVIGATE_FALLBACK_DENYLIST,
    devEnabled = false,
    workboxExtras = {},
  } = input;

  return {
    registerType,
    manifest: buildManifest(manifest),
    devOptions: { enabled: devEnabled },
    workbox: {
      globPatterns: precacheGlobs,
      navigateFallback,
      // Spread into a fresh array — `vite-plugin-pwa` mutates the
      // config internally and we don't want to leak that back into
      // the caller's `DEFAULT_NAVIGATE_FALLBACK_DENYLIST` reference.
      navigateFallbackDenylist: [...navigateFallbackDenylist],
      runtimeCaching: [...getRuntimeCaching(runtimeCaching)],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      // Never skipWaiting by default — the "update available" flow
      // driven by `PwaService.acceptUpdate()` handles it explicitly.
      skipWaiting: false,
      ...workboxExtras,
    },
  };
}

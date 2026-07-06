/**
 * @file get-vite-pwa-options.ts
 * @module @academorix/pwa/vite/get-vite-pwa-options
 *
 * @description
 * `getVitePwaOptions(input)` — composes the options object the
 * dashboard's `vite.config.ts` passes to `VitePWA(...)`. Wraps
 * `buildManifest` + `getRuntimeCaching` so the caller only sees
 * one flat input.
 *
 * The return value is typed as `unknown` at the boundary — we
 * DON'T depend on `vite-plugin-pwa`'s types because that would
 * pull the plugin's peer deps into every consumer's typecheck.
 * The caller performs a single `as VitePWAOptions` cast at the
 * call site; the shape is contract-tested in the dashboard's
 * config.
 */

import { buildManifest } from "../manifest/build-manifest.util";
import { getRuntimeCaching } from "../workbox/runtime-caching.util";

import type { BuildManifestInput } from "../manifest/build-manifest.util";
import type { RuntimeCachingOptions } from "../workbox/runtime-caching.util";

/** Input the caller passes to {@link getVitePwaOptions}. */
export interface GetVitePwaOptionsInput {
  /** Manifest inputs — forwarded to `buildManifest`. */
  readonly manifest: BuildManifestInput;
  /** Runtime-caching overrides — forwarded to `getRuntimeCaching`. */
  readonly runtimeCaching?: RuntimeCachingOptions;
  /**
   * Whether to register the service worker automatically. Default
   * `"prompt"` — the app shows a "Refresh to update" toast via
   * `useRegisterSW`. Set `"autoUpdate"` for silent hot-swaps.
   */
  readonly registerType?: "prompt" | "autoUpdate";
  /**
   * Glob patterns for files to precache. Default matches the
   * dashboard's output: JS/CSS/HTML/PNG/SVG/WebP/WOFF/WOFF2 with
   * an 8-character content hash.
   */
  readonly precacheGlobs?: readonly string[];
  /**
   * URL to fall back to when the service worker can't fulfill a
   * navigation request. Default `"index.html"` (SPA fallback).
   * Set `null` to disable — pointless for a single-page app.
   */
  readonly navigateFallback?: string | null;
  /**
   * Regexes for URLs to skip when handling navigation requests.
   * Default excludes `/api/*`, `/broadcasting/*`, and any URL with
   * a file extension in the path.
   */
  readonly navigateFallbackDenylist?: readonly RegExp[];
  /**
   * Whether the service worker should be enabled in dev builds.
   * Default `false` — dev builds don't precache and the SW would
   * only slow down hot-reload.
   */
  readonly devEnabled?: boolean;
  /** Additional workbox options merged into the emitted config. */
  readonly workboxExtras?: Readonly<Record<string, unknown>>;
}

/**
 * The default navigate-fallback denylist — every URL that should
 * hit the network directly instead of the SPA shell.
 */
export const DEFAULT_NAVIGATE_FALLBACK_DENYLIST: readonly RegExp[] = [
  /^\/api\//,
  /^\/broadcasting\//,
  /^\/manifest\.webmanifest/,
  /^\/sitemap/,
  /^\/robots/,
  // Any URL whose last path segment has an extension (JS bundles,
  // static assets, etc.) — the SPA shell doesn't own these.
  /\.[a-z0-9]{2,5}(\?.*)?$/i,
] as const;

/**
 * Composes a `vite-plugin-pwa` options object. Cast to
 * `VitePWAOptions` at the call site in the app's `vite.config.ts`.
 *
 * @example
 * ```ts
 * // apps/dashboard/vite.config.ts
 * import { VitePWA } from "vite-plugin-pwa";
 * import { getVitePwaOptions } from "@academorix/pwa/vite";
 *
 * export default defineConfig({
 *   plugins: [
 *     react(),
 *     VitePWA(getVitePwaOptions({
 *       manifest: { name, shortName, description, ... },
 *     }) as VitePWAOptions),
 *   ],
 * });
 * ```
 */
export function getVitePwaOptions(input: GetVitePwaOptionsInput): Record<string, unknown> {
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
      navigateFallbackDenylist: [...navigateFallbackDenylist],
      runtimeCaching: [...getRuntimeCaching(runtimeCaching)],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: false,
      ...workboxExtras,
    },
  };
}

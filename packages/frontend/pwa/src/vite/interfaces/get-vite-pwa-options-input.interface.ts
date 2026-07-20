/**
 * @file get-vite-pwa-options-input.interface.ts
 * @module @stackra/pwa/vite/interfaces
 * @description Input shape for `getVitePwaOptions(input)`.
 */

import type { IBuildManifestInput } from "../../manifest";
import type { IRuntimeCachingOptions } from "../../workbox";

/**
 * Input passed to `getVitePwaOptions`.
 *
 * Composed of a manifest input (forwarded to `buildManifest`) plus
 * curated Workbox options (forwarded to `getRuntimeCaching`), and
 * a handful of plugin-level knobs.
 */
export interface IGetVitePwaOptionsInput {
  /** Manifest inputs — forwarded to `buildManifest`. */
  readonly manifest: IBuildManifestInput;
  /** Runtime-caching overrides — forwarded to `getRuntimeCaching`. */
  readonly runtimeCaching?: IRuntimeCachingOptions;
  /**
   * Service-worker registration mode. `'prompt'` shows a
   * "Refresh to update" prompt (via `useRegisterSW`); `'autoUpdate'`
   * silently hot-swaps.
   *
   * @default 'prompt'
   */
  readonly registerType?: "prompt" | "autoUpdate";
  /**
   * Glob patterns for files to precache. Defaults to the shape a
   * standard Vite build emits (JS/CSS/HTML with content hashes).
   */
  readonly precacheGlobs?: readonly string[];
  /**
   * URL to fall back to when the SW can't fulfil a navigation
   * request. `null` disables the fallback entirely (pointless for
   * a single-page app).
   *
   * @default 'index.html'
   */
  readonly navigateFallback?: string | null;
  /** Regexes for URLs that skip the navigate fallback. */
  readonly navigateFallbackDenylist?: readonly RegExp[];
  /**
   * Whether the service worker runs in dev builds. Off by default
   * because dev builds don't precache and the SW slows HMR.
   *
   * @default false
   */
  readonly devEnabled?: boolean;
  /** Additional workbox options merged into the emitted config. */
  readonly workboxExtras?: Readonly<Record<string, unknown>>;
}

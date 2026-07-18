/**
 * @file get-serwist-options.ts
 * @module @academorix/pwa/serwist/get-serwist-options
 *
 * @description
 * `getSerwistOptions(input)` — composes the options object the
 * marketing app's Serwist service-worker source consumes.
 *
 * Serwist is the modern Workbox-based PWA toolkit maintained by
 * Google's PWA working group. `@serwist/turbopack` is the
 * Turbopack-native integration Next.js 16 uses. Landing-page is
 * already using it (see `apps/landing-page/tsconfig.sw.json` +
 * the recent 503c742 commit).
 *
 * The return value stays typed as `Record<string, unknown>` at the
 * package boundary so consumers cast to `SerwistOptions` at the
 * call site — same rationale as {@link getVitePwaOptions}.
 */

import { getRuntimeCaching } from "../workbox/runtime-caching.util";

import type { RuntimeCachingOptions } from "../workbox/runtime-caching.util";

/** Input the caller passes to {@link getSerwistOptions}. */
export interface GetSerwistOptionsInput {
  /**
   * Runtime-caching overrides — forwarded to `getRuntimeCaching`.
   * The marketing app usually turns off the API rule
   * (`includeApi: false`) since it doesn't hit same-origin APIs.
   */
  readonly runtimeCaching?: RuntimeCachingOptions;
  /**
   * URL to fall back to when Serwist can't fulfill a navigation
   * request. Marketing pages are SSG so this is usually `null` —
   * Next.js already emits the right HTML per route.
   */
  readonly navigateFallback?: string | null;
  /**
   * URLs to skip when handling navigation requests.
   */
  readonly navigateFallbackDenylist?: readonly RegExp[];
  /**
   * Whether Serwist should skip its `install` waiting phase and
   * activate immediately. Default `false`.
   */
  readonly skipWaiting?: boolean;
  /**
   * Whether the active service worker should claim uncontrolled
   * clients immediately. Default `true`.
   */
  readonly clientsClaim?: boolean;
  /** Additional options merged into the emitted config. */
  readonly extras?: Readonly<Record<string, unknown>>;
}

/**
 * Composes a Serwist configuration object. Cast to the Serwist
 * options type at the call site.
 *
 * @example
 * ```ts
 * // apps/landing-page/src/app/sw.ts
 * import { installSerwist } from "@serwist/turbopack";
 * import { getSerwistOptions } from "@academorix/pwa/serwist";
 *
 * declare const self: ServiceWorkerGlobalScope & {
 *   __SW_MANIFEST: unknown[];
 * };
 *
 * installSerwist({
 *   ...getSerwistOptions({ runtimeCaching: { includeApi: false } }),
 *   precacheEntries: self.__SW_MANIFEST,
 * });
 * ```
 */
export function getSerwistOptions(input: GetSerwistOptionsInput = {}): Record<string, unknown> {
  const {
    runtimeCaching,
    navigateFallback,
    navigateFallbackDenylist,
    skipWaiting = false,
    clientsClaim = true,
    extras = {},
  } = input;

  return {
    runtimeCaching: [...getRuntimeCaching(runtimeCaching)],
    ...(navigateFallback === undefined
      ? {}
      : { fallbacks: { entries: [{ url: navigateFallback }] } }),
    ...(navigateFallbackDenylist
      ? { navigateFallbackDenylist: [...navigateFallbackDenylist] }
      : {}),
    skipWaiting,
    clientsClaim,
    ...extras,
  };
}

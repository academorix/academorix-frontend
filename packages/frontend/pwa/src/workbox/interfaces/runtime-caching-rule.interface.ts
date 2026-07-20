/**
 * @file runtime-caching-rule.interface.ts
 * @module @stackra/pwa/workbox/interfaces
 * @description Structural type for a single Workbox `RuntimeCaching`
 *   rule — kept independent of the `workbox-build` package so
 *   consumer typechecks don't pull in a large Node-only dep chain.
 */

/**
 * A single Workbox runtime-caching rule.
 *
 * `vite-plugin-pwa` accepts an array of these on
 * `workbox.runtimeCaching`; Serwist accepts the same shape on its
 * `runtimeCaching`.
 */
export interface IRuntimeCachingRule {
  /**
   * URL matcher. Either a regex or a function returning `true` when
   * the rule applies. The function form receives the parsed URL plus
   * a `sameOrigin` boolean.
   */
  readonly urlPattern:
    RegExp | ((context: { readonly url: URL; readonly sameOrigin: boolean }) => boolean);
  /** Workbox strategy name. */
  readonly handler:
    "CacheFirst" | "NetworkFirst" | "StaleWhileRevalidate" | "NetworkOnly" | "CacheOnly";
  /** Strategy-specific options. */
  readonly options?: {
    readonly cacheName?: string;
    readonly networkTimeoutSeconds?: number;
    readonly expiration?: {
      readonly maxEntries?: number;
      readonly maxAgeSeconds?: number;
    };
    readonly cacheableResponse?: {
      readonly statuses?: readonly number[];
    };
    readonly [key: string]: unknown;
  };
}

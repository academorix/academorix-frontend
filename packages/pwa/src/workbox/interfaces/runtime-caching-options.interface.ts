/**
 * @file runtime-caching-options.interface.ts
 * @module @stackra/pwa/workbox/interfaces
 * @description Options accepted by `getRuntimeCaching(options)`.
 */

/**
 * Options for {@link getRuntimeCaching}.
 *
 * Every field is optional; the defaults ship a sensible baseline
 * (API `NetworkFirst`, images `CacheFirst`, fonts `CacheFirst`,
 * HTML navigation `NetworkFirst`).
 */
export interface IRuntimeCachingOptions {
  /**
   * Include the same-origin API-GET rule. Turn off for marketing
   * apps that don't call same-origin APIs. @default true
   */
  readonly includeApi?: boolean;
  /** API path prefix (matched by regex). @default '/api' */
  readonly apiPathPrefix?: string;
  /** API cache expiry in seconds. @default 86400 (24h) */
  readonly apiMaxAgeSeconds?: number;
  /** API cache max entries. @default 200 */
  readonly apiMaxEntries?: number;

  /** Image cache expiry in seconds. @default 2592000 (30 days) */
  readonly imageMaxAgeSeconds?: number;
  /** Image cache max entries. @default 100 */
  readonly imageMaxEntries?: number;

  /** Font cache expiry in seconds. @default 31536000 (1 year) */
  readonly fontMaxAgeSeconds?: number;
  /** Font cache max entries. @default 30 */
  readonly fontMaxEntries?: number;

  /**
   * Include the HTML navigation-`NetworkFirst` rule. @default true
   */
  readonly includeHtmlNavigation?: boolean;
  /** Navigation network-first timeout in seconds. @default 3 */
  readonly navigationTimeoutSeconds?: number;

  /**
   * Prefix used for the emitted `cacheName` values. Every rule's
   * cache is named `<cacheNamePrefix>-<category>`. @default 'stackra-pwa'
   */
  readonly cacheNamePrefix?: string;
}

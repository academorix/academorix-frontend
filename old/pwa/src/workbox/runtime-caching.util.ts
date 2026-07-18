/**
 * @file runtime-caching.util.ts
 * @module @academorix/pwa/workbox/runtime-caching.util
 *
 * @description
 * Curated Workbox runtime-caching strategies used by both apps'
 * service workers. Kept as plain data (arrays of
 * `RuntimeCaching`-shaped objects) so the caller's Workbox version
 * consumes them directly — we don't wrap or transform.
 *
 * ## Strategies
 *
 *  - **API GETs** — `NetworkFirst` with a short 5s timeout so pages
 *    that assume same-origin API don't stall when offline. Falls
 *    back to a small (~24h) cache.
 *  - **Images** — `CacheFirst` with a 30-day expiry. Suitable for
 *    logos, brand marks, static content.
 *  - **Fonts** — `CacheFirst` with a 1-year expiry. Web fonts are
 *    versioned in the URL by every provider we use.
 *  - **Chunked JS/CSS** — Workbox precaches these via
 *    `globPatterns` in the plugin config; no runtime rule needed.
 *
 * ## Cross-tool compatibility
 *
 * `vite-plugin-pwa` accepts `RuntimeCaching[]` on `workbox.runtimeCaching`.
 * Serwist accepts `RuntimeCaching[]` on `runtimeCaching` in the
 * service worker source. Both apps pass the same array unchanged.
 */

/**
 * Structural type mirroring Workbox's `RuntimeCaching` — we DON'T
 * import from `workbox-build` because that pulls in a large chain
 * of Node-only deps we don't need in every consumer's typecheck.
 */
export interface RuntimeCachingRule {
  /**
   * Either a regex (`RegExp`) matched against the request URL, or a
   * function callback returning true when the rule applies.
   */
  readonly urlPattern: RegExp | ((context: { url: URL; sameOrigin: boolean }) => boolean);
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

/**
 * Options accepted by {@link getRuntimeCaching}. Every field is
 * optional — the defaults ship a sensible baseline for Academorix.
 */
export interface RuntimeCachingOptions {
  /**
   * Include the API-GET rule. Turn off for the marketing app since
   * its pages don't call same-origin APIs.
   */
  readonly includeApi?: boolean;
  /** API path prefix (matched by regex). Default `"/api"`. */
  readonly apiPathPrefix?: string;
  /** API cache expiry in seconds. Default 24h. */
  readonly apiMaxAgeSeconds?: number;
  /** API cache max entries. Default 200. */
  readonly apiMaxEntries?: number;
  /** Image cache expiry in seconds. Default 30 days. */
  readonly imageMaxAgeSeconds?: number;
  /** Image cache max entries. Default 100. */
  readonly imageMaxEntries?: number;
  /** Font cache expiry in seconds. Default 1 year. */
  readonly fontMaxAgeSeconds?: number;
  /** Font cache max entries. Default 30. */
  readonly fontMaxEntries?: number;
}

const DEFAULT_API_PREFIX = "/api";
const DAY_SECONDS = 60 * 60 * 24;
const YEAR_SECONDS = DAY_SECONDS * 365;

/**
 * Returns the curated runtime-caching rules for an Academorix app.
 * Callers pass the returned array to `vite-plugin-pwa`'s
 * `workbox.runtimeCaching` or Serwist's `runtimeCaching`.
 */
export function getRuntimeCaching(
  options: RuntimeCachingOptions = {},
): readonly RuntimeCachingRule[] {
  const {
    includeApi = true,
    apiPathPrefix = DEFAULT_API_PREFIX,
    apiMaxAgeSeconds = DAY_SECONDS,
    apiMaxEntries = 200,
    imageMaxAgeSeconds = DAY_SECONDS * 30,
    imageMaxEntries = 100,
    fontMaxAgeSeconds = YEAR_SECONDS,
    fontMaxEntries = 30,
  } = options;

  const rules: RuntimeCachingRule[] = [];

  if (includeApi) {
    // Same-origin API GETs.
    const escapedPrefix = apiPathPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    rules.push({
      urlPattern: ({ url, sameOrigin }) =>
        sameOrigin && new RegExp(`^${escapedPrefix}(/|$)`).test(url.pathname),
      handler: "NetworkFirst",
      options: {
        cacheName: "academorix-api",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: apiMaxEntries,
          maxAgeSeconds: apiMaxAgeSeconds,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    });
  }

  // Same-origin images (PWA icons, brand assets, uploaded content).
  rules.push({
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
    handler: "CacheFirst",
    options: {
      cacheName: "academorix-images",
      expiration: {
        maxEntries: imageMaxEntries,
        maxAgeSeconds: imageMaxAgeSeconds,
      },
      cacheableResponse: { statuses: [0, 200] },
    },
  });

  // Fonts (Google Fonts / local self-hosted).
  rules.push({
    urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
    handler: "CacheFirst",
    options: {
      cacheName: "academorix-fonts",
      expiration: {
        maxEntries: fontMaxEntries,
        maxAgeSeconds: fontMaxAgeSeconds,
      },
      cacheableResponse: { statuses: [0, 200] },
    },
  });

  return rules;
}

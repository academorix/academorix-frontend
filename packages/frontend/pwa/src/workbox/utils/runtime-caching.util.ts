/**
 * @file runtime-caching.util.ts
 * @module @stackra/pwa/workbox/utils
 * @description Curated Workbox runtime-caching rules.
 *
 *   The five categories the package ships:
 *   1. Same-origin API (`NetworkFirst`, 5s timeout).
 *   2. Images (`.png|jpg|jpeg|svg|gif|webp|avif|ico` — `CacheFirst`, 30d).
 *   3. Fonts (`.woff|woff2|ttf|otf|eot` — `CacheFirst`, 1y).
 *   4. HTML navigation (`NetworkFirst`, 3s timeout).
 *
 *   Every `cacheName` is prefixed (default `stackra-pwa`) so the
 *   caches don't collide with other Workbox users in the same origin.
 */

import type { IRuntimeCachingOptions, IRuntimeCachingRule } from '../interfaces';

const DAY_SECONDS = 60 * 60 * 24;
const YEAR_SECONDS = DAY_SECONDS * 365;

/** Regex meta characters that must be escaped when embedding a literal. */
const REGEX_META_CHARS = /[.*+?^${}()|[\]\\]/g;

/**
 * Escape every regex metacharacter in a literal path prefix so
 * `apiPathPrefix: '/api.v1'` doesn't accidentally match `/apiXv1/*`.
 *
 * `String.prototype.replace` with a regex is the canonical primitive
 * for this transform; `Str.replace` operates on a literal search
 * string so it would need its own loop — not a fit here.
 */
// support-utilities-exempt: regex replacement is a language feature; Str.replace only handles literal search.
function escapeRegex(literal: string): string {
  return literal.replace(REGEX_META_CHARS, '\\$&');
}

/**
 * Return the curated runtime-caching rules for a Stackra-powered app.
 *
 * Consumers pass the returned array to `vite-plugin-pwa`'s
 * `workbox.runtimeCaching` or Serwist's `runtimeCaching`.
 *
 * @param options - Overrides applied over the sensible defaults.
 * @returns Immutable array of rules — a fresh array on every call.
 *
 * @example
 * ```typescript
 * import { getRuntimeCaching } from '@stackra/pwa/workbox';
 *
 * const rules = getRuntimeCaching({
 *   includeApi: true,
 *   apiPathPrefix: '/api',
 *   imageMaxAgeSeconds: 3600,
 * });
 * ```
 */
export function getRuntimeCaching(
  options: IRuntimeCachingOptions = {}
): readonly IRuntimeCachingRule[] {
  const {
    includeApi = true,
    apiPathPrefix = '/api',
    apiMaxAgeSeconds = DAY_SECONDS,
    apiMaxEntries = 200,
    imageMaxAgeSeconds = DAY_SECONDS * 30,
    imageMaxEntries = 100,
    fontMaxAgeSeconds = YEAR_SECONDS,
    fontMaxEntries = 30,
    includeHtmlNavigation = true,
    navigationTimeoutSeconds = 3,
    cacheNamePrefix = 'stackra-pwa',
  } = options;

  const rules: IRuntimeCachingRule[] = [];

  if (includeApi) {
    // Escape the caller-provided prefix so specials like `.` are
    // treated literally, then anchor to path-start with an optional
    // trailing slash.
    const escaped = escapeRegex(apiPathPrefix);
    rules.push({
      urlPattern: ({ url, sameOrigin }) =>
        sameOrigin && new RegExp(`^${escaped}(/|$)`).test(url.pathname),
      handler: 'NetworkFirst',
      options: {
        cacheName: `${cacheNamePrefix}-api`,
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: apiMaxEntries, maxAgeSeconds: apiMaxAgeSeconds },
        cacheableResponse: { statuses: [0, 200] },
      },
    });
  }

  // Static assets — images, fonts. Bundled at fixed positions so
  // consumers can index by ordinal in tests.
  rules.push({
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: `${cacheNamePrefix}-images`,
      expiration: { maxEntries: imageMaxEntries, maxAgeSeconds: imageMaxAgeSeconds },
      cacheableResponse: { statuses: [0, 200] },
    },
  });
  rules.push({
    urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: `${cacheNamePrefix}-fonts`,
      expiration: { maxEntries: fontMaxEntries, maxAgeSeconds: fontMaxAgeSeconds },
      cacheableResponse: { statuses: [0, 200] },
    },
  });

  if (includeHtmlNavigation) {
    // HTML navigation — NetworkFirst with a short timeout so the SPA
    // shell still opens offline. Chromium routes navigation requests
    // through the SW even without an explicit `navigateFallback`.
    rules.push({
      urlPattern: ({ url, sameOrigin }) =>
        sameOrigin && !!url.pathname && !/\.[a-z0-9]{2,5}(\?.*)?$/i.test(url.pathname),
      handler: 'NetworkFirst',
      options: {
        cacheName: `${cacheNamePrefix}-html`,
        networkTimeoutSeconds: navigationTimeoutSeconds,
        expiration: { maxEntries: 50, maxAgeSeconds: DAY_SECONDS },
        cacheableResponse: { statuses: [0, 200] },
      },
    });
  }

  return rules;
}

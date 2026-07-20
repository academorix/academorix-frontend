/**
 * @file default-navigate-fallback-denylist.constant.ts
 * @module @stackra/pwa/vite/constants
 * @description Default navigate-fallback denylist for `vite-plugin-pwa`.
 *
 *   Every URL matched by these patterns hits the network directly
 *   instead of falling back to the SPA shell — the shell doesn't own
 *   `/api`, `/broadcasting`, `/manifest.webmanifest`, `/sitemap*`,
 *   `/robots*`, or any URL that ends in a file extension.
 */

/**
 * The default navigate-fallback denylist emitted by
 * `getVitePwaOptions`.
 *
 * `readonly` at the reference so tests can spread it without worrying
 * about mutation; each pattern is likewise `readonly`.
 */
export const DEFAULT_NAVIGATE_FALLBACK_DENYLIST: readonly RegExp[] = [
  /^\/api\//,
  /^\/broadcasting\//,
  /^\/manifest\.webmanifest/,
  /^\/sitemap/,
  /^\/robots/,
  // Any URL whose last path segment carries a file extension —
  // JS bundles, static assets, `manifest.json`, favicons, etc.
  /\.[a-z0-9]{2,5}(\?.*)?$/i,
] as const;

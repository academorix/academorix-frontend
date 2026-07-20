/**
 * @file index.ts
 * @module @stackra/cache/core/constants
 * @description Barrel export for cache constants.
 *
 *   `CACHE_CONFIG_INTERNAL` is intentionally NOT re-exported by the
 *   package's public `src/core/index.ts` barrel — it is a
 *   package-internal binding token consumed only by classes inside
 *   `@stackra/cache`. External consumers reach the same config via
 *   `@Inject(cacheConfig.KEY)` on a `registerAs` factory (see
 *   `@stackra/config`).
 */

export { DEFAULT_TTL, DEFAULT_PREFIX, DEFAULT_STORE } from "./defaults.constant";
export { STORAGE_STORE_OPTIONS } from "./storage-store.constants";
export { CACHE_CONFIG_INTERNAL } from "./cache-config-internal.constant";

// NOTE: CACHE_MANAGER / CACHE_STORE_METADATA_KEY are DI tokens owned by
// @stackra/contracts — import them from there, never from here.
// (CACHE_CONFIG was removed from contracts alongside this refactor;
// package-internal consumers use `CACHE_CONFIG_INTERNAL` above.)

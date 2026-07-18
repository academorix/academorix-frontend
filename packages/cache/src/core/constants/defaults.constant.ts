/**
 * @file defaults.constant.ts
 * @module @stackra/cache/core/constants
 * @description Default configuration values for the cache module.
 *   Provides sensible fallbacks when no explicit configuration is given.
 */

/** Default time-to-live in seconds (1 hour). */
export const DEFAULT_TTL = 3600;

/** Default cache key prefix. */
export const DEFAULT_PREFIX = "";

/** Default store name used when no explicit store is specified. */
export const DEFAULT_STORE = "memory";

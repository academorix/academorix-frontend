/**
 * @file cacheable-options.interface.ts
 * @module @stackra/cache/core/interfaces
 * @description Options interface for the @Cacheable() method decorator.
 *   Defines caching configuration including key strategy, TTL, store selection,
 *   tag-based invalidation, and conditional bypass.
 */

/**
 * Options for the @Cacheable() method decorator.
 *
 * Configures how the decorated method's return value is cached, including
 * the cache key generation strategy, time-to-live, named store selection,
 * tag assignment for grouped invalidation, and conditional bypass logic.
 */
export interface ICacheableOptions {
  /** Custom cache key or key builder function. */
  key?: string | ((...args: any[]) => string);
  /** TTL in seconds. Default: 300. */
  ttl?: number;
  /** Named store to use (default: module default). */
  store?: string;
  /** Tags for tag-based invalidation. */
  tags?: string[];
  /** Condition to bypass caching. If returns true, cache is skipped. */
  unless?: (...args: any[]) => boolean;
}

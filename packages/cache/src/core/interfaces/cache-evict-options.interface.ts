/**
 * @file cache-evict-options.interface.ts
 * @module @stackra/cache/core/interfaces
 * @description Options interface for the @CacheEvict() method decorator.
 *   Defines how cache entries are evicted after method execution,
 *   supporting key-based, tag-based, and full-store eviction strategies.
 */

/**
 * Options for the @CacheEvict() method decorator.
 *
 * Controls which cache entries are evicted when the decorated method
 * is invoked. Supports key-based eviction (single or multiple keys),
 * tag-based eviction (flush all entries under tags), full store flush,
 * and before/after invocation timing.
 */
export interface ICacheEvictOptions {
  /** Cache key(s) to evict, or a function that builds them from method args. */
  keys?: string | string[] | ((...args: any[]) => string | string[]);
  /** Tags to flush. All entries tagged with these are evicted. */
  tags?: string[] | ((...args: any[]) => string[]);
  /** Named store to evict from (default: module default). */
  store?: string;
  /** If true, evict BEFORE method executes (even if method throws). */
  beforeInvocation?: boolean;
  /** If true, flush the entire store (nuclear option). */
  allEntries?: boolean;
}

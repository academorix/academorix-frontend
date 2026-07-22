/**
 * @file tagged-cache.interface.ts
 * @module @stackra/contracts/interfaces/cache
 * @description Tag-scoped cache contract — read/write cache entries
 *   within a namespace identified by an array of tags. When the tag
 *   set is flushed, every previously-stored entry under that
 *   namespace becomes unreachable.
 */

/**
 * Tag-scoped cache surface.
 *
 * The methods here are the SUBSET of the concrete `TaggedCache`
 * that cross-package consumers depend on (HTTP cache interceptor,
 * feature-flag cache, etc.). The concrete implementation ships
 * additional helpers (`remember`, `pull`, `many`, `touch`) — inject
 * the concrete class from `@stackra/cache` if you need those.
 */
export interface ITaggedCache {
  /**
   * Retrieve a tagged value.
   *
   * @typeParam T - Expected value type.
   * @param key - Cache key (scoped by the tag namespace).
   * @returns The cached value, or `undefined` when absent /
   *   expired.
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Store a tagged value.
   *
   * @typeParam T - Value type.
   * @param key - Cache key.
   * @param value - Value to store.
   * @param ttlSeconds - Time-to-live in seconds. When omitted,
   *   the entry follows the store's default TTL policy.
   */
  put<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Flush every entry scoped to this tag set. Rotates the
   * namespace — an O(1) operation regardless of entry count.
   */
  flush(): Promise<void>;
}

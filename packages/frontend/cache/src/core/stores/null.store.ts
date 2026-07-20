/**
 * @file null.store.ts
 * @module @stackra/cache/core/stores
 * @description No-op cache store for testing and development.
 *   Every operation is a no-op — get always returns undefined,
 *   set does nothing, has always returns false, etc.
 */

import { CacheStore } from "@/core/decorators";
import type { ICacheStore } from "@stackra/contracts";

/**
 * No-op cache store — discards all writes, returns empty on reads.
 *
 * Useful for:
 * - Testing without actual caching side effects
 * - Disabling caching in specific environments
 * - Serving as a fallback when no real store is configured
 *
 * @example
 * ```typescript
 * const store = new NullStore();
 * await store.set('key', 'value'); // silently discarded
 * await store.get('key');          // → undefined
 * ```
 */
@CacheStore("null")
export class NullStore implements ICacheStore {
  /**
   * Always returns undefined — nothing is ever cached.
   *
   * @param _key - Cache key (ignored)
   * @returns Always undefined
   */
  public async get<T>(_key: string): Promise<T | undefined> {
    return undefined;
  }

  /**
   * No-op — value is silently discarded.
   *
   * @param _key - Cache key (ignored)
   * @param _value - Value (ignored)
   * @param _ttl - TTL (ignored)
   */
  public async set<T>(_key: string, _value: T, _ttl?: number): Promise<void> {
    // Intentionally empty — null store discards all writes
  }

  /**
   * Always returns false — nothing is ever cached.
   *
   * @param _key - Cache key (ignored)
   * @returns Always false
   */
  public async has(_key: string): Promise<boolean> {
    return false;
  }

  /**
   * Always returns false — nothing to delete.
   *
   * @param _key - Cache key (ignored)
   * @returns Always false
   */
  public async delete(_key: string): Promise<boolean> {
    return false;
  }

  /**
   * No-op — there is nothing to clear.
   */
  public async clear(): Promise<void> {
    // Intentionally empty — null store has no state
  }

  /**
   * Returns a map with undefined for every requested key.
   *
   * @param keys - Array of cache keys (all return undefined)
   * @returns Map of key to undefined
   */
  public async many<T>(keys: string[]): Promise<Map<string, T | undefined>> {
    const results = new Map<string, T | undefined>();
    for (const key of keys) {
      results.set(key, undefined);
    }
    return results;
  }

  /**
   * No-op — all entries are silently discarded.
   *
   * @param _entries - Map of entries (ignored)
   * @param _ttl - TTL (ignored)
   */
  public async setMany<T>(_entries: Map<string, T>, _ttl?: number): Promise<void> {
    // Intentionally empty — null store discards all writes
  }

  /**
   * No-op — value is silently discarded (stored "forever" is meaningless here).
   *
   * @param _key - Cache key (ignored)
   * @param _value - Value (ignored)
   */
  public async forever<T>(_key: string, _value: T): Promise<void> {
    // Intentionally empty — null store discards all writes
  }

  /**
   * Always returns 0 — no value exists to increment.
   *
   * @param _key - Cache key (ignored)
   * @param by - Amount to increment by (default: 1)
   * @returns Always returns the `by` value (as if starting from 0)
   */
  public async increment(_key: string, by: number = 1): Promise<number> {
    return by;
  }

  /**
   * Always returns 0 — no value exists to decrement.
   *
   * @param _key - Cache key (ignored)
   * @param by - Amount to decrement by (default: 1)
   * @returns Always returns the negated `by` value (as if starting from 0)
   */
  public async decrement(_key: string, by: number = 1): Promise<number> {
    return -by;
  }

  /**
   * Always returns false — no key exists to touch.
   *
   * @param _key - Cache key (ignored)
   * @param _ttl - TTL (ignored)
   * @returns Always false
   */
  public async touch(_key: string, _ttl: number): Promise<boolean> {
    return false;
  }
}

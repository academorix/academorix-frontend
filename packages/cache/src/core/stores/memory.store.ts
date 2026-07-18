/**
 * @file memory.store.ts
 * @module @stackra/cache/core/stores
 * @description In-memory cache store with TTL support.
 *   Uses a Map with expiry timestamps and passive expiry (checked on read).
 *   Suitable for single-process applications, testing, and development.
 */

import { CacheStore } from "@/core/decorators";
import type { ICacheStore } from "@stackra/contracts";
import type { ICacheEntry } from "@/core/interfaces/cache-entry.interface";

/**
 * In-memory cache store with passive TTL expiry.
 *
 * Stores key-value pairs in a JavaScript Map. Expired entries are removed
 * lazily on read (passive expiry) rather than via timers, keeping resource
 * usage minimal.
 *
 * Features:
 * - Passive expiry — entries checked on get/has, cleaned up on access
 * - Batch operations — many() and setMany() for efficient bulk access
 * - Zero external dependencies — works in any JavaScript runtime
 *
 * @example
 * ```typescript
 * const store = new MemoryStore();
 * await store.set('user:1', { name: 'Alice' }, 300);
 * const user = await store.get<{ name: string }>('user:1');
 * ```
 */
@CacheStore("memory")
export class MemoryStore implements ICacheStore {
  /** Internal storage map. */
  private readonly store: Map<string, ICacheEntry> = new Map();

  /**
   * Retrieve a value from the in-memory cache.
   *
   * Returns undefined if the key does not exist or has expired.
   * Expired entries are removed on access (passive expiry).
   *
   * @param key - Cache key
   * @returns The cached value, or undefined if not found / expired
   */
  public async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Store a value in the in-memory cache.
   *
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (optional, no expiry if omitted)
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiresAt = ttl != null && ttl > 0 ? Date.now() + ttl * 1000 : null;

    this.store.set(key, { value, expiresAt });
  }

  /**
   * Check if a key exists and has not expired.
   *
   * @param key - Cache key
   * @returns `true` if the key exists and is not expired
   */
  public async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the in-memory cache.
   *
   * @param key - Cache key
   * @returns `true` if the key existed and was deleted
   */
  public async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  /**
   * Remove all entries from the in-memory cache.
   */
  public async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Retrieve multiple values from the cache in a single operation.
   *
   * @param keys - Array of cache keys to retrieve
   * @returns Map of key to value (undefined for missing/expired keys)
   */
  public async many<T>(keys: string[]): Promise<Map<string, T | undefined>> {
    const results = new Map<string, T | undefined>();

    for (const key of keys) {
      results.set(key, await this.get<T>(key));
    }

    return results;
  }

  /**
   * Store multiple values in the cache in a single operation.
   *
   * @param entries - Map of key-value pairs to store
   * @param ttl - Time-to-live in seconds (optional, no expiry if omitted)
   */
  public async setMany<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }

  /**
   * Store a value in the cache indefinitely (no TTL expiry).
   *
   * The value persists until explicitly deleted or the store is cleared.
   *
   * @param key - Cache key
   * @param value - Value to store permanently
   */
  public async forever<T>(key: string, value: T): Promise<void> {
    this.store.set(key, { value, expiresAt: null });
  }

  /**
   * Atomically increment a numeric value at the given key.
   *
   * If the key does not exist, it is initialized to 0 before incrementing.
   * If the key holds a non-numeric value, it is treated as 0.
   * The entry's existing TTL is preserved.
   *
   * @param key - Cache key
   * @param by - Amount to increment by (default: 1)
   * @returns The new value after incrementing
   */
  public async increment(key: string, by: number = 1): Promise<number> {
    const entry = this.store.get(key);

    // If expired, remove and treat as non-existent
    if (entry && this.isExpired(entry)) {
      this.store.delete(key);
    }

    const existing = this.store.get(key);
    const currentValue = existing ? (typeof existing.value === "number" ? existing.value : 0) : 0;
    const newValue = currentValue + by;

    // Preserve existing TTL if the key already existed
    const expiresAt = existing ? existing.expiresAt : null;
    this.store.set(key, { value: newValue, expiresAt });

    return newValue;
  }

  /**
   * Atomically decrement a numeric value at the given key.
   *
   * If the key does not exist, it is initialized to 0 before decrementing.
   * If the key holds a non-numeric value, it is treated as 0.
   * The entry's existing TTL is preserved.
   *
   * @param key - Cache key
   * @param by - Amount to decrement by (default: 1)
   * @returns The new value after decrementing
   */
  public async decrement(key: string, by: number = 1): Promise<number> {
    return this.increment(key, -by);
  }

  /**
   * Extend the TTL of an existing key without changing its value.
   *
   * If the key does not exist or is expired, returns false.
   * If the key exists, its expiry is reset to the new TTL.
   *
   * @param key - Cache key
   * @param ttl - New time-to-live in seconds
   * @returns `true` if the key existed and its TTL was updated
   */
  public async touch(key: string, ttl: number): Promise<boolean> {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.store.delete(key);
      return false;
    }

    // Update only the expiry, preserve the value
    entry.expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null;
    return true;
  }

  /**
   * Check if a cache entry has expired.
   *
   * @param entry - The cache entry to check
   * @returns `true` if the entry has a TTL and has expired
   */
  private isExpired(entry: ICacheEntry): boolean {
    if (entry.expiresAt === null) {
      return false;
    }
    return Date.now() > entry.expiresAt;
  }
}

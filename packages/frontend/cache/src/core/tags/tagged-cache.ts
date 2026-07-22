/**
 * @file tagged-cache.ts
 * @module @stackra/cache/core/tags
 * @description Tag-aware cache wrapper that namespaces all keys by tag set.
 *   Wraps an `ICacheStore` and prefixes every key with a hash of the tag
 *   namespace. When tags are flushed, the namespace changes and all
 *   previously stored entries become unreachable.
 *
 *   TaggedCache provides the SAME API as CacheService but operates within
 *   a tag-scoped namespace. It is returned by `cache.tags(['users', 'posts'])`.
 */

import { TagSet } from "./tag-set";
import type { ICacheStore } from "@stackra/contracts";
import { Str } from "@stackra/support";
import { requireStoreMethod } from "@/core/utils/require-store-method.util";

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Tag-scoped cache wrapper — all operations are namespaced by tags.
 *
 * TaggedCache wraps an existing cache store and prefixes all keys with
 * a hash derived from the tag set's namespace. This enables bulk
 * invalidation by tag: calling `flush()` rotates the tag namespace,
 * making all previously-stored entries unreachable.
 *
 * Key structure: `{sha(tagNamespace)}:{originalKey}`
 *
 * Use cases:
 * - Invalidate all user-related cache when a user is updated
 * - Clear all product listings when inventory changes
 * - Group related cache entries for coordinated expiration
 *
 * @example
 * ```typescript
 * // Store entries under the 'users' and 'admin' tags
 * const tagged = await cache.tags(['users', 'admin']);
 * await tagged.set('user:1:permissions', permissions, 600);
 * await tagged.set('user:1:profile', profile, 600);
 *
 * // Invalidate ALL entries tagged with 'users'
 * await tagged.flush();
 * // Both 'user:1:permissions' and 'user:1:profile' are now unreachable
 * ```
 *
 * @example
 * ```typescript
 * // Remember with tags
 * const tagged = await cache.tags(['products', 'catalog']);
 * const products = await tagged.remember('featured', 300, async () => {
 *   return await fetchFeaturedProducts();
 * });
 * ```
 */
export class TaggedCache {
  /** The tag set managing the namespace. */
  private readonly tagSet: TagSet;

  /** Cached namespace string (resolved lazily). */
  private namespaceCache: string | null = null;

  /**
   * Create a new TaggedCache wrapping a store with a tag set.
   *
   * @param store - The underlying cache store
   * @param tags - Array of tag names to scope this cache instance
   */
  public constructor(
    private readonly store: ICacheStore,
    tags: string[],
  ) {
    this.tagSet = new TagSet(store, tags);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Read Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Retrieve a tagged value from the cache.
   *
   * @typeParam T - Expected type of the cached value
   * @param key - Cache key (will be prefixed with tag namespace)
   * @param defaultValue - Optional fallback when the key is missing
   * @returns The cached value, the default, or undefined
   */
  public async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const prefixed = await this.itemKey(key);
    const value = await this.store.get<T>(prefixed);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Retrieve multiple tagged values from the cache.
   *
   * @typeParam T - Expected type of the cached values
   * @param keys - Array of cache keys
   * @returns Map of original key to value (undefined for missing)
   */
  public async many<T>(keys: string[]): Promise<Map<string, T | undefined>> {
    const prefixedKeys = await Promise.all(keys.map((k) => this.itemKey(k)));
    const results = await requireStoreMethod(this.store, "many")<T>(prefixedKeys);

    // Map back to original keys
    const mapped = new Map<string, T | undefined>();
    keys.forEach((originalKey, index) => {
      mapped.set(originalKey, results.get(prefixedKeys[index]!));
    });
    return mapped;
  }

  /**
   * Check if a tagged key exists in the cache.
   *
   * @param key - Cache key
   * @returns `true` if the key exists and is not expired
   */
  public async has(key: string): Promise<boolean> {
    const prefixed = await this.itemKey(key);
    return this.store.has(prefixed);
  }

  /**
   * Check if a tagged key does NOT exist.
   *
   * @param key - Cache key
   * @returns `true` if the key does NOT exist or is expired
   */
  public async missing(key: string): Promise<boolean> {
    return !(await this.has(key));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Write Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Store a tagged value in the cache.
   *
   * @typeParam T - Type of the value
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (optional)
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const prefixed = await this.itemKey(key);
    await this.store.set(prefixed, value, ttl);
  }

  /**
   * Store a tagged value (alias for `set`).
   *
   * @typeParam T - Type of the value
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (optional)
   */
  public async put<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.set(key, value, ttl);
  }

  /**
   * Store a tagged value indefinitely (no TTL).
   *
   * @typeParam T - Type of the value
   * @param key - Cache key
   * @param value - Value to store permanently
   */
  public async forever<T>(key: string, value: T): Promise<void> {
    const prefixed = await this.itemKey(key);
    await requireStoreMethod(this.store, "forever")(prefixed, value);
  }

  /**
   * Store a tagged value only if the key does not already exist.
   *
   * @typeParam T - Type of the value
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (optional)
   * @returns `true` if stored (key was new), `false` if already exists
   */
  public async add<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (await this.has(key)) return false;
    await this.set(key, value, ttl);
    return true;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Compute Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get from tagged cache, or execute factory and store the result.
   *
   * @typeParam T - Type of the cached/computed value
   * @param key - Cache key
   * @param ttl - Time-to-live in seconds
   * @param factory - Async factory function on miss
   * @returns The cached or freshly computed value
   */
  public async remember<T>(key: string, ttl: number, factory: () => Promise<T> | T): Promise<T> {
    const existing = await this.get<T>(key);
    if (existing !== undefined) return existing;

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Get from tagged cache, or execute factory and store forever.
   *
   * @typeParam T - Type of the cached/computed value
   * @param key - Cache key
   * @param factory - Async factory function on miss
   * @returns The cached or freshly computed value
   */
  public async rememberForever<T>(key: string, factory: () => Promise<T> | T): Promise<T> {
    const existing = await this.get<T>(key);
    if (existing !== undefined) return existing;

    const value = await factory();
    await this.forever(key, value);
    return value;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Counter Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Increment a tagged numeric value.
   *
   * @param key - Cache key
   * @param by - Amount to increment (default: 1)
   * @returns The new value after incrementing
   */
  public async increment(key: string, by: number = 1): Promise<number> {
    const prefixed = await this.itemKey(key);
    return requireStoreMethod(this.store, "increment")(prefixed, by);
  }

  /**
   * Decrement a tagged numeric value.
   *
   * @param key - Cache key
   * @param by - Amount to decrement (default: 1)
   * @returns The new value after decrementing
   */
  public async decrement(key: string, by: number = 1): Promise<number> {
    const prefixed = await this.itemKey(key);
    return requireStoreMethod(this.store, "decrement")(prefixed, by);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Delete Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Delete a single tagged key.
   *
   * @param key - Cache key
   * @returns `true` if the key existed and was deleted
   */
  public async forget(key: string): Promise<boolean> {
    const prefixed = await this.itemKey(key);
    return requireStoreMethod(this.store, "delete")(prefixed);
  }

  /**
   * Delete a single tagged key (alias for `forget`).
   *
   * @param key - Cache key
   * @returns `true` if the key existed and was deleted
   */
  public async delete(key: string): Promise<boolean> {
    return this.forget(key);
  }

  /**
   * Retrieve a tagged value and immediately remove it.
   *
   * @typeParam T - Expected type of the cached value
   * @param key - Cache key
   * @param defaultValue - Optional fallback
   * @returns The cached value, then removes the key
   */
  public async pull<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const value = await this.get<T>(key, defaultValue);
    await this.forget(key);
    return value;
  }

  /**
   * Flush all entries scoped to this tag set.
   *
   * Rotates the tag namespace — all previously-stored entries under
   * this tag combination become unreachable. The entries themselves are
   * not deleted (they'll be evicted by TTL or store eviction policy).
   *
   * This is an O(1) operation regardless of how many entries are tagged.
   */
  public async flush(): Promise<void> {
    await this.tagSet.reset();
    // Clear cached namespace so next operation gets fresh one
    this.namespaceCache = null;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TTL Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Extend the TTL of an existing tagged key.
   *
   * @param key - Cache key
   * @param ttl - New time-to-live in seconds
   * @returns `true` if the key existed and its TTL was updated
   */
  public async touch(key: string, ttl: number): Promise<boolean> {
    const prefixed = await this.itemKey(key);
    return requireStoreMethod(this.store, "touch")(prefixed, ttl);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Introspection
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get the tag names associated with this cache instance.
   *
   * @returns Array of tag name strings
   */
  public getTagNames(): string[] {
    return this.tagSet.getNames();
  }

  /**
   * Get the underlying TagSet instance.
   *
   * @returns The TagSet managing this cache's namespace
   */
  public getTagSet(): TagSet {
    return this.tagSet;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Build the fully-qualified cache key with tag namespace prefix.
   *
   * Structure: `{sha(namespace)}:{originalKey}`
   *
   * @param key - The original cache key
   * @returns The namespaced cache key
   */
  private async itemKey(key: string): Promise<string> {
    const namespace = await this.resolveNamespace();
    const hash = this.simpleHash(namespace);
    return `${hash}:${key}`;
  }

  /**
   * Resolve (and cache) the tag namespace.
   *
   * @returns The composite namespace string
   */
  private async resolveNamespace(): Promise<string> {
    if (this.namespaceCache) return this.namespaceCache;
    this.namespaceCache = await this.tagSet.getNamespace();
    return this.namespaceCache;
  }

  /**
   * Simple hash function for namespace → prefix conversion.
   *
   * Produces a short, deterministic hex string from the namespace.
   * Not cryptographic — just ensures a fixed-length prefix.
   *
   * @param input - The string to hash
   * @returns An 8-character hex string
   */
  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Str.padLeft(Math.abs(hash).toString(16), 8, "0");
  }
}

/**
 * @file cache.service.ts
 * @module @stackra/cache/core/services
 * @description High-level convenience service for cache operations.
 *   Delegates to the CacheManager's default store and provides a comprehensive
 *   API including: get/set, remember/rememberForever, pull, add, forever,
 *   increment/decrement, many/setMany, touch, flexible (stale-while-revalidate),
 *   and event emission on all lifecycle operations.
 *
 *   Inspired by Laravel's Cache Repository — adapted for TypeScript with
 *   generics, async/await, and optional event emission via IEventEmitter.
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import { Logger } from "@stackra/logger";

import { CacheManager } from "./cache-manager.service";
import { TaggedCache } from "@/core/tags/tagged-cache";
import { CACHE_EVENTS, CACHE_MANAGER, EVENT_EMITTER } from "@stackra/contracts";
import type { ICacheStore, IEventEmitter } from "@stackra/contracts";
import { requireStoreMethod } from "@/core/utils/require-store-method.util";

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * High-level cache service with a comprehensive, Laravel-inspired API.
 *
 * Wraps the CacheManager's stores with convenience methods for all common
 * caching patterns. Supports event emission for observability (optional).
 *
 * Method categories:
 * - **Read**: `get`, `many`, `has`, `missing`
 * - **Write**: `set`, `setMany`, `forever`, `add`, `put`, `putMany`
 * - **Compute**: `remember`, `rememberForever`, `flexible`
 * - **Counters**: `increment`, `decrement`
 * - **TTL**: `touch`
 * - **Delete**: `delete`, `forget`, `pull`, `clear`, `flush`
 *
 * @example
 * ```typescript
 * const cache = container.get(CacheService);
 *
 * // Get-or-compute pattern
 * const user = await cache.remember('user:1', 300, async () => {
 *   return await fetchUserFromDatabase(1);
 * });
 *
 * // Stale-while-revalidate
 * const config = await cache.flexible('app:config', [60, 300], async () => {
 *   return await loadConfigFromRemote();
 * });
 *
 * // Counters
 * await cache.increment('page:views', 1);
 *
 * // Bulk operations
 * const values = await cache.many(['user:1', 'user:2', 'user:3']);
 * ```
 */
@Injectable()
export class CacheService {
  /** Scoped logger for fail-soft emit warnings. */
  private readonly logger = new Logger(CacheService.name);

  /**
   * @param manager - The CacheManager instance for resolving stores
   * @param eventEmitter - Optional event emitter for lifecycle events
   */
  public constructor(
    @Inject(CACHE_MANAGER) private readonly manager: CacheManager,
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════════
  // Read Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Retrieve a value from the default cache store.
   *
   * @typeParam T - Expected type of the cached value
   * @param key - Cache key
   * @param defaultValue - Optional fallback returned when the key is missing
   * @returns The cached value, the default value, or undefined
   */
  public async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const value = await this.getStore().get<T>(key);

    if (value !== undefined) {
      this.emit(CACHE_EVENTS.HIT, { key, store: this.storeName() });
      return value;
    }

    this.emit(CACHE_EVENTS.MISS, { key, store: this.storeName() });
    return defaultValue;
  }

  /**
   * Retrieve multiple values from the cache in a single operation.
   *
   * Returns a Map where missing/expired keys map to undefined.
   * More efficient than multiple `get()` calls on stores that
   * support batch reads (e.g., Redis MGET).
   *
   * @typeParam T - Expected type of the cached values
   * @param keys - Array of cache keys to retrieve
   * @returns Map of key to value (undefined for missing/expired keys)
   *
   * @example
   * ```typescript
   * const results = await cache.many<User>(['user:1', 'user:2', 'user:3']);
   * const user1 = results.get('user:1'); // User | undefined
   * ```
   */
  public async many<T>(keys: string[]): Promise<Map<string, T | undefined>> {
    return requireStoreMethod(this.getStore(), "many")<T>(keys);
  }

  /**
   * Check if a key exists in the default cache store.
   *
   * @param key - Cache key
   * @returns `true` if the key exists and is not expired
   */
  public async has(key: string): Promise<boolean> {
    return this.getStore().has(key);
  }

  /**
   * Check if a key does NOT exist in the cache.
   *
   * Inverse of `has()` — for readability in conditional logic.
   *
   * @param key - Cache key
   * @returns `true` if the key does NOT exist or is expired
   *
   * @example
   * ```typescript
   * if (await cache.missing('session:token')) {
   *   redirect('/login');
   * }
   * ```
   */
  public async missing(key: string): Promise<boolean> {
    return !(await this.has(key));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Write Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Store a value in the default cache store.
   *
   * @typeParam T - Type of the value to store
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (optional, no expiry if omitted)
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.getStore().set(key, value, ttl);
    this.emit(CACHE_EVENTS.WRITTEN, { key, store: this.storeName(), ttl });
  }

  /**
   * Store a value in the cache (alias for `set`).
   *
   * Matches Laravel's naming convention. Identical to `set()`.
   *
   * @typeParam T - Type of the value to store
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (optional)
   */
  public async put<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.set(key, value, ttl);
  }

  /**
   * Store multiple key-value pairs in the cache in a single operation.
   *
   * More efficient than multiple `set()` calls on stores that support
   * batch writes (e.g., Redis MSET).
   *
   * @typeParam T - Type of the values to store
   * @param entries - Map of key-value pairs to store
   * @param ttl - Time-to-live in seconds (optional, applies to all entries)
   *
   * @example
   * ```typescript
   * await cache.setMany(new Map([
   *   ['user:1', { name: 'Alice' }],
   *   ['user:2', { name: 'Bob' }],
   * ]), 600);
   * ```
   */
  public async setMany<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    await requireStoreMethod(this.getStore(), "setMany")(entries, ttl);
    const store = this.storeName();
    entries.forEach((_value, key) => {
      this.emit(CACHE_EVENTS.WRITTEN, { key, store, ttl });
    });
  }

  /**
   * Store multiple key-value pairs (alias for `setMany` with object input).
   *
   * Accepts a plain object for convenience. Converts to Map internally.
   *
   * @typeParam T - Type of the values to store
   * @param values - Object mapping keys to values
   * @param ttl - Time-to-live in seconds (optional)
   *
   * @example
   * ```typescript
   * await cache.putMany({ 'user:1': alice, 'user:2': bob }, 600);
   * ```
   */
  public async putMany<T>(values: Record<string, T>, ttl?: number): Promise<void> {
    const entries = new Map<string, T>(Object.entries(values));
    await requireStoreMethod(this.getStore(), "setMany")(entries, ttl);
  }

  /**
   * Store a value only if the key does not already exist.
   *
   * Returns `true` if the value was stored, `false` if the key already exists.
   * This is NOT atomic across distributed stores — for atomic add, the store
   * implementation should override with a native SET NX equivalent.
   *
   * @typeParam T - Type of the value to store
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (optional)
   * @returns `true` if the value was stored (key was new)
   *
   * @example
   * ```typescript
   * const locked = await cache.add('lock:invoice:123', true, 60);
   * if (!locked) {
   *   throw new Error('Invoice is already being processed');
   * }
   * ```
   */
  public async add<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const exists = await this.getStore().has(key);

    if (exists) {
      return false;
    }

    await this.getStore().set(key, value, ttl);
    this.emit(CACHE_EVENTS.WRITTEN, { key, store: this.storeName(), ttl });
    return true;
  }

  /**
   * Store a value in the cache indefinitely (no TTL expiry).
   *
   * The value persists until explicitly deleted or the store is flushed.
   * Use for configuration data, feature flags, or other long-lived values.
   *
   * @typeParam T - Type of the value to store
   * @param key - Cache key
   * @param value - Value to store permanently
   *
   * @example
   * ```typescript
   * await cache.forever('app:version', '2.1.0');
   * ```
   */
  public async forever<T>(key: string, value: T): Promise<void> {
    await requireStoreMethod(this.getStore(), "forever")(key, value);
    this.emit(CACHE_EVENTS.WRITTEN, { key, store: this.storeName(), ttl: undefined });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Compute (Get-or-Set) Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get a value from cache, or execute the factory and store the result.
   *
   * The factory function is only called when the key does not exist
   * in the cache. The result is stored with the given TTL.
   *
   * This is the most commonly used caching pattern — "cache aside".
   *
   * @typeParam T - Type of the cached/computed value
   * @param key - Cache key
   * @param ttl - Time-to-live in seconds for the computed value
   * @param factory - Async factory function to compute the value on miss
   * @returns The cached or freshly computed value
   *
   * @example
   * ```typescript
   * const config = await cache.remember('app:config', 600, async () => {
   *   return await loadConfigFromRemote();
   * });
   * ```
   */
  public async remember<T>(key: string, ttl: number, factory: () => Promise<T> | T): Promise<T> {
    const existing = await this.getStore().get<T>(key);
    const store = this.storeName();

    if (existing !== undefined) {
      this.emit(CACHE_EVENTS.HIT, { key, store });
      return existing;
    }

    this.emit(CACHE_EVENTS.MISS, { key, store });
    const value = await factory();
    await this.getStore().set(key, value, ttl);
    this.emit(CACHE_EVENTS.WRITTEN, { key, store, ttl });
    return value;
  }

  /**
   * Get a value from cache, or execute the factory and store forever.
   *
   * Like `remember()` but the computed value never expires. Use for
   * values that are expensive to compute but rarely change (computed
   * once per application lifecycle).
   *
   * @typeParam T - Type of the cached/computed value
   * @param key - Cache key
   * @param factory - Async factory function to compute the value on miss
   * @returns The cached or freshly computed value
   *
   * @example
   * ```typescript
   * const schema = await cache.rememberForever('db:schema', async () => {
   *   return await introspectDatabaseSchema();
   * });
   * ```
   */
  public async rememberForever<T>(key: string, factory: () => Promise<T> | T): Promise<T> {
    const existing = await this.getStore().get<T>(key);
    const store = this.storeName();

    if (existing !== undefined) {
      this.emit(CACHE_EVENTS.HIT, { key, store });
      return existing;
    }

    this.emit(CACHE_EVENTS.MISS, { key, store });
    const value = await factory();
    await requireStoreMethod(this.getStore(), "forever")(key, value);
    this.emit(CACHE_EVENTS.WRITTEN, { key, store, ttl: undefined });
    return value;
  }

  /**
   * Stale-while-revalidate caching pattern.
   *
   * Returns a cached value immediately if it's within the "fresh" window.
   * If it's between "fresh" and "max" TTL (stale), returns the stale value
   * AND refreshes in the background. If it's beyond "max", recomputes synchronously.
   *
   * This provides the best of both worlds:
   * - Fast responses (serve stale data immediately)
   * - Fresh data (background refresh keeps the cache current)
   *
   * @typeParam T - Type of the cached/computed value
   * @param key - Cache key
   * @param ttl - Tuple of [freshSeconds, maxSeconds]
   *   - freshSeconds: value is considered fresh (served as-is)
   *   - maxSeconds: value is considered stale but usable (background refresh)
   *   - Beyond maxSeconds: value is expired (synchronous recompute)
   * @param factory - Async factory function to compute the value
   * @returns The cached or freshly computed value
   *
   * @example
   * ```typescript
   * // Fresh for 60s, stale-but-usable for up to 300s, expired after 300s
   * const prices = await cache.flexible('product:prices', [60, 300], async () => {
   *   return await fetchPricesFromApi();
   * });
   * ```
   */
  public async flexible<T>(
    key: string,
    ttl: [freshSeconds: number, maxSeconds: number],
    factory: () => Promise<T> | T,
  ): Promise<T> {
    const [freshSeconds, maxSeconds] = ttl;
    const metaKey = `__flexible:created:${key}`;
    const store = this.storeName();

    // Retrieve both the value and its creation timestamp
    const results = await requireStoreMethod(this.getStore(), "many")<unknown>([key, metaKey]);
    const value = results.get(key) as T | undefined;
    const createdAt = results.get(metaKey) as number | undefined;

    // Case 1: No cached value — compute synchronously and store
    if (value === undefined || createdAt === undefined) {
      this.emit(CACHE_EVENTS.MISS, { key, store });
      const freshValue = await factory();
      await this.getStore().set(key, freshValue, maxSeconds);
      await this.getStore().set(metaKey, Date.now(), maxSeconds);
      this.emit(CACHE_EVENTS.WRITTEN, { key, store, ttl: maxSeconds });
      return freshValue;
    }

    // Case 2: Value is within the fresh window — return as-is
    const ageSeconds = (Date.now() - createdAt) / 1000;
    if (ageSeconds <= freshSeconds) {
      this.emit(CACHE_EVENTS.HIT, { key, store });
      return value;
    }

    // Case 3: Value is stale but within max — return stale + refresh in background
    if (ageSeconds <= maxSeconds) {
      this.emit(CACHE_EVENTS.HIT, { key, store });
      // Background refresh (non-blocking, errors swallowed)
      this.refreshInBackground(key, metaKey, maxSeconds, factory);
      return value;
    }

    // Case 4: Value is expired — synchronous recompute
    this.emit(CACHE_EVENTS.MISS, { key, store });
    const freshValue = await factory();
    await this.getStore().set(key, freshValue, maxSeconds);
    await this.getStore().set(metaKey, Date.now(), maxSeconds);
    this.emit(CACHE_EVENTS.WRITTEN, { key, store, ttl: maxSeconds });
    return freshValue;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Counter Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Increment a numeric value stored at the given key.
   *
   * If the key does not exist, it is initialized to 0 before incrementing.
   * Returns the new value after the increment.
   *
   * @param key - Cache key
   * @param by - Amount to increment by (default: 1)
   * @returns The new value after incrementing
   *
   * @example
   * ```typescript
   * await cache.increment('page:views');        // 1
   * await cache.increment('page:views');        // 2
   * await cache.increment('page:views', 5);     // 7
   * ```
   */
  public async increment(key: string, by: number = 1): Promise<number> {
    const value = await requireStoreMethod(this.getStore(), "increment")(key, by);
    this.emit(CACHE_EVENTS.INCREMENTED, { key, store: this.storeName(), by, value });
    return value;
  }

  /**
   * Decrement a numeric value stored at the given key.
   *
   * If the key does not exist, it is initialized to 0 before decrementing.
   * Returns the new value after the decrement (can go negative).
   *
   * @param key - Cache key
   * @param by - Amount to decrement by (default: 1)
   * @returns The new value after decrementing
   *
   * @example
   * ```typescript
   * await cache.set('stock', 10);
   * await cache.decrement('stock');      // 9
   * await cache.decrement('stock', 3);   // 6
   * ```
   */
  public async decrement(key: string, by: number = 1): Promise<number> {
    const value = await requireStoreMethod(this.getStore(), "decrement")(key, by);
    this.emit(CACHE_EVENTS.DECREMENTED, { key, store: this.storeName(), by, value });
    return value;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TTL Management
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Extend the TTL of an existing key without changing its value.
   *
   * If the key does not exist or is expired, this is a no-op (returns false).
   * Useful for "keep-alive" patterns where access should extend the expiry.
   *
   * @param key - Cache key
   * @param ttl - New time-to-live in seconds
   * @returns `true` if the key existed and its TTL was updated
   *
   * @example
   * ```typescript
   * // Extend session TTL on each request
   * await cache.touch('session:abc123', 1800); // reset to 30min
   * ```
   */
  public async touch(key: string, ttl: number): Promise<boolean> {
    const success = await requireStoreMethod(this.getStore(), "touch")(key, ttl);
    this.emit(CACHE_EVENTS.TOUCHED, { key, store: this.storeName(), ttl, success });
    return success;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Delete Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Delete a key from the default cache store.
   *
   * @param key - Cache key
   * @returns `true` if the key existed and was deleted
   */
  public async delete(key: string): Promise<boolean> {
    const removed = await requireStoreMethod(this.getStore(), "delete")(key);
    if (removed) {
      this.emit(CACHE_EVENTS.FORGOTTEN, { key, store: this.storeName() });
    }
    return removed;
  }

  /**
   * Delete a key from the cache (alias for `delete`).
   *
   * Matches Laravel's naming convention.
   *
   * @param key - Cache key
   * @returns `true` if the key existed and was deleted
   */
  public async forget(key: string): Promise<boolean> {
    return this.delete(key);
  }

  /**
   * Retrieve a value and immediately remove it from the cache.
   *
   * Useful for one-time-use tokens, OTP codes, nonces, or flash messages.
   * The key is deleted regardless of whether the value was found.
   *
   * @typeParam T - Expected type of the cached value
   * @param key - Cache key
   * @param defaultValue - Optional fallback if the key is missing
   * @returns The cached value, or the default, or undefined
   *
   * @example
   * ```typescript
   * const otp = await cache.pull<string>('otp:user:123');
   * if (!otp) throw new Error('OTP expired or already used');
   * ```
   */
  public async pull<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const value = await this.get<T>(key, defaultValue);
    await requireStoreMethod(this.getStore(), "delete")(key);
    return value;
  }

  /**
   * Remove all entries from the default cache store.
   */
  public async clear(): Promise<void> {
    await requireStoreMethod(this.getStore(), "clear")();
    this.emit(CACHE_EVENTS.FLUSHED, { store: this.storeName() });
  }

  /**
   * Remove all entries from the default cache store (alias for `clear`).
   *
   * Matches Laravel's naming convention.
   */
  public async flush(): Promise<void> {
    return this.clear();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Store Access
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Begin a tag-scoped cache operation.
   *
   * Returns a `TaggedCache` instance that namespaces all keys by the
   * given tag set. Flushing the tagged cache invalidates ALL entries
   * stored under those tags in O(1) time — without enumerating keys.
   *
   * The TaggedCache provides the same API as CacheService (get, set,
   * remember, forever, increment, etc.) but scoped to the tag namespace.
   *
   * @param names - One or more tag names to scope the cache
   * @returns A TaggedCache instance for tag-scoped operations
   *
   * @example
   * ```typescript
   * // Store entries under the 'users' tag
   * const tagged = cache.tags(['users']);
   * await tagged.set('user:1', userData, 600);
   * await tagged.set('user:2', otherUser, 600);
   *
   * // Invalidate ALL user-tagged entries at once
   * await tagged.flush();
   * ```
   *
   * @example
   * ```typescript
   * // Multiple tags — entries are scoped to the combination
   * const tagged = cache.tags(['products', 'featured']);
   * await tagged.remember('featured-list', 300, () => fetchFeatured());
   *
   * // Flushing invalidates entries with BOTH tags
   * await cache.tags(['products', 'featured']).flush();
   * ```
   */
  public tags(names: string | string[]): TaggedCache {
    const tagNames = Array.isArray(names) ? names : [names];
    return new TaggedCache(this.getStore(), tagNames);
  }

  /**
   * Get a named cache store from the manager.
   *
   * Allows the CacheService to operate on a specific store instead of
   * the default. The returned store implements `ICacheStore`.
   *
   * @param name - Store name (defaults to the configured default)
   * @returns The resolved ICacheStore implementation
   *
   * @example
   * ```typescript
   * const redisStore = cache.store('redis');
   * await redisStore.set('key', 'value', 300);
   * ```
   */
  public store(name?: string): ICacheStore {
    return this.manager.store(name);
  }

  /**
   * Get the underlying CacheManager instance.
   *
   * Useful for advanced operations like registering custom drivers,
   * accessing non-default stores, or inspecting configuration.
   *
   * @returns The CacheManager instance
   */
  public getManager(): CacheManager {
    return this.manager;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get the default cache store from the manager.
   *
   * @returns The default ICacheStore implementation
   */
  private getStore(): ICacheStore {
    return this.manager.store();
  }

  /**
   * Return the name of the active default store. Used in event payloads
   * so subscribers can scope metrics/logs by store.
   *
   * @returns The default driver name from the manager.
   */
  private storeName(): string {
    return this.manager.getDefaultDriver();
  }

  /**
   * Emit a cache lifecycle event on the optional event bus.
   *
   * Fail-soft: silently no-ops when no emitter is registered, and
   * swallows synchronous errors thrown by listeners so a misbehaving
   * subscriber can never break a cache operation.
   *
   * @param event - Event name (from `CACHE_EVENTS`).
   * @param payload - Event payload.
   */
  private emit(event: string, payload?: unknown): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(event, payload);
    } catch (error: unknown) {
      this.logger.warn("[CacheService] failed to emit event", { event, error });
    }
  }

  /**
   * Refresh a cache key in the background (non-blocking).
   *
   * Used by `flexible()` for stale-while-revalidate. The refresh runs
   * after the current microtask completes. Errors are silently swallowed
   * (the stale value continues to be served).
   *
   * @param key - The cache key to refresh
   * @param metaKey - The metadata key storing the creation timestamp
   * @param maxTtl - The maximum TTL for the refreshed value
   * @param factory - The factory to recompute the value
   */
  private refreshInBackground<T>(
    key: string,
    metaKey: string,
    maxTtl: number,
    factory: () => Promise<T> | T,
  ): void {
    queueMicrotask(async () => {
      try {
        const freshValue = await factory();
        await this.getStore().set(key, freshValue, maxTtl);
        await this.getStore().set(metaKey, Date.now(), maxTtl);
      } catch {
        // Background refresh failures are non-fatal.
        // The stale value continues to be served until maxTtl expires.
      }
    });
  }
}

/**
 * @file storage.store.ts
 * @module @stackra/cache/core/stores
 * @description `IStorage`-backed cache store. Composes over the
 *   `@stackra/storage` manager — the backing driver (localStorage,
 *   sessionStorage, IndexedDB via Dexie, AsyncStorage, or a custom
 *   driver) is a config choice at the `StorageManager` level, not a
 *   compile-time choice.
 *
 *   Cache-specific concerns (TTL envelope with `createdAt`,
 *   max-entries eviction, prefix isolation) layered ON TOP of
 *   `IStorage` — the store no longer touches `localStorage` /
 *   `sessionStorage` directly.
 */

import { Inject, Optional } from "@stackra/container";
import {
  STORAGE_MANAGER,
  type ICacheStore,
  type IStorage,
  type IStorageManager,
} from "@stackra/contracts";

import { STORAGE_STORE_OPTIONS } from "@/core/constants/storage-store.constants";
import { CacheStore } from "@/core/decorators";
import type { IStorageEntry } from "@/core/interfaces/storage-entry.interface";
import type { IStorageStoreOptions } from "@/core/interfaces/storage-store-options.interface";

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * `IStorage`-backed cache store with TTL, prefix, and eviction.
 *
 * Each cache entry is stored as a separate `IStorage` key with a
 * cache-owned metadata envelope (`{ value, createdAt, ttl }`) — this
 * gives us the `createdAt` timestamp needed for LRU-style eviction
 * that `IStorage`'s own TTL machinery doesn't expose.
 *
 * Features:
 * - Passive TTL expiry (checked on read, cleaned up on access).
 * - Max-entry eviction (oldest removed when limit exceeded).
 * - Prefix isolation (multiple apps can share the same underlying
 *   storage instance without collision).
 * - Cross-platform via `@stackra/storage` — SSR consumers configure
 *   the manager to use the `memory` driver; browser apps use
 *   `localStorage` / `sessionStorage` / `indexedDB`; React Native
 *   apps use `asyncStorage`.
 * - Graceful failure — `IStorage`'s fail-soft semantics propagate
 *   (quota / private-mode / driver-error all resolve to `null` on
 *   read, silent no-op on write).
 *
 * @example
 * ```typescript
 * // App wires the storage manager once:
 * WebStorageModule.forRoot({
 *   default: 'localStorage',
 *   stores: { localStorage: { driver: 'localStorage', prefix: 'app' } },
 * });
 *
 * // Cache registers StorageStore as its 'storage' driver:
 * CacheModule.forRoot({
 *   default: 'persistent',
 *   stores: { persistent: { driver: 'storage', prefix: 'cache:' } },
 * });
 * CacheModule.forFeature('storage', StorageStore);
 *
 * // Consumer uses cache normally:
 * const store = cacheManager.store('persistent');
 * await store.set('user:1', { name: 'Alice' }, 3600);
 * ```
 */
@CacheStore("storage")
export class StorageStore implements ICacheStore {
  /** Key prefix for all entries. */
  private readonly prefix: string;

  /** Maximum entries to retain. */
  private readonly maxEntries: number;

  /** Named `IStorage` instance to resolve from the manager. */
  private readonly instanceName: string;

  /** Lazy — resolved on first access. */
  private cached: IStorage | null = null;

  /**
   * Create a new StorageStore.
   *
   * @param manager - The resolved `IStorageManager` — required. The
   *   store defers to the manager for platform selection: web /
   *   native / SSR all get the same code path here.
   * @param options - Store configuration (optional). When constructed
   *   by the DI container, options come from the `STORAGE_STORE_OPTIONS`
   *   token — unbound = defaults. Consumers manually constructing
   *   the store pass options as the second constructor argument.
   */
  public constructor(
    @Inject(STORAGE_MANAGER) private readonly manager: IStorageManager,
    @Optional()
    @Inject(STORAGE_STORE_OPTIONS)
    options: IStorageStoreOptions = {},
  ) {
    this.prefix = options.prefix ?? "cache:";
    this.maxEntries = options.maxEntries ?? 1000;
    this.instanceName = options.storage ?? (options.session ? "sessionStorage" : "localStorage");
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ICacheStore Implementation
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Retrieve a value from the cache.
   *
   * Returns `undefined` if the key does not exist or has expired.
   * Expired entries are removed on access (passive expiry).
   */
  public async get<T>(key: string): Promise<T | undefined> {
    const entry = await this.readEntry(key);
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      await this.removeKey(key);
      return undefined;
    }
    return entry.value as T;
  }

  /**
   * Store a value in the cache.
   *
   * @param key - Cache key.
   * @param value - Value to store (must be JSON-serialisable at the
   *   `IStorage` layer for JSON-backed drivers).
   * @param ttl - Time-to-live in seconds (optional — no expiry when
   *   omitted).
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry: IStorageEntry = {
      value,
      createdAt: Date.now(),
      ttl: ttl != null && ttl > 0 ? ttl * 1000 : undefined,
    };
    await this.writeEntry(key, entry);
    await this.enforceLimit();
  }

  /** Check if a key exists and has not expired. */
  public async has(key: string): Promise<boolean> {
    const entry = await this.readEntry(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      await this.removeKey(key);
      return false;
    }
    return true;
  }

  /** Delete a key. Returns `true` when the key existed. */
  public async delete(key: string): Promise<boolean> {
    const existed = await this.storage().has(this.prefix + key);
    await this.storage().delete(this.prefix + key);
    return existed;
  }

  /**
   * Remove all entries managed by this store (matching prefix).
   *
   * Only removes keys under this store's prefix — other applications
   * / cache stores sharing the same `IStorage` instance stay intact.
   */
  public async clear(): Promise<void> {
    const keys = await this.storage().keys();
    const owned = keys.filter((k) => k.startsWith(this.prefix));
    for (const k of owned) {
      await this.storage().delete(k);
    }
  }

  /** Retrieve multiple values. */
  public async many<T>(keys: string[]): Promise<Map<string, T | undefined>> {
    const results = new Map<string, T | undefined>();
    for (const key of keys) {
      results.set(key, await this.get<T>(key));
    }
    return results;
  }

  /** Store multiple values with a shared TTL. */
  public async setMany<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }

  /** Store a value forever (no TTL). */
  public async forever<T>(key: string, value: T): Promise<void> {
    const entry: IStorageEntry = {
      value,
      createdAt: Date.now(),
      // No ttl = never expires
    };
    await this.writeEntry(key, entry);
    await this.enforceLimit();
  }

  /**
   * Increment a numeric value at `key`. Initialises to 0 when absent.
   * Preserves the existing TTL metadata.
   */
  public async increment(key: string, by: number = 1): Promise<number> {
    // If expired, treat as non-existent so the write below effectively
    // resets the counter.
    const existing = await this.readEntry(key);
    if (existing && this.isExpired(existing)) {
      await this.removeKey(key);
    }

    const current =
      existing && !this.isExpired(existing)
        ? typeof existing.value === "number"
          ? existing.value
          : 0
        : 0;
    const next = current + by;

    const entry: IStorageEntry = {
      value: next,
      createdAt: existing?.createdAt ?? Date.now(),
      ttl: existing?.ttl,
    };
    await this.writeEntry(key, entry);
    return next;
  }

  /** Decrement a numeric value. */
  public async decrement(key: string, by: number = 1): Promise<number> {
    return this.increment(key, -by);
  }

  /** Extend a key's TTL without touching its value. */
  public async touch(key: string, ttl: number): Promise<boolean> {
    const entry = await this.readEntry(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      await this.removeKey(key);
      return false;
    }
    entry.createdAt = Date.now();
    entry.ttl = ttl > 0 ? ttl * 1000 : undefined;
    await this.writeEntry(key, entry);
    return true;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Resolve (and cache) the underlying `IStorage`. Deferred so
   * platform modules that register drivers via `manager.extend(...)`
   * during `onApplicationBootstrap` get a chance to run first.
   */
  private storage(): IStorage {
    if (this.cached) return this.cached;
    this.cached = this.manager.instance(this.instanceName);
    return this.cached;
  }

  /** Read and unwrap a single entry from `IStorage`. */
  private async readEntry(key: string): Promise<IStorageEntry | null> {
    return (await this.storage().get<IStorageEntry>(this.prefix + key)) ?? null;
  }

  /** Write an entry to `IStorage`. */
  private async writeEntry(key: string, entry: IStorageEntry): Promise<void> {
    await this.storage().set(this.prefix + key, entry);
  }

  /** Remove a single key from `IStorage`. */
  private async removeKey(key: string): Promise<void> {
    await this.storage().delete(this.prefix + key);
  }

  /** Check if a cache entry has expired. */
  private isExpired(entry: IStorageEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.createdAt > entry.ttl;
  }

  /**
   * Remove oldest entries if the store exceeds `maxEntries`.
   *
   * Scans every key under the store's prefix, reads each entry's
   * `createdAt` timestamp, sorts oldest-first, and drops the excess.
   * The IStorage layer's fail-soft semantics propagate — one
   * unreadable entry doesn't abort the sweep.
   */
  private async enforceLimit(): Promise<void> {
    if (this.maxEntries <= 0 || this.maxEntries === Infinity) return;

    const allKeys = await this.storage().keys();
    const ownedKeys = allKeys.filter((k) => k.startsWith(this.prefix));
    if (ownedKeys.length <= this.maxEntries) return;

    // Read each entry's createdAt in parallel — the sweep is
    // O(prefix-matching-keys) which stays small in practice.
    const entries: Array<{ key: string; createdAt: number }> = [];
    await Promise.all(
      ownedKeys.map(async (key) => {
        try {
          const parsed = await this.storage().get<IStorageEntry>(key);
          if (parsed) entries.push({ key, createdAt: parsed.createdAt });
        } catch {
          // Skip unreadable entries.
        }
      }),
    );

    // Sort oldest first and drop the overflow.
    entries.sort((a, b) => a.createdAt - b.createdAt);
    const toRemove = entries.length - this.maxEntries;
    for (let i = 0; i < toRemove; i += 1) {
      await this.storage().delete(entries[i]!.key);
    }
  }
}

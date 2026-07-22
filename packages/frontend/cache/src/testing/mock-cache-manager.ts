/**
 * @file mock-cache-manager.ts
 * @module @stackra/cache/testing
 * @description In-memory `ICacheManager` implementation for tests.
 *
 *   Resolves named stores lazily and delegates to `MockCacheStore` for
 *   actual storage. All methods on the contract are implemented, so the
 *   mock is a drop-in replacement for a real `CacheManager`.
 */

import type { ICacheManager, ICacheStore, ITaggedCache } from "@stackra/contracts";
import { MockCacheStore } from "./mock-cache-store";

/**
 * In-memory cache manager for testing.
 *
 * Resolves named stores from an internal registry. If a store hasn't
 * been created yet, a fresh `MockCacheStore` is spun up on first access.
 */
export class MockCacheManager implements ICacheManager {
  /** Named store registry — created lazily on `.store(name)`. */
  private readonly stores = new Map<string, ICacheStore>();

  /** Custom store creators registered via `.extend()`. */
  private readonly creators = new Map<string, () => ICacheStore>();

  /** Configurable default driver name (matches production behaviour). */
  private defaultDriver: string = "default";

  public getDefaultDriver(): string {
    return this.defaultDriver;
  }

  /** Test helper — change the default driver name. */
  public setDefaultDriver(name: string): void {
    this.defaultDriver = name;
  }

  public store(name?: string): ICacheStore {
    const key = name ?? this.defaultDriver;
    const cached = this.stores.get(key);
    if (cached) return cached;

    const creator = this.creators.get(key);
    const store = creator ? creator() : new MockCacheStore();
    this.stores.set(key, store);
    return store;
  }

  public extend(name: string, creator: () => ICacheStore): void {
    this.creators.set(name, creator);
    // Invalidate any cached instance so the next `.store(name)` re-creates.
    this.stores.delete(name);
  }

  /**
   * Minimal `tags()` for testing — returns a bare `ITaggedCache`
   * shaped as a per-tag-set in-memory map. Not a full production
   * `TaggedCache` (no namespacing / hashing); tests that need
   * realistic tag behaviour should mount the real `CacheManager`.
   */
  public tags(_tags: string[]): ITaggedCache {
    const local = new Map<string, unknown>();
    return {
      async get<T>(key: string): Promise<T | undefined> {
        return local.get(key) as T | undefined;
      },
      async put<T>(key: string, value: T): Promise<void> {
        local.set(key, value);
      },
      async flush(): Promise<void> {
        local.clear();
      },
    };
  }
}

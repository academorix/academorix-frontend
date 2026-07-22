/**
 * @file cache-manager.interface.ts
 * @module @stackra/contracts/interfaces/cache
 * @description Cache manager contract — resolves named cache stores.
 */

import type { ICacheStore } from "./cache-store.interface";
import type { ITaggedCache } from "./tagged-cache.interface";

/**
 * Cache manager contract.
 *
 * Resolves named cache stores lazily with caching.
 */
export interface ICacheManager {
  /** Get the default store name. */
  getDefaultDriver(): string;

  /** Resolve a named store (defaults to the configured default). */
  store(name?: string): ICacheStore;

  /** Register a custom store driver at runtime. */
  extend(name: string, creator: () => ICacheStore): void;

  /**
   * Resolve a tag-scoped cache. Every entry stored through the
   * returned `ITaggedCache` is namespaced by the tag set — a
   * `flush()` on the tagged cache invalidates every entry
   * previously stored under the same tag combination.
   *
   * Every concrete manager in `@stackra/cache` implements this;
   * minimal null/mock implementations should still surface a
   * `tags()` method (may return a no-op `ITaggedCache`).
   *
   * @param tags - Tag names composing the namespace.
   */
  tags(tags: string[]): ITaggedCache;
}

/**
 * @file cache-manager.interface.ts
 * @module @stackra/contracts/interfaces/cache
 * @description Cache manager contract — resolves named cache stores.
 */

import type { ICacheStore } from "./cache-store.interface";

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
}

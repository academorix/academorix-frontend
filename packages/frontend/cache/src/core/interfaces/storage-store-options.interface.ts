/**
 * @file storage-store-options.interface.ts
 * @module @stackra/cache/core/interfaces
 * @description Configuration options interface for the `StorageStore`.
 *   Controls prefix isolation, maximum entry limits, and the named
 *   `IStorage` instance used as the backing store.
 */

/**
 * Configuration options for the `StorageStore`.
 *
 * Controls how the `IStorage`-backed cache store operates — key
 * prefix isolation, entry-count eviction limit, and which named
 * storage instance to resolve from the manager.
 */
export interface IStorageStoreOptions {
  /** Key prefix for all entries. Default: 'cache:'. */
  prefix?: string;

  /** Maximum entries to retain before eviction. Default: 1000. */
  maxEntries?: number;

  /**
   * Named `IStorage` instance to resolve from the manager. Falls
   * back to the manager's default instance when omitted.
   *
   * @default 'localStorage' (or 'sessionStorage' when `session: true`)
   */
  storage?: string;

  /**
   * If `true`, resolve `'sessionStorage'` from the manager instead of
   * `'localStorage'`. Kept for backward compatibility — new code
   * should set `storage: 'sessionStorage'` explicitly.
   *
   * @deprecated Use `storage: 'sessionStorage'`.
   */
  session?: boolean;
}

/**
 * @file storage-store.constants.ts
 * @module @stackra/cache/core/constants
 * @description DI token for optional `StorageStore` options.
 */

/**
 * DI token for `IStorageStoreOptions` when the `StorageStore` is
 * constructed by the container. When unbound, the store uses its
 * documented defaults.
 */
export const STORAGE_STORE_OPTIONS = Symbol.for("STACKRA_CACHE_STORAGE_STORE_OPTIONS");

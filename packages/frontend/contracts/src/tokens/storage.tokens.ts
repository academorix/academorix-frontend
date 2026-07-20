/**
 * @file storage.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the unified KV storage system.
 *
 *   These tokens are bound by `@stackra/storage`'s `StorageModule`.
 *   Consumer packages inject them to talk to the manager or the
 *   default `IStorage` instance without importing anything from the
 *   storage package's runtime.
 */

/**
 * DI token for the resolved `IStorageManager` — the multi-instance
 * manager that owns every named `IStorage` instance.
 *
 * @remarks Bound in `StorageModule.forRoot`.
 */
export const STORAGE_MANAGER = Symbol.for("STORAGE_MANAGER");

/**
 * DI token for the resolved `IStorageConfig` — the merged options
 * (defaults ∪ user overrides) that `StorageManager` reads to lazy-
 * create instances.
 *
 * @remarks Bound in `StorageModule.forRoot`.
 */
export const STORAGE_CONFIG = Symbol.for("STORAGE_CONFIG");

/**
 * DI token for the default `IStorage` instance — a shortcut equal to
 * `storageManager.instance()` (the store named by `config.default`).
 *
 * @remarks Bound in `StorageModule.forRoot`. Use this token when the
 *   consumer only cares about one storage instance; use
 *   {@link STORAGE_MANAGER} when the consumer needs multiple named
 *   instances.
 */
export const STORAGE = Symbol.for("STORAGE");

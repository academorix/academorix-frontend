/**
 * @file storage-manager.interface.ts
 * @module @stackra/contracts/interfaces/storage
 * @description The `IStorageManager` contract — resolves named
 *   `IStorage` instances lazily. Bound by `@stackra/storage` under
 *   the `STORAGE_MANAGER` token.
 */

import type { IStorage } from "./storage.interface";

/**
 * Factory that builds one `IStorage` from a raw config record.
 *
 * Used by {@link IStorageManager.extend} and by the internal
 * `create{Driver}Driver` convention of the `MultipleInstanceManager`
 * base class.
 */
export interface IStorageDriverCreator {
  (config: Record<string, unknown>): IStorage | Promise<IStorage>;
}

/**
 * Storage manager contract.
 *
 * Mirrors the manager surface `@stackra/cache`, `@stackra/http`,
 * and `@stackra/queue` expose: named instances resolved on demand,
 * cached after first resolution, extendable at runtime via
 * `extend(driverName, creator)`.
 *
 * @example
 * ```typescript
 * import { STORAGE_MANAGER, type IStorageManager } from '@stackra/contracts';
 *
 * class UserPreferencesService {
 *   public constructor(
 *     @Inject(STORAGE_MANAGER) private readonly storage: IStorageManager,
 *   ) {}
 *
 *   async persist(): Promise<void> {
 *     await this.storage.instance('preferences').set('theme', 'dark');
 *   }
 * }
 * ```
 */
export interface IStorageManager {
  /**
   * Resolve a named storage instance.
   *
   * Resolution is lazy — the instance is created on first access
   * from the store's config, then cached. Subsequent calls return
   * the same object.
   *
   * @param name - Instance name. Defaults to the configured
   *   `config.default`.
   * @returns The resolved `IStorage`.
   * @throws Error when the named instance is not declared or the
   *   configured driver is not registered.
   */
  instance(name?: string): IStorage;

  /**
   * Whether a named instance has been resolved and cached.
   *
   * @param name - Instance name. Defaults to `config.default`.
   */
  hasInstance(name?: string): boolean;

  /**
   * Register a custom driver factory at runtime.
   *
   * Platform-specific drivers (localStorage, sessionStorage,
   * IndexedDB, AsyncStorage) register through this hook from their
   * subpath module (`WebStorageModule`, `NativeStorageModule`) —
   * the base `StorageManager` class holds only the cross-platform
   * `memory` / `null` drivers.
   *
   * @param driverName - The `driver` config field that selects this
   *   creator (e.g. `'localStorage'`).
   * @param creator - Factory that builds an `IStorage` from a raw
   *   config record.
   * @returns The manager (for chaining).
   */
  extend(driverName: string, creator: IStorageDriverCreator): this;

  /**
   * Get the configured default instance name.
   *
   * @returns The store name resolved by `instance()` when no
   *   argument is passed.
   */
  getDefaultInstance(): string;
}

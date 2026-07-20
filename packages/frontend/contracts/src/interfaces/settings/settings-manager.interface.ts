/**
 * @file settings-manager.interface.ts
 * @module @stackra/contracts/interfaces/settings
 * @description The `ISettingsManager` contract — multi-instance
 *   manager for named `ISettingsStore` drivers.
 *
 *   Mirrors the shape of `IStorageManager` / `ICacheManager`: named
 *   instances resolved lazily, cached after first resolve, extendable
 *   at runtime via `extend(driverName, creator)`.
 */

import type { ISettingsStore } from "./settings-store.interface";

/**
 * Factory that builds one `ISettingsStore` from a raw config record.
 *
 * Registered via {@link ISettingsManager.extend} or by the built-in
 * `create{Driver}Driver` convention.
 */
export interface ISettingsDriverCreator {
  (config: Record<string, unknown>): ISettingsStore | Promise<ISettingsStore>;
}

/**
 * Multi-instance manager over `ISettingsStore` implementations.
 *
 * @example
 * ```typescript
 * import { SETTINGS_MANAGER, type ISettingsManager } from '@stackra/contracts';
 *
 * class SomeService {
 *   public constructor(
 *     @Inject(SETTINGS_MANAGER) private readonly manager: ISettingsManager,
 *   ) {}
 *
 *   getStore(name: string) {
 *     return this.manager.instance(name);
 *   }
 * }
 * ```
 */
export interface ISettingsManager {
  /**
   * Resolve a named store. Uses `config.default` when `name` is
   * omitted. Instances are cached after first resolve.
   */
  instance(name?: string): ISettingsStore;

  /**
   * Return the store that should back a specific settings group,
   * honouring per-group overrides configured under `config.groups`.
   */
  storeForGroup(groupKey: string): ISettingsStore;

  /** Whether a named instance is cached. */
  hasInstance(name?: string): boolean;

  /**
   * Register a custom driver factory. Downstream packages hook their
   * own drivers (indexed DB, cookies, etc.) through this method.
   */
  extend(driverName: string, creator: ISettingsDriverCreator): this;

  /** The `config.default` store name. */
  getDefaultInstance(): string;
}

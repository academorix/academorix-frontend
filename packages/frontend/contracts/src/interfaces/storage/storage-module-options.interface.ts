/**
 * @file storage-module-options.interface.ts
 * @module @stackra/contracts/interfaces/storage
 * @description Root config shape for `StorageModule.forRoot(options)`.
 *
 *   Every family member below is only used AS a nested part of
 *   `IStorageModuleOptions` — they qualify for the composite-family
 *   grouping exception in `code-standards.md`.
 */

/**
 * Per-instance config bag.
 *
 * The `driver` field selects the backing store; every other field
 * is driver-specific and passed through to the corresponding
 * `IStorageDriverCreator` unmodified. See each store's JSDoc for
 * the fields it recognises (`prefix`, `database`, `tableName`, …).
 */
export interface IStorageStoreConfig {
  /**
   * Driver name selecting the backing store.
   *
   * Cross-platform built-ins are `memory` (in-process) and `null`
   * (no-op sink for tests). Web-only drivers are `localStorage`,
   * `sessionStorage`, `indexedDB`. Native-only is `asyncStorage`.
   * Custom drivers register via `manager.extend(name, creator)`.
   */
  readonly driver: string;

  /**
   * Driver-specific option pass-through.
   *
   * @remarks The index signature is intentionally permissive —
   *   drivers declare their own well-typed narrower shapes.
   */
  readonly [key: string]: unknown;
}

/**
 * Root options accepted by `StorageModule.forRoot`.
 *
 * Two fields:
 *
 * - `default` — the instance name resolved when `manager.instance()`
 *   is called with no argument (and the store bound to the
 *   `STORAGE` DI token).
 * - `stores` — every named instance the manager is expected to
 *   serve, keyed by name.
 *
 * `mergeConfig` fills in `DEFAULT_STORAGE_CONFIG` — the built-in
 * defaults produce a single `'memory'` instance so the manager
 * always resolves in tests / SSR without extra wiring.
 */
export interface IStorageModuleOptions {
  /**
   * Name of the instance returned by `manager.instance()` when no
   * argument is passed. Must be a key of `stores`.
   *
   * @default 'memory'
   */
  readonly default?: string;

  /**
   * Map of named instances to their configuration.
   *
   * @default { memory: { driver: 'memory' } }
   */
  readonly stores?: Record<string, IStorageStoreConfig>;
}

/**
 * The merged, defaults-applied form of {@link IStorageModuleOptions}
 * bound under `STORAGE_CONFIG`.
 *
 * @remarks Every field is required after `mergeConfig(options?)`
 *   has run — the manager may assume both fields are present.
 */
export interface IStorageConfig {
  /** Resolved default instance name. */
  readonly default: string;
  /** Resolved named-instance map. */
  readonly stores: Record<string, IStorageStoreConfig>;
}

/**
 * @file settings-store.interface.ts
 * @module @stackra/contracts/interfaces/settings
 * @description Persistence-driver contract for `@stackra/settings`.
 *
 *   Each driver (memory, storage-backed, api) implements this contract.
 *   Values are loaded / saved / cleared per `groupKey`. Return types
 *   are `T | Promise<T>` because some drivers are synchronous (memory)
 *   and some are asynchronous (api, indexed DB) — the service handles
 *   both with a sync-cache-over-async-hydrate pattern.
 */

/**
 * Driver contract for a settings store.
 *
 * The `driver` field names the backing implementation (e.g.
 * `'memory'`, `'storage'`, `'api'`) and is used by the manager
 * for logging and diagnostics.
 */
export interface ISettingsStore {
  /** Driver name (e.g. `'memory'`, `'storage'`, `'api'`). */
  readonly driver: string;

  /**
   * Load persisted values for a group.
   *
   * Returns an empty object when nothing is persisted. Sync drivers
   * return synchronously; async drivers return a `Promise`.
   */
  load(groupKey: string): Record<string, unknown> | Promise<Record<string, unknown>>;

  /**
   * Save values for a group. The store owns representation choices
   * (partial merge vs. full replace) — the service always sends the
   * full merged snapshot.
   */
  save(groupKey: string, values: Record<string, unknown>): void | Promise<void>;

  /** Clear persisted values for a group. */
  clear(groupKey: string): void | Promise<void>;

  /**
   * Bulk-load values for every group the driver can address.
   *
   * Returns a `Record<groupKey, values>` map. Drivers that address
   * a single "everything" endpoint (`api` calling `GET /settings`)
   * implement this natively for a one-round-trip cold start.
   * Drivers without a bulk primitive (`memory`, `storage`) omit
   * this method — the service falls back to per-group `load()` on
   * the known groups.
   *
   * @remarks Optional. When present, `SettingsService.loadAll()`
   *   prefers it over the per-group fallback.
   */
  loadAll?(): Promise<Record<string, Record<string, unknown>>>;
}

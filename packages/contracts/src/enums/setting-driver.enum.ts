/**
 * @file setting-driver.enum.ts
 * @module @stackra/contracts/enums
 * @description Built-in settings-store driver names.
 *
 *   Each case names a driver `SettingsStoreManager.createXDriver()`
 *   can resolve at runtime. Third-party drivers (e.g. an IndexedDB
 *   store from a downstream package) extend the manager via
 *   `manager.extend(name, creator)` and don't need to appear here.
 */

/** Built-in settings-store driver names. */
export enum SettingDriver {
  /** In-process `Map`-backed store. Values are lost on reload. */
  Memory = "memory",
  /**
   * Generic wrapper over a named `IStorage` instance from
   * `@stackra/storage`. Config passes through `storageInstance`.
   */
  Storage = "storage",
  /** REST API-backed store — GET / PUT / DELETE on `{baseUrl}/{group}`. */
  Api = "api",
}

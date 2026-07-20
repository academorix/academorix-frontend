/**
 * @file storage-driver.error.ts
 * @module @stackra/storage/core/errors
 * @description Raised when the `StorageManager` cannot resolve a
 *   named instance because its `driver` config field references a
 *   creator that isn't registered on the manager.
 */

import { StorageError } from './storage.error';

/**
 * Raised when a store's configured driver is unknown to the manager.
 *
 * @example
 * ```typescript
 * // Thrown by StorageManager.resolve() when config.stores[name].driver
 * // matches neither a create{Driver}Driver method nor a driver
 * // registered via manager.extend(...).
 * throw new StorageDriverError('preferences', 'localStorage');
 * ```
 */
export class StorageDriverError extends StorageError {
  /**
   * @param instance - Name of the storage instance being resolved.
   * @param driver - The unknown driver name from the instance config.
   * @param options - Standard `ErrorOptions` (currently only `cause`).
   */
  public constructor(instance: string, driver: string, options?: ErrorOptions) {
    super(
      `[@stackra/storage] instance "${instance}" is configured with driver ` +
        `"${driver}", but no creator is registered. Import the matching platform ` +
        `module (WebStorageModule / NativeStorageModule) or register a custom ` +
        `driver via storageManager.extend("${driver}", creator).`,
      options
    );
    this.name = 'StorageDriverError';
  }
}

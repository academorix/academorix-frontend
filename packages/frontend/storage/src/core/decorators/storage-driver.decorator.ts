/**
 * @file storage-driver.decorator.ts
 * @module @stackra/storage/core/decorators
 * @description Class decorator stamping metadata that identifies a
 *   custom `IStorage` implementation. Discovery loaders scan for
 *   the metadata key and register the class with the manager.
 */

import { defineMetadata } from "@vivtel/metadata";
import { Injectable } from "@stackra/container";

/**
 * Metadata key stamped by the `@StorageDriver()` decorator.
 *
 * @internal Discovery scanners read this key via
 *   `discovery.getProvidersByMetadata(STORAGE_DRIVER_METADATA_KEY)`.
 */
export const STORAGE_DRIVER_METADATA_KEY = "stackra:storage:driver";

/**
 * Mark a class as a custom `IStorage` driver.
 *
 * Also stamps `@Injectable()` so the class can be provided directly
 * in a module's `providers` array. Discovery loaders introspect the
 * metadata to auto-register the driver with `StorageManager.extend()`.
 * The `name` argument matches the `driver` field consumers pass in
 * their per-instance config.
 *
 * @param name - The driver name (e.g. `'redis'`, `'mmkv'`).
 * @returns A class decorator that stamps the metadata + `@Injectable`.
 *
 * @example
 * ```typescript
 * @StorageDriver('mmkv')
 * export class MmkvStore implements IStorage { … }
 * ```
 */
export function StorageDriver(name: string): ClassDecorator {
  return (target: Function) => {
    // Stamp @Injectable so the container knows to construct via DI.
    Injectable()(target as never);
    defineMetadata(STORAGE_DRIVER_METADATA_KEY, name, target);
  };
}

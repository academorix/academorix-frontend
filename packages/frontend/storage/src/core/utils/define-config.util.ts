/**
 * @file define-config.util.ts
 * @module @stackra/storage/core/utils
 * @description Typed identity for authoring a storage config in a
 *   dedicated `config/*.config.ts` file. The function performs no
 *   merging — {@link mergeConfig} does that, once, inside
 *   `StorageModule.forRoot`.
 */

import type { IStorageModuleOptions } from "@stackra/contracts";

/**
 * Type-safe storage config builder.
 *
 * The function returns its input unchanged — its sole value is
 * IDE autocompletion and compile-time validation for the shape
 * (default + stores map).
 *
 * @param config - The storage configuration.
 * @returns The same config object, fully typed.
 *
 * @example
 * ```typescript
 * // config/storage.config.ts
 * import { defineConfig } from '@stackra/storage';
 *
 * export default defineConfig({
 *   default: 'preferences',
 *   stores: {
 *     preferences: { driver: 'localStorage', prefix: 'app:prefs' },
 *     session: { driver: 'sessionStorage' },
 *   },
 * });
 * ```
 */
export function defineConfig(config: IStorageModuleOptions): IStorageModuleOptions {
  return config;
}

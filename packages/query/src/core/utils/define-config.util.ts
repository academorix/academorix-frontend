/**
 * @file define-config.util.ts
 * @module @stackra/query/core/utils
 * @description Typed identity for authoring query config in a file.
 */

import type { QueryModuleOptions } from '../interfaces/query-module-options.interface';

/**
 * Type-safe identity for a query configuration object.
 *
 * @param config - The query module configuration.
 * @returns The same object, fully typed.
 */
export function defineConfig(config: QueryModuleOptions): QueryModuleOptions {
  return config;
}

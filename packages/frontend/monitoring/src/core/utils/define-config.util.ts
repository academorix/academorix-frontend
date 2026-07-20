/**
 * @file define-config.util.ts
 * @module @stackra/monitoring/core/utils
 * @description Typed identity for authoring monitoring config in a file.
 */

import type { IMonitoringModuleOptions } from "../interfaces";

/**
 * Type-safe identity for a monitoring configuration object.
 *
 * @param config - The monitoring module configuration.
 * @returns The same object, fully typed.
 *
 * @example
 * ```typescript
 * // config/monitoring.config.ts
 * import { defineConfig } from '@stackra/monitoring';
 *
 * export const monitoringConfig = defineConfig({
 *   environment: 'production',
 *   sentry: { dsn: import.meta.env.VITE_SENTRY_DSN },
 * });
 * ```
 */
export function defineConfig(config: IMonitoringModuleOptions): IMonitoringModuleOptions {
  return config;
}

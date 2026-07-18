/**
 * @file define-config.util.ts
 * @module @stackra/analytics/core/utils
 * @description Typed identity for authoring analytics config in a file.
 */

import type { IAnalyticsModuleOptions } from '../interfaces';

/**
 * Type-safe identity for an analytics configuration object.
 *
 * @param config - The analytics module configuration.
 * @returns The same object, fully typed.
 *
 * @example
 * ```typescript
 * // config/analytics.config.ts
 * import { defineConfig } from '@stackra/analytics';
 *
 * export const analyticsConfig = defineConfig({
 *   ga4: { measurementId: 'G-XXXXXXX' },
 *   metaPixel: { pixelId: '1234567890' },
 * });
 * ```
 */
export function defineConfig(config: IAnalyticsModuleOptions): IAnalyticsModuleOptions {
  return config;
}

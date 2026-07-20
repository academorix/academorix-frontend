/**
 * @file define-config.util.ts
 * @module @stackra/settings/core/utils
 * @description Type-safe configuration builder for the settings
 *   module. Provides IDE autocompletion and validation for settings
 *   configurations defined in separate config files.
 *
 *   Per the config-architecture guide:
 *   - Use `defineConfig` here for **module-level** configuration
 *     passed to `SettingsModule.forRoot`.
 *   - For **application-level** injectable configuration (per-tenant
 *     defaults, business toggles, etc.), use `registerAs` from
 *     `@stackra/config`.
 */

import type { ISettingsModuleOptions } from "@stackra/contracts";

/**
 * Type-safe configuration builder for the settings module.
 *
 * Returns the config unchanged — its purpose is to provide TypeScript
 * type checking and IDE autocompletion for settings configurations
 * defined in separate config files.
 *
 * @param config - The settings module configuration object.
 * @returns The same config object, fully typed.
 *
 * @example
 * ```typescript
 * // config/settings.config.ts
 * import { defineConfig } from '@stackra/settings';
 *
 * export default defineConfig({
 *   default: 'localStorage',
 *   stores: {
 *     memory: { driver: 'memory' },
 *     localStorage: { driver: 'storage', storageInstance: 'localStorage' },
 *     api: { driver: 'api', fallbackStore: 'localStorage' },
 *   },
 *   groups: {
 *     notifications: { store: 'api' },
 *   },
 *   api: { autoLoadSchema: true },
 *   broadcasting: { enabled: true, channelPrefix: 'settings' },
 * });
 * ```
 */
export function defineConfig(config: ISettingsModuleOptions): ISettingsModuleOptions {
  return config;
}

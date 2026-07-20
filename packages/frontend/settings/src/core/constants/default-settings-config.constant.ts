/**
 * @file default-settings-config.constant.ts
 * @module @stackra/settings/core/constants
 * @description Default configuration values applied to
 *   `SettingsModule.forRoot(options?)` by the module's `mergeConfig`
 *   helper. Consumers may override any nested field without
 *   re-declaring the rest.
 */

import type { ISettingsConfig } from '@stackra/contracts';

import { DEFAULT_API_ENDPOINTS } from './api-endpoints.constant';

/**
 * Default settings-module configuration.
 *
 * - Two stores are pre-configured: an in-memory driver (`memory`) and
 *   a `localStorage`-backed driver that wraps
 *   `STORAGE_MANAGER.instance('localStorage')`. `default` selects
 *   the persistent one so page reloads survive.
 * - `api.autoLoadSchema` is `false` by default — apps opt in once
 *   the backend endpoint is stable.
 * - `broadcasting.enabled` is `false` by default — apps opt in when
 *   they also install `@stackra/realtime`.
 */
export const DEFAULT_SETTINGS_CONFIG: ISettingsConfig = {
  default: 'localStorage',
  prefix: 'stackra:settings',
  stores: {
    memory: { driver: 'memory' },
    localStorage: { driver: 'storage', storageInstance: 'localStorage' },
  },
  debounce: true,
  debounceMs: 300,
  api: {
    httpClient: 'default',
    endpoints: DEFAULT_API_ENDPOINTS,
    autoLoadSchema: false,
    autoLoadValues: false,
    cacheSchemaStore: false,
  },
  broadcasting: {
    enabled: false,
    channelPrefix: 'settings',
    connection: 'default',
  },
};

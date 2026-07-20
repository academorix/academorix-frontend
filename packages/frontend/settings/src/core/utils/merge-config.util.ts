/**
 * @file merge-config.util.ts
 * @module @stackra/settings/core/utils
 * @description Single source of truth for merging user-supplied
 *   settings options with `DEFAULT_SETTINGS_CONFIG`.
 *
 *   Both `forRoot` and `forRootAsync` route through this helper so
 *   defaults stay consistent. The merge is deep for `api` and
 *   `broadcasting` sub-objects (so callers can override just one
 *   endpoint or one flag), and shallow-replace for `stores` (giving
 *   full control over the store map when it's provided at all).
 */

import type {
  ISettingsApiEndpoints,
  ISettingsConfig,
  ISettingsModuleOptions,
} from '@stackra/contracts';

import { DEFAULT_SETTINGS_CONFIG } from '@/core/constants/default-settings-config.constant';

/**
 * Merge user options into the default settings config.
 *
 * @param options - User-supplied partial configuration.
 * @returns Fully resolved configuration with defaults applied.
 */
export function mergeConfig(options?: ISettingsModuleOptions): ISettingsConfig {
  if (!options) return DEFAULT_SETTINGS_CONFIG;

  // Deep-merge `api.endpoints` so callers can override just one path.
  // Start from the fully-populated defaults, then let the user object
  // narrow individual keys — the defaults guarantee every key is a
  // string.
  const endpoints: Required<ISettingsApiEndpoints> = {
    schema: options.api?.endpoints?.schema ?? DEFAULT_SETTINGS_CONFIG.api.endpoints.schema,
    listGroups:
      options.api?.endpoints?.listGroups ?? DEFAULT_SETTINGS_CONFIG.api.endpoints.listGroups,
    getGroup: options.api?.endpoints?.getGroup ?? DEFAULT_SETTINGS_CONFIG.api.endpoints.getGroup,
    updateGroup:
      options.api?.endpoints?.updateGroup ?? DEFAULT_SETTINGS_CONFIG.api.endpoints.updateGroup,
  };

  return {
    // Scalars — user wins.
    default: options.default ?? DEFAULT_SETTINGS_CONFIG.default,
    prefix: options.prefix ?? DEFAULT_SETTINGS_CONFIG.prefix,
    debounce: options.debounce ?? DEFAULT_SETTINGS_CONFIG.debounce,
    debounceMs: options.debounceMs ?? DEFAULT_SETTINGS_CONFIG.debounceMs,

    // Stores — shallow-replace when user provides a full map; otherwise
    // keep the defaults so `memory` + `localStorage` are always
    // present.
    stores: options.stores ?? DEFAULT_SETTINGS_CONFIG.stores,

    // Per-group overrides pass through unchanged (undefined when
    // absent).
    ...(options.groups ? { groups: options.groups } : {}),

    // API sub-config — deep-merge fields so `autoLoadSchema: true`
    // alone doesn't blow away the endpoint defaults.
    api: {
      httpClient: options.api?.httpClient ?? DEFAULT_SETTINGS_CONFIG.api.httpClient,
      endpoints,
      autoLoadSchema: options.api?.autoLoadSchema ?? DEFAULT_SETTINGS_CONFIG.api.autoLoadSchema,
      autoLoadValues: options.api?.autoLoadValues ?? DEFAULT_SETTINGS_CONFIG.api.autoLoadValues,
      cacheSchemaStore:
        options.api?.cacheSchemaStore ?? DEFAULT_SETTINGS_CONFIG.api.cacheSchemaStore,
      ...(options.api?.baseUrl !== undefined ? { baseUrl: options.api.baseUrl } : {}),
    },

    // Broadcasting sub-config — deep-merge.
    broadcasting: {
      enabled: options.broadcasting?.enabled ?? DEFAULT_SETTINGS_CONFIG.broadcasting.enabled,
      channelPrefix:
        options.broadcasting?.channelPrefix ?? DEFAULT_SETTINGS_CONFIG.broadcasting.channelPrefix,
      connection:
        options.broadcasting?.connection ?? DEFAULT_SETTINGS_CONFIG.broadcasting.connection,
    },
  };
}

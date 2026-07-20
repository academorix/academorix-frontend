/**
 * @file settings.config.ts
 * @module @stackra/settings/config
 * @description Application-level settings framework configuration.
 *   Consumed by `SettingsModule.forRoot()` at bootstrap.
 */

import { defineConfig } from '@stackra/settings';

export const settingsConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Store
  |--------------------------------------------------------------------------
  |
  | Which named store persists a group's values when the group has no
  | per-group override in `groups` below. Must be a key of `stores`.
  |
  */
  default: 'localStorage',

  /*
  |--------------------------------------------------------------------------
  | Key Prefix
  |--------------------------------------------------------------------------
  |
  | Global namespace prepended to persisted keys by storage-backed
  | drivers. Prevents collisions with unrelated apps on the same
  | origin.
  |
  */
  prefix: 'stackra:settings',

  /*
  |--------------------------------------------------------------------------
  | Stores
  |--------------------------------------------------------------------------
  |
  | Named store configurations. Available drivers:
  |   - `memory`   — in-process, cleared on reload
  |   - `storage`  — wraps @stackra/storage instances (localStorage,
  |                  sessionStorage, IndexedDB, cookie)
  |   - `api`      — HTTP-backed against the connection in `httpClient`,
  |                  with an optional local `fallbackStore` for offline
  |
  */
  stores: {
    memory: { driver: 'memory' },
    localStorage: { driver: 'storage', storageInstance: 'localStorage' },
    // api: {
    //   driver: 'api',
    //   httpClient: 'api',
    //   fallbackStore: 'localStorage',
    //   retry: { attempts: 3, backoffMs: 300 },
    // },
  },

  /*
  |--------------------------------------------------------------------------
  | Debounced Persist
  |--------------------------------------------------------------------------
  |
  | Coalesces back-to-back `set()` calls before flushing to the store.
  | Ideal for slider / colour-picker UX where the user drags rapidly.
  |
  */
  debounce: true,
  debounceMs: 300,

  /*
  |--------------------------------------------------------------------------
  | API — schema + values endpoint
  |--------------------------------------------------------------------------
  |
  | Points at the backend that owns the settings schema (definitions +
  | fields) + resolved values. `autoLoadSchema` / `autoLoadValues`
  | fetch on boot; keep them off until the endpoint exists.
  |
  */
  api: {
    httpClient: 'api',
    endpoints: {
      schema: '/api/v1/settings/schema',
      listGroups: '/api/v1/settings',
      getGroup: '/api/v1/settings/{group}',
      updateGroup: '/api/v1/settings/{group}',
    },
    autoLoadSchema: false,
    autoLoadValues: false,
  },

  /*
  |--------------------------------------------------------------------------
  | Realtime Broadcasting
  |--------------------------------------------------------------------------
  |
  | Subscribes to `settings.{group}` (public) and
  | `settings.{group}.tenant.{id}` (private) channels so a change on
  | one client fans out to every open tab. Requires @stackra/realtime
  | with a driver bound.
  |
  */
  broadcasting: {
    enabled: false,
    channelPrefix: 'settings',
    connection: 'default',
  },
});

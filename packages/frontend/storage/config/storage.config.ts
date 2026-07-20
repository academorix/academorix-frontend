/**
 * @file storage.config.ts
 * @module @stackra/storage/config
 * @description Application-level KV storage configuration.
 *   Consumed by `WebStorageModule.forRoot()` (browser) or
 *   `NativeStorageModule.forRoot()` (React Native) at bootstrap.
 */

import { defineConfig } from '@stackra/storage';

export const storageConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Instance
  |--------------------------------------------------------------------------
  |
  | Which named instance `manager.instance()` returns when called with
  | no argument. Must be a key of `stores`.
  |
  */
  default: 'localStorage',

  /*
  |--------------------------------------------------------------------------
  | Stores
  |--------------------------------------------------------------------------
  |
  | Named instances the manager serves. Web drivers:
  |   - `localStorage`   — persistent, ~5 MB per origin
  |   - `sessionStorage` — cleared on tab close
  |   - `indexedDB`      — large, structured-clone, requires `database`
  |   - `cookie`         — SSR-safe reads (via `document.cookie`)
  |   - `memory`         — in-process, useful for SSR + tests
  |
  | Native drivers (via `NativeStorageModule`):
  |   - `asyncStorage`   — React Native's AsyncStorage
  |
  | Driver-specific options (`prefix`, `database`, `tableName`, ...)
  | pass through unchanged.
  |
  */
  stores: {
    localStorage: { driver: 'localStorage', prefix: 'stackra:' },
    sessionStorage: { driver: 'sessionStorage', prefix: 'stackra:' },
    indexedDB: { driver: 'indexedDB', database: 'stackra', tableName: 'kv' },
    cookie: { driver: 'cookie', path: '/', sameSite: 'Lax', prefix: 'stackra:' },
    memory: { driver: 'memory' },
  },
});

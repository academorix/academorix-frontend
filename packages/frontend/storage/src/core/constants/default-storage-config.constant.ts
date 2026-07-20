/**
 * @file default-storage-config.constant.ts
 * @module @stackra/storage/core/constants
 * @description Ship-in-the-box defaults for `StorageModule.forRoot(...)`.
 *
 *   Kept intentionally tiny: one `memory` instance so the manager
 *   always resolves in tests and SSR without extra wiring. Apps
 *   layer their real stores on top via `forRoot`'s `stores` field.
 */

import type { IStorageConfig } from '@stackra/contracts';

/**
 * Default merged config bound under `STORAGE_CONFIG` when the caller
 * passes nothing to `StorageModule.forRoot()`.
 *
 * @remarks Kept `readonly`-friendly by declaring the top-level shape,
 *   but `mergeConfig` spreads user overrides into a fresh object —
 *   so callers never mutate this constant directly.
 */
export const DEFAULT_STORAGE_CONFIG: IStorageConfig = {
  default: 'memory',
  stores: {
    memory: { driver: 'memory' },
  },
};

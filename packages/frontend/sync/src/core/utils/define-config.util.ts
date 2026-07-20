/**
 * @file define-config.util.ts
 * @module @stackra/sync/core/utils
 * @description Typed identity function for authoring sync configuration
 *   in `config/*.config.ts` files — it performs no merging, only shape
 *   checking.
 */

import type { ISyncModuleOptions } from '@stackra/contracts';

/**
 * Authoring helper for sync configuration.
 *
 * Consumers write their sync configuration as:
 *
 * ```ts
 * // config/sync.config.ts
 * import { defineConfig } from '@stackra/sync';
 * import { ConflictStrategy } from '@stackra/contracts';
 *
 * export default defineConfig({
 *   baseUrl: process.env.SYNC_API!,
 *   defaultStrategy: ConflictStrategy.LastWriteWins,
 *   autoSyncInterval: 60_000,
 * });
 * ```
 *
 * The identity form (no merge) keeps the authored file honest — a typo in
 * a field name surfaces at compile time.
 *
 * @param config - The sync configuration.
 * @returns The same configuration, typed as {@link ISyncModuleOptions}.
 */
export function defineConfig(config: ISyncModuleOptions): ISyncModuleOptions {
  return config;
}

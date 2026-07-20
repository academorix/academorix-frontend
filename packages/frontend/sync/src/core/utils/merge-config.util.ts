/**
 * @file merge-config.util.ts
 * @module @stackra/sync/core/utils
 * @description Merge caller options over {@link DEFAULT_SYNC_CONFIG} to
 *   produce the fully-resolved runtime configuration consumed by every
 *   sync service.
 */

import type { ISyncModuleOptions } from "@stackra/contracts";
import { DEFAULT_SYNC_CONFIG } from "../constants/default-sync-config.constant";

/**
 * Merge caller-supplied options over the package defaults.
 *
 * `SyncModule.forRoot(...)` and `SyncModule.forRootAsync(...)` both route
 * their configuration through this single function — no service merges
 * defaults inline.
 *
 * @param options - Caller-supplied options (may omit any field).
 * @returns Fully-resolved sync options with defaults filled in.
 */
export function mergeConfig(options: ISyncModuleOptions): ISyncModuleOptions {
  return {
    ...DEFAULT_SYNC_CONFIG,
    ...options,
    endpoints: { ...(DEFAULT_SYNC_CONFIG.endpoints ?? {}), ...(options.endpoints ?? {}) },
    strategies: { ...(DEFAULT_SYNC_CONFIG.strategies ?? {}), ...(options.strategies ?? {}) },
    headers: { ...(DEFAULT_SYNC_CONFIG.headers ?? {}), ...(options.headers ?? {}) },
    networkDetector: {
      ...(DEFAULT_SYNC_CONFIG.networkDetector ?? {}),
      ...(options.networkDetector ?? {}),
    },
  };
}

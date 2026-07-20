/**
 * @file default-sync-config.constant.ts
 * @module @stackra/sync/core/constants
 * @description Default values applied by `mergeConfig` when a caller omits
 *   a field from {@link ISyncModuleOptions}.
 */

import { ConflictStrategy, type ISyncModuleOptions } from "@stackra/contracts";

/**
 * Defaults applied by `mergeConfig` to any {@link ISyncModuleOptions}.
 *
 * `baseUrl` is a required field on `ISyncModuleOptions`, so `mergeConfig`
 * expects the caller to supply it — the empty string here is a marker that
 * unit tests catch (a real configuration must set `baseUrl`).
 */
export const DEFAULT_SYNC_CONFIG: Readonly<
  Required<
    Omit<
      ISyncModuleOptions,
      "localStorageAdapter" | "endpoints" | "strategies" | "networkDetector" | "headers"
    >
  >
> &
  Pick<ISyncModuleOptions, "endpoints" | "strategies" | "networkDetector" | "headers"> = {
  baseUrl: "",
  endpoints: {},
  strategies: {},
  headers: {},
  defaultStrategy: ConflictStrategy.LastWriteWins,
  autoSyncInterval: 0,
  autoSyncOnReconnect: true,
  batchSize: 50,
  timeout: 30_000,
  enableQueuePersistence: true,
  maxRetries: 3,
  storage: "indexedDB",
  networkDetector: {},
};

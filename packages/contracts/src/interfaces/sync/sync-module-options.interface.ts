/**
 * @file sync-module-options.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Consumer-supplied configuration for `SyncModule.forRoot(...)`.
 */

import type { ConflictStrategy } from "@/enums/conflict-strategy.enum";
import type { ILocalStorageAdapter } from "./local-storage-adapter.interface";

/**
 * Sync module configuration.
 *
 * Passed to `SyncModule.forRoot(...)` at boot time. `mergeConfig` fills in
 * defaults from `DEFAULT_SYNC_CONFIG` for any unset field.
 */
export interface ISyncModuleOptions {
  /** Base URL for the remote sync API. */
  baseUrl: string;

  /**
   * Local storage adapter for reading/writing synced data.
   *
   * Any object satisfying {@link ILocalStorageAdapter} works — an ORM
   * DataAdapter, a raw IndexedDB wrapper, or an in-memory store for tests.
   * If omitted, the adapter must be registered separately under the
   * `LOCAL_STORAGE_ADAPTER` token.
   */
  localStorageAdapter?: ILocalStorageAdapter;

  /** Collection → endpoint path mapping. */
  endpoints?: Record<string, string>;

  /** Default conflict-resolution strategy (per-collection strategies override). */
  defaultStrategy?: ConflictStrategy;

  /** Collection-specific conflict strategies. */
  strategies?: Record<string, ConflictStrategy>;

  /** Auto-sync interval in milliseconds. `0` disables the interval. */
  autoSyncInterval?: number;

  /** Whether to trigger a full sync when connectivity is restored. */
  autoSyncOnReconnect?: boolean;

  /** Batch size for pull/push operations. */
  batchSize?: number;

  /** Request timeout in milliseconds. */
  timeout?: number;

  /** Custom headers attached to every sync request. */
  headers?: Record<string, string>;

  /** Whether to persist the operation queue to storage. */
  enableQueuePersistence?: boolean;

  /** Maximum retry attempts for failed operations. */
  maxRetries?: number;

  /**
   * Named `IStorage` instance the checkpoint service resolves from
   * the app's `StorageManager`. Falls back to `'indexedDB'` when
   * omitted — apps configure the actual driver
   * (`indexedDB` / `memory` / custom) on
   * `WebStorageModule.forRoot({ stores })`.
   *
   * @default 'indexedDB'
   */
  storage?: string;

  /** Network-detector configuration slice. */
  networkDetector?: {
    /** Debounce time in milliseconds. */
    debounceTime?: number;
    /** Enable custom connectivity probes on top of the platform detector. */
    enableCustomChecks?: boolean;
    /** Interval between custom connectivity probes in milliseconds. */
    customCheckInterval?: number;
  };
}

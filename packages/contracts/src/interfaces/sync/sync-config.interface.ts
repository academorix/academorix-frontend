/**
 * @file sync-config.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Fully-resolved runtime configuration used by the sync engine.
 *   Produced by `mergeConfig(options)` from an {@link ISyncModuleOptions}.
 */

/**
 * Fully-resolved sync configuration seen by services after defaults have
 * been applied. Every field is required — {@link import('./sync-module-options.interface').ISyncModuleOptions}
 * is the consumer-facing partial shape.
 */
export interface ISyncConfig {
  /** Base URL for the remote sync API. */
  baseUrl: string;

  /** Collection → endpoint path mapping. */
  endpoints: Record<string, string>;

  /** Auto-sync interval in milliseconds (`0` disables). */
  autoSyncInterval: number;

  /** Whether to trigger a full sync when connectivity is restored. */
  autoSyncOnReconnect: boolean;

  /** Batch size for pull/push operations. */
  batchSize: number;

  /** Request timeout in milliseconds. */
  timeout: number;

  /** Custom headers attached to every sync request. */
  headers: Record<string, string>;
}

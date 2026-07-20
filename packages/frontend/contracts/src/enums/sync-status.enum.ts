/**
 * @file sync-status.enum.ts
 * @module @stackra/contracts/enums
 * @description Lifecycle status of a sync operation.
 */

/**
 * Lifecycle status of a sync operation (per-collection or global).
 */
export enum SyncStatus {
  /** No sync currently in flight. */
  Idle = "idle",
  /** A sync operation is running. */
  Syncing = "syncing",
  /** The most recent sync completed successfully. */
  Completed = "completed",
  /** The most recent sync failed. */
  Failed = "failed",
}

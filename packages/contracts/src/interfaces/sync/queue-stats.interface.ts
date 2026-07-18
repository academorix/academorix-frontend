/**
 * @file queue-stats.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Aggregate counts for the offline operation queue.
 */

/**
 * Aggregate counts for the offline operation queue — surfaced to UI
 * through the `useSyncStatus` hook and the `stats$` observable.
 */
export interface IQueueStats {
  /** Total operations currently in the queue (any status). */
  total: number;

  /** Operations still waiting to be processed. */
  pending: number;

  /** Operations currently being processed. */
  processing: number;

  /** Operations that finished successfully. */
  completed: number;

  /** Operations that failed permanently. */
  failed: number;
}

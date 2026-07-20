/**
 * @file sync-result.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description The final result returned by a sync operation.
 */

import type { SyncDirection } from "@/enums/sync-direction.enum";
import type { SyncStatus } from "@/enums/sync-status.enum";

/**
 * Result of a single sync run.
 */
export interface ISyncResult {
  /** Direction of the sync operation. */
  direction: SyncDirection;

  /** Collections included in the run. */
  collections: string[];

  /** Total documents pulled from remote. */
  pulled: number;

  /** Total documents pushed to remote. */
  pushed: number;

  /** Total conflicts resolved during the run. */
  conflicts: number;

  /** Elapsed time in milliseconds. */
  duration: number;

  /** Timestamp the run completed (or failed). */
  timestamp: Date;

  /** Final status. */
  status: SyncStatus;

  /** Error message when `status === SyncStatus.Failed`. */
  error?: string;
}

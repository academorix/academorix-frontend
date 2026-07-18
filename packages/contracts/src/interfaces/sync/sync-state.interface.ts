/**
 * @file sync-state.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Per-collection sync state tracked by the sync engine.
 */

import type { SyncStatus } from "@/enums/sync-status.enum";

/**
 * Per-collection sync state.
 */
export interface ISyncState {
  /** Collection / table name. */
  collection: string;

  /** Timestamp of the last successful sync (any direction), or `null`. */
  lastSyncAt: Date | null;

  /** Timestamp of the last successful pull, or `null`. */
  lastPullAt: Date | null;

  /** Timestamp of the last successful push, or `null`. */
  lastPushAt: Date | null;

  /** Current lifecycle status. */
  status: SyncStatus;

  /** Whether a sync is currently in flight for this collection. */
  isSyncing: boolean;

  /** Last error message, when the most recent sync failed. */
  lastError?: string;

  /** Number of pending operations for this collection. */
  pendingOperations: number;

  /** Cursor to resume the next pull from (server-issued opaque token). */
  pullCursor?: string | null;
}

/**
 * @file sync-checkpoint.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Per-collection sync checkpoint persisted after every
 *   successful pull or push. Survives page refreshes and restores the
 *   sync engine's cursor state on next boot.
 */

/**
 * Per-collection sync checkpoint.
 *
 * Written by the sync engine after every successful pull or push. The
 * checkpoint records the cursor to resume from, the timestamps of the
 * last successful operations, and a version marker so future schema
 * migrations of the checkpoint shape can be handled cleanly.
 */
export interface ISyncCheckpoint {
  /** Collection / table this checkpoint belongs to. */
  collection: string;

  /** Cursor to resume the next pull from (server-issued opaque token). */
  pullCursor: string | null;

  /** Timestamp of the most recent successful pull, or `null`. */
  lastPullAt: Date | null;

  /** Timestamp of the most recent successful push, or `null`. */
  lastPushAt: Date | null;

  /** Timestamp of the most recent successful sync (any direction), or `null`. */
  lastSyncAt: Date | null;

  /** Number of records affected by the most recent successful sync. */
  lastSyncCount: number;

  /** Timestamp the checkpoint was written. */
  createdAt: Date;

  /** Checkpoint schema version — allows future migrations. */
  version: number;
}

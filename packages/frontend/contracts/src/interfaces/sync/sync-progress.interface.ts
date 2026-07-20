/**
 * @file sync-progress.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description A single progress tick emitted during a sync operation.
 */

import type { SyncDirection } from "@/enums/sync-direction.enum";

/**
 * A single progress tick emitted during a sync operation.
 */
export interface ISyncProgress {
  /** Direction of the sync producing this progress event. */
  direction: SyncDirection;

  /** Collection currently being synced. */
  collection: string;

  /** Overall progress percentage (0-100). */
  progress: number;

  /** Human-readable label for the current step. */
  operation: string;

  /** Timestamp the tick was emitted. */
  timestamp: Date;
}

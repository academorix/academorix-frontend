/**
 * @file global-sync-state.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Aggregate sync state across every registered collection.
 */

import type { ISyncState } from "./sync-state.interface";

/**
 * Global sync state — the aggregate view surfaced to UI through the
 * `state$` observable.
 */
export interface IGlobalSyncState {
  /** Whether the device currently has connectivity. */
  isOnline: boolean;

  /** Whether any collection is currently syncing. */
  isSyncing: boolean;

  /** Per-collection state indexed by collection name. */
  collections: Record<string, ISyncState>;

  /** Sum of pending operations across every collection. */
  totalPendingOperations: number;

  /** Most recent successful sync timestamp across every collection. */
  lastSyncAt: Date | null;
}

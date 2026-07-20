/**
 * @file dashboard-version-snapshot.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Snapshot of a dashboard at a specific version. Written
 *   before every mutating call plus one more on explicit restore.
 */

import type { IDashboard } from "./dashboard.interface";

/**
 * Immutable snapshot of a {@link IDashboard} at a specific version.
 *
 * The full document is stored denormalised (not a diff) so restore is
 * a single write with no rebuild-from-log pass and no dependency on
 * preceding snapshots.
 */
export interface IDashboardVersionSnapshot {
  /** Version-record UUID. */
  id: string;

  /** FK back to the owning dashboard. */
  dashboardId: string;

  /** Matches {@link IDashboard.version} at snapshot time. */
  version: number;

  /** Full dashboard document — denormalised for O(1) restore. */
  snapshot: IDashboard;

  /** ISO-8601 timestamp of the mutation that prompted the snapshot. */
  changedAt: string;

  /** Optional actor id — the playground uses `"playground-user"`. */
  changedBy?: string;

  /** Short "what changed" string; used verbatim in the history list. */
  summary?: string;
}

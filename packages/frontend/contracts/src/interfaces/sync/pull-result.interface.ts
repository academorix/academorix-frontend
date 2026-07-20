/**
 * @file pull-result.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Result of a pull operation for a single collection.
 */

/**
 * Result of a single-collection pull.
 */
export interface IPullResult {
  /** Total documents pulled from remote. */
  pulled: number;

  /** Total conflicts detected and resolved during the pull. */
  conflicts: number;

  /** Cursor to resume the next pull from, or `null` when caught up. */
  nextCursor: string | null;
}

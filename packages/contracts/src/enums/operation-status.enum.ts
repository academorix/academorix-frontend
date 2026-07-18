/**
 * @file operation-status.enum.ts
 * @module @stackra/contracts/enums
 * @description Lifecycle status of a queued sync operation.
 */

/**
 * Lifecycle status of a single queued operation.
 */
export enum OperationStatus {
  /** Waiting to be processed. */
  Pending = "pending",
  /** Currently being processed. */
  Processing = "processing",
  /** Successfully processed. */
  Completed = "completed",
  /** Failed and exceeded the retry budget. */
  Failed = "failed",
}

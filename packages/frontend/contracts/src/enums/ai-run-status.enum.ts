/**
 * @file ai-run-status.enum.ts
 * @module @stackra/contracts/enums
 * @description Lifecycle status of an AI chat run.
 */

/** Status of an AI run. */
export enum AiRunStatus {
  /** Queued, not yet streaming. */
  Pending = "pending",
  /** Actively streaming events. */
  Streaming = "streaming",
  /** Finished successfully. */
  Completed = "completed",
  /** Cancelled by the user. */
  Cancelled = "cancelled",
  /** Terminated by an error. */
  Failed = "failed",
}

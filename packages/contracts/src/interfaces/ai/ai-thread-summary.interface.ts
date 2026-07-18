/**
 * @file ai-thread-summary.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Lightweight summary of a conversation thread for listing.
 */

/** A summary of a conversation thread. */
export interface IAiThreadSummary {
  /** Thread identifier. */
  threadId: string;
  /** Display title. */
  title: string;
  /** Short preview of the latest exchange. */
  preview: string;
  /** Last-updated timestamp (epoch millis). */
  updatedAt: number;
}

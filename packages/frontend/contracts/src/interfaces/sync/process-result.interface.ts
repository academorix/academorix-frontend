/**
 * @file process-result.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description The summary returned by `OperationQueue.processQueue(...)`.
 */

/**
 * Summary of a single processing pass over the operation queue.
 */
export interface IProcessResult {
  /** Number of operations processed successfully. */
  success: number;

  /** Number of operations that failed permanently in this pass. */
  failed: number;

  /** Total processing duration in milliseconds. */
  duration: number;

  /** Failed operations with their error messages. */
  failedOperations: Array<{ id: string; error: string }>;
}

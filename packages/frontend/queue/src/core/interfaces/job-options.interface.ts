/**
 * @file job-options.interface.ts
 * @module @stackra/queue/core/interfaces
 * @description Options for dispatching a job.
 */

/**
 * Options passed when dispatching a job to a queue.
 */
export interface IJobOptions {
  /** Target queue name (defaults to 'default'). */
  queue?: string;
  /** Delay in ms before the job becomes eligible for processing. */
  delayMs?: number;
  /** Maximum retry attempts. */
  tries?: number;
  /** Backoff delay in ms between retries. */
  backoffMs?: number;
  /** Unique ID for deduplication (only one job with this ID at a time). */
  uniqueId?: string;
  /** Driver-specific options (passed through to the backend). */
  driverOptions?: Record<string, unknown>;
}

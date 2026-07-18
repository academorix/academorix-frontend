/**
 * @file queued-job.interface.ts
 * @module @stackra/queue/core/interfaces
 * @description Shape of a job retrieved from the queue for processing.
 */

/**
 * A job retrieved from the queue, ready for processing.
 */
export interface IQueuedJob<T = unknown> {
  /** Unique job identifier assigned by the backend. */
  readonly id: string;
  /** Job name (used to route to the correct processor). */
  readonly name: string;
  /** Job payload data. */
  readonly data: T;
  /** Number of attempts made so far. */
  readonly attempts: number;
  /** Maximum allowed attempts. */
  readonly maxAttempts: number;
  /** Queue this job belongs to. */
  readonly queue: string;
  /** Timestamp when the job was created (ms). */
  readonly createdAt: number;
}

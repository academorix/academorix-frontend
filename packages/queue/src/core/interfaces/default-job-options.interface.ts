/**
 * @file default-job-options.interface.ts
 * @module @stackra/queue/core/interfaces
 * @description Default options applied to every dispatched job.
 */

/**
 * Default job options applied globally to every dispatched job.
 *
 * Individual dispatch calls can override these defaults.
 */
export interface IDefaultJobOptions {
  /** Maximum retry attempts before dead-lettering. */
  tries?: number;

  /** Base backoff delay in ms between retries. */
  backoffMs?: number;

  /** Maximum backoff delay cap in ms. */
  maxBackoffMs?: number;

  /** Maximum execution time per job in ms. */
  timeoutMs?: number;

  /** Delay in ms before the job becomes eligible for processing. */
  delayMs?: number;

  /** Whether to remove the job on completion. */
  removeOnComplete?: boolean;

  /** Whether to remove the job on failure. */
  removeOnFail?: boolean;
}

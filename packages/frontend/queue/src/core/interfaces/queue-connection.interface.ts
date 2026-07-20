/**
 * @file queue-connection.interface.ts
 * @module @stackra/queue/core/interfaces
 * @description Contract for queue connections — the runtime handle
 *   that dispatches and consumes jobs from a specific backend.
 */

import type { IJobOptions } from "./job-options.interface";
import type { IQueuedJob } from "./queued-job.interface";

/**
 * A queue connection — the runtime handle for dispatching and consuming jobs.
 *
 * Each connection corresponds to a configured backend (memory, indexeddb,
 * BullMQ, QStash, etc.). Multiple named connections can coexist.
 */
export interface IQueueConnection {
  /** Push a job onto the queue. Returns the assigned job ID. */
  push<T = unknown>(name: string, data: T, options?: IJobOptions): Promise<string>;

  /** Push a job with a delay (ms). Returns the job ID. */
  later<T = unknown>(
    delayMs: number,
    name: string,
    data: T,
    options?: IJobOptions,
  ): Promise<string>;

  /** Push multiple jobs at once. Returns their IDs. */
  bulk<T = unknown>(
    jobs: Array<{ name: string; data: T; options?: IJobOptions }>,
  ): Promise<string[]>;

  /** Pop the next available job (for worker consumption). Returns null if empty. */
  pop(queue?: string): Promise<IQueuedJob | null>;

  /** Total jobs across all states (waiting + active + delayed). */
  size(queue?: string): Promise<number>;

  /** Remove a specific job by ID. */
  remove(jobId: string): Promise<void>;

  /** Pause a queue (stop processing). */
  pause(queue?: string): Promise<void>;

  /** Resume a paused queue. */
  resume(queue?: string): Promise<void>;

  /** Clear all jobs from a queue. */
  clear(queue?: string): Promise<void>;

  /** Close the connection and release resources. */
  close(): Promise<void>;
}

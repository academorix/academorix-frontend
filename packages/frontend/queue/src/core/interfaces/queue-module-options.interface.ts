/**
 * @file queue-module-options.interface.ts
 * @module @stackra/queue/core/interfaces
 * @description Full module-level configuration for the queue system.
 *   Defines connections, worker behavior, job defaults, and lifecycle options.
 */

import type { IDefaultJobOptions } from "./default-job-options.interface";

// ════════════════════════════════════════════════════════════════════════════════
// Connection Config
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Per-connection configuration.
 *
 * The `driver` field determines which connector creates the connection.
 * Additional fields are driver-specific (prefix, dbName, token, etc.).
 */
export interface IQueueConnectionConfig {
  /**
   * Driver name that resolves to a registered connector.
   *
   * Built-in: 'memory', 'sync', 'null', 'local-storage', 'indexeddb',
   *           'broadcast-channel', 'qstash'
   * External: 'bullmq' (via optional adapter)
   */
  driver: string;

  /**
   * Key prefix for all jobs on this connection.
   * Useful for isolating queues in shared backends (Redis).
   *
   * @default ''
   */
  prefix?: string;

  /** Allow additional driver-specific options. */
  [key: string]: unknown;
}

// ════════════════════════════════════════════════════════════════════════════════
// Worker Options
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Worker configuration defaults.
 *
 * Applied to all workers unless overridden per-job or per-queue.
 */
export interface IWorkerOptions {
  /**
   * Maximum retry attempts per job before dead-lettering.
   *
   * @default 1
   */
  tries?: number;

  /**
   * Base backoff delay (ms) between retry attempts.
   * Multiplied exponentially on each subsequent retry.
   *
   * @default 1000
   */
  backoffMs?: number;

  /**
   * Maximum backoff delay cap (ms).
   * Retries never wait longer than this regardless of exponential growth.
   *
   * @default 30000
   */
  maxBackoffMs?: number;

  /**
   * Maximum execution time per job (ms) before forced timeout.
   * Jobs exceeding this are marked as failed with TimeoutExceededError.
   *
   * @default 30000
   */
  timeoutMs?: number;

  /**
   * How often (ms) the worker polls the connection for new jobs.
   * Lower = more responsive but more CPU/network usage.
   *
   * @default 500
   */
  pollIntervalMs?: number;

  /**
   * Whether to auto-start the worker when the module initializes.
   * When false, you must call `worker.start()` manually.
   *
   * @default true
   */
  autoStart?: boolean;

  /**
   * Whether to throw TimeoutExceededError when a job times out.
   * When false, timed-out jobs are silently marked as failed.
   *
   * @default true
   */
  failOnTimeout?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════════
// Default Job Options
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Module Options
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Top-level configuration for `QueueModule.forRoot()`.
 */
export interface IQueueModuleOptions {
  /**
   * Whether to emit queue lifecycle events through @stackra/events.
   *
   * @default true
   */
  emitEvents?: boolean;

  /**
   * Global key prefix applied to all queue names across all connections.
   *
   * @default ''
   */
  prefix?: string;

  /**
   * Default connection name.
   */
  default: string;

  /**
   * Named connection configurations.
   */
  connections: Record<string, IQueueConnectionConfig>;

  /**
   * Worker configuration defaults.
   */
  worker?: IWorkerOptions;

  /**
   * Default job options applied to every dispatched job.
   */
  defaultJobOptions?: IDefaultJobOptions;
}

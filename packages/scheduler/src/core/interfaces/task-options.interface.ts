/**
 * @file task-options.interface.ts
 * @module @stackra/scheduler/core/interfaces
 * @description Configuration options for registering a scheduled task.
 *   Supports both interval-based and cron-expression-based scheduling.
 */

/**
 * Options for scheduling a task.
 *
 * Either `interval` OR `cron` must be provided (not both).
 * - `interval` — fixed delay between executions (ms)
 * - `cron` — standard cron expression for time-based scheduling
 */
export interface ITaskOptions {
  /**
   * Execution interval in milliseconds.
   *
   * Mutually exclusive with `cron`. The task re-executes every N ms
   * after the previous execution completes.
   */
  readonly interval?: number;

  /**
   * Cron expression for time-based scheduling.
   *
   * Supports standard 5-field cron (minute hour dayOfMonth month dayOfWeek)
   * and extended 6-field with seconds (second minute hour dayOfMonth month dayOfWeek).
   *
   * Examples: '0 3 1 1 1' (every Mon at 3am), every-5-min, daily-at-3am.
   */
  readonly cron?: string;

  /**
   * Whether to execute the task immediately upon registration.
   *
   * @default false
   */
  readonly immediate?: boolean;

  /**
   * Number of retry attempts on failure before giving up.
   *
   * @default 0
   */
  readonly retries?: number;

  /**
   * Whether to ensure only one instance runs this task across
   * all processes/tabs (single-server mode).
   *
   * When `true`, acquires a distributed lock before execution.
   * Uses `@stackra/coordinator` LockManager in browser or
   * `@stackra/redis` distributed lock on server.
   *
   * @default false
   */
  readonly singleServer?: boolean;

  /**
   * Lifecycle hooks called around each task execution.
   */
  readonly hooks?: ITaskLifecycleHooks;
}

/**
 * Lifecycle hooks for a scheduled task.
 *
 * Called before/after each execution for logging, metrics, and cleanup.
 */
export interface ITaskLifecycleHooks {
  /** Called before the task executes. */
  onBefore?: (taskName: string) => void | Promise<void>;
  /** Called after the task executes (regardless of success/failure). */
  onAfter?: (taskName: string, durationMs: number) => void | Promise<void>;
  /** Called after a successful execution. */
  onSuccess?: (taskName: string, durationMs: number) => void | Promise<void>;
  /** Called after a failed execution. */
  onFailure?: (taskName: string, error: Error) => void | Promise<void>;
}

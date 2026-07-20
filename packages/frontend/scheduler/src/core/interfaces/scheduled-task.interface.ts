/**
 * @file scheduled-task.interface.ts
 * @module @stackra/scheduler/core/interfaces
 * @description Describes the current state of a registered scheduled task.
 */

/**
 * State descriptor for a registered task.
 */
export interface IScheduledTask {
  /** Unique identifier for the task. */
  readonly name: string;
  /** Execution interval in milliseconds (0 for cron-based tasks). */
  readonly interval: number;
  /** Cron expression if cron-based. */
  readonly cron?: string;
  /** Timestamp of the last execution, if any. */
  readonly lastRun?: number;
  /** Whether the task is currently executing. */
  readonly isRunning: boolean;
  /** Whether the task is paused. */
  readonly isPaused: boolean;
}

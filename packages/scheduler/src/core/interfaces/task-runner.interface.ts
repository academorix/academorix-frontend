/**
 * @file task-runner.interface.ts
 * @module @stackra/scheduler/core/interfaces
 * @description Platform-agnostic contract for task execution engines.
 *   Implementations handle the actual scheduling mechanism (setInterval,
 *   expo-task-manager, node-cron, etc.) while the SchedulerService provides
 *   the high-level orchestration.
 */

import type { IScheduledTask } from './scheduled-task.interface';
import type { ITaskOptions } from './task-options.interface';

/**
 * Contract that all task runners must implement.
 *
 * Runners are swappable per platform:
 * - `DefaultTaskRunner` — setInterval (web/foreground native)
 * - `ExpoTaskRunner` — expo-task-manager (background native)
 * - `CronTaskRunner` — node-cron (server)
 */
export interface ITaskRunner {
  /**
   * Register a new scheduled task.
   *
   * @param name - Unique task identifier
   * @param fn - Async function to execute on each interval
   * @param options - Scheduling options (interval, retries, etc.)
   */
  register(name: string, fn: () => Promise<void>, options: ITaskOptions): void;

  /**
   * Unregister and stop a scheduled task.
   *
   * @param name - The task identifier to remove
   */
  unregister(name: string): void;

  /**
   * Execute a registered task immediately, outside its normal schedule.
   *
   * @param name - The task identifier to run
   * @returns A promise that resolves when the task completes
   */
  runNow(name: string): Promise<void>;

  /**
   * Get all currently registered tasks and their status.
   *
   * @returns Array of scheduled task descriptors
   */
  getRegistered(): IScheduledTask[];

  /**
   * Pause a running task without unregistering it.
   *
   * @param name - The task identifier to pause
   */
  pause(name: string): void;

  /**
   * Resume a previously paused task.
   *
   * @param name - The task identifier to resume
   */
  resume(name: string): void;
}

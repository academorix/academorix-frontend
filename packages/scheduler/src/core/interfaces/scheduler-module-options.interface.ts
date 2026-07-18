/**
 * @file scheduler-module-options.interface.ts
 * @module @stackra/scheduler/src/interfaces
 * @description ISchedulerModuleOptions interface.
 */

import type { ITaskRunner } from './task-runner.interface';

/**
 * Configuration for `SchedulerModule.forRoot()`.
 */
export interface ISchedulerModuleOptions {
  /**
   * Custom task runner implementation.
   *
   * Override to replace the default setInterval-based runner with
   * a platform-specific implementation (e.g., ExpoTaskRunner for native).
   * When undefined, uses DefaultTaskRunner.
   */
  readonly runner?: ITaskRunner;
}

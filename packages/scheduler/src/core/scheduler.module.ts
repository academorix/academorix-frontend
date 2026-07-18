/**
 * @file scheduler.module.ts
 * @module @stackra/scheduler/core
 * @description DI module for task scheduling. Registers SchedulerService,
 *   the platform-specific ITaskRunner, and the auto-discovery ScheduledTaskLoader.
 *
 *   Tasks are registered via:
 *   1. `@Scheduled()` class decorator (auto-discovered at bootstrap)
 *   2. `SchedulerService.register()` (programmatic)
 *
 *   The task runner is swappable via `forRoot({ runner })` — default is
 *   `DefaultTaskRunner` (setInterval/cron). For native background tasks,
 *   pass `ExpoTaskRunner` from `@stackra/scheduler/native`.
 */

import { Module, type DynamicModule } from '@stackra/container';
import { SCHEDULER_CONFIG, SCHEDULER_SERVICE, TASK_RUNNER } from '@stackra/contracts';
import { SchedulerService } from './services/scheduler.service';
import { DefaultTaskRunner } from './services/default-task-runner.service';
import { ScheduledTaskLoader } from './services/scheduled-task-loader.service';
import type { ISchedulerModuleOptions } from './interfaces/scheduler-module-options.interface';
import { mergeConfig } from './utils/merge-config.util';

// Module Options

// Module

/**
 * Scheduler DI module.
 *
 * - `forRoot()` — registers the runner, service, and auto-discovery loader
 *
 * Tasks are NOT passed via config. They are:
 * - Auto-discovered via `@Scheduled()` decorator on classes
 * - Registered programmatically via `SchedulerService.register()`
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [SchedulerModule.forRoot()],
 *   providers: [SyncOrdersTask, HeartbeatTask], // @Scheduled classes
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class SchedulerModule {
  /**
   * Register the scheduler module globally.
   *
   * @param options - Module configuration (runner)
   * @returns Dynamic module definition
   */
  public static forRoot(options: ISchedulerModuleOptions = {}): DynamicModule {
    const config = mergeConfig(options);

    const runnerProvider = config.runner
      ? { provide: TASK_RUNNER, useValue: config.runner }
      : { provide: TASK_RUNNER, useClass: DefaultTaskRunner };

    return {
      module: SchedulerModule,
      global: true,
      providers: [
        { provide: SCHEDULER_CONFIG, useValue: config },
        runnerProvider as any,
        SchedulerService,
        { provide: SCHEDULER_SERVICE, useExisting: SchedulerService },
        ScheduledTaskLoader,
      ],
      exports: [SCHEDULER_CONFIG, TASK_RUNNER, SCHEDULER_SERVICE, SchedulerService],
    };
  }
}

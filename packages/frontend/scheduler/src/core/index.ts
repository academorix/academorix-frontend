/**
 * @file index.ts
 * @module @stackra/scheduler
 * @description Public API for the scheduler package (core entry point).
 *   Platform-agnostic task scheduling with interval and cron support.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { SchedulerModule } from "./scheduler.module";
export type { ISchedulerModuleOptions } from "./interfaces/scheduler-module-options.interface";

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { SchedulerService, SCHEDULER_EVENTS } from "./services";
export { DefaultTaskRunner } from "./services";
export { ScheduledTaskLoader } from "./services";

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { Scheduled } from "./decorators";

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig } from "./utils";
export { parseCron, getNextCronTime, getNextCronDelay } from "./utils";

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export { DEFAULT_SCHEDULER_CONFIG } from "./constants";

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type { ITaskRunner, IScheduledTask, ITaskOptions, ITaskLifecycleHooks } from "./interfaces";

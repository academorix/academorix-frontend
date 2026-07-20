/**
 * @file scheduler.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens and metadata keys for the scheduler subsystem.
 *
 *   Tokens live in contracts so cross-package consumers (discovery
 *   loaders, dashboards) can reference them without pulling in the
 *   runtime.
 */

/** Token for the SchedulerService singleton. */
export const SCHEDULER_SERVICE = Symbol.for("SCHEDULER_SERVICE");

/** Token for the scheduler module configuration. */
export const SCHEDULER_CONFIG = Symbol.for("SCHEDULER_CONFIG");

/** Token for the platform-specific ITaskRunner implementation. */
export const TASK_RUNNER = Symbol.for("TASK_RUNNER");

/** Metadata key for the `@Scheduled()` decorator. */
export const SCHEDULED_METADATA_KEY = "stackra:scheduler:scheduled";

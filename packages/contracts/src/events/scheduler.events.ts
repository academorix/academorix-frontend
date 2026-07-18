/**
 * @file scheduler.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/scheduler` on the
 *   `EVENT_EMITTER` bus.
 *
 *   Constants live in contracts so cross-package consumers (metrics,
 *   dashboards, error trackers) can subscribe without depending on
 *   the scheduler package directly.
 */

/**
 * Scheduler lifecycle event names.
 *
 * Payload shapes:
 * - `TASK_REGISTERED`   — `{ name, options }`
 * - `TASK_UNREGISTERED` — `{ name }`
 * - `TASK_STARTED`      — `{ name }`
 * - `TASK_COMPLETED`    — `{ name, timestamp }`
 * - `TASK_FAILED`       — `{ name, error }`
 * - `TASK_PAUSED`       — `{ name }`
 * - `TASK_RESUMED`      — `{ name }`
 */
export const SCHEDULER_EVENTS = {
  /** A task was registered with the scheduler. */
  TASK_REGISTERED: "scheduler.task-registered",
  /** A task was removed from the scheduler. */
  TASK_UNREGISTERED: "scheduler.task-unregistered",
  /** A task started executing. */
  TASK_STARTED: "scheduler.task-started",
  /** A task finished successfully. */
  TASK_COMPLETED: "scheduler.task-completed",
  /** A task threw an error. */
  TASK_FAILED: "scheduler.task-failed",
  /** A task was paused without unregistering. */
  TASK_PAUSED: "scheduler.task-paused",
  /** A previously paused task was resumed. */
  TASK_RESUMED: "scheduler.task-resumed",
} as const;

/**
 * Union type of every emitted scheduler event name.
 */
export type SchedulerEventName = (typeof SCHEDULER_EVENTS)[keyof typeof SCHEDULER_EVENTS];

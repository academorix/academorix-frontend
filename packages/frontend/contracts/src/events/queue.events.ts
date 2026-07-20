/**
 * @file queue.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/queue` on the
 *   `EVENT_EMITTER` bus (and on each queue-scoped `QueueEventBus`).
 *
 *   Constants live in contracts so cross-package consumers (dashboards,
 *   metrics, alerters) can subscribe without depending on the queue
 *   package directly.
 */

/**
 * Queue lifecycle event names.
 *
 * Payload shapes are documented on each event constant in the queue
 * package. Common shapes: `{ job, queue }`, `{ job, error }`.
 */
export const QUEUE_EVENTS = {
  /** A job was pushed onto a queue. */
  JOB_QUEUED: "queue.job-queued",
  /** A job was dispatched (fluent alias for JOB_QUEUED — driver-facing). */
  JOB_DISPATCHED: "queue.job-dispatched",
  /** A worker picked up a job to process. */
  JOB_STARTED: "queue.job-started",
  /** A job finished successfully. */
  JOB_COMPLETED: "queue.job-completed",
  /** A job attempt failed but retries remain. */
  JOB_RETRY: "queue.job-retry",
  /** A job exhausted all retries and moved to the failed set. */
  JOB_FAILED: "queue.job-failed",
  /** A job exceeded max attempts and was dead-lettered. */
  JOB_DEAD: "queue.job-dead",
  /** A scheduled job's delay elapsed and it is now runnable. */
  JOB_READY: "queue.job-ready",
  /** A job was removed from the queue before processing. */
  JOB_REMOVED: "queue.job-removed",
  /** A worker started listening on a queue. */
  WORKER_STARTED: "queue.worker-started",
  /** A worker stopped. */
  WORKER_STOPPED: "queue.worker-stopped",
} as const;

/**
 * Union type of every emitted queue event name.
 */
export type QueueEventName = (typeof QUEUE_EVENTS)[keyof typeof QUEUE_EVENTS];

/**
 * @file on-job-event-options.interface.ts
 * @module @stackra/contracts/interfaces/queue
 *
 * @description
 * Metadata payload stamped by the `@OnJobEvent(event, queue?)` method
 * decorator on the class prototype.
 */

import type { JobEventType } from "./job-event-type.type";

/**
 * Options for a single `@OnJobEvent(...)` decoration. Stamped
 * per-method on the prototype under `ON_JOB_EVENT_METADATA_KEY`.
 */
export interface IOnJobEventOptions {
  /** Job lifecycle event to subscribe to. */
  readonly event: JobEventType;
  /**
   * Queue name to scope the subscription to. When omitted the
   * listener fires for every queue in the manager.
   */
  readonly queue?: string;
}

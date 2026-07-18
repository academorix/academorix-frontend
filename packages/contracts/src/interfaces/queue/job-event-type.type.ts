/**
 * @file job-event-type.type.ts
 * @module @stackra/contracts/interfaces/queue
 *
 * @description
 * Union of job lifecycle event types emitted by the queue runtime.
 * Consumed by `@OnJobEvent(...)` decorators to subscribe to worker
 * events.
 */

/**
 * Supported job lifecycle event types.
 *
 * @example
 * ```typescript
 * import { OnJobEvent } from '@stackra/decorators/queue';
 *
 * @Injectable()
 * export class EmailListener {
 *   @OnJobEvent('completed', 'email')
 *   public onJobCompleted(job: Job): void { … }
 * }
 * ```
 */
export type JobEventType =
  | "completed"
  | "failed"
  | "active"
  | "progress"
  | "stalled"
  | "waiting"
  | "delayed"
  | "removed"
  | "drained";

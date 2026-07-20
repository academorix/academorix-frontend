/**
 * @file queue.error.ts
 * @module @stackra/queue/core/errors
 * @description Base error class for the queue package.
 */

/** Base queue error. */
export class QueueError extends Error {
  public readonly code: string;

  public constructor(message: string, code: string = "QUEUE_ERROR") {
    super(message);
    this.name = "QueueError";
    this.code = code;
    Object.setPrototypeOf(this, QueueError.prototype);
  }
}

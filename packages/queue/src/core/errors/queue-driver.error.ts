/**
 * @file queue-driver.error.ts
 * @module @stackra/queue/core/errors
 * @description Error thrown when an unknown queue driver is requested.
 */

import { QueueError } from "./queue.error";

/** Thrown when a queue driver is not registered. */
export class QueueDriverError extends QueueError {
  public constructor(message: string) {
    super(message, "QUEUE_DRIVER_NOT_FOUND");
    this.name = "QueueDriverError";
    Object.setPrototypeOf(this, QueueDriverError.prototype);
  }
}

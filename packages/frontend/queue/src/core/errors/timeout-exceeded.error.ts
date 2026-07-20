/**
 * @file timeout-exceeded.error.ts
 * @module @stackra/queue/core/errors
 * @description Thrown when a job exceeds its execution timeout.
 */

import { QueueError } from "./queue.error";

/** Thrown when a job exceeds its configured timeout. */
export class TimeoutExceededError extends QueueError {
  public constructor(jobId: string, timeoutMs: number) {
    super(`Job "${jobId}" exceeded timeout of ${timeoutMs}ms.`, "TIMEOUT_EXCEEDED");
    this.name = "TimeoutExceededError";
    Object.setPrototypeOf(this, TimeoutExceededError.prototype);
  }
}

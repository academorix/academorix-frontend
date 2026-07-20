/**
 * @file max-attempts-exceeded.error.ts
 * @module @stackra/queue/core/errors
 * @description Thrown when a job exceeds its maximum retry attempts.
 */

import { QueueError } from "./queue.error";

/** Thrown when a job fails after all retry attempts. */
export class MaxAttemptsExceededError extends QueueError {
  public constructor(jobId: string, maxAttempts: number) {
    super(`Job "${jobId}" failed after ${maxAttempts} attempts.`, "MAX_ATTEMPTS_EXCEEDED");
    this.name = "MaxAttemptsExceededError";
    Object.setPrototypeOf(this, MaxAttemptsExceededError.prototype);
  }
}

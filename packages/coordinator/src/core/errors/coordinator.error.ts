/**
 * @file coordinator.error.ts
 * @module @stackra/coordinator/core/errors
 * @description Error class for coordinator operations (lock timeouts, election failures).
 */

/**
 * Error thrown by the coordinator system.
 *
 * Codes: `LOCK_TIMEOUT`, `ELECTION_FAILED`, `CHANNEL_UNAVAILABLE`
 */
export class CoordinatorError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  public constructor(
    message: string,
    code: string = 'COORDINATOR_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CoordinatorError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, CoordinatorError.prototype);
  }
}

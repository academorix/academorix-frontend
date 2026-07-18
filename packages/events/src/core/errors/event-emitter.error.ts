/**
 * @file event-emitter.error.ts
 * @module @stackra/events/core/errors
 * @description Base error for event emitter configuration and runtime issues.
 */

/**
 * Error thrown for event emitter configuration or runtime failures.
 *
 * @example
 * ```typescript
 * throw new EventEmitterError('maxListeners must be non-negative');
 * ```
 */
export class EventEmitterError extends Error {
  /** Programmatic error code. */
  public readonly code = "EVENT_EMITTER_ERROR" as const;

  public constructor(message: string) {
    super(message);
    this.name = "EventEmitterError";
    Object.setPrototypeOf(this, EventEmitterError.prototype);
  }
}

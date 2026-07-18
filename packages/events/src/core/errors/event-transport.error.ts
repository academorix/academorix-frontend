/**
 * @file event-transport.error.ts
 * @module @stackra/events/core/errors
 * @description Error thrown when an event transport fails to connect or operate.
 */

/**
 * Error for transport connection/operation failures.
 *
 * @example
 * ```typescript
 * throw new EventTransportError('Transport "websocket" failed to connect');
 * ```
 */
export class EventTransportError extends Error {
  /** Programmatic error code. */
  public readonly code = "EVENT_TRANSPORT_ERROR" as const;

  public constructor(message: string) {
    super(message);
    this.name = "EventTransportError";
    Object.setPrototypeOf(this, EventTransportError.prototype);
  }
}

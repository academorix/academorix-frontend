/**
 * @file event-listener.error.ts
 * @module @stackra/events/core/errors
 * @description Error thrown when an event listener fails during dispatch.
 */

/**
 * Error wrapping a listener failure with event context.
 *
 * @example
 * ```typescript
 * throw new EventListenerError('Listener "onOrder" threw', 'order.created');
 * ```
 */
export class EventListenerError extends Error {
  /** Programmatic error code. */
  public readonly code = "EVENT_LISTENER_ERROR" as const;

  /**
   * @param message - Description of the failure
   * @param event - The event name that was being dispatched
   * @param originalError - The error thrown by the listener (optional)
   */
  public constructor(
    message: string,
    public readonly event: string | symbol,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "EventListenerError";
    Object.setPrototypeOf(this, EventListenerError.prototype);
  }
}

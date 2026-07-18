/**
 * @file event-emitter.interface.ts
 * @module @stackra/contracts/interfaces/events
 * @description Cross-package event emitter contract.
 */

/**
 * Platform-agnostic event emitter contract.
 *
 * Inject via `@Inject(EVENT_EMITTER)`.
 */
export interface IEventEmitter {
  /**
   * Emit an event with optional payload.
   *
   * @param event - The event name (dot-separated)
   * @param payload - Optional event data
   * @returns Promise that resolves when all listeners complete
   */
  emit(event: string, payload?: unknown): Promise<void>;

  /**
   * Subscribe to an event.
   *
   * @param event - The event name (supports wildcards)
   * @param listener - Callback invoked when the event fires
   * @returns Unsubscribe function
   */
  on(event: string, listener: (payload: unknown) => void | Promise<void>): () => void;

  /**
   * Return every event name currently bound to a listener.
   *
   * @returns Array of event names. May include symbol entries when the
   *   implementation supports symbol-keyed events.
   */
  eventNames(): Array<string | symbol>;

  /**
   * Count the listeners bound to a specific event name.
   *
   * @param event - Event name to inspect.
   * @returns The number of listeners currently registered.
   */
  listenerCount(event: string | symbol): number;

  /**
   * Detach every listener — globally when `event` is omitted, or
   * scoped to a single event name when supplied.
   *
   * Used by CLI tooling (e.g. `event:clear`) and shutdown paths that
   * want to release every subscription before disposing of the
   * emitter.
   *
   * @param event - Optional event name to scope the clear to.
   */
  removeAllListeners(event?: string | symbol): void;
}

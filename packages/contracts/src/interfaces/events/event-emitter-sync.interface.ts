/**
 * @file event-emitter-sync.interface.ts
 * @module @stackra/contracts/interfaces/events
 * @description Synchronous event emitter interface for transport use.
 */

/**
 * Synchronous event emitter contract for event transports.
 *
 * Used by IEventTransport implementations that need to emit events
 * synchronously without awaiting. Transports push events into the local
 * emitter — they don't need the full IEventEmitter (which is async).
 */
export interface IEventEmitterSync {
  /** Emit an event synchronously with optional arguments. */
  emit(event: string | symbol, ...args: unknown[]): boolean;
}

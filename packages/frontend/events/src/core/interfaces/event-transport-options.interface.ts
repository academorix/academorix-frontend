/**
 * @file event-transport-options.interface.ts
 * @module @stackra/events/core/interfaces
 *
 * @description
 * Legacy re-export of `IEventTransportOptions` + the `IEventTransport`
 * contract. The canonical shapes now live in
 * `@stackra/contracts/interfaces/events`.
 */

export type { IEventTransportOptions } from "@stackra/contracts";

import type { IEventEmitterSync } from "@stackra/contracts";

/**
 * Contract that transport classes must implement.
 *
 * At bootstrap, the `EventSubscribersLoader` calls `connect(emitter)`
 * on each discovered transport. The transport then listens to its
 * external source and re-emits events on the provided emitter. On
 * shutdown, `disconnect()` is called to clean up resources.
 *
 * NOTE: this contract lives in the events package (not contracts)
 * because it describes a runtime concern — transports call into the
 * emitter. Options interfaces live in contracts; behavior contracts
 * live with their runtime.
 */
export interface IEventTransport {
  /**
   * Connect the transport to the event emitter.
   *
   * Called once at application bootstrap. The transport should start
   * listening to its external source and forward events to the emitter.
   *
   * @param emitter - The application's EventEmitter instance
   */
  connect(emitter: IEventEmitterSync): void;

  /**
   * Disconnect the transport and release resources.
   * Called on application shutdown. Close sockets, clear intervals, etc.
   */
  disconnect(): void;
}

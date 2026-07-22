/**
 * @file event-transport-options.interface.ts
 * @module @stackra/events/core/interfaces
 * @description Package-owned `IEventTransport` behavior interface.
 *   `IEventTransportOptions` is contract vocabulary — import it
 *   directly from `@stackra/contracts` per
 *   `.kiro/steering/contract-reexports.md`.
 */

import type { EventEmitter } from "../services/event-emitter.service";

/**
 * Behavior interface every `@EventTransport()`-decorated class must
 * implement. The `EventSubscribersLoader` connects each discovered
 * transport at bootstrap and disconnects it at shutdown.
 */
export interface IEventTransport {
  /** Attach the transport to the active emitter. */
  connect(emitter: EventEmitter): void | Promise<void>;

  /**
   * Detach the transport. Called on shutdown / disconnect. Required
   * — matches the historical shape the `EventTransportRegistry`
   * relies on.
   */
  disconnect(): void | Promise<void>;
}

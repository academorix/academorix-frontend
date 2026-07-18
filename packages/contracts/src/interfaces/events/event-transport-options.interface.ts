/**
 * @file event-transport-options.interface.ts
 * @module @stackra/contracts/interfaces/events
 *
 * @description
 * Options accepted by the `@EventTransport(options)` class decorator —
 * the metadata payload stamped on the target class under
 * `EVENT_TRANSPORT_METADATA_KEY` and read by the transports loader.
 *
 * Transports are external event sources (WebSocket, SSE, BroadcastChannel)
 * that inject events into the local EventEmitter.
 */

/**
 * Options for the `@EventTransport(options)` class decorator.
 *
 * @example
 * ```typescript
 * import { EventTransport } from '@stackra/decorators/events';
 *
 * @EventTransport({ name: 'broadcast-channel' })
 * export class BroadcastChannelTransport implements IEventTransport {
 *   // ...
 * }
 * ```
 */
export interface IEventTransportOptions {
  /**
   * Unique name for this transport — used by the registry for
   * lookup. Examples: `'websocket'`, `'broadcast-channel'`, `'sse'`.
   */
  readonly name: string;
}

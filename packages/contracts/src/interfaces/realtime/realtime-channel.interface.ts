/**
 * @file realtime-channel.interface.ts
 * @module @stackra/contracts/interfaces/realtime
 * @description Contract for a subscribed realtime channel + its
 *   presence-channel specialisation.
 *
 *   Consumers (broadcast listeners, dashboards, sync engines) inject
 *   the manager, resolve a connection, and subscribe to channels
 *   through this shape. Drivers implement it — the concrete Socket.IO
 *   / Pusher / Ably channel classes all conform.
 */

/**
 * A subscribed realtime channel — the handle for listening to events
 * published on that channel.
 *
 * @example
 * ```typescript
 * const connection = await manager.connection();
 * const channel = connection.channel('orders');
 * channel.on('updated', (data) => logger.info(data));
 * ```
 */
export interface IRealtimeChannel {
  /**
   * Listen for an event on this channel.
   *
   * @param event - The event name to subscribe to.
   * @param handler - Callback invoked with the decoded payload.
   * @returns `this` for chaining.
   */
  on(event: string, handler: (data: unknown) => void): this;

  /**
   * Remove a listener previously registered via `on`.
   *
   * @param event - The event name.
   * @param handler - The exact handler reference to remove.
   * @returns `this` for chaining.
   */
  off(event: string, handler: (data: unknown) => void): this;

  /** Leave the channel — unsubscribes from every event. */
  leave(): void;

  /**
   * Send a client event to other channel members (whisper).
   * Client events never reach the server — they're a peer-to-peer
   * broadcast within the channel membership.
   *
   * @param event - The event name.
   * @param data - The payload to send.
   * @returns `this` for chaining.
   */
  whisper(event: string, data: unknown): this;
}

/**
 * A presence channel — tracks who's currently online in a channel.
 *
 * Extends `IRealtimeChannel` with member-tracking callbacks. Only
 * drivers that support presence channels (Pusher, Ably, Reverb) can
 * resolve one via `connection.presenceChannel(name)`.
 */
export interface IRealtimePresenceChannel extends IRealtimeChannel {
  /** Receive the current member list. */
  here(callback: (members: unknown[]) => void): this;

  /** Listen for a member joining. */
  joining(callback: (member: unknown) => void): this;

  /** Listen for a member leaving. */
  leaving(callback: (member: unknown) => void): this;
}

/**
 * @file realtime-connection.interface.ts
 * @module @stackra/contracts/interfaces/realtime
 * @description Contract for a live realtime connection — the runtime
 *   handle through which consumers open channels, listen for events,
 *   and disconnect.
 */

import type { IRealtimeChannel, IRealtimePresenceChannel } from "./realtime-channel.interface";

/**
 * A live realtime connection.
 *
 * Resolved via `IRealtimeManager.connection(name?)`. Each named
 * connection corresponds to one server endpoint (a Socket.IO server,
 * a Pusher app, an Ably realm, …).
 */
export interface IRealtimeConnection {
  /**
   * Subscribe to a public channel. Public channels require no
   * authentication.
   */
  channel(name: string): IRealtimeChannel;

  /**
   * Subscribe to a private channel. The connection must have been
   * opened with credentials the server can authenticate.
   */
  privateChannel(name: string): IRealtimeChannel;

  /**
   * Subscribe to a presence channel — a private channel that
   * additionally tracks membership.
   */
  presenceChannel(name: string): IRealtimePresenceChannel;

  /** Close the connection. Idempotent. */
  disconnect(): void;

  /** Whether the underlying transport is currently connected. */
  isConnected(): boolean;
}

/**
 * @file tab-transport-manager.interface.ts
 * @module @stackra/contracts/interfaces/coordinator
 * @description Public contract for the cross-tab transport manager.
 *   Consumers inject the manager, ask it for a named channel, and
 *   receive an `ITabTransport` — the manager owns environment
 *   detection (`BroadcastChannel` present or not) and caches
 *   channel instances so two consumers asking for the same name
 *   share the same transport.
 */

import type { ITabTransport } from "./tab-transport.interface";

/**
 * Contract for the cross-tab transport manager.
 *
 * The manager owns three responsibilities:
 *
 * 1. **Environment detection** — via `isSupported()`. SSR / non-DOM
 *    contexts fall back to a no-op transport so consumers stay
 *    driver-agnostic.
 * 2. **Channel caching** — a second `channel('foo')` call returns
 *    the same transport as the first, so two consumers on the same
 *    channel share subscribers instead of double-emitting.
 * 3. **Lifecycle** — the manager tracks every channel it hands out
 *    and can close them all on module destroy.
 */
export interface ITabTransportManager {
  /**
   * Whether the underlying transport (usually `BroadcastChannel`)
   * is available in the current runtime.
   */
  isSupported(): boolean;

  /**
   * Resolve (or create) the named channel.
   *
   * Two calls with the same name return the SAME transport
   * instance — the manager caches by channel name.
   *
   * @param name - Channel name — used as-is as the underlying
   *   `BroadcastChannel` name.
   */
  channel(name: string): ITabTransport;

  /**
   * Close a channel by name and drop it from the manager's cache.
   *
   * Consumers that OWN a short-lived channel (a collaboration room
   * scoped to `collab:${roomId}`, a temporary handshake channel)
   * call `release(name)` when they're done — the next
   * `channel(name)` call rebuilds a fresh transport instead of
   * handing back an already-closed one.
   *
   * Consumers of long-lived / shared channels (coordinator relay,
   * state sync, queue distribution) should NEVER call `release` —
   * the manager closes those at module destroy.
   *
   * @param name - Channel name previously returned by
   *   {@link ITabTransportManager.channel}.
   */
  release(name: string): void;
}

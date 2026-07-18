/**
 * @file event-transport-registry.service.ts
 * @module @stackra/events/core/services
 * @description Registry for active event transports.
 *
 *   Tracks every transport connected to the EventEmitter so consumer
 *   code can introspect or programmatically disconnect specific
 *   transports at runtime. Populated automatically by
 *   `EventSubscribersLoader` at bootstrap.
 *
 *   Extends {@link BaseRegistry} for unified storage. Adds two
 *   domain-specific methods on top of the inherited surface:
 *
 *     - `disconnect(name)` — calls `transport.disconnect()` and
 *       removes the entry.
 *     - `disconnectAll()` — disconnects every transport and clears
 *       the registry.
 */

import { Injectable } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";

import type { IEventTransport } from "@/core/interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Registry
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Registry of active event transports.
 *
 * Transports are external event sources (WebSocket, SSE,
 * BroadcastChannel) that inject events into the local EventEmitter.
 * The registry provides runtime introspection and disconnect
 * capabilities.
 *
 * @example
 * ```typescript
 * const registry = container.get(EventTransportRegistry);
 *
 * if (registry.has('websocket')) {
 *   registry.disconnect('websocket');
 * }
 *
 * const names = registry.keys(); // ['websocket', 'broadcast-channel']
 * ```
 */
@Injectable()
export class EventTransportRegistry extends BaseRegistry<string, IEventTransport> {
  /**
   * Disconnect a specific transport by name.
   *
   * Calls `transport.disconnect()` then removes the entry. No-op
   * when the transport isn't present (matches the previous
   * implementation's silent-no-op semantics).
   *
   * @param name - Transport name to disconnect.
   */
  public disconnect(name: string): void {
    const transport = this.get(name);
    if (!transport) return;
    transport.disconnect();
    this.remove(name);
  }

  /**
   * Disconnect all transports and clear the registry.
   *
   * Called on application shutdown to release all external
   * resources. Iterates over the inherited `values()` snapshot so
   * the underlying map can be mutated safely.
   */
  public disconnectAll(): void {
    for (const transport of this.values()) {
      transport.disconnect();
    }
    this.clear();
  }
}

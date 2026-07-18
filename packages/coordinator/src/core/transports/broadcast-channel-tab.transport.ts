/**
 * @file broadcast-channel-tab.transport.ts
 * @module @stackra/coordinator/core/transports
 * @description `ITabTransport` implementation backed by the browser
 *   `BroadcastChannel` API. One instance = one underlying channel.
 *   Subscribers are held in a local `Set` and invoked on every
 *   inbound message, so multiple consumers of the same channel
 *   share a single `BroadcastChannel` (see `TabTransportManager`
 *   for the caching layer).
 */

import type { ITabTransport, TabTransportListener } from '@stackra/contracts';

/**
 * `ITabTransport` backed by the browser `BroadcastChannel` API.
 *
 * The transport is fail-soft:
 *
 * - Construction assumes `BroadcastChannel` is available — the
 *   manager gates unsupported environments with `NoopTabTransport`.
 * - `broadcast()` catches serialisation / closed-channel errors so a
 *   broken transport never breaks the caller.
 * - Listener errors are caught + swallowed so one bad subscriber
 *   doesn't block others.
 *
 * @example
 * ```typescript
 * // Usually resolved via the manager; direct construction is only
 * // needed inside the coordinator package itself.
 * const transport = new BroadcastChannelTabTransport('stackra-events');
 * const unsub = transport.subscribe((data) => console.log(data));
 * transport.broadcast({ hello: 'world' });
 * unsub();
 * transport.close();
 * ```
 */
export class BroadcastChannelTabTransport implements ITabTransport {
  /** Underlying `BroadcastChannel`, or `null` after `close()`. */
  private channel: BroadcastChannel | null;

  /** All active listeners for this channel. */
  private readonly listeners = new Set<TabTransportListener>();

  /**
   * @param channelName - The `BroadcastChannel` name to open.
   */
  public constructor(public readonly channelName: string) {
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (event: MessageEvent) => {
      // Snapshot the listener set so `subscribe`/`unsubscribe` calls
      // fired inside a listener don't mutate the iteration.
      for (const listener of Array.from(this.listeners)) {
        try {
          listener(event.data);
        } catch {
          // fail-soft — one bad subscriber must not stall the fan-out.
        }
      }
    };
  }

  /** @inheritdoc */
  public subscribe(listener: TabTransportListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** @inheritdoc */
  public broadcast(data: unknown): void {
    if (!this.channel) return; // already closed
    try {
      this.channel.postMessage(data);
    } catch {
      // fail-soft — closed channel, structured-clone failure, or a
      // browser refusing to serialise a specific payload should not
      // propagate to the caller.
    }
  }

  /** @inheritdoc */
  public close(): void {
    this.channel?.close();
    this.channel = null;
    this.listeners.clear();
  }
}

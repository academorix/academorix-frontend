/**
 * @file noop-tab.transport.ts
 * @module @stackra/coordinator/core/transports
 * @description No-op `ITabTransport` used when the environment has
 *   no `BroadcastChannel` (SSR, hardened iframes, older browsers).
 *   Every method is a silent no-op so callers can treat the manager
 *   as unconditionally present.
 */

import type { ITabTransport, TabTransportListener } from "@stackra/contracts";

/**
 * `ITabTransport` implementation that swallows every operation.
 *
 * Handed out by `TabTransportManager` in environments where
 * `BroadcastChannel` is unavailable. Consumers still get a working
 * transport object — subscriptions never fire, broadcasts vanish —
 * which keeps them free from having to feature-detect at every call
 * site.
 */
export class NoopTabTransport implements ITabTransport {
  /**
   * @param channelName - The channel name the caller asked for
   *   (kept for observability / debugging).
   */
  public constructor(public readonly channelName: string) {}

  /** @inheritdoc */
  public subscribe(_listener: TabTransportListener): () => void {
    // Silent no-op — return a no-op unsubscribe so consumers stay
    // symmetrical with the browser-backed transport.
    return () => {};
  }

  /** @inheritdoc */
  public broadcast(_data: unknown): void {
    /* no-op */
  }

  /** @inheritdoc */
  public close(): void {
    /* no-op */
  }
}

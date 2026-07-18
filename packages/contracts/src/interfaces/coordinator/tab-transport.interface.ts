/**
 * @file tab-transport.interface.ts
 * @module @stackra/contracts/interfaces/coordinator
 * @description Public contract for a single cross-tab pub/sub
 *   channel. Wraps `BroadcastChannel` (browsers) or an equivalent
 *   fallback (no-op in SSR, could be a `postMessage` bridge in a
 *   worker) behind one minimal surface every consumer package can
 *   inject.
 */

/**
 * Callback fired when a message arrives on this channel from
 * another tab.
 */
export type TabTransportListener = (data: unknown) => void;

/**
 * Contract for a single named cross-tab pub/sub channel.
 *
 * One `ITabTransport` corresponds to one underlying transport
 * instance (a `BroadcastChannel` in the standard web driver). Each
 * consumer holds its own transport for its own domain — the
 * coordinator's leader-election channel, state's cross-tab sync
 * channel, queue's cross-tab job channel — so channel lifecycle
 * stays local to each consumer.
 *
 * The manager (`ITabTransportManager`) is responsible for handing
 * out these instances by channel name.
 */
export interface ITabTransport {
  /** The underlying channel name (e.g. `'stackra-event-relay'`). */
  readonly channelName: string;

  /**
   * Subscribe to messages arriving on this channel from other tabs.
   *
   * @param listener - Callback invoked with the raw message data.
   * @returns Unsubscribe function.
   */
  subscribe(listener: TabTransportListener): () => void;

  /**
   * Post a message to every other tab subscribed to this channel.
   *
   * Fail-soft — a serialisation error or a closed channel is
   * swallowed so a broken transport never breaks the caller.
   *
   * @param data - Structured-clone-serialisable message.
   */
  broadcast(data: unknown): void;

  /**
   * Close the underlying channel and drop every subscriber.
   *
   * After `close()` the transport is inert — further `subscribe` /
   * `broadcast` calls are no-ops.
   */
  close(): void;
}

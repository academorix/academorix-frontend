/**
 * @file mock-tab-transport-manager.ts
 * @module @stackra/coordinator/testing
 * @description In-memory `ITabTransportManager` implementation used
 *   by tests that exercise cross-tab pub/sub without spinning up a
 *   real `BroadcastChannel`.
 *
 *   Messages posted through one transport are delivered synchronously
 *   to every other subscriber on the same channel — matching the
 *   BroadcastChannel guarantee that a sender never receives its own
 *   posts, but every other listener on the same channel does. This
 *   lets tests wire multiple "tabs" onto the same manager and assert
 *   the full fan-out.
 */

import type { ITabTransport, ITabTransportManager, TabTransportListener } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════════════════
// Channel bus (shared by all transports opened on a channel name)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Internal per-channel bus. One instance per channel name — every
 * `MockTabTransport` opened for that name is registered here so
 * `broadcast()` on any one member reaches every other member's
 * listeners without echoing back to the sender.
 */
class MockChannelBus {
  /** Every open transport on this channel. */
  public readonly transports = new Set<MockTabTransport>();

  /** Deliver `data` to every transport except `sender`. */
  public deliver(sender: MockTabTransport, data: unknown): void {
    for (const transport of Array.from(this.transports)) {
      if (transport === sender) continue;
      transport.receive(data);
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Transport
// ════════════════════════════════════════════════════════════════════════════════

/**
 * In-memory `ITabTransport` — one per subscriber; the shared bus
 * (per channel name) routes messages so a broadcast from `A` never
 * echoes to `A`'s own listeners but does reach `B`, `C`, ….
 *
 * Listener errors are swallowed to match production semantics
 * (`BroadcastChannelTabTransport.onmessage` swallows subscriber
 * errors so one bad handler cannot block the fan-out).
 */
export class MockTabTransport implements ITabTransport {
  /** Registered subscribers on this transport. */
  private readonly listeners = new Set<TabTransportListener>();

  /** Whether `close()` has been called. */
  private closed = false;

  /**
   * @param channelName - The channel this transport is opened on.
   * @param bus - The shared channel bus; every transport for the
   *   same channel name shares one bus so `broadcast()` reaches
   *   every peer.
   */
  public constructor(
    public readonly channelName: string,
    private readonly bus: MockChannelBus,
  ) {
    this.bus.transports.add(this);
  }

  /** @inheritdoc */
  public subscribe(listener: TabTransportListener): () => void {
    // Post-close subscribes are silently ignored (matches production
    // behaviour where the underlying `BroadcastChannel` no longer
    // fires `onmessage`).
    if (this.closed) return () => {};
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** @inheritdoc */
  public broadcast(data: unknown): void {
    // Silently drop broadcasts after close — matches
    // `BroadcastChannelTabTransport` which no-ops on a nulled channel.
    if (this.closed) return;
    this.bus.deliver(this, data);
  }

  /** @inheritdoc */
  public close(): void {
    if (this.closed) return;
    this.closed = true;
    this.bus.transports.delete(this);
    this.listeners.clear();
  }

  /**
   * Test-only helper — deliver `data` to every registered listener
   * (used by the shared bus when another transport broadcasts).
   *
   * @param data - Message payload.
   */
  public receive(data: unknown): void {
    // Snapshot so listeners that mutate the set (subscribe /
    // unsubscribe inside a handler) don't affect iteration.
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(data);
      } catch {
        // fail-soft — mirror the production transport's swallow.
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Manager
// ════════════════════════════════════════════════════════════════════════════════

/**
 * In-memory `ITabTransportManager` — matches the shape of the real
 * `TabTransportManager` but never touches `BroadcastChannel`.
 *
 * ## Behaviour
 *
 * - `isSupported()` returns `true` (tests opt in to unsupported paths
 *   by flipping the field, see `simulateUnsupported`).
 * - `channel(name)` caches by name — two calls with the same name
 *   return the same `MockTabTransport`, matching production caching.
 * - `release(name)` closes and evicts a cached channel — a
 *   subsequent `channel(name)` call rebuilds a fresh transport.
 *
 * ## Multi-tab tests
 *
 * Two managers sharing the same `busRegistry` simulate two tabs on
 * the same origin. Use {@link MockTabTransportManager.createPeer}
 * to spawn a second manager that shares this manager's bus map.
 *
 * @example
 * ```ts
 * import { MockTabTransportManager } from '@stackra/coordinator/testing';
 *
 * const tabA = new MockTabTransportManager();
 * const tabB = tabA.createPeer();
 *
 * const chanA = tabA.channel('room:42');
 * const chanB = tabB.channel('room:42');
 * chanB.subscribe(vi.fn());
 * chanA.broadcast({ hello: 'world' });
 * // chanB's listener fired; chanA's did not.
 * ```
 */
export class MockTabTransportManager implements ITabTransportManager {
  /**
   * Registry of per-channel buses — shared across every manager
   * that was spawned from the same root through `createPeer`.
   */
  public readonly busRegistry: Map<string, MockChannelBus>;

  /** Cache of transports keyed by channel name (per-manager). */
  public readonly channels = new Map<string, MockTabTransport>();

  /** Toggle used by `isSupported()`; flip in tests that exercise the SSR path. */
  public supported = true;

  /**
   * @param busRegistry - Optional externally-owned bus registry.
   *   When omitted the manager owns its own; peers share it via
   *   `createPeer`.
   */
  public constructor(busRegistry?: Map<string, MockChannelBus>) {
    this.busRegistry = busRegistry ?? new Map<string, MockChannelBus>();
  }

  /** @inheritdoc */
  public isSupported(): boolean {
    return this.supported;
  }

  /** @inheritdoc */
  public channel(name: string): ITabTransport {
    const existing = this.channels.get(name);
    if (existing) return existing;

    // One bus per channel name — shared with peer managers so
    // cross-"tab" broadcasts land on every listener.
    let bus = this.busRegistry.get(name);
    if (!bus) {
      bus = new MockChannelBus();
      this.busRegistry.set(name, bus);
    }
    const transport = new MockTabTransport(name, bus);
    this.channels.set(name, transport);
    return transport;
  }

  /** @inheritdoc */
  public release(name: string): void {
    const existing = this.channels.get(name);
    if (!existing) return;
    existing.close();
    this.channels.delete(name);
  }

  /**
   * Test hook — spawn a peer manager (a "second tab") that shares
   * this manager's bus registry so `broadcast()` calls cross tabs
   * as they would in a real browser.
   */
  public createPeer(): MockTabTransportManager {
    return new MockTabTransportManager(this.busRegistry);
  }

  /**
   * Test hook — flip `isSupported()` to `false` (SSR / hardened
   * iframe path).
   */
  public simulateUnsupported(): void {
    this.supported = false;
  }

  /** Test hook — check whether a channel is currently cached. */
  public hasChannel(name: string): boolean {
    return this.channels.has(name);
  }
}

/**
 * @file broadcast-channel-tab-transport.spec.ts
 * @module @stackra/coordinator/__tests__/unit
 * @description Behavioural spec for `BroadcastChannelTabTransport`.
 *   Uses an in-memory `BroadcastChannel` shim (installed on
 *   `globalThis` in `beforeEach`, restored in `afterEach`) so the
 *   spec never depends on `jsdom` or a real DOM.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { BroadcastChannelTabTransport } from '@/core/transports/broadcast-channel-tab.transport';

// ════════════════════════════════════════════════════════════════════════════════
// In-memory BroadcastChannel shim
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Minimal in-memory `BroadcastChannel` that routes messages between
 * every constructed instance on the same channel name. Matches the
 * browser guarantee that a sender doesn't receive its own posts.
 */
class MockBroadcastChannel {
  /** Every open channel keyed by name. Shared static registry. */
  public static readonly instances = new Map<string, Set<MockBroadcastChannel>>();

  public onmessage: ((event: MessageEvent) => void) | null = null;
  private closed = false;

  public constructor(public readonly name: string) {
    let pool = MockBroadcastChannel.instances.get(name);
    if (!pool) {
      pool = new Set();
      MockBroadcastChannel.instances.set(name, pool);
    }
    pool.add(this);
  }

  public postMessage(data: unknown): void {
    if (this.closed) throw new Error('closed');
    const pool = MockBroadcastChannel.instances.get(this.name);
    if (!pool) return;
    // Deliver synchronously to every peer except the sender.
    for (const peer of Array.from(pool)) {
      if (peer === this) continue;
      peer.onmessage?.({ data } as MessageEvent);
    }
  }

  public close(): void {
    this.closed = true;
    const pool = MockBroadcastChannel.instances.get(this.name);
    pool?.delete(this);
    if (pool && pool.size === 0) MockBroadcastChannel.instances.delete(this.name);
  }
}

const originalBroadcastChannel = (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;

describe('BroadcastChannelTabTransport', () => {
  beforeEach(() => {
    // Reset the static pool so tests don't leak into each other.
    MockBroadcastChannel.instances.clear();
    (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel =
      MockBroadcastChannel as unknown as typeof BroadcastChannel;
  });

  afterEach(() => {
    (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel = originalBroadcastChannel;
  });

  describe('subscribe', () => {
    it('returns an unsubscribe function that removes the listener', () => {
      const a = new BroadcastChannelTabTransport('room');
      const b = new BroadcastChannelTabTransport('room');
      const listener = vi.fn();

      const unsub = a.subscribe(listener);
      b.broadcast({ x: 1 });
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
      b.broadcast({ x: 2 });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('supports multiple subscribers on the same transport', () => {
      const a = new BroadcastChannelTabTransport('room');
      const b = new BroadcastChannelTabTransport('room');
      const l1 = vi.fn();
      const l2 = vi.fn();
      a.subscribe(l1);
      a.subscribe(l2);

      b.broadcast({ hello: true });
      expect(l1).toHaveBeenCalledWith({ hello: true });
      expect(l2).toHaveBeenCalledWith({ hello: true });
    });

    it('does not deliver a sender its own broadcasts', () => {
      const a = new BroadcastChannelTabTransport('room');
      const listener = vi.fn();
      a.subscribe(listener);
      a.broadcast({ mine: true });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    it('delivers to every peer on the same channel', () => {
      const a = new BroadcastChannelTabTransport('room');
      const b = new BroadcastChannelTabTransport('room');
      const c = new BroadcastChannelTabTransport('room');
      const lB = vi.fn();
      const lC = vi.fn();
      b.subscribe(lB);
      c.subscribe(lC);

      a.broadcast({ v: 42 });

      expect(lB).toHaveBeenCalledWith({ v: 42 });
      expect(lC).toHaveBeenCalledWith({ v: 42 });
    });

    it('does not deliver to peers on a different channel', () => {
      const a = new BroadcastChannelTabTransport('rooms:1');
      const b = new BroadcastChannelTabTransport('rooms:2');
      const listener = vi.fn();
      b.subscribe(listener);

      a.broadcast({ v: 1 });

      expect(listener).not.toHaveBeenCalled();
    });

    it('swallows serialisation / postMessage failures (fail-soft)', () => {
      const a = new BroadcastChannelTabTransport('room');
      // Force `postMessage` to throw — the transport must swallow it.
      const spy = vi.spyOn(MockBroadcastChannel.prototype, 'postMessage').mockImplementation(() => {
        throw new Error('structured-clone failure');
      });

      expect(() => a.broadcast({ x: 1 })).not.toThrow();
      spy.mockRestore();
    });

    it('is a no-op after close()', () => {
      const a = new BroadcastChannelTabTransport('room');
      const b = new BroadcastChannelTabTransport('room');
      const listener = vi.fn();
      b.subscribe(listener);

      a.close();
      a.broadcast({ v: 1 });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('listener isolation', () => {
    it('a throwing listener does not block other listeners on the same transport', () => {
      const a = new BroadcastChannelTabTransport('room');
      const b = new BroadcastChannelTabTransport('room');
      const bad = vi.fn(() => {
        throw new Error('bad handler');
      });
      const good = vi.fn();
      a.subscribe(bad);
      a.subscribe(good);

      b.broadcast({ x: 1 });

      expect(bad).toHaveBeenCalled();
      expect(good).toHaveBeenCalledWith({ x: 1 });
    });
  });

  describe('close', () => {
    it('is idempotent — calling twice does not throw', () => {
      const a = new BroadcastChannelTabTransport('room');
      a.close();
      expect(() => a.close()).not.toThrow();
    });

    it('drops every subscriber', () => {
      const a = new BroadcastChannelTabTransport('room');
      const b = new BroadcastChannelTabTransport('room');
      const listener = vi.fn();
      a.subscribe(listener);

      a.close();
      b.broadcast({ v: 1 });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});

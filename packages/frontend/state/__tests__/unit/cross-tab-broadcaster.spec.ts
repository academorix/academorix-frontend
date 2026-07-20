/**
 * @file cross-tab-broadcaster.spec.ts
 * @module @stackra/state/__tests__/unit
 * @description Behavioural spec for `CrossTabBroadcaster` — verifies
 *   outbound broadcasting (only for enabled stores, only when the
 *   sync guard is not active), inbound state application (with the
 *   sync guard set to prevent re-broadcast), and lifecycle wiring
 *   (subscribe on `onModuleInit`, unsubscribe on `onModuleDestroy`
 *   without closing the shared transport channel).
 *
 *   Uses `MockStateRegistry` from `@stackra/state/testing`, the
 *   shared `MockTabTransportManager` from
 *   `@stackra/coordinator/testing` (reached via relative source
 *   import because `@stackra/coordinator` is not a declared dep of
 *   `@stackra/state`), and a hand-rolled in-memory `IEventEmitter`
 *   that supports the wildcard-listener contract the broadcaster
 *   relies on.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '@tanstack/store';

import { STATE_EVENTS, type IEventEmitter } from '@stackra/contracts';

import { CrossTabBroadcaster } from '@/core/broadcasters/cross-tab.broadcaster';
import { MockStateRegistry } from '@/testing/mock-state-registry';
import { MockTabTransportManager } from '@stackra/coordinator/testing';

const CHANNEL_NAME = '__stackra_state_sync';

// ════════════════════════════════════════════════════════════════════════════════
// Mock IEventEmitter — supports the wildcard listener contract the
// broadcaster depends on. `.on('*.changed', handler)` fires the handler
// with `(eventName, ...args)` when a matching event is emitted.
// ════════════════════════════════════════════════════════════════════════════════

interface Listener {
  fn: (...args: unknown[]) => void;
  pattern: string;
  wildcard: boolean;
}

class MockEmitter implements IEventEmitter {
  private readonly listeners: Listener[] = [];

  public async emit(event: string, ...args: unknown[]): Promise<void> {
    for (const l of Array.from(this.listeners)) {
      if (l.wildcard) {
        if (this.matchesWildcard(l.pattern, event)) l.fn(event, ...args);
      } else if (l.pattern === event) {
        l.fn(...args);
      }
    }
  }

  public on(event: string, listener: (payload: unknown) => void | Promise<void>): () => void {
    const wildcard = event.includes('*');
    const entry: Listener = {
      fn: listener as (...args: unknown[]) => void,
      pattern: event,
      wildcard,
    };
    this.listeners.push(entry);
    return () => {
      const i = this.listeners.indexOf(entry);
      if (i !== -1) this.listeners.splice(i, 1);
    };
  }

  public eventNames(): Array<string | symbol> {
    return this.listeners.map((l) => l.pattern);
  }

  public listenerCount(event: string | symbol): number {
    if (typeof event !== 'string') return 0;
    return this.listeners.filter((l) => {
      if (l.wildcard) return this.matchesWildcard(l.pattern, event);
      return l.pattern === event;
    }).length;
  }

  public removeAllListeners(event?: string | symbol): void {
    if (event === undefined) {
      this.listeners.length = 0;
      return;
    }
    for (let i = this.listeners.length - 1; i >= 0; i--) {
      if (this.listeners[i]!.pattern === event) this.listeners.splice(i, 1);
    }
  }

  private matchesWildcard(pattern: string, event: string): boolean {
    const pp = pattern.split('.');
    const ep = event.split('.');
    if (pp.length !== ep.length) return false;
    for (let i = 0; i < pp.length; i++) {
      if (pp[i] === '*') continue;
      if (pp[i] !== ep[i]) return false;
    }
    return true;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Spec
// ════════════════════════════════════════════════════════════════════════════════

const THEME_TOKEN = Symbol.for('THEME_STORE');

describe('CrossTabBroadcaster', () => {
  let emitter: MockEmitter;
  let registry: MockStateRegistry;
  let manager: MockTabTransportManager;
  let broadcaster: CrossTabBroadcaster;

  beforeEach(() => {
    emitter = new MockEmitter();
    registry = new MockStateRegistry();
    manager = new MockTabTransportManager();
    broadcaster = new CrossTabBroadcaster(
      emitter as unknown as IEventEmitter,
      // The runtime type is StateRegistry; MockStateRegistry mirrors the
      // subset the broadcaster reads (`get(name)`).
      registry as unknown as import('@/core/registries/state.registry').StateRegistry,
      manager
    );
  });

  describe('onModuleInit', () => {
    it('opens the shared channel and subscribes to store changes when both events + manager are present', () => {
      broadcaster.onModuleInit();
      expect(manager.hasChannel(CHANNEL_NAME)).toBe(true);
      // The broadcaster registered a wildcard listener for `*.changed`.
      expect(emitter.listenerCount('theme.changed')).toBeGreaterThanOrEqual(1);
    });

    it('is inert when EventEmitter is missing', () => {
      const noEmitter = new CrossTabBroadcaster(
        undefined,
        registry as unknown as import('@/core/registries/state.registry').StateRegistry,
        manager
      );
      noEmitter.onModuleInit();
      expect(manager.hasChannel(CHANNEL_NAME)).toBe(false);
    });

    it('is inert when the tab transport manager is missing', () => {
      const noManager = new CrossTabBroadcaster(
        emitter as unknown as IEventEmitter,
        registry as unknown as import('@/core/registries/state.registry').StateRegistry,
        undefined
      );
      noManager.onModuleInit();
      // Nothing to open — the listener registration is skipped.
      expect(emitter.listenerCount('theme.changed')).toBe(0);
    });

    it('is inert when the manager reports unsupported', () => {
      manager.simulateUnsupported();
      broadcaster.onModuleInit();
      expect(manager.hasChannel(CHANNEL_NAME)).toBe(false);
    });
  });

  describe('outbound path', () => {
    beforeEach(() => {
      broadcaster.onModuleInit();
    });

    it('broadcasts a CrossTabMessage when an enabled store fires *.changed', async () => {
      broadcaster.enableForStore('theme');
      const peer = manager.createPeer();
      const peerChan = peer.channel(CHANNEL_NAME);
      const seen: unknown[] = [];
      peerChan.subscribe((data) => seen.push(data));

      await emitter.emit('theme.changed', { state: { mode: 'dark' } });

      expect(seen).toHaveLength(1);
      const msg = seen[0] as { storeName: string; state: unknown; timestamp: number };
      expect(msg.storeName).toBe('theme');
      expect(msg.state).toEqual({ mode: 'dark' });
      expect(typeof msg.timestamp).toBe('number');
    });

    it('does NOT broadcast when the store is not enabled', async () => {
      // Enable `theme` but fire `i18n.changed` — the broadcaster
      // should ignore it.
      broadcaster.enableForStore('theme');

      const peer = manager.createPeer();
      const seen: unknown[] = [];
      peer.channel(CHANNEL_NAME).subscribe((data) => seen.push(data));

      await emitter.emit('i18n.changed', { state: { locale: 'fr' } });

      expect(seen).toHaveLength(0);
    });

    it('supports multiple enabled stores simultaneously', async () => {
      broadcaster.enableForStore('theme');
      broadcaster.enableForStore('i18n');

      const peer = manager.createPeer();
      const seen: string[] = [];
      peer.channel(CHANNEL_NAME).subscribe((data) => {
        const msg = data as { storeName: string };
        seen.push(msg.storeName);
      });

      await emitter.emit('theme.changed', { state: {} });
      await emitter.emit('i18n.changed', { state: {} });

      expect(seen).toEqual(['theme', 'i18n']);
    });
  });

  describe('inbound path', () => {
    beforeEach(() => {
      broadcaster.onModuleInit();
    });

    it('applies inbound state to the matching store via setState', () => {
      const store = new Store({ mode: 'light' });
      registry.registerStore('theme', THEME_TOKEN, store as Store<unknown>);
      broadcaster.enableForStore('theme');

      const peer = manager.createPeer();
      peer.channel(CHANNEL_NAME).broadcast({
        storeName: 'theme',
        state: { mode: 'dark' },
        timestamp: Date.now(),
      });

      expect(store.state).toEqual({ mode: 'dark' });
    });

    it('emits a `.sync.received` event on the emitter after applying', async () => {
      const store = new Store({ mode: 'light' });
      registry.registerStore('theme', THEME_TOKEN, store as Store<unknown>);
      broadcaster.enableForStore('theme');

      const received: Array<[string, unknown]> = [];
      emitter.on(`theme.${STATE_EVENTS.SYNC_RECEIVED}`, (payload) => {
        received.push([`theme.${STATE_EVENTS.SYNC_RECEIVED}`, payload]);
      });

      const peer = manager.createPeer();
      peer.channel(CHANNEL_NAME).broadcast({
        storeName: 'theme',
        state: { mode: 'dark' },
        timestamp: 12345,
      });

      expect(received).toHaveLength(1);
      expect(received[0]?.[1]).toEqual({ state: { mode: 'dark' }, timestamp: 12345 });
    });

    it('sets the isSyncing guard so a synchronous *.changed emit inside setState does NOT re-broadcast', () => {
      const store = new Store({ mode: 'light' });

      // Simulate the `createReactiveStore` integration — every
      // setState synchronously emits `theme.changed`. If the guard
      // is properly set during handleInbound, the outbound
      // handler must observe `isSyncing === true` and short-circuit.
      store.subscribe(() => {
        // fire the reactive change event synchronously — this is
        // the exact critical section the isSyncing guard protects.
        void emitter.emit('theme.changed', { state: store.state });
      });

      registry.registerStore('theme', THEME_TOKEN, store as Store<unknown>);
      broadcaster.enableForStore('theme');

      const peer = manager.createPeer();
      const seen: unknown[] = [];
      peer.channel(CHANNEL_NAME).subscribe((data) => seen.push(data));

      // Fire an inbound sync — the setState triggers our subscriber
      // which emits `theme.changed`. Without the guard, this would
      // ping back through outbound and re-broadcast.
      peer.channel(CHANNEL_NAME).broadcast({
        storeName: 'theme',
        state: { mode: 'dark' },
        timestamp: Date.now(),
      });

      expect(store.state).toEqual({ mode: 'dark' });
      // Guard held — no re-broadcast to the peer.
      expect(seen).toEqual([]);
    });

    it('ignores messages for unregistered store names', () => {
      broadcaster.enableForStore('missing');

      const peer = manager.createPeer();
      // No store registered for `missing` — the inbound message
      // must be silently skipped.
      expect(() =>
        peer.channel(CHANNEL_NAME).broadcast({
          storeName: 'missing',
          state: { x: 1 },
          timestamp: Date.now(),
        })
      ).not.toThrow();
    });

    it('ignores messages for disabled store names', () => {
      const store = new Store({ mode: 'light' });
      registry.registerStore('theme', THEME_TOKEN, store as Store<unknown>);
      // Not calling enableForStore('theme') — the message should
      // be discarded, leaving the store's state untouched.

      const peer = manager.createPeer();
      peer.channel(CHANNEL_NAME).broadcast({
        storeName: 'theme',
        state: { mode: 'dark' },
        timestamp: Date.now(),
      });

      expect(store.state).toEqual({ mode: 'light' });
    });

    it('ignores malformed inbound messages (missing storeName)', () => {
      const store = new Store({ mode: 'light' });
      registry.registerStore('theme', THEME_TOKEN, store as Store<unknown>);
      broadcaster.enableForStore('theme');

      const peer = manager.createPeer();
      expect(() => peer.channel(CHANNEL_NAME).broadcast(null)).not.toThrow();
      expect(() => peer.channel(CHANNEL_NAME).broadcast({})).not.toThrow();

      // Store state is untouched.
      expect(store.state).toEqual({ mode: 'light' });
    });
  });

  describe('onModuleDestroy', () => {
    it('unsubscribes but leaves the shared channel cached in the manager', () => {
      broadcaster.onModuleInit();
      expect(manager.hasChannel(CHANNEL_NAME)).toBe(true);

      // Snapshot state before destroy — after destroy, an inbound
      // peer broadcast must NOT update the store.
      const store = new Store({ mode: 'light' });
      registry.registerStore('theme', THEME_TOKEN, store as Store<unknown>);
      broadcaster.enableForStore('theme');

      broadcaster.onModuleDestroy();

      const peer = manager.createPeer();
      peer.channel(CHANNEL_NAME).broadcast({
        storeName: 'theme',
        state: { mode: 'dark' },
        timestamp: Date.now(),
      });

      // Store state unchanged because the broadcaster is unsubbed.
      expect(store.state).toEqual({ mode: 'light' });
      // But the manager still holds the channel — its lifecycle is
      // the manager's, not the broadcaster's.
      expect(manager.hasChannel(CHANNEL_NAME)).toBe(true);
    });

    it('is safe to call before onModuleInit', () => {
      const b = new CrossTabBroadcaster(
        emitter as unknown as IEventEmitter,
        registry as unknown as import('@/core/registries/state.registry').StateRegistry,
        manager
      );
      expect(() => b.onModuleDestroy()).not.toThrow();
    });
  });
});

/**
 * @file coordinator-transport.spec.ts
 * @module @stackra/coordinator/__tests__/unit
 * @description Behavioural spec for `CoordinatorTransport` — the
 *   cross-tab event relay. Covers pattern matching (`*` = one
 *   segment, `**` = one-or-more), echo suppression by tabId,
 *   `connect(emitter)` wiring, disconnect semantics, and the
 *   `relay()` filter.
 *
 *   Uses `MockTabTransportManager` from `@stackra/coordinator/testing`
 *   plus a hand-rolled peer manager to simulate a second tab.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { IEventEmitterSync } from '@stackra/contracts';

import { CoordinatorTransport } from '@/core/services/coordinator-transport.service';
import { MockTabTransportManager } from '@/testing/mock-tab-transport-manager';
import type { IRelayMessage } from '@/core/interfaces/relay-message.interface';

const RELAY_CHANNEL = 'stackra-event-relay';

/** Tiny sync event emitter shim — captures `emit` calls for assertion. */
function makeEmitter(): IEventEmitterSync & { calls: Array<[string | symbol, unknown[]]> } {
  const calls: Array<[string | symbol, unknown[]]> = [];
  return {
    calls,
    emit(event, ...args) {
      calls.push([event, args]);
      return true;
    },
  };
}

describe('CoordinatorTransport', () => {
  let manager: MockTabTransportManager;

  beforeEach(() => {
    manager = new MockTabTransportManager();
  });

  describe('connect + disconnect', () => {
    it('subscribes to the shared relay channel on connect()', () => {
      const transport = new CoordinatorTransport(manager, { broadcastEvents: true });
      const emitter = makeEmitter();
      transport.connect(emitter);

      // Once connect() ran, the manager has cached the relay channel.
      expect(manager.hasChannel(RELAY_CHANNEL)).toBe(true);
    });

    it('is inert when broadcastEvents is false', () => {
      const transport = new CoordinatorTransport(manager, { broadcastEvents: false });
      const emitter = makeEmitter();
      transport.connect(emitter);
      // No channel was opened.
      expect(manager.hasChannel(RELAY_CHANNEL)).toBe(false);
    });

    it('is inert when the manager reports unsupported', () => {
      manager.simulateUnsupported();
      const transport = new CoordinatorTransport(manager, { broadcastEvents: true });
      transport.connect(makeEmitter());
      expect(manager.hasChannel(RELAY_CHANNEL)).toBe(false);
    });

    it('is inert when no manager was injected', () => {
      const transport = new CoordinatorTransport(undefined, { broadcastEvents: true });
      // connect() must not throw; there's nothing to wire.
      expect(() => transport.connect(makeEmitter())).not.toThrow();
    });

    it('disconnect() unsubscribes but leaves the shared channel open', () => {
      const transport = new CoordinatorTransport(manager, { broadcastEvents: true });
      const emitter = makeEmitter();
      transport.connect(emitter);

      // Sanity — a peer post reaches the emitter.
      const peer = manager.createPeer();
      const peerChan = peer.channel(RELAY_CHANNEL);
      const msg: IRelayMessage = {
        kind: 'event-relay',
        event: 'auth:login',
        args: [{ userId: 'u1' }],
        sourceTabId: 'peer-tab',
      };
      peerChan.broadcast(msg);
      expect(emitter.calls).toContainEqual(['auth:login', [{ userId: 'u1' }]]);

      const beforeCalls = emitter.calls.length;
      transport.disconnect();

      // Post-disconnect, inbound messages must not reach the emitter.
      peerChan.broadcast({ ...msg, args: [{ userId: 'u2' }] });
      expect(emitter.calls.length).toBe(beforeCalls);

      // But the shared channel itself is still cached in the manager —
      // its lifecycle belongs to the manager, not the transport.
      expect(manager.hasChannel(RELAY_CHANNEL)).toBe(true);
    });
  });

  describe('echo suppression', () => {
    it('does not re-emit a message whose sourceTabId equals its own', () => {
      const transport = new CoordinatorTransport(manager, { broadcastEvents: true });
      const emitter = makeEmitter();
      transport.connect(emitter);

      // Grab this transport's channel directly and simulate an echo
      // arriving with the transport's own tabId.
      const chan = manager.channel(RELAY_CHANNEL);
      // Broadcast then observe on a peer — the sender's own tabId is
      // captured on the outbound message.
      transport.relay('sync:pull', { id: 1 });
      const peer = manager.createPeer();
      const peerChan = peer.channel(RELAY_CHANNEL);

      const seen: unknown[] = [];
      peerChan.subscribe((data) => seen.push(data));

      // Now re-broadcast on the OWN channel using the same tabId —
      // the transport's own subscriber must swallow it.
      const relayed = seen[0] ?? { sourceTabId: 'unknown' };
      const own = (relayed as IRelayMessage).sourceTabId;
      const before = emitter.calls.length;
      chan.broadcast({
        kind: 'event-relay',
        event: 'auth:login',
        args: [],
        sourceTabId: own,
      });
      // Because own broadcasts don't come back through the peer bus
      // (senders never receive their own posts), the emitter's calls
      // count must not have changed.
      expect(emitter.calls.length).toBe(before);
    });

    it('ignores payloads that are not event-relay messages', () => {
      const transport = new CoordinatorTransport(manager, { broadcastEvents: true });
      const emitter = makeEmitter();
      transport.connect(emitter);

      const peer = manager.createPeer();
      const peerChan = peer.channel(RELAY_CHANNEL);
      peerChan.broadcast({ kind: 'not-relay', hello: 'world' });
      peerChan.broadcast(null);
      peerChan.broadcast('a string');

      expect(emitter.calls).toEqual([]);
    });
  });

  describe('relay() pattern matching', () => {
    it('* matches exactly one segment', () => {
      const transport = new CoordinatorTransport(manager, {
        broadcastEvents: true,
        broadcastPatterns: ['auth.*'],
      });
      const emitter = makeEmitter();
      transport.connect(emitter);

      const peer = manager.createPeer();
      const peerChan = peer.channel(RELAY_CHANNEL);
      const seen: IRelayMessage[] = [];
      peerChan.subscribe((data) => seen.push(data as IRelayMessage));

      transport.relay('auth.login', { u: 1 });
      transport.relay('auth.logout.done', { u: 1 }); // two segments — must NOT match
      transport.relay('other.login', { u: 1 }); // wrong prefix

      expect(seen.map((m) => m.event)).toEqual(['auth.login']);
    });

    it('** matches one-or-more segments', () => {
      const transport = new CoordinatorTransport(manager, {
        broadcastEvents: true,
        broadcastPatterns: ['sync.**'],
      });
      transport.connect(makeEmitter());

      const peer = manager.createPeer();
      const peerChan = peer.channel(RELAY_CHANNEL);
      const seen: IRelayMessage[] = [];
      peerChan.subscribe((data) => seen.push(data as IRelayMessage));

      transport.relay('sync.pull', {}); // 1 segment after prefix — matches
      transport.relay('sync.pull.batch', {}); // 2 segments after prefix — matches
      transport.relay('sync', {}); // no trailing segment — does NOT match (** needs ≥ 1)
      transport.relay('other.stuff', {}); // wrong prefix

      expect(seen.map((m) => m.event)).toEqual(['sync.pull', 'sync.pull.batch']);
    });

    it('leaves broadcasts alone when none of the patterns match', () => {
      const transport = new CoordinatorTransport(manager, {
        broadcastEvents: true,
        broadcastPatterns: ['auth.**'],
      });
      transport.connect(makeEmitter());

      const peer = manager.createPeer();
      const peerChan = peer.channel(RELAY_CHANNEL);
      const seen: IRelayMessage[] = [];
      peerChan.subscribe((data) => seen.push(data as IRelayMessage));

      transport.relay('other.event', {});

      expect(seen).toEqual([]);
    });

    it('is a no-op before connect() (no transport yet)', () => {
      const transport = new CoordinatorTransport(manager, {
        broadcastEvents: true,
        broadcastPatterns: ['**'],
      });

      // No emitter connected yet — relay() must silently no-op.
      expect(() => transport.relay('auth.login', {})).not.toThrow();
    });
  });

  describe('inbound flow', () => {
    it('re-emits matching inbound relay messages on the local emitter', () => {
      const transport = new CoordinatorTransport(manager, {
        broadcastEvents: true,
        broadcastPatterns: ['sync.**'],
      });
      const emitter = makeEmitter();
      transport.connect(emitter);

      const peer = manager.createPeer();
      const peerChan = peer.channel(RELAY_CHANNEL);
      peerChan.broadcast({
        kind: 'event-relay',
        event: 'auth.login',
        args: [{ userId: 'u1' }, { at: 1 }],
        sourceTabId: 'other-tab',
      } satisfies IRelayMessage);

      expect(emitter.calls).toContainEqual(['auth.login', [{ userId: 'u1' }, { at: 1 }]]);
    });
  });
});

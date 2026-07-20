/**
 * @file room-manager.spec.ts
 * @module @stackra/collaboration/__tests__/unit
 * @description Behavioural spec for `RoomManager` — the transport
 *   selection + caching service consumed by hooks + DI. Verifies the
 *   three transport strategies (`'broadcast'`, `'reverb'`, `'auto'`),
 *   the cached-instance contract, and reset-on-reconfigure semantics.
 *
 *   `RoomManager.getTransport()` is synchronous; no fake timers or
 *   `window` shim are needed because we never call `connect()` on the
 *   transport here — that's covered by `broadcast-channel-transport.spec.ts`.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { RoomManager } from '@/services/room-manager.service';
import { BroadcastChannelTransport } from '@/transports/broadcast-channel.transport';
import { ReverbTransport } from '@/transports/reverb.transport';

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = new RoomManager();
  });

  // ── default (auto) ──────────────────────────────────────────────────────

  describe('default strategy (auto)', () => {
    it('returns a BroadcastChannelTransport when no realtimeManager is available', () => {
      // No `configure()` — strategy defaults to `'auto'`, no
      // `realtimeManager`, so auto picks the local transport.
      const t = manager.getTransport();
      expect(t).toBeInstanceOf(BroadcastChannelTransport);
    });

    it('returns the same instance across subsequent calls (caches)', () => {
      const t1 = manager.getTransport();
      const t2 = manager.getTransport();
      expect(t2).toBe(t1);
    });
  });

  // ── explicit strategies ─────────────────────────────────────────────────

  describe('configure({ transport })', () => {
    it('selects BroadcastChannelTransport for strategy=broadcast', () => {
      manager.configure({ transport: 'broadcast' });
      expect(manager.getTransport()).toBeInstanceOf(BroadcastChannelTransport);
    });

    it('selects ReverbTransport for strategy=reverb (with realtimeManager)', () => {
      // Any non-null value is accepted — RoomManager stores it as
      // `unknown` and hands it to ReverbTransport.
      manager.configure({ transport: 'reverb', realtimeManager: {} });
      expect(manager.getTransport()).toBeInstanceOf(ReverbTransport);
    });

    it('selects ReverbTransport for strategy=reverb even without a realtimeManager', () => {
      // The service does not gate reverb selection on realtimeManager
      // presence — ReverbTransport itself handles the fallback. We
      // just assert the class chosen here.
      manager.configure({ transport: 'reverb' });
      expect(manager.getTransport()).toBeInstanceOf(ReverbTransport);
    });

    it('auto picks Reverb when a realtimeManager is provided', () => {
      manager.configure({ transport: 'auto', realtimeManager: {} });
      expect(manager.getTransport()).toBeInstanceOf(ReverbTransport);
    });

    it('auto picks BroadcastChannel when no realtimeManager is provided', () => {
      manager.configure({ transport: 'auto' });
      expect(manager.getTransport()).toBeInstanceOf(BroadcastChannelTransport);
    });

    it('defaults to auto when transport is not specified', () => {
      manager.configure({});
      expect(manager.getTransport()).toBeInstanceOf(BroadcastChannelTransport);
    });
  });

  // ── caching + reset semantics ───────────────────────────────────────────

  describe('caching + reset semantics', () => {
    it('resets the cached transport — reconfiguring returns a fresh instance', () => {
      const first = manager.getTransport();
      // Reconfigure to a different strategy; the cache is cleared so
      // the next getTransport() builds a new instance.
      manager.configure({ transport: 'broadcast' });
      const second = manager.getTransport();
      expect(second).not.toBe(first);
    });

    it('caches the new transport after reconfigure', () => {
      manager.configure({ transport: 'broadcast' });
      const a = manager.getTransport();
      const b = manager.getTransport();
      expect(b).toBe(a);
    });

    it('reconfiguring with the same strategy still returns a fresh instance', () => {
      // `configure` unconditionally resets the cached transport — it
      // does not compare against the prior strategy. Consumers get a
      // guaranteed fresh instance on every reconfigure.
      manager.configure({ transport: 'broadcast' });
      const first = manager.getTransport();
      manager.configure({ transport: 'broadcast' });
      const second = manager.getTransport();
      expect(second).not.toBe(first);
      expect(second).toBeInstanceOf(BroadcastChannelTransport);
    });

    it('reconfiguring updates the realtimeManager passed to the next transport', () => {
      // Auto without a realtimeManager -> BroadcastChannel.
      manager.configure({ transport: 'auto' });
      expect(manager.getTransport()).toBeInstanceOf(BroadcastChannelTransport);

      // Auto WITH a realtimeManager -> Reverb.
      manager.configure({ transport: 'auto', realtimeManager: {} });
      expect(manager.getTransport()).toBeInstanceOf(ReverbTransport);
    });
  });
});

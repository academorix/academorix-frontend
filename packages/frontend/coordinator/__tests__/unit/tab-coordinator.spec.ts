/**
 * @file tab-coordinator.spec.ts
 * @module @stackra/coordinator/__tests__/unit
 * @description Behavioural spec for `TabCoordinator`. Uses fake
 *   timers to drive the election protocol and
 *   `MockTabTransportManager` for a fully in-memory cross-tab bus.
 *
 *   The coordinator is time-sensitive — `heartbeatMs` /
 *   `staleThresholdMs` control claim windows and stale-check
 *   intervals. Every test uses fake timers so behaviour is
 *   deterministic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { CoordinatorMessageKind } from '@/core/enums';
import { TabCoordinator } from '@/core/services/tab-coordinator.service';
import { MockTabTransportManager } from '@/testing/mock-tab-transport-manager';
import type { CoordinatorMessage } from '@/core/types';

// ════════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Advance timers enough for the coordinator's initial election
 * cycle: one `heartbeatMs` for the claim delay, plus a second for
 * the leader-promotion timeout.
 */
function tickElection(heartbeatMs: number): void {
  // Two consecutive delays chained via `setTimeout(...)` inside
  // `start()` → `claimLeadership()` → `becomeLeader()`.
  vi.advanceTimersByTime(heartbeatMs);
  vi.advanceTimersByTime(heartbeatMs);
}

describe('TabCoordinator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('SSR / no manager fallback', () => {
    it('becomes an immediate leader when no transport manager is injected', () => {
      const coordinator = new TabCoordinator(undefined);
      expect(coordinator.isLeader()).toBe(true);
      expect(coordinator.getRole()).toBe('leader');
      expect(coordinator.getLeaderId()).toBe(coordinator.getTabId());
      coordinator.destroy();
    });

    it('becomes an immediate leader when the manager reports unsupported', () => {
      const manager = new MockTabTransportManager();
      manager.simulateUnsupported();
      const coordinator = new TabCoordinator(manager);
      expect(coordinator.isLeader()).toBe(true);
      coordinator.destroy();
    });
  });

  describe('election', () => {
    it('promotes itself to leader when nobody else responds', () => {
      const manager = new MockTabTransportManager();
      const coordinator = new TabCoordinator(manager, { heartbeatMs: 50 });

      expect(coordinator.isLeader()).toBe(false); // starts as follower

      // Fire the delayed CLAIM + promotion window.
      tickElection(50);

      expect(coordinator.isLeader()).toBe(true);
      expect(coordinator.getLeaderId()).toBe(coordinator.getTabId());
      coordinator.destroy();
    });

    it('fires onRoleChange when the role flips', () => {
      const manager = new MockTabTransportManager();
      const coordinator = new TabCoordinator(manager, { heartbeatMs: 20 });
      const roles: string[] = [];
      coordinator.onRoleChange((r) => roles.push(r));

      tickElection(20);

      expect(roles).toEqual(['leader']);
      coordinator.destroy();
    });
  });

  describe('message handling', () => {
    it('adopts the sender of a HEARTBEAT as leader', () => {
      const manager = new MockTabTransportManager();
      const coordinator = new TabCoordinator(manager, { heartbeatMs: 20 });

      const peer = manager.createPeer();
      const peerChan = peer.channel('stackra-coordinator:leader');
      const msg: CoordinatorMessage = {
        kind: CoordinatorMessageKind.HEARTBEAT,
        tabId: 'peer-tab',
        at: Date.now(),
      };
      peerChan.broadcast(msg);

      expect(coordinator.getLeaderId()).toBe('peer-tab');
      coordinator.destroy();
    });

    it('demotes itself when a peer HEARTBEAT arrives while it is leader', () => {
      const manager = new MockTabTransportManager();
      const coordinator = new TabCoordinator(manager, { heartbeatMs: 20 });
      tickElection(20); // become leader

      expect(coordinator.isLeader()).toBe(true);

      const peer = manager.createPeer();
      const peerChan = peer.channel('stackra-coordinator:leader');
      peerChan.broadcast({
        kind: CoordinatorMessageKind.HEARTBEAT,
        tabId: 'other-leader',
        at: Date.now(),
      } satisfies CoordinatorMessage);

      expect(coordinator.isLeader()).toBe(false);
      expect(coordinator.getLeaderId()).toBe('other-leader');
      coordinator.destroy();
    });

    it('reclaims leadership after a RESIGNED message from the current leader', () => {
      const manager = new MockTabTransportManager();
      const coordinator = new TabCoordinator(manager, { heartbeatMs: 20 });

      const peer = manager.createPeer();
      const peerChan = peer.channel('stackra-coordinator:leader');
      // Establish `other-leader` first.
      peerChan.broadcast({
        kind: CoordinatorMessageKind.HEARTBEAT,
        tabId: 'other-leader',
        at: Date.now(),
      } satisfies CoordinatorMessage);
      expect(coordinator.getLeaderId()).toBe('other-leader');

      // Now the peer resigns — coordinator should attempt to claim.
      peerChan.broadcast({
        kind: CoordinatorMessageKind.RESIGNED,
        tabId: 'other-leader',
      } satisfies CoordinatorMessage);

      // Post-RESIGNED, leaderId is null and a CLAIM was scheduled.
      // Fire the pending timeouts to complete the claim.
      vi.advanceTimersByTime(20);
      vi.advanceTimersByTime(20);
      expect(coordinator.isLeader()).toBe(true);
      coordinator.destroy();
    });

    it('leader responds to an ANNOUNCE with an immediate HEARTBEAT', () => {
      const manager = new MockTabTransportManager();
      const coordinator = new TabCoordinator(manager, { heartbeatMs: 20 });
      tickElection(20); // become leader

      const peer = manager.createPeer();
      const peerChan = peer.channel('stackra-coordinator:leader');
      const seen: CoordinatorMessage[] = [];
      peerChan.subscribe((data) => seen.push(data as CoordinatorMessage));

      peerChan.broadcast({
        kind: CoordinatorMessageKind.ANNOUNCE,
        tabId: 'new-tab',
        at: Date.now(),
      } satisfies CoordinatorMessage);

      // The leader should have emitted a HEARTBEAT in response.
      expect(seen.some((m) => m.kind === CoordinatorMessageKind.HEARTBEAT)).toBe(true);
      coordinator.destroy();
    });
  });

  describe('resign', () => {
    it('demotes leader → follower and clears the leaderId', () => {
      const manager = new MockTabTransportManager();
      const coordinator = new TabCoordinator(manager, { heartbeatMs: 20 });
      tickElection(20);
      expect(coordinator.isLeader()).toBe(true);

      const roles: string[] = [];
      coordinator.onRoleChange((r) => roles.push(r));

      coordinator.resign();

      expect(coordinator.isLeader()).toBe(false);
      expect(coordinator.getRole()).toBe('follower');
      expect(coordinator.getLeaderId()).toBeNull();
      expect(roles).toEqual(['follower']);
      coordinator.destroy();
    });

    it('is a no-op when not currently leader', () => {
      const manager = new MockTabTransportManager();
      const coordinator = new TabCoordinator(manager, { heartbeatMs: 20 });
      // Do not tick — still a follower.

      const roles: string[] = [];
      coordinator.onRoleChange((r) => roles.push(r));
      coordinator.resign();
      expect(roles).toEqual([]);
      coordinator.destroy();
    });
  });

  describe('destroy', () => {
    it('unsubscribes from the transport but leaves the shared channel cached', () => {
      const manager = new MockTabTransportManager();
      const coordinator = new TabCoordinator(manager, { heartbeatMs: 20 });
      tickElection(20);
      expect(manager.hasChannel('stackra-coordinator:leader')).toBe(true);

      coordinator.destroy();

      // The manager keeps the channel — its lifecycle is not the
      // coordinator's to manage. Other consumers can still use it.
      expect(manager.hasChannel('stackra-coordinator:leader')).toBe(true);

      // Post-destroy, incoming messages must not flip state.
      const priorLeader = coordinator.getLeaderId();
      const peer = manager.createPeer();
      const peerChan = peer.channel('stackra-coordinator:leader');
      peerChan.broadcast({
        kind: CoordinatorMessageKind.HEARTBEAT,
        tabId: 'someone-else',
        at: Date.now(),
      } satisfies CoordinatorMessage);
      expect(coordinator.getLeaderId()).toBe(priorLeader);
    });

    it('is idempotent — a second destroy() does not throw', () => {
      const manager = new MockTabTransportManager();
      const coordinator = new TabCoordinator(manager, { heartbeatMs: 20 });
      coordinator.destroy();
      expect(() => coordinator.destroy()).not.toThrow();
    });
  });
});

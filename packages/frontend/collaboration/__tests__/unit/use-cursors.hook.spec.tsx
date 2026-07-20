// @vitest-environment jsdom
/**
 * @file use-cursors.hook.spec.tsx
 * @module @stackra/collaboration/__tests__/unit
 * @description Behavioural spec for `useCursors` — the transport-backed
 *   cursor tracking hook.
 *
 *   Covers:
 *   - Inbound `CURSOR_MOVE` broadcasts populate the `cursors` map keyed
 *     by `userId` (with the sender's `name` + `color` copied through).
 *   - Inbound `CURSOR_REMOVE` broadcasts drop the entry.
 *   - `onMemberLeave` drops the entry for the leaving member.
 *   - `updateCursor({x, y})` broadcasts `CURSOR_MOVE` and is throttled
 *     to a single call every 16ms (`THROTTLE_MS`).
 *   - Unmount unsubscribes every listener and clears the map.
 *
 *   `useInject` is mocked at the `@stackra/container/react` boundary
 *   so a `MockRoomManager` stands in for the DI-resolved instance.
 */

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COLLABORATION_EVENTS } from '@stackra/contracts';

import { MockRoomManager, MockCollaborationTransport } from '@/testing';
import type { RoomMember } from '@/interfaces/room-member.interface';

// ── Mock `@stackra/container/react` ─────────────────────────────────────────
//
// The mock is hoisted above imports. `useInject` always returns the
// current `state.manager`, which each `beforeEach` swaps in.

const state = vi.hoisted(() => ({
  manager: null as MockRoomManager | null,
}));

vi.mock('@stackra/container/react', () => ({
  useInject: () => state.manager,
}));

// AFTER the mock — import the hook.
import { useCursors } from '@/hooks/use-cursors/use-cursors.hook';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Build a `RoomMember` fixture with sensible defaults. */
function member(overrides: Partial<RoomMember> = {}): RoomMember {
  return {
    userId: overrides.userId ?? 'user-remote',
    name: overrides.name ?? 'Remote',
    color: overrides.color ?? '#3498db',
    joinedAt: overrides.joinedAt ?? Date.now(),
    presence: overrides.presence ?? {},
  };
}

// ── Spec ────────────────────────────────────────────────────────────────────

describe('useCursors', () => {
  let manager: MockRoomManager;
  let transport: MockCollaborationTransport;

  beforeEach(() => {
    manager = new MockRoomManager();
    transport = manager.getTransport() as MockCollaborationTransport;
    state.manager = manager;
  });

  afterEach(() => {
    cleanup();
    manager.reset();
    state.manager = null;
    vi.useRealTimers();
  });

  // ── Inbound events ───────────────────────────────────────────────────────

  describe('inbound events', () => {
    it('adds the sender to the cursors map when a CURSOR_MOVE broadcast arrives', () => {
      const { result } = renderHook(() => useCursors('room-1'));

      // No cursors before an event arrives.
      expect(result.current.cursors.size).toBe(0);

      const sender = member({ userId: 'user-a', name: 'Alice', color: '#e74c3c' });
      act(() => {
        transport.simulateBroadcast(
          'room-1',
          COLLABORATION_EVENTS.CURSOR_MOVE,
          { x: 100, y: 200 },
          sender
        );
      });

      expect(result.current.cursors.size).toBe(1);
      const entry = result.current.cursors.get('user-a');
      // The full CursorPosition shape is assembled from the sender +
      // payload — assert both halves are copied through.
      expect(entry).toEqual({
        x: 100,
        y: 200,
        userId: 'user-a',
        name: 'Alice',
        color: '#e74c3c',
      });
    });

    it('overwrites an existing cursor when the same user broadcasts again', () => {
      const { result } = renderHook(() => useCursors('room-1'));
      const sender = member({ userId: 'user-a', name: 'Alice' });

      act(() => {
        transport.simulateBroadcast(
          'room-1',
          COLLABORATION_EVENTS.CURSOR_MOVE,
          { x: 10, y: 20 },
          sender
        );
      });
      act(() => {
        transport.simulateBroadcast(
          'room-1',
          COLLABORATION_EVENTS.CURSOR_MOVE,
          { x: 50, y: 60 },
          sender
        );
      });

      expect(result.current.cursors.size).toBe(1);
      expect(result.current.cursors.get('user-a')).toMatchObject({ x: 50, y: 60 });
    });

    it('removes the entry when a CURSOR_REMOVE broadcast arrives', () => {
      const { result } = renderHook(() => useCursors('room-1'));
      const alice = member({ userId: 'user-a', name: 'Alice' });
      const bob = member({ userId: 'user-b', name: 'Bob' });

      act(() => {
        transport.simulateBroadcast(
          'room-1',
          COLLABORATION_EVENTS.CURSOR_MOVE,
          { x: 1, y: 2 },
          alice
        );
        transport.simulateBroadcast(
          'room-1',
          COLLABORATION_EVENTS.CURSOR_MOVE,
          { x: 3, y: 4 },
          bob
        );
      });
      expect(result.current.cursors.size).toBe(2);

      act(() => {
        transport.simulateBroadcast(
          'room-1',
          COLLABORATION_EVENTS.CURSOR_REMOVE,
          { userId: 'user-a' },
          alice
        );
      });

      expect(result.current.cursors.size).toBe(1);
      expect(result.current.cursors.has('user-a')).toBe(false);
      expect(result.current.cursors.has('user-b')).toBe(true);
    });

    it('removes the entry when the member leaves the room', () => {
      const { result } = renderHook(() => useCursors('room-1'));
      const alice = member({ userId: 'user-a', name: 'Alice' });

      act(() => {
        transport.simulateBroadcast(
          'room-1',
          COLLABORATION_EVENTS.CURSOR_MOVE,
          { x: 1, y: 2 },
          alice
        );
        // The mock's `simulateMemberJoin` also seeds the member map so
        // `simulateMemberLeave` has an entry to delete.
        transport.simulateMemberJoin('room-1', alice);
      });
      expect(result.current.cursors.size).toBe(1);

      act(() => {
        transport.simulateMemberLeave('room-1', 'user-a');
      });

      expect(result.current.cursors.size).toBe(0);
    });
  });

  // ── updateCursor + throttling ───────────────────────────────────────────

  describe('updateCursor + throttling', () => {
    it('broadcasts a CURSOR_MOVE on the first call', () => {
      // Fake timers so `Date.now()` (used inside the throttle) is
      // deterministic and starts at a known value.
      vi.useFakeTimers();
      const { result } = renderHook(() => useCursors('room-1'));

      act(() => {
        result.current.updateCursor({ x: 42, y: 99 });
      });

      const moves = transport.broadcasts.filter(
        (b) => b.event === COLLABORATION_EVENTS.CURSOR_MOVE
      );
      expect(moves).toHaveLength(1);
      expect(moves[0]?.roomId).toBe('room-1');
      expect(moves[0]?.data).toEqual({ x: 42, y: 99 });
    });

    it('drops calls within the 16ms throttle window', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useCursors('room-1'));

      // First call — passes.
      act(() => {
        result.current.updateCursor({ x: 1, y: 1 });
      });
      // Advance 10ms — still inside the window.
      act(() => {
        vi.advanceTimersByTime(10);
      });
      // Second call — dropped.
      act(() => {
        result.current.updateCursor({ x: 2, y: 2 });
      });

      const moves = transport.broadcasts.filter(
        (b) => b.event === COLLABORATION_EVENTS.CURSOR_MOVE
      );
      expect(moves).toHaveLength(1);
      expect(moves[0]?.data).toEqual({ x: 1, y: 1 });
    });

    it('passes a second call once the 16ms window has elapsed', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useCursors('room-1'));

      act(() => {
        result.current.updateCursor({ x: 1, y: 1 });
      });
      act(() => {
        // Jump past the throttle. 20 > 16 — the next call is allowed.
        vi.advanceTimersByTime(20);
      });
      act(() => {
        result.current.updateCursor({ x: 2, y: 2 });
      });

      const moves = transport.broadcasts.filter(
        (b) => b.event === COLLABORATION_EVENTS.CURSOR_MOVE
      );
      expect(moves).toHaveLength(2);
      expect(moves[1]?.data).toEqual({ x: 2, y: 2 });
    });
  });

  // ── Cleanup on unmount ──────────────────────────────────────────────────

  describe('cleanup', () => {
    it('unsubscribes broadcast + presence listeners on unmount', () => {
      const { unmount, result } = renderHook(() => useCursors('room-1'));

      // Prime a cursor before unmount so we can assert the map clears.
      const alice = member({ userId: 'user-a', name: 'Alice' });
      act(() => {
        transport.simulateBroadcast(
          'room-1',
          COLLABORATION_EVENTS.CURSOR_MOVE,
          { x: 1, y: 2 },
          alice
        );
      });
      expect(result.current.cursors.size).toBe(1);

      unmount();

      // After unmount, further broadcasts must not be observable —
      // the mock keeps a `Set` of listeners, so `size === 0` is the
      // strongest assertion available without touching internals.
      const room = (transport as unknown as { rooms: Map<string, unknown> }).rooms.get('room-1') as
        | {
            memberJoinListeners: Set<unknown>;
            memberLeaveListeners: Set<unknown>;
            broadcastListeners: Map<string, Set<unknown>>;
          }
        | undefined;
      expect(room?.memberJoinListeners.size).toBe(0);
      expect(room?.memberLeaveListeners.size).toBe(0);
      // The broadcast bucket is emptied AND the key deleted when its
      // Set is empty — see MockCollaborationTransport.onBroadcast.
      expect(room?.broadcastListeners.has(COLLABORATION_EVENTS.CURSOR_MOVE)).toBe(false);
      expect(room?.broadcastListeners.has(COLLABORATION_EVENTS.CURSOR_REMOVE)).toBe(false);
    });
  });
});

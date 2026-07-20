// @vitest-environment jsdom
/**
 * @file use-shared-state.hook.spec.tsx
 * @module @stackra/collaboration/__tests__/unit
 * @description Behavioural spec for `useSharedState` — the transport-
 *   backed last-write-wins shared state hook.
 *
 *   Covers:
 *   - Initialises with the caller's `initialState`.
 *   - Hydrates from `transport.getState(roomId)` on mount when the
 *     transport already holds a value.
 *   - Inbound `onStateChange` updates `state`, populates
 *     `meta.lastUpdatedBy` with the remote member, and increments
 *     `meta.version`.
 *   - Local `setState(value)` broadcasts via `transport.setState(...)`.
 *   - Local `setState((prev) => next)` calls the updater with the
 *     previous state.
 *   - Local `setState` sets `meta.lastUpdatedBy = null` (self-update).
 *   - Unsubscribes on unmount.
 *
 *   `useInject` is mocked so a `MockRoomManager` stands in.
 */

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MockRoomManager, MockCollaborationTransport } from "@/testing";

// ── Mock `@stackra/container/react` ─────────────────────────────────────────

const state = vi.hoisted(() => ({
  manager: null as MockRoomManager | null,
}));

vi.mock("@stackra/container/react", () => ({
  useInject: () => state.manager,
}));

// AFTER the mock — import the hook.
import { useSharedState } from "@/hooks/use-shared-state/use-shared-state.hook";

// ── Spec ────────────────────────────────────────────────────────────────────

describe("useSharedState", () => {
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
  });

  // ── Initialisation + hydration ──────────────────────────────────────────

  describe("initialisation", () => {
    it("exposes the initial state, a setState, and empty meta on first render", () => {
      const { result } = renderHook(() => useSharedState("room-1", { count: 0 }));
      const [value, setValue, meta] = result.current;

      expect(value).toEqual({ count: 0 });
      expect(typeof setValue).toBe("function");
      expect(meta).toEqual({ lastUpdatedBy: null, version: 0 });
    });

    it("hydrates from transport.getState when a value is already present", async () => {
      // Pre-seed the transport BEFORE mount so the hydration effect
      // reads the persisted value. `setState` on the transport also
      // fires state-change listeners — but nothing is listening yet,
      // so the seed lands cleanly.
      transport.setState<{ count: number }>("room-1", () => ({ count: 42 }));

      const { result } = renderHook(() =>
        useSharedState<{ count: number }>("room-1", { count: 0 }),
      );

      // Hydration happens synchronously in the effect, but React
      // batches — waitFor flushes.
      await waitFor(() => {
        expect(result.current[0]).toEqual({ count: 42 });
      });
    });

    it("keeps the initial state when transport.getState returns null", () => {
      const { result } = renderHook(() => useSharedState("room-1", { count: 0 }));
      // No pre-seeding — hydration returns null and initialState wins.
      expect(result.current[0]).toEqual({ count: 0 });
    });
  });

  // ── Inbound state change (remote) ───────────────────────────────────────

  describe("inbound state changes", () => {
    /** Fixture — a remote peer that owns the inbound state change. */
    const remote = {
      userId: "user-remote",
      name: "Remote",
      color: "#3498db",
      joinedAt: 0,
      presence: {},
    };

    it("updates state, populates meta.lastUpdatedBy, and increments version", () => {
      const { result } = renderHook(() =>
        useSharedState<{ count: number }>("room-1", { count: 0 }),
      );

      // `simulateStateChange` bypasses the connect handshake — it
      // fires the state listener directly with the supplied
      // `updatedBy`, matching the wire shape of a real peer's
      // setState arriving from another tab.
      act(() => {
        transport.simulateStateChange("room-1", { count: 7 }, remote);
      });

      const [value, , meta] = result.current;
      expect(value).toEqual({ count: 7 });
      expect(meta.lastUpdatedBy?.userId).toBe("user-remote");
      expect(meta.lastUpdatedBy?.name).toBe("Remote");
      expect(meta.version).toBe(1);
    });

    it("increments version on every remote state change", () => {
      const { result } = renderHook(() => useSharedState<number>("room-1", 0));

      act(() => {
        transport.simulateStateChange("room-1", 1, remote);
      });
      expect(result.current[2].version).toBe(1);

      act(() => {
        transport.simulateStateChange("room-1", 2, remote);
      });
      expect(result.current[2].version).toBe(2);

      act(() => {
        transport.simulateStateChange("room-1", 3, remote);
      });
      expect(result.current[2].version).toBe(3);
    });
  });

  // ── Local setState ──────────────────────────────────────────────────────

  describe("local setState", () => {
    it("broadcasts the new value via transport.setState", () => {
      const setStateSpy = vi.spyOn(transport, "setState");
      const { result } = renderHook(() => useSharedState<number>("room-1", 0));

      act(() => {
        result.current[1](5);
      });

      expect(setStateSpy).toHaveBeenCalledWith("room-1", expect.any(Function));
      // The updater passed to the transport returns the new value —
      // verify it produces 5 when called with any prev value.
      const [, updater] = setStateSpy.mock.calls[0]!;
      expect((updater as (prev: number) => number)(999)).toBe(5);
    });

    it("applies a functional updater against the previous state", () => {
      const { result } = renderHook(() => useSharedState<number>("room-1", 10));

      act(() => {
        result.current[1]((prev) => prev + 5);
      });

      expect(result.current[0]).toBe(15);
    });

    it("sets meta.lastUpdatedBy = null when the update originates locally", () => {
      // No transport.connect — the mock's `setState` will find no
      // `currentUserId` and skip listener notification, leaving only
      // the local branch of `useSharedState.setState` to run.
      const { result } = renderHook(() => useSharedState<number>("room-1", 0));

      act(() => {
        result.current[1](3);
      });

      expect(result.current[0]).toBe(3);
      expect(result.current[2].lastUpdatedBy).toBeNull();
      expect(result.current[2].version).toBe(1);
    });
  });

  // ── Cleanup ────────────────────────────────────────────────────────────

  describe("cleanup", () => {
    it("unsubscribes the state listener on unmount", () => {
      const { unmount } = renderHook(() => useSharedState<number>("room-1", 0));

      // Reach into the mock — `stateListeners` is a `Set` internal to
      // the room; the strongest cleanup assertion is that it empties.
      const rooms = (transport as unknown as { rooms: Map<string, unknown> }).rooms;
      const room = rooms.get("room-1") as { stateListeners: Set<unknown> };
      expect(room.stateListeners.size).toBe(1);

      unmount();

      expect(room.stateListeners.size).toBe(0);
    });
  });
});

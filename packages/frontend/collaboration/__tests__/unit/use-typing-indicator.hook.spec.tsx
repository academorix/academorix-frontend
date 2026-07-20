// @vitest-environment jsdom
/**
 * @file use-typing-indicator.hook.spec.tsx
 * @module @stackra/collaboration/__tests__/unit
 * @description Behavioural spec for `useTypingIndicator` — the transport-
 *   backed typing indicator hook.
 *
 *   Covers:
 *   - `TYPING_START` broadcasts add the sender's `name` to `typingUsers`
 *     (deduped via a `Set`).
 *   - After 3s of no further `TYPING_START` for a user, that user
 *     auto-expires from `typingUsers`.
 *   - A new `TYPING_START` from the same user before expiry resets
 *     the 3s window.
 *   - `TYPING_STOP` removes the sender's name immediately.
 *   - `onMemberLeave` removes the leaving user from `typingUsers`.
 *   - `startTyping()` broadcasts `TYPING_START` with an empty payload.
 *   - `stopTyping()` broadcasts `TYPING_STOP` with an empty payload.
 *   - Every timeout is cleared on unmount.
 *
 *   `useInject` is mocked so a `MockRoomManager` stands in. Fake timers
 *   drive the 3s auto-expiry deterministically.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COLLABORATION_EVENTS } from "@stackra/contracts";

import { MockRoomManager, MockCollaborationTransport } from "@/testing";
import type { RoomMember } from "@/interfaces/room-member.interface";

// ── Mock `@stackra/container/react` ─────────────────────────────────────────

const state = vi.hoisted(() => ({
  manager: null as MockRoomManager | null,
}));

vi.mock("@stackra/container/react", () => ({
  useInject: () => state.manager,
}));

// AFTER the mock — import the hook.
import { useTypingIndicator } from "@/hooks/use-typing-indicator/use-typing-indicator.hook";

// ── Helpers ─────────────────────────────────────────────────────────────────

function member(overrides: Partial<RoomMember> = {}): RoomMember {
  return {
    userId: overrides.userId ?? "user-remote",
    name: overrides.name ?? "Remote",
    color: overrides.color ?? "#3498db",
    joinedAt: overrides.joinedAt ?? Date.now(),
    presence: overrides.presence ?? {},
  };
}

// ── Spec ────────────────────────────────────────────────────────────────────

describe("useTypingIndicator", () => {
  let manager: MockRoomManager;
  let transport: MockCollaborationTransport;

  beforeEach(() => {
    // Fake timers so the 3s auto-expiry is drivable via
    // `vi.advanceTimersByTime`. Vitest v4 fakes `Date` too, so
    // `Date.now()` moves with the timer.
    vi.useFakeTimers();
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

  // ── Inbound TYPING_START ────────────────────────────────────────────────

  describe("inbound TYPING_START", () => {
    it("adds the sender name to typingUsers", () => {
      const { result } = renderHook(() => useTypingIndicator("room-1"));

      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.TYPING_START,
          {},
          member({ userId: "user-a", name: "Alice" }),
        );
      });

      expect(result.current.typingUsers).toEqual(["Alice"]);
    });

    it("deduplicates the same user typing multiple times", () => {
      const { result } = renderHook(() => useTypingIndicator("room-1"));
      const alice = member({ userId: "user-a", name: "Alice" });

      act(() => {
        transport.simulateBroadcast("room-1", COLLABORATION_EVENTS.TYPING_START, {}, alice);
        transport.simulateBroadcast("room-1", COLLABORATION_EVENTS.TYPING_START, {}, alice);
      });

      // Deduped via Set — one entry.
      expect(result.current.typingUsers).toEqual(["Alice"]);
    });

    it("tracks multiple typing users concurrently", () => {
      const { result } = renderHook(() => useTypingIndicator("room-1"));

      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.TYPING_START,
          {},
          member({ userId: "user-a", name: "Alice" }),
        );
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.TYPING_START,
          {},
          member({ userId: "user-b", name: "Bob" }),
        );
      });

      expect(result.current.typingUsers).toEqual(expect.arrayContaining(["Alice", "Bob"]));
      expect(result.current.typingUsers).toHaveLength(2);
    });
  });

  // ── Auto-expiry (3s) ────────────────────────────────────────────────────

  describe("auto-expiry", () => {
    it("drops the user from typingUsers after 3s of no further TYPING_START", () => {
      const { result } = renderHook(() => useTypingIndicator("room-1"));

      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.TYPING_START,
          {},
          member({ userId: "user-a", name: "Alice" }),
        );
      });
      expect(result.current.typingUsers).toEqual(["Alice"]);

      // Just before expiry — still typing.
      act(() => {
        vi.advanceTimersByTime(2999);
      });
      expect(result.current.typingUsers).toEqual(["Alice"]);

      // Cross the 3s boundary — should auto-drop.
      act(() => {
        vi.advanceTimersByTime(2);
      });
      expect(result.current.typingUsers).toEqual([]);
    });

    it("resets the 3s window when the same user types again before expiry", () => {
      const { result } = renderHook(() => useTypingIndicator("room-1"));
      const alice = member({ userId: "user-a", name: "Alice" });

      act(() => {
        transport.simulateBroadcast("room-1", COLLABORATION_EVENTS.TYPING_START, {}, alice);
      });

      // Half-way through — user types again, which should reset the
      // timer.
      act(() => {
        vi.advanceTimersByTime(1500);
        transport.simulateBroadcast("room-1", COLLABORATION_EVENTS.TYPING_START, {}, alice);
      });

      // Original expiry would have fired at 3000ms; check we're
      // still typing at 4000ms because the timer reset at 1500ms.
      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(result.current.typingUsers).toEqual(["Alice"]);

      // Full 3s AFTER the reset — now expiry fires.
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.typingUsers).toEqual([]);
    });
  });

  // ── Inbound TYPING_STOP ─────────────────────────────────────────────────

  describe("inbound TYPING_STOP", () => {
    it("removes the sender immediately", () => {
      const { result } = renderHook(() => useTypingIndicator("room-1"));
      const alice = member({ userId: "user-a", name: "Alice" });

      act(() => {
        transport.simulateBroadcast("room-1", COLLABORATION_EVENTS.TYPING_START, {}, alice);
      });
      expect(result.current.typingUsers).toEqual(["Alice"]);

      act(() => {
        transport.simulateBroadcast("room-1", COLLABORATION_EVENTS.TYPING_STOP, {}, alice);
      });
      expect(result.current.typingUsers).toEqual([]);
    });

    it("cancels the auto-expiry timeout so the user cannot reappear", () => {
      const { result } = renderHook(() => useTypingIndicator("room-1"));
      const alice = member({ userId: "user-a", name: "Alice" });

      act(() => {
        transport.simulateBroadcast("room-1", COLLABORATION_EVENTS.TYPING_START, {}, alice);
      });
      act(() => {
        transport.simulateBroadcast("room-1", COLLABORATION_EVENTS.TYPING_STOP, {}, alice);
      });

      // Advance well past the 3s expiry — no ghost expiry callback
      // should re-fire.
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current.typingUsers).toEqual([]);
    });
  });

  // ── Member leave ────────────────────────────────────────────────────────

  describe("member leave", () => {
    it("drops the leaving user from typingUsers", () => {
      const { result } = renderHook(() => useTypingIndicator("room-1"));
      const alice = member({ userId: "user-a", name: "Alice" });
      const bob = member({ userId: "user-b", name: "Bob" });

      act(() => {
        transport.simulateBroadcast("room-1", COLLABORATION_EVENTS.TYPING_START, {}, alice);
        transport.simulateBroadcast("room-1", COLLABORATION_EVENTS.TYPING_START, {}, bob);
        transport.simulateMemberJoin("room-1", alice);
        transport.simulateMemberJoin("room-1", bob);
      });
      expect(result.current.typingUsers).toHaveLength(2);

      act(() => {
        transport.simulateMemberLeave("room-1", "user-a");
      });

      expect(result.current.typingUsers).toEqual(["Bob"]);
    });
  });

  // ── startTyping / stopTyping ────────────────────────────────────────────

  describe("startTyping / stopTyping", () => {
    it("startTyping broadcasts TYPING_START with an empty payload", () => {
      const { result } = renderHook(() => useTypingIndicator("room-1"));

      act(() => {
        result.current.startTyping();
      });

      const [broadcast] = transport.broadcasts.filter(
        (b) => b.event === COLLABORATION_EVENTS.TYPING_START,
      );
      expect(broadcast?.roomId).toBe("room-1");
      expect(broadcast?.data).toEqual({});
    });

    it("stopTyping broadcasts TYPING_STOP with an empty payload", () => {
      const { result } = renderHook(() => useTypingIndicator("room-1"));

      act(() => {
        result.current.stopTyping();
      });

      const [broadcast] = transport.broadcasts.filter(
        (b) => b.event === COLLABORATION_EVENTS.TYPING_STOP,
      );
      expect(broadcast?.roomId).toBe("room-1");
      expect(broadcast?.data).toEqual({});
    });
  });

  // ── Cleanup ────────────────────────────────────────────────────────────

  describe("cleanup", () => {
    it("clears every outstanding timeout and empties typingUsers on unmount", () => {
      const { unmount, result } = renderHook(() => useTypingIndicator("room-1"));
      const alice = member({ userId: "user-a", name: "Alice" });

      act(() => {
        transport.simulateBroadcast("room-1", COLLABORATION_EVENTS.TYPING_START, {}, alice);
      });
      expect(result.current.typingUsers).toEqual(["Alice"]);

      unmount();

      // Advance past the auto-expiry — since timeouts were cleared,
      // no ghost callback fires.
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      const rooms = (transport as unknown as { rooms: Map<string, unknown> }).rooms;
      const room = rooms.get("room-1") as {
        memberLeaveListeners: Set<unknown>;
        broadcastListeners: Map<string, Set<unknown>>;
      };
      expect(room.memberLeaveListeners.size).toBe(0);
      expect(room.broadcastListeners.has(COLLABORATION_EVENTS.TYPING_START)).toBe(false);
      expect(room.broadcastListeners.has(COLLABORATION_EVENTS.TYPING_STOP)).toBe(false);
    });
  });
});

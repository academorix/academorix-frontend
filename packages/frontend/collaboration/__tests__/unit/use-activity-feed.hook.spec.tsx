// @vitest-environment jsdom
/**
 * @file use-activity-feed.hook.spec.tsx
 * @module @stackra/collaboration/__tests__/unit
 * @description Behavioural spec for `useActivityFeed` — the transport-
 *   backed room activity timeline.
 *
 *   Covers:
 *   - `isLoading` flips to `false` once the transport is attached.
 *   - `onMemberJoin` pushes a `type: 'join'` entry.
 *   - `onMemberLeave` pushes a `type: 'leave'` entry.
 *   - `onStateChange` pushes a `type: 'state_change'` entry.
 *   - `THREAD_CREATE` broadcast pushes a `type: 'thread_create'` entry.
 *   - `THREAD_RESOLVE` broadcast pushes a `type: 'thread_resolve'`
 *     entry.
 *   - Manual `addActivity(...)` pushes with a generated id + timestamp.
 *   - Entries stay newest-first and cap at 50.
 *   - Every listener is unsubscribed on unmount.
 *
 *   `useInject` is mocked so a `MockRoomManager` stands in.
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
import { useActivityFeed } from "@/hooks/use-activity-feed/use-activity-feed.hook";

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

describe("useActivityFeed", () => {
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

  // ── Initialisation ──────────────────────────────────────────────────────

  describe("initialisation", () => {
    it("starts with an empty feed and isLoading=true, then flips to false after mount", () => {
      // `isLoading` starts at `true` (the useState default) and is
      // flipped to `false` inside the effect. Since renderHook commits
      // synchronously and effects flush before the first return, the
      // observable value is already `false`.
      const { result } = renderHook(() => useActivityFeed("room-1"));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.activities).toEqual([]);
    });
  });

  // ── Inbound events ──────────────────────────────────────────────────────

  describe("inbound events", () => {
    it("pushes a join entry when a member joins", () => {
      const { result } = renderHook(() => useActivityFeed("room-1"));

      act(() => {
        transport.simulateMemberJoin("room-1", member({ userId: "user-a", name: "Alice" }));
      });

      expect(result.current.activities).toHaveLength(1);
      expect(result.current.activities[0]).toMatchObject({
        type: "join",
        userId: "user-a",
        userName: "Alice",
        message: "Alice joined the room",
      });
      expect(result.current.activities[0]?.id).toEqual(expect.any(String));
      expect(result.current.activities[0]?.timestamp).toEqual(expect.any(Number));
    });

    it("pushes a leave entry when a member leaves", () => {
      const { result } = renderHook(() => useActivityFeed("room-1"));
      const alice = member({ userId: "user-a", name: "Alice" });

      act(() => {
        transport.simulateMemberJoin("room-1", alice);
        transport.simulateMemberLeave("room-1", "user-a");
      });

      const [leave] = result.current.activities;
      expect(leave).toMatchObject({
        type: "leave",
        userId: "user-a",
        userName: "Alice",
        message: "Alice left the room",
      });
    });

    it("pushes a state_change entry when the shared state changes", async () => {
      const { result } = renderHook(() => useActivityFeed("room-1"));

      // Wrap the connect in `act` — the mock's `connect` fires the
      // memberJoinListeners synchronously, which triggers a React
      // state update (the join is pushed to the feed).
      await act(async () => {
        await transport.connect("room-1", "user-a", {
          name: "Alice",
          color: "#e74c3c",
        });
      });

      act(() => {
        transport.setState("room-1", () => ({ count: 1 }));
      });

      // The join fired first (via connect), then the state_change.
      // Feed is newest-first, so [0] is the state_change.
      expect(result.current.activities[0]).toMatchObject({
        type: "state_change",
        userId: "user-a",
        userName: "Alice",
        message: "Alice updated the shared state",
      });
    });

    it("pushes a thread_create entry when a THREAD_CREATE broadcast arrives", () => {
      const { result } = renderHook(() => useActivityFeed("room-1"));

      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.THREAD_CREATE,
          { id: "thr-a" },
          member({ userId: "user-a", name: "Alice" }),
        );
      });

      expect(result.current.activities[0]).toMatchObject({
        type: "thread_create",
        userId: "user-a",
        userName: "Alice",
        message: "Alice started a new thread",
      });
    });

    it("pushes a thread_resolve entry when a THREAD_RESOLVE broadcast arrives", () => {
      const { result } = renderHook(() => useActivityFeed("room-1"));

      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.THREAD_RESOLVE,
          { threadId: "thr-a" },
          member({ userId: "user-a", name: "Alice" }),
        );
      });

      expect(result.current.activities[0]).toMatchObject({
        type: "thread_resolve",
        userId: "user-a",
        userName: "Alice",
        message: "Alice resolved a thread",
      });
    });
  });

  // ── Ordering + cap ──────────────────────────────────────────────────────

  describe("ordering + cap", () => {
    it("keeps entries newest-first", () => {
      const { result } = renderHook(() => useActivityFeed("room-1"));

      act(() => {
        transport.simulateMemberJoin("room-1", member({ userId: "user-a", name: "Alice" }));
      });
      act(() => {
        transport.simulateMemberJoin("room-1", member({ userId: "user-b", name: "Bob" }));
      });

      expect(result.current.activities[0]?.userId).toBe("user-b");
      expect(result.current.activities[1]?.userId).toBe("user-a");
    });

    it("caps the timeline at 50 entries", () => {
      const { result } = renderHook(() => useActivityFeed("room-1"));

      act(() => {
        // Push 60 joins — the newest 50 survive.
        for (let i = 0; i < 60; i += 1) {
          transport.simulateMemberJoin(
            "room-1",
            member({ userId: `user-${i}`, name: `User-${i}` }),
          );
        }
      });

      expect(result.current.activities).toHaveLength(50);
      // Newest first — user-59 leads, user-10 is the oldest survivor.
      expect(result.current.activities[0]?.userId).toBe("user-59");
      expect(result.current.activities[49]?.userId).toBe("user-10");
    });
  });

  // ── addActivity ─────────────────────────────────────────────────────────

  describe("addActivity()", () => {
    it("pushes an entry with a generated id + timestamp", () => {
      const { result } = renderHook(() => useActivityFeed("room-1"));

      act(() => {
        result.current.addActivity({
          type: "message",
          userId: "user-a",
          userName: "Alice",
          message: "sent a message",
        });
      });

      const [entry] = result.current.activities;
      expect(entry).toMatchObject({
        type: "message",
        userId: "user-a",
        userName: "Alice",
        message: "sent a message",
      });
      expect(entry?.id).toEqual(expect.any(String));
      expect(entry?.timestamp).toEqual(expect.any(Number));
    });

    it("participates in the 50-entry cap", () => {
      const { result } = renderHook(() => useActivityFeed("room-1"));

      act(() => {
        for (let i = 0; i < 55; i += 1) {
          result.current.addActivity({
            type: "message",
            userId: `user-${i}`,
            userName: `User-${i}`,
            message: `msg-${i}`,
          });
        }
      });

      expect(result.current.activities).toHaveLength(50);
      expect(result.current.activities[0]?.message).toBe("msg-54");
      expect(result.current.activities[49]?.message).toBe("msg-5");
    });
  });

  // ── Cleanup ────────────────────────────────────────────────────────────

  describe("cleanup", () => {
    it("unsubscribes every listener on unmount", () => {
      const { unmount } = renderHook(() => useActivityFeed("room-1"));

      const rooms = (transport as unknown as { rooms: Map<string, unknown> }).rooms;
      const room = rooms.get("room-1") as {
        memberJoinListeners: Set<unknown>;
        memberLeaveListeners: Set<unknown>;
        stateListeners: Set<unknown>;
        broadcastListeners: Map<string, Set<unknown>>;
      };
      expect(room.memberJoinListeners.size).toBe(1);
      expect(room.memberLeaveListeners.size).toBe(1);
      expect(room.stateListeners.size).toBe(1);
      // Two broadcast buckets: THREAD_CREATE + THREAD_RESOLVE.
      expect(room.broadcastListeners.size).toBe(2);

      unmount();

      expect(room.memberJoinListeners.size).toBe(0);
      expect(room.memberLeaveListeners.size).toBe(0);
      expect(room.stateListeners.size).toBe(0);
      expect(room.broadcastListeners.size).toBe(0);
    });
  });
});

// @vitest-environment jsdom
/**
 * @file use-threads.hook.spec.tsx
 * @module @stackra/collaboration/__tests__/unit
 * @description Behavioural spec for `useThreads` — the thread CRUD hook.
 *
 *   Covers, for each CRUD verb (create, reply, resolve, delete):
 *   1. The local optimistic update lands in `threads`.
 *   2. A matching broadcast is recorded on the transport.
 *
 *   Also verifies inbound broadcasts apply the same mutations, and that
 *   every listener is unsubscribed on unmount.
 *
 *   `useInject` is mocked so a `MockRoomManager` stands in.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COLLABORATION_EVENTS } from "@stackra/contracts";

import { MockRoomManager, MockCollaborationTransport } from "@/testing";
import type { RoomMember } from "@/interfaces/room-member.interface";
import type { Thread, ThreadMessage } from "@/interfaces/thread.interface";

// ── Mock `@stackra/container/react` ─────────────────────────────────────────

const state = vi.hoisted(() => ({
  manager: null as MockRoomManager | null,
}));

vi.mock("@stackra/container/react", () => ({
  useInject: () => state.manager,
}));

// AFTER the mock — import the hook.
import { useThreads } from "@/hooks/use-threads/use-threads.hook";

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

function makeThread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: overrides.id ?? "thread-remote",
    roomId: overrides.roomId ?? "room-1",
    elementId: overrides.elementId,
    messages: overrides.messages ?? [],
    resolved: overrides.resolved ?? false,
    createdBy: overrides.createdBy ?? "user-remote",
    createdByName: overrides.createdByName ?? "Remote",
    createdAt: overrides.createdAt ?? Date.now(),
  };
}

function makeMessage(overrides: Partial<ThreadMessage> = {}): ThreadMessage {
  return {
    id: overrides.id ?? "msg-remote",
    body: overrides.body ?? "Hello",
    createdBy: overrides.createdBy ?? "user-remote",
    createdByName: overrides.createdByName ?? "Remote",
    createdAt: overrides.createdAt ?? Date.now(),
  };
}

// ── Spec ────────────────────────────────────────────────────────────────────

describe("useThreads", () => {
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

  // ── Local: createThread ─────────────────────────────────────────────────

  describe("createThread()", () => {
    it("appends a new thread locally with sane shape", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-alice", "Alice"));

      act(() => {
        result.current.createThread("First discussion");
      });

      expect(result.current.threads).toHaveLength(1);
      const [thread] = result.current.threads;
      // Assert the SHAPE, not the exact id (uses `Math.random` under
      // the hood — the audit backlog flags this).
      expect(thread).toMatchObject({
        id: expect.any(String),
        roomId: "room-1",
        resolved: false,
        createdBy: "user-alice",
        createdByName: "Alice",
        createdAt: expect.any(Number),
      });
      expect(thread?.messages).toHaveLength(1);
      expect(thread?.messages[0]).toMatchObject({
        id: expect.any(String),
        body: "First discussion",
        createdBy: "user-alice",
        createdByName: "Alice",
        createdAt: expect.any(Number),
      });
    });

    it("threads elementId through when supplied", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-alice", "Alice"));
      act(() => {
        result.current.createThread("anchored", "btn-submit");
      });
      expect(result.current.threads[0]?.elementId).toBe("btn-submit");
    });

    it("broadcasts a THREAD_CREATE with the constructed thread as payload", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-alice", "Alice"));

      act(() => {
        result.current.createThread("broadcast me");
      });

      const [broadcast] = transport.broadcasts.filter(
        (b) => b.event === COLLABORATION_EVENTS.THREAD_CREATE,
      );
      expect(broadcast?.roomId).toBe("room-1");
      // The payload IS the thread — same reference as the local
      // list entry.
      expect(broadcast?.data).toEqual(result.current.threads[0]);
    });
  });

  // ── Local: reply ────────────────────────────────────────────────────────

  describe("reply()", () => {
    it("appends a message to the matching thread locally", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-alice", "Alice"));
      act(() => {
        result.current.createThread("root");
      });
      const parentId = result.current.threads[0]!.id;

      act(() => {
        result.current.reply(parentId, "reply body");
      });

      const [thread] = result.current.threads;
      expect(thread?.messages).toHaveLength(2);
      expect(thread?.messages[1]).toMatchObject({
        body: "reply body",
        createdBy: "user-alice",
        createdByName: "Alice",
      });
    });

    it("broadcasts THREAD_REPLY with { threadId, message }", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-alice", "Alice"));
      act(() => {
        result.current.createThread("root");
      });
      const parentId = result.current.threads[0]!.id;

      act(() => {
        result.current.reply(parentId, "reply body");
      });

      const [broadcast] = transport.broadcasts.filter(
        (b) => b.event === COLLABORATION_EVENTS.THREAD_REPLY,
      );
      expect(broadcast?.roomId).toBe("room-1");
      expect(broadcast?.data).toMatchObject({
        threadId: parentId,
        message: expect.objectContaining({ body: "reply body" }),
      });
    });
  });

  // ── Local: resolve ──────────────────────────────────────────────────────

  describe("resolve()", () => {
    it("marks the thread resolved locally", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-alice", "Alice"));
      act(() => {
        result.current.createThread("root");
      });
      const parentId = result.current.threads[0]!.id;

      act(() => {
        result.current.resolve(parentId);
      });

      expect(result.current.threads[0]?.resolved).toBe(true);
    });

    it("broadcasts THREAD_RESOLVE with { threadId }", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-alice", "Alice"));
      act(() => {
        result.current.createThread("root");
      });
      const parentId = result.current.threads[0]!.id;

      act(() => {
        result.current.resolve(parentId);
      });

      const [broadcast] = transport.broadcasts.filter(
        (b) => b.event === COLLABORATION_EVENTS.THREAD_RESOLVE,
      );
      expect(broadcast?.data).toEqual({ threadId: parentId });
    });
  });

  // ── Local: deleteThread ─────────────────────────────────────────────────

  describe("deleteThread()", () => {
    it("removes the thread locally", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-alice", "Alice"));
      act(() => {
        result.current.createThread("a");
        result.current.createThread("b");
      });
      const [threadA, threadB] = result.current.threads;

      act(() => {
        result.current.deleteThread(threadA!.id);
      });

      expect(result.current.threads).toHaveLength(1);
      expect(result.current.threads[0]?.id).toBe(threadB!.id);
    });

    it("broadcasts THREAD_DELETE with { threadId }", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-alice", "Alice"));
      act(() => {
        result.current.createThread("a");
      });
      const parentId = result.current.threads[0]!.id;

      act(() => {
        result.current.deleteThread(parentId);
      });

      const [broadcast] = transport.broadcasts.filter(
        (b) => b.event === COLLABORATION_EVENTS.THREAD_DELETE,
      );
      expect(broadcast?.data).toEqual({ threadId: parentId });
    });
  });

  // ── Inbound broadcasts ──────────────────────────────────────────────────

  describe("inbound broadcasts", () => {
    it("appends a thread when THREAD_CREATE arrives", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-self", "Self"));
      const remote = makeThread({ id: "thr-a", createdByName: "Alice" });

      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.THREAD_CREATE,
          remote,
          member({ userId: "user-alice", name: "Alice" }),
        );
      });

      expect(result.current.threads).toHaveLength(1);
      expect(result.current.threads[0]?.id).toBe("thr-a");
    });

    it("appends a message to the matching thread when THREAD_REPLY arrives", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-self", "Self"));
      const remoteThread = makeThread({ id: "thr-a" });

      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.THREAD_CREATE,
          remoteThread,
          member(),
        );
      });

      const message = makeMessage({ id: "msg-2", body: "inbound reply" });
      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.THREAD_REPLY,
          { threadId: "thr-a", message },
          member(),
        );
      });

      expect(result.current.threads[0]?.messages).toHaveLength(1);
      expect(result.current.threads[0]?.messages[0]?.body).toBe("inbound reply");
    });

    it("flips resolved=true when THREAD_RESOLVE arrives", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-self", "Self"));
      const remoteThread = makeThread({ id: "thr-a" });

      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.THREAD_CREATE,
          remoteThread,
          member(),
        );
      });
      expect(result.current.threads[0]?.resolved).toBe(false);

      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.THREAD_RESOLVE,
          { threadId: "thr-a" },
          member(),
        );
      });

      expect(result.current.threads[0]?.resolved).toBe(true);
    });

    it("drops the thread when THREAD_DELETE arrives", () => {
      const { result } = renderHook(() => useThreads("room-1", "user-self", "Self"));
      const remoteThread = makeThread({ id: "thr-a" });

      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.THREAD_CREATE,
          remoteThread,
          member(),
        );
      });
      expect(result.current.threads).toHaveLength(1);

      act(() => {
        transport.simulateBroadcast(
          "room-1",
          COLLABORATION_EVENTS.THREAD_DELETE,
          { threadId: "thr-a" },
          member(),
        );
      });

      expect(result.current.threads).toHaveLength(0);
    });
  });

  // ── Cleanup ────────────────────────────────────────────────────────────

  describe("cleanup", () => {
    it("unsubscribes all four broadcast listeners on unmount", () => {
      const { unmount } = renderHook(() => useThreads("room-1", "user-self", "Self"));

      const rooms = (transport as unknown as { rooms: Map<string, unknown> }).rooms;
      const room = rooms.get("room-1") as {
        broadcastListeners: Map<string, Set<unknown>>;
      };
      // Every one of the four events registered a listener bucket.
      expect(room.broadcastListeners.size).toBe(4);

      unmount();

      // Empty buckets are deleted by the mock — the whole map clears.
      expect(room.broadcastListeners.size).toBe(0);
    });
  });
});

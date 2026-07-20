// @vitest-environment jsdom
/**
 * @file use-room.hook.spec.tsx
 * @module @stackra/collaboration/__tests__/unit
 * @description Behavioural spec for `useRoom` — the connection lifecycle
 *   hook every collaboration surface builds on.
 *
 *   Covers:
 *   - Status transitions: `connecting` → `connected` on resolve,
 *     `connecting` → `error` on reject.
 *   - `self` is populated with the resolved user identity (id / name /
 *     color / joinedAt / presence).
 *   - `onMemberJoin` appends to `members`.
 *   - `onMemberLeave` removes from `members`.
 *   - `broadcast(event, data)` delegates to `transport.broadcast(...)`.
 *   - `leave()` disconnects and drops back to `disconnected`.
 *   - Unmount disconnects if still connected.
 *   - `options.userId` / `userName` / `userColor` / `initialPresence`
 *     are honoured when provided; defaults kick in otherwise.
 *
 *   `useInject` is mocked so a `MockRoomManager` stands in.
 */

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
import { useRoom } from "@/hooks/use-room/use-room.hook";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Build a `RoomMember` fixture with sensible defaults. */
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

describe("useRoom", () => {
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

  // ── Status transitions ──────────────────────────────────────────────────

  describe("status transitions", () => {
    it('starts at "connecting" then flips to "connected" once transport.connect resolves', async () => {
      const { result } = renderHook(() =>
        useRoom("room-1", { userName: "Alice", userColor: "#e74c3c" }),
      );

      // The `.then` handler fires on the microtask queue. Force a
      // flush so we observe the resolved state deterministically.
      await waitFor(() => {
        expect(result.current.status).toBe("connected");
      });
    });

    it('flips to "error" when transport.connect rejects', async () => {
      // Swap in a rejecting `connect` BEFORE mounting so the hook's
      // first call hits the failure path.
      transport.connect = vi.fn().mockRejectedValue(new Error("boom"));

      const { result } = renderHook(() => useRoom("room-1"));

      await waitFor(() => {
        expect(result.current.status).toBe("error");
      });
    });
  });

  // ── Self identity ───────────────────────────────────────────────────────

  describe("self identity", () => {
    it("populates `self` with the supplied options", async () => {
      const { result } = renderHook(() =>
        useRoom("room-1", {
          userId: "user-alice",
          userName: "Alice",
          userColor: "#e74c3c",
          initialPresence: { status: "active" },
        }),
      );

      await waitFor(() => {
        expect(result.current.self).not.toBeNull();
      });

      expect(result.current.self).toEqual({
        userId: "user-alice",
        name: "Alice",
        color: "#e74c3c",
        joinedAt: expect.any(Number),
        presence: { status: "active" },
      });
    });

    it("auto-generates an id + name when options are omitted", async () => {
      const { result } = renderHook(() => useRoom("room-1"));

      await waitFor(() => {
        expect(result.current.self).not.toBeNull();
      });

      const self = result.current.self!;
      // The default id is a `Str.uuid()` v4 — dashed, 36 chars,
      // version-4 nibble in position 15.
      expect(self.userId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      // Auto-name is `User-{userId}` when userName is omitted.
      expect(self.name).toBe(`User-${self.userId}`);
      // Auto-color falls back to a palette entry (starts with '#').
      expect(self.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("passes the userInfo (name/color/presence) through to transport.connect", async () => {
      const connectSpy = vi.spyOn(transport, "connect");
      renderHook(() =>
        useRoom("room-1", {
          userId: "user-alice",
          userName: "Alice",
          userColor: "#e74c3c",
          initialPresence: { role: "admin" },
        }),
      );

      await waitFor(() => {
        expect(connectSpy).toHaveBeenCalled();
      });

      expect(connectSpy).toHaveBeenCalledWith("room-1", "user-alice", {
        name: "Alice",
        color: "#e74c3c",
        role: "admin",
      });
    });
  });

  // ── Presence events ─────────────────────────────────────────────────────

  describe("presence events", () => {
    it("appends a joining member to `members`", async () => {
      const { result } = renderHook(() => useRoom("room-1", { userName: "Alice" }));
      await waitFor(() => {
        expect(result.current.status).toBe("connected");
      });

      const bob = member({ userId: "user-bob", name: "Bob" });
      act(() => {
        transport.simulateMemberJoin("room-1", bob);
      });

      expect(result.current.members).toHaveLength(1);
      expect(result.current.members[0]?.userId).toBe("user-bob");
    });

    it("removes a leaving member from `members`", async () => {
      const { result } = renderHook(() => useRoom("room-1", { userName: "Alice" }));
      await waitFor(() => {
        expect(result.current.status).toBe("connected");
      });

      const bob = member({ userId: "user-bob", name: "Bob" });
      const carol = member({ userId: "user-carol", name: "Carol" });
      act(() => {
        transport.simulateMemberJoin("room-1", bob);
        transport.simulateMemberJoin("room-1", carol);
      });
      expect(result.current.members).toHaveLength(2);

      act(() => {
        transport.simulateMemberLeave("room-1", "user-bob");
      });

      expect(result.current.members).toHaveLength(1);
      expect(result.current.members[0]?.userId).toBe("user-carol");
    });

    it("de-duplicates re-joins for the same userId", async () => {
      const { result } = renderHook(() => useRoom("room-1", { userName: "Alice" }));
      await waitFor(() => {
        expect(result.current.status).toBe("connected");
      });

      const bob = member({ userId: "user-bob", name: "Bob" });
      const bobRenamed = member({ userId: "user-bob", name: "Bob (2)" });

      act(() => {
        transport.simulateMemberJoin("room-1", bob);
        transport.simulateMemberJoin("room-1", bobRenamed);
      });

      expect(result.current.members).toHaveLength(1);
      // The re-join replaces the old entry (last-wins on userId).
      expect(result.current.members[0]?.name).toBe("Bob (2)");
    });
  });

  // ── broadcast ───────────────────────────────────────────────────────────

  describe("broadcast()", () => {
    it("delegates to transport.broadcast(roomId, event, data)", async () => {
      const { result } = renderHook(() => useRoom("room-1", { userName: "Alice" }));
      await waitFor(() => {
        expect(result.current.status).toBe("connected");
      });

      act(() => {
        result.current.broadcast("ping", { time: 42 });
      });

      const pings = transport.broadcasts.filter((b) => b.event === "ping");
      expect(pings).toHaveLength(1);
      expect(pings[0]?.roomId).toBe("room-1");
      expect(pings[0]?.data).toEqual({ time: 42 });
    });
  });

  // ── leave() ─────────────────────────────────────────────────────────────

  describe("leave()", () => {
    it('disconnects the transport and drops status back to "disconnected"', async () => {
      const disconnectSpy = vi.spyOn(transport, "disconnect");
      const { result } = renderHook(() => useRoom("room-1", { userName: "Alice" }));
      await waitFor(() => {
        expect(result.current.status).toBe("connected");
      });

      act(() => {
        result.current.leave();
      });

      expect(disconnectSpy).toHaveBeenCalledWith("room-1");
      expect(result.current.status).toBe("disconnected");
      expect(result.current.members).toEqual([]);
    });

    it("is a no-op when called before the connection is established", () => {
      // Freeze `connect` so it never resolves — that keeps
      // `connectedRef.current` at `false` for the entire test AND
      // prevents a late `setStatus('connected')` from firing outside
      // `act(...)` after the test returns.
      transport.connect = vi.fn().mockReturnValue(new Promise(() => undefined));

      const disconnectSpy = vi.spyOn(transport, "disconnect");
      const { result } = renderHook(() => useRoom("room-1", { userName: "Alice" }));

      act(() => {
        result.current.leave();
      });

      expect(disconnectSpy).not.toHaveBeenCalled();
    });
  });

  // ── Unmount cleanup ─────────────────────────────────────────────────────

  describe("unmount", () => {
    it("disconnects the transport on unmount if still connected", async () => {
      const disconnectSpy = vi.spyOn(transport, "disconnect");
      const { result, unmount } = renderHook(() => useRoom("room-1", { userName: "Alice" }));
      await waitFor(() => {
        expect(result.current.status).toBe("connected");
      });

      unmount();

      expect(disconnectSpy).toHaveBeenCalledWith("room-1");
    });

    it("does not disconnect when unmounting before connect resolved", () => {
      // Never resolve `connect` — leaves `connectedRef` at `false`.
      transport.connect = vi.fn().mockReturnValue(new Promise(() => undefined));
      const disconnectSpy = vi.spyOn(transport, "disconnect");

      const { unmount } = renderHook(() => useRoom("room-1", { userName: "Alice" }));

      unmount();

      expect(disconnectSpy).not.toHaveBeenCalled();
    });
  });
});

/**
 * @file broadcast-channel-transport.spec.ts
 * @module @stackra/collaboration/__tests__/unit
 * @description Behavioural spec for `BroadcastChannelTransport` — the
 *   local cross-tab collaboration transport built on
 *   `@stackra/coordinator`'s `ITabTransportManager`.
 *
 *   Covers the pattern-alignment sweep that migrated the transport from
 *   raw `BroadcastChannel` calls to a manager-owned channel per room
 *   (`collab:${roomId}`) that is `release()`d on disconnect.
 *
 *   Every test uses fake timers (heartbeat + stale-peer intervals fire
 *   every 1500ms) and a shimmed `window` for the
 *   `beforeunload` / `pagehide` / `pageshow` listeners the transport
 *   attaches. `MockTabTransportManager` from
 *   `@stackra/coordinator/testing` provides an in-memory shared bus so
 *   two "tabs" can exchange messages without a real `BroadcastChannel`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { MockTabTransportManager } from "@stackra/coordinator/testing";

import { BroadcastChannelTransport } from "@/transports/broadcast-channel.transport";
import type { RoomMember } from "@/interfaces/room-member.interface";

// ════════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Recorded call shape used by the `window` shim — we only care about
 * `addEventListener` / `removeEventListener` call names, not their
 * handlers.
 */
interface WindowShim {
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

/** Build a room member for a peer with sensible defaults. */
function peerMember(userId: string, overrides: Partial<RoomMember> = {}): RoomMember {
  return {
    userId,
    name: overrides.name ?? userId,
    color: overrides.color ?? "#000000",
    joinedAt: overrides.joinedAt ?? Date.now(),
    presence: overrides.presence ?? {},
  };
}

/**
 * Type helper — everything the transport puts on the wire is a
 * `ChannelMessage`; we spy on it through the peer's subscribe.
 */
interface WireMessage {
  type: "join" | "leave" | "heartbeat" | "broadcast" | "state_update" | "presence_update";
  roomId: string;
  sender: RoomMember;
  event?: string;
  data?: unknown;
}

// ════════════════════════════════════════════════════════════════════════════════
// Spec
// ════════════════════════════════════════════════════════════════════════════════

describe("BroadcastChannelTransport", () => {
  let manager: MockTabTransportManager;
  let transport: BroadcastChannelTransport;
  let windowShim: WindowShim;

  beforeEach(() => {
    // Fake timers drive heartbeats (1500ms) and stale-peer cleanup
    // (4000ms) deterministically. `Date` is faked by default in
    // Vitest v4, so `Date.now()` inside the transport ticks with
    // `vi.advanceTimersByTime(...)`.
    vi.useFakeTimers();

    // The transport calls `window.addEventListener` on connect and
    // `window.removeEventListener` on disconnect for beforeunload /
    // pagehide / pageshow. Node has no `window` — stub a minimal shim
    // whose only job is to record calls.
    windowShim = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("window", windowShim);

    manager = new MockTabTransportManager();
    transport = new BroadcastChannelTransport(manager);
  });

  afterEach(() => {
    // Shared setup restores fake timers + unstubs globals; also do it
    // explicitly here so a test with heavy timer state doesn't leak
    // into the next `beforeEach`.
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  // ── connect ─────────────────────────────────────────────────────────────

  describe("connect", () => {
    it("opens `collab:{roomId}` on the manager and broadcasts a join", async () => {
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      // Subscribe BEFORE the transport connects so the join lands on
      // the peer's listener.
      peer.channel("collab:room-1").subscribe((data) => seen.push(data as WireMessage));

      await transport.connect("room-1", "alice", { name: "Alice", color: "#e74c3c" });

      expect(manager.hasChannel("collab:room-1")).toBe(true);
      expect(seen).toHaveLength(1);
      const [msg] = seen;
      expect(msg?.type).toBe("join");
      expect(msg?.roomId).toBe("room-1");
      expect(msg?.sender.userId).toBe("alice");
      expect(msg?.sender.name).toBe("Alice");
      expect(msg?.sender.color).toBe("#e74c3c");
      // `presence` on the self member is the raw userInfo passed in.
      expect(msg?.sender.presence).toEqual({ name: "Alice", color: "#e74c3c" });
    });

    it("falls back to sane defaults when name / color are missing from userInfo", async () => {
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      peer.channel("collab:room-1").subscribe((data) => seen.push(data as WireMessage));

      await transport.connect("room-1", "user-42", {});

      const [msg] = seen;
      // Default name = userId, default color = '#3498db' — read from
      // the source.
      expect(msg?.sender.name).toBe("user-42");
      expect(msg?.sender.color).toBe("#3498db");
    });

    it("is idempotent — a second connect for the same room is a no-op", async () => {
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      peer.channel("collab:room-1").subscribe((data) => seen.push(data as WireMessage));

      await transport.connect("room-1", "alice", { name: "Alice" });
      await transport.connect("room-1", "alice", { name: "Alice" });

      const joins = seen.filter((m) => m.type === "join");
      expect(joins).toHaveLength(1);
    });

    it("is inert when no manager is provided", async () => {
      const standalone = new BroadcastChannelTransport();
      await standalone.connect("room-1", "alice", { name: "Alice" });
      // Nothing on the shared manager was touched.
      expect(manager.hasChannel("collab:room-1")).toBe(false);
      // Every downstream operation is a no-op too.
      expect(standalone.getMembers("room-1")).toEqual([]);
      expect(standalone.getState("room-1")).toBeNull();
      expect(() => standalone.broadcast("room-1", "evt", {})).not.toThrow();
    });

    it("is inert when the manager reports unsupported", async () => {
      manager.simulateUnsupported();
      await transport.connect("room-1", "alice", { name: "Alice" });
      expect(manager.hasChannel("collab:room-1")).toBe(false);
      expect(transport.getMembers("room-1")).toEqual([]);
    });

    it("registers window event listeners for beforeunload / pagehide / pageshow", async () => {
      await transport.connect("room-1", "alice", {});
      const events = windowShim.addEventListener.mock.calls.map((args) => args[0] as string);
      expect(events).toContain("beforeunload");
      expect(events).toContain("pagehide");
      expect(events).toContain("pageshow");
    });
  });

  // ── presence ────────────────────────────────────────────────────────────

  describe("presence", () => {
    beforeEach(async () => {
      await transport.connect("room-1", "alice", { name: "Alice" });
    });

    it("onMemberJoin fires on inbound join from a peer", () => {
      const joined: RoomMember[] = [];
      transport.onMemberJoin("room-1", (m) => joined.push(m));

      const peer = manager.createPeer();
      const bob = peerMember("bob", { name: "Bob" });
      peer.channel("collab:room-1").broadcast({
        type: "join",
        roomId: "room-1",
        sender: bob,
      } satisfies WireMessage);

      expect(joined).toHaveLength(1);
      expect(joined[0]?.userId).toBe("bob");
      expect(transport.getMembers("room-1").map((m) => m.userId)).toContain("bob");
    });

    it("onMemberLeave fires on inbound leave from a peer", () => {
      const left: RoomMember[] = [];
      transport.onMemberLeave("room-1", (m) => left.push(m));

      const peer = manager.createPeer();
      const bob = peerMember("bob");
      // Bob joins first — otherwise his 'leave' is a no-op.
      peer.channel("collab:room-1").broadcast({
        type: "join",
        roomId: "room-1",
        sender: bob,
      } satisfies WireMessage);
      peer.channel("collab:room-1").broadcast({
        type: "leave",
        roomId: "room-1",
        sender: bob,
      } satisfies WireMessage);

      expect(left).toHaveLength(1);
      expect(left[0]?.userId).toBe("bob");
      expect(transport.getMembers("room-1").map((m) => m.userId)).not.toContain("bob");
    });

    it("an inbound heartbeat from an unseen peer registers them + fires onMemberJoin", () => {
      const joined: RoomMember[] = [];
      transport.onMemberJoin("room-1", (m) => joined.push(m));

      const peer = manager.createPeer();
      const bob = peerMember("bob");
      peer.channel("collab:room-1").broadcast({
        type: "heartbeat",
        roomId: "room-1",
        sender: bob,
      } satisfies WireMessage);

      // First heartbeat = join event.
      expect(joined).toHaveLength(1);
      expect(transport.getMembers("room-1").map((m) => m.userId)).toContain("bob");
    });

    it("unsubscribing removes the join listener", () => {
      const joined: RoomMember[] = [];
      const off = transport.onMemberJoin("room-1", (m) => joined.push(m));
      off();

      const peer = manager.createPeer();
      peer.channel("collab:room-1").broadcast({
        type: "join",
        roomId: "room-1",
        sender: peerMember("bob"),
      } satisfies WireMessage);

      expect(joined).toHaveLength(0);
    });

    it("onMemberJoin / onMemberLeave against an unknown room return a no-op unsubscribe", () => {
      const off1 = transport.onMemberJoin("missing", () => {});
      const off2 = transport.onMemberLeave("missing", () => {});
      // Neither throws on invocation.
      expect(() => off1()).not.toThrow();
      expect(() => off2()).not.toThrow();
    });

    it("getMembers on an unknown room returns an empty array", () => {
      expect(transport.getMembers("missing")).toEqual([]);
    });

    it("updatePresence merges into self.presence and broadcasts a presence_update", () => {
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      peer.channel("collab:room-1").subscribe((data) => seen.push(data as WireMessage));

      transport.updatePresence("room-1", { cursor: { x: 100, y: 200 } });

      expect(seen).toHaveLength(1);
      const [msg] = seen;
      expect(msg?.type).toBe("presence_update");
      // Merged — the original `{ name: 'Alice' }` presence is preserved.
      expect(msg?.sender.presence).toMatchObject({
        cursor: { x: 100, y: 200 },
        name: "Alice",
      });
      // The payload carries only the delta.
      expect(msg?.data).toEqual({ cursor: { x: 100, y: 200 } });
    });

    it("updatePresence is a no-op for unknown rooms", () => {
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      peer.channel("collab:missing").subscribe((data) => seen.push(data as WireMessage));

      transport.updatePresence("missing", { anything: 1 });
      expect(seen).toEqual([]);
    });

    it("inbound presence_update refreshes the sender in the members map", () => {
      const peer = manager.createPeer();
      const bob = peerMember("bob", { name: "Bob" });
      // Bob joins with an initial presence.
      peer.channel("collab:room-1").broadcast({
        type: "join",
        roomId: "room-1",
        sender: bob,
      } satisfies WireMessage);

      const bobV2 = { ...bob, presence: { cursor: { x: 5 } } };
      peer.channel("collab:room-1").broadcast({
        type: "presence_update",
        roomId: "room-1",
        sender: bobV2,
        data: { cursor: { x: 5 } },
      } satisfies WireMessage);

      const bobMember = transport.getMembers("room-1").find((m) => m.userId === "bob");
      expect(bobMember?.presence).toEqual({ cursor: { x: 5 } });
    });
  });

  // ── broadcast ───────────────────────────────────────────────────────────

  describe("broadcast", () => {
    beforeEach(async () => {
      await transport.connect("room-1", "alice", {});
    });

    it("posts a broadcast envelope with event + data", () => {
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      peer.channel("collab:room-1").subscribe((data) => seen.push(data as WireMessage));

      transport.broadcast("room-1", "cursor.move", { x: 1, y: 2 });

      const events = seen.filter((m) => m.type === "broadcast");
      expect(events).toHaveLength(1);
      const [evt] = events;
      expect(evt?.event).toBe("cursor.move");
      expect(evt?.data).toEqual({ x: 1, y: 2 });
      expect(evt?.sender.userId).toBe("alice");
    });

    it("broadcast against an unknown room is a no-op", () => {
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      peer.channel("collab:missing").subscribe((data) => seen.push(data as WireMessage));

      transport.broadcast("missing", "evt", {});
      expect(seen).toEqual([]);
    });

    it("onBroadcast fires for the matching event only", () => {
      const cursorEvents: unknown[] = [];
      const otherEvents: unknown[] = [];
      transport.onBroadcast("room-1", "cursor.move", (d) => cursorEvents.push(d));
      transport.onBroadcast("room-1", "other", (d) => otherEvents.push(d));

      const peer = manager.createPeer();
      const bob = peerMember("bob");
      peer.channel("collab:room-1").broadcast({
        type: "broadcast",
        roomId: "room-1",
        sender: bob,
        event: "cursor.move",
        data: { x: 5 },
      } satisfies WireMessage);

      expect(cursorEvents).toEqual([{ x: 5 }]);
      expect(otherEvents).toEqual([]);
    });

    it("onBroadcast passes the sender through to the callback", () => {
      const received: Array<{ data: unknown; sender: RoomMember }> = [];
      transport.onBroadcast("room-1", "evt", (data, sender) => {
        received.push({ data, sender });
      });

      const peer = manager.createPeer();
      const bob = peerMember("bob", { name: "Bob" });
      peer.channel("collab:room-1").broadcast({
        type: "broadcast",
        roomId: "room-1",
        sender: bob,
        event: "evt",
        data: "payload",
      } satisfies WireMessage);

      expect(received).toHaveLength(1);
      expect(received[0]?.sender.userId).toBe("bob");
      expect(received[0]?.data).toBe("payload");
    });

    it("inbound broadcast without a matching listener is silently ignored", () => {
      // No `onBroadcast('room-1', 'evt', ...)` registered.
      const peer = manager.createPeer();
      expect(() =>
        peer.channel("collab:room-1").broadcast({
          type: "broadcast",
          roomId: "room-1",
          sender: peerMember("bob"),
          event: "evt",
          data: { x: 1 },
        } satisfies WireMessage),
      ).not.toThrow();
    });

    it("onBroadcast unsubscribe removes only that listener", () => {
      const received: unknown[] = [];
      const off = transport.onBroadcast("room-1", "evt", (d) => received.push(d));

      const peer = manager.createPeer();
      peer.channel("collab:room-1").broadcast({
        type: "broadcast",
        roomId: "room-1",
        sender: peerMember("bob"),
        event: "evt",
        data: 1,
      } satisfies WireMessage);
      expect(received).toEqual([1]);

      off();
      peer.channel("collab:room-1").broadcast({
        type: "broadcast",
        roomId: "room-1",
        sender: peerMember("bob"),
        event: "evt",
        data: 2,
      } satisfies WireMessage);
      expect(received).toEqual([1]);
    });

    it("onBroadcast against an unknown room returns a no-op unsubscribe", () => {
      const off = transport.onBroadcast("missing", "evt", () => {});
      expect(() => off()).not.toThrow();
    });
  });

  // ── shared state ────────────────────────────────────────────────────────

  describe("shared state", () => {
    beforeEach(async () => {
      await transport.connect("room-1", "alice", {});
    });

    it("getState returns null before any state exists", () => {
      expect(transport.getState("room-1")).toBeNull();
    });

    it("getState returns null for an unknown room", () => {
      expect(transport.getState("missing")).toBeNull();
    });

    it("getState returns the last-received state after a peer state_update", () => {
      const peer = manager.createPeer();
      peer.channel("collab:room-1").broadcast({
        type: "state_update",
        roomId: "room-1",
        sender: peerMember("bob"),
        data: { count: 7 },
      } satisfies WireMessage);

      expect(transport.getState<{ count: number }>("room-1")).toEqual({ count: 7 });
    });

    it("setState broadcasts state_update with the updater result", () => {
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      peer.channel("collab:room-1").subscribe((data) => seen.push(data as WireMessage));

      transport.setState<{ count: number }>("room-1", (prev) => ({
        count: (prev?.count ?? 0) + 1,
      }));

      const evts = seen.filter((m) => m.type === "state_update");
      expect(evts).toHaveLength(1);
      expect(evts[0]?.data).toEqual({ count: 1 });
    });

    it("setState against an unknown room is a no-op", () => {
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      peer.channel("collab:missing").subscribe((data) => seen.push(data as WireMessage));

      transport.setState("missing", () => ({ any: 1 }));
      expect(seen).toEqual([]);
    });

    it("onStateChange fires on inbound state_update from a peer", () => {
      const received: Array<{ state: unknown; updatedBy: RoomMember }> = [];
      transport.onStateChange<{ mode: string }>("room-1", (state, updatedBy) => {
        received.push({ state, updatedBy });
      });

      const peer = manager.createPeer();
      const bob = peerMember("bob");
      peer.channel("collab:room-1").broadcast({
        type: "state_update",
        roomId: "room-1",
        sender: bob,
        data: { mode: "dark" },
      } satisfies WireMessage);

      expect(received).toHaveLength(1);
      expect(received[0]?.state).toEqual({ mode: "dark" });
      expect(received[0]?.updatedBy.userId).toBe("bob");
    });

    it("onStateChange unsubscribe removes the listener", () => {
      const received: unknown[] = [];
      const off = transport.onStateChange<unknown>("room-1", (state) => received.push(state));
      off();

      const peer = manager.createPeer();
      peer.channel("collab:room-1").broadcast({
        type: "state_update",
        roomId: "room-1",
        sender: peerMember("bob"),
        data: { mode: "dark" },
      } satisfies WireMessage);

      expect(received).toEqual([]);
    });

    it("onStateChange against an unknown room returns a no-op unsubscribe", () => {
      const off = transport.onStateChange("missing", () => {});
      expect(() => off()).not.toThrow();
    });
  });

  // ── heartbeat + stale-peer cleanup ──────────────────────────────────────

  describe("heartbeat + stale-peer cleanup", () => {
    it("emits a heartbeat every 1500ms", async () => {
      await transport.connect("room-1", "alice", {});
      const peer = manager.createPeer();
      const heartbeats: WireMessage[] = [];
      peer.channel("collab:room-1").subscribe((data) => {
        const msg = data as WireMessage;
        if (msg.type === "heartbeat") heartbeats.push(msg);
      });

      vi.advanceTimersByTime(1500);
      expect(heartbeats).toHaveLength(1);
      vi.advanceTimersByTime(1500);
      expect(heartbeats).toHaveLength(2);
      vi.advanceTimersByTime(1500);
      expect(heartbeats).toHaveLength(3);
    });

    it("evicts a peer that stops heartbeating after > 4000ms", async () => {
      await transport.connect("room-1", "alice", {});
      const left: RoomMember[] = [];
      transport.onMemberLeave("room-1", (m) => left.push(m));

      // Bob joins at t=0. His `lastSeen` is stamped `Date.now()`.
      const peer = manager.createPeer();
      const bob = peerMember("bob");
      peer.channel("collab:room-1").broadcast({
        type: "join",
        roomId: "room-1",
        sender: bob,
      } satisfies WireMessage);
      expect(transport.getMembers("room-1").map((m) => m.userId)).toContain("bob");

      // Advance past the stale threshold (4000ms) — no further
      // heartbeats from Bob. The cleanup interval fires every 1500ms:
      //   t=1500  cleanup — elapsed 1500 < 4000, fresh
      //   t=3000  cleanup — elapsed 3000 < 4000, fresh
      //   t=4500  cleanup — elapsed 4500 > 4000, EVICT
      vi.advanceTimersByTime(4500);

      expect(transport.getMembers("room-1").map((m) => m.userId)).not.toContain("bob");
      expect(left.map((m) => m.userId)).toContain("bob");
    });

    it("keeps a peer alive if it keeps heartbeating within the window", async () => {
      await transport.connect("room-1", "alice", {});
      const peer = manager.createPeer();
      const bob = peerMember("bob");
      peer.channel("collab:room-1").broadcast({
        type: "join",
        roomId: "room-1",
        sender: bob,
      } satisfies WireMessage);

      // Send heartbeats every 1500ms — the peer stays fresh.
      vi.advanceTimersByTime(1500);
      peer.channel("collab:room-1").broadcast({
        type: "heartbeat",
        roomId: "room-1",
        sender: bob,
      } satisfies WireMessage);
      vi.advanceTimersByTime(1500);
      peer.channel("collab:room-1").broadcast({
        type: "heartbeat",
        roomId: "room-1",
        sender: bob,
      } satisfies WireMessage);
      vi.advanceTimersByTime(1500);
      peer.channel("collab:room-1").broadcast({
        type: "heartbeat",
        roomId: "room-1",
        sender: bob,
      } satisfies WireMessage);

      expect(transport.getMembers("room-1").map((m) => m.userId)).toContain("bob");
    });

    it("responds to an inbound join with a heartbeat so the newcomer sees us", async () => {
      await transport.connect("room-1", "alice", {});
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      peer.channel("collab:room-1").subscribe((data) => seen.push(data as WireMessage));

      peer.channel("collab:room-1").broadcast({
        type: "join",
        roomId: "room-1",
        sender: peerMember("bob"),
      } satisfies WireMessage);

      // Alice replies immediately with a heartbeat carrying her own
      // sender info — that's how Bob discovers her.
      const heartbeats = seen.filter((m) => m.type === "heartbeat" && m.sender.userId === "alice");
      expect(heartbeats.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── own-broadcast short-circuit ─────────────────────────────────────────

  describe("own-broadcast short-circuit", () => {
    it("ignores inbound messages whose sender.userId matches self.userId", async () => {
      await transport.connect("room-1", "alice", {});
      const joined: RoomMember[] = [];
      transport.onMemberJoin("room-1", (m) => joined.push(m));

      // A peer impersonates 'alice' — the transport short-circuits
      // in `handleMessage` before firing any callback.
      const peer = manager.createPeer();
      peer.channel("collab:room-1").broadcast({
        type: "join",
        roomId: "room-1",
        sender: peerMember("alice", { name: "Impersonator" }),
      } satisfies WireMessage);

      expect(joined).toHaveLength(0);
      // Alice's own userId does not appear as a `member` (self is
      // tracked separately in `room.self`, not in `room.members`).
      expect(transport.getMembers("room-1").map((m) => m.userId)).not.toContain("alice");
    });
  });

  // ── disconnect ──────────────────────────────────────────────────────────

  describe("disconnect", () => {
    it("broadcasts leave, releases the channel, clears timers, and drops the room", async () => {
      await transport.connect("room-1", "alice", {});
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      peer.channel("collab:room-1").subscribe((data) => seen.push(data as WireMessage));

      transport.disconnect("room-1");

      // Leave broadcast landed on the peer BEFORE the transport
      // released the channel.
      const leaves = seen.filter((m) => m.type === "leave");
      expect(leaves).toHaveLength(1);
      expect(leaves[0]?.sender.userId).toBe("alice");

      // Manager released the channel — no other consumer should still
      // be subscribed to `collab:room-1` in this process.
      expect(manager.hasChannel("collab:room-1")).toBe(false);

      // Heartbeat timer cleared — advancing time produces no new
      // heartbeats. `seen` also stops accumulating because the peer's
      // transport-side subscribe still fires on peer-side broadcasts,
      // so filter to messages that would come from alice.
      seen.length = 0;
      vi.advanceTimersByTime(5000);
      const aliceMessages = seen.filter((m) => m.sender?.userId === "alice");
      expect(aliceMessages).toEqual([]);

      // Room dropped — post-disconnect getMembers returns empty.
      expect(transport.getMembers("room-1")).toEqual([]);
    });

    it("removes the window event listeners it registered on connect", async () => {
      await transport.connect("room-1", "alice", {});
      windowShim.removeEventListener.mockClear();

      transport.disconnect("room-1");

      const events = windowShim.removeEventListener.mock.calls.map((args) => args[0] as string);
      expect(events).toContain("beforeunload");
      expect(events).toContain("pagehide");
      expect(events).toContain("pageshow");
    });

    it("is a no-op for unknown rooms", () => {
      expect(() => transport.disconnect("unknown")).not.toThrow();
      // Manager release was never called for an untracked room.
      // (Assert indirectly by confirming no channel exists.)
      expect(manager.hasChannel("collab:unknown")).toBe(false);
    });

    it("supports reconnecting after disconnect", async () => {
      await transport.connect("room-1", "alice", { name: "Alice" });
      transport.disconnect("room-1");
      expect(manager.hasChannel("collab:room-1")).toBe(false);

      // Reconnect — the manager rebuilds a fresh transport on the
      // shared bus.
      const peer = manager.createPeer();
      const seen: WireMessage[] = [];
      peer.channel("collab:room-1").subscribe((data) => seen.push(data as WireMessage));

      await transport.connect("room-1", "alice", { name: "Alice" });
      expect(manager.hasChannel("collab:room-1")).toBe(true);
      const joins = seen.filter((m) => m.type === "join");
      expect(joins).toHaveLength(1);
    });
  });
});

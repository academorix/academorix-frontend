/**
 * @file broadcast-channel.transport.ts
 * BroadcastChannel-based transport for local/cross-tab collaboration.
 *
 * Uses `@stackra/coordinator`'s shared `ITabTransportManager` to
 * open one channel per room (named `collab:{roomId}`). Presence is
 * maintained via heartbeats (every 2s) with stale peer cleanup (5s
 * timeout).
 *
 * @module @stackra/collaboration/transports
 * @category Transports
 */

import type { ITabTransport, ITabTransportManager } from "@stackra/contracts";

import type { CollaborationTransport } from "@/interfaces/transport.interface";
import type { RoomMember } from "@/interfaces/room-member.interface";

/** Internal message envelope for the cross-tab channel. */
interface ChannelMessage {
  type: "join" | "leave" | "heartbeat" | "broadcast" | "state_update" | "presence_update";
  roomId: string;
  sender: RoomMember;
  event?: string;
  data?: unknown;
}

/** Internal room state tracked per connected room. */
interface RoomState {
  channelName: string;
  transport: ITabTransport;
  unsubscribe: () => void;
  self: RoomMember;
  members: Map<string, RoomMember>;
  heartbeatInterval: ReturnType<typeof setInterval>;
  cleanupInterval: ReturnType<typeof setInterval>;
  lastSeen: Map<string, number>;
  joinCallbacks: Set<(member: RoomMember) => void>;
  leaveCallbacks: Set<(member: RoomMember) => void>;
  broadcastCallbacks: Map<string, Set<(data: unknown, sender: RoomMember) => void>>;
  stateCallbacks: Set<(state: unknown, updatedBy: RoomMember) => void>;
  state: unknown;
  beforeUnloadHandler: () => void;
  pageHideHandler: () => void;
  pageShowHandler: (event: PageTransitionEvent) => void;
}

/** Heartbeat interval in milliseconds. */
const HEARTBEAT_MS = 1500;

/** Stale peer timeout in milliseconds. */
const STALE_TIMEOUT_MS = 4000;

/**
 * BroadcastChannel transport for local cross-tab collaboration.
 *
 * Works entirely in the browser without any backend. Ideal for demos,
 * testing, and single-device collaboration scenarios.
 *
 * @example
 * ```typescript
 * const transport = new BroadcastChannelTransport(manager);
 * await transport.connect('room-1', 'user-abc', { name: 'Alice' });
 * transport.broadcast('room-1', 'cursor.move', { x: 100, y: 200 });
 * ```
 */
export class BroadcastChannelTransport implements CollaborationTransport {
  /** Active room connections. */
  private readonly rooms = new Map<string, RoomState>();

  /**
   * @param manager - Cross-tab transport manager (from
   *   `@stackra/coordinator`). When missing / unsupported, this
   *   transport becomes inert — every operation resolves to a
   *   no-op so consumers stay driver-agnostic.
   */
  public constructor(private readonly manager?: ITabTransportManager) {}

  /**
   * Connect to a collaboration room via a cross-tab channel.
   *
   * @param roomId - Unique room identifier.
   * @param userId - Current user's unique ID.
   * @param userInfo - User metadata (name, color, etc.).
   * @returns Resolves immediately (no network required).
   */
  public async connect(
    roomId: string,
    userId: string,
    userInfo: Record<string, unknown>,
  ): Promise<void> {
    if (this.rooms.has(roomId)) return;
    if (!this.manager || !this.manager.isSupported()) return;

    const channelName = `collab:${roomId}`;
    const transport = this.manager.channel(channelName);

    const self: RoomMember = {
      userId,
      name: (userInfo.name as string) ?? userId,
      color: (userInfo.color as string) ?? "#3498db",
      joinedAt: Date.now(),
      presence: userInfo,
    };

    const unsubscribe = transport.subscribe((data) => {
      this.handleMessage(roomId, data as ChannelMessage);
    });

    // Register beforeunload + pagehide to ensure `leave` is
    // broadcast on refresh / close. `pagehide` is more reliable in
    // modern browsers (bfcache, mobile Safari).
    const beforeUnloadHandler = (): void => {
      transport.broadcast({ type: "leave", roomId, sender: self } satisfies ChannelMessage);
    };
    const pageHideHandler = (): void => {
      transport.broadcast({ type: "leave", roomId, sender: self } satisfies ChannelMessage);
    };
    // Re-announce on `pageshow` for bfcache restoration
    // (back / forward navigation).
    const pageShowHandler = (event: PageTransitionEvent): void => {
      if (event.persisted) {
        transport.broadcast({ type: "join", roomId, sender: self } satisfies ChannelMessage);
      }
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
    window.addEventListener("pagehide", pageHideHandler);
    window.addEventListener("pageshow", pageShowHandler);

    const roomState: RoomState = {
      channelName,
      transport,
      unsubscribe,
      self,
      members: new Map(),
      heartbeatInterval: setInterval(() => {
        this.sendMessage(roomId, { type: "heartbeat", roomId, sender: self });
      }, HEARTBEAT_MS),
      cleanupInterval: setInterval(() => {
        this.cleanupStalePeers(roomId);
      }, HEARTBEAT_MS),
      lastSeen: new Map(),
      joinCallbacks: new Set(),
      leaveCallbacks: new Set(),
      broadcastCallbacks: new Map(),
      stateCallbacks: new Set(),
      state: null,
      beforeUnloadHandler,
      pageHideHandler,
      pageShowHandler,
    };

    this.rooms.set(roomId, roomState);

    // Announce join.
    this.sendMessage(roomId, { type: "join", roomId, sender: self });
  }

  /**
   * Disconnect from a collaboration room.
   *
   * @param roomId - The room to disconnect from.
   */
  public disconnect(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    window.removeEventListener("beforeunload", room.beforeUnloadHandler);
    window.removeEventListener("pagehide", room.pageHideHandler);
    window.removeEventListener("pageshow", room.pageShowHandler);

    // Announce leave BEFORE tearing the transport down so peers
    // see the message.
    this.sendMessage(roomId, { type: "leave", roomId, sender: room.self });

    clearInterval(room.heartbeatInterval);
    clearInterval(room.cleanupInterval);
    room.unsubscribe();
    // Release the room-scoped channel from the manager's cache —
    // no one else in this process should be subscribed to
    // `collab:${roomId}` after this transport disconnects.
    this.manager?.release(room.channelName);
    this.rooms.delete(roomId);
  }

  /**
   * Register a callback for when a member joins the room.
   *
   * @param roomId - The room to listen on.
   * @param callback - Invoked with the joining member.
   * @returns An unsubscribe function.
   */
  public onMemberJoin(roomId: string, callback: (member: RoomMember) => void): () => void {
    const room = this.rooms.get(roomId);
    if (!room) return () => {};

    room.joinCallbacks.add(callback);
    return () => {
      room.joinCallbacks.delete(callback);
    };
  }

  /**
   * Register a callback for when a member leaves the room.
   *
   * @param roomId - The room to listen on.
   * @param callback - Invoked with the leaving member.
   * @returns An unsubscribe function.
   */
  public onMemberLeave(roomId: string, callback: (member: RoomMember) => void): () => void {
    const room = this.rooms.get(roomId);
    if (!room) return () => {};

    room.leaveCallbacks.add(callback);
    return () => {
      room.leaveCallbacks.delete(callback);
    };
  }

  /**
   * Get all currently connected members in a room.
   *
   * @param roomId - The room to query.
   * @returns Array of current room members.
   */
  public getMembers(roomId: string): RoomMember[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.members.values());
  }

  /**
   * Update the current user's presence data.
   *
   * @param roomId - The room to update presence in.
   * @param data - Arbitrary presence data to broadcast.
   */
  public updatePresence(roomId: string, data: Record<string, unknown>): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.self = { ...room.self, presence: { ...room.self.presence, ...data } };
    this.sendMessage(roomId, {
      type: "presence_update",
      roomId,
      sender: room.self,
      data,
    });
  }

  /**
   * Broadcast an ephemeral event to all room members.
   *
   * @param roomId - The room to broadcast in.
   * @param event - Event name.
   * @param data - Event payload.
   */
  public broadcast(roomId: string, event: string, data: unknown): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    this.sendMessage(roomId, {
      type: "broadcast",
      roomId,
      sender: room.self,
      event,
      data,
    });
  }

  /**
   * Listen for a specific broadcast event in a room.
   *
   * @param roomId - The room to listen in.
   * @param event - Event name to listen for.
   * @param callback - Invoked with the event data and sender.
   * @returns An unsubscribe function.
   */
  public onBroadcast(
    roomId: string,
    event: string,
    callback: (data: unknown, sender: RoomMember) => void,
  ): () => void {
    const room = this.rooms.get(roomId);
    if (!room) return () => {};

    if (!room.broadcastCallbacks.has(event)) {
      room.broadcastCallbacks.set(event, new Set());
    }

    room.broadcastCallbacks.get(event)!.add(callback);
    return () => {
      room.broadcastCallbacks.get(event)?.delete(callback);
    };
  }

  /**
   * Get the current shared state for a room.
   *
   * @typeParam T - The shape of the shared state.
   * @param roomId - The room to query.
   * @returns The current state or null if none exists.
   */
  public getState<T>(roomId: string): T | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room.state as T | null;
  }

  /**
   * Update the shared state for a room using an updater function.
   *
   * @typeParam T - The shape of the shared state.
   * @param roomId - The room to update.
   * @param updater - Function that receives the previous state and returns the new state.
   */
  public setState<T>(roomId: string, updater: (prev: T) => T): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const prev = (room.state ?? null) as T;
    const next = updater(prev);
    room.state = next;

    this.sendMessage(roomId, {
      type: "state_update",
      roomId,
      sender: room.self,
      data: next,
    });
  }

  /**
   * Listen for shared state changes in a room.
   *
   * @typeParam T - The shape of the shared state.
   * @param roomId - The room to listen in.
   * @param callback - Invoked with the new state and the member who made the change.
   * @returns An unsubscribe function.
   */
  public onStateChange<T>(
    roomId: string,
    callback: (state: T, updatedBy: RoomMember) => void,
  ): () => void {
    const room = this.rooms.get(roomId);
    if (!room) return () => {};

    room.stateCallbacks.add(callback as (state: unknown, updatedBy: RoomMember) => void);
    return () => {
      room.stateCallbacks.delete(callback as (state: unknown, updatedBy: RoomMember) => void);
    };
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Send a message on the room's cross-tab channel.
   */
  private sendMessage(roomId: string, message: ChannelMessage): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.transport.broadcast(message);
  }

  /**
   * Handle an incoming message from the cross-tab channel.
   */
  private handleMessage(roomId: string, message: ChannelMessage): void {
    const room = this.rooms.get(roomId);
    if (!room || !message) return;

    // Ignore own messages
    if (message.sender.userId === room.self.userId) return;

    const { sender } = message;

    switch (message.type) {
      case "join": {
        room.members.set(sender.userId, sender);
        room.lastSeen.set(sender.userId, Date.now());
        room.joinCallbacks.forEach((cb) => cb(sender));
        // Respond with heartbeat so the new member sees us.
        this.sendMessage(roomId, { type: "heartbeat", roomId, sender: room.self });
        break;
      }

      case "heartbeat": {
        const isNew = !room.members.has(sender.userId);
        room.members.set(sender.userId, sender);
        room.lastSeen.set(sender.userId, Date.now());
        if (isNew) {
          room.joinCallbacks.forEach((cb) => cb(sender));
        }
        break;
      }

      case "leave": {
        room.members.delete(sender.userId);
        room.lastSeen.delete(sender.userId);
        room.leaveCallbacks.forEach((cb) => cb(sender));
        break;
      }

      case "presence_update": {
        room.members.set(sender.userId, sender);
        room.lastSeen.set(sender.userId, Date.now());
        break;
      }

      case "broadcast": {
        if (message.event) {
          const callbacks = room.broadcastCallbacks.get(message.event);
          callbacks?.forEach((cb) => cb(message.data, sender));
        }
        break;
      }

      case "state_update": {
        room.state = message.data;
        room.stateCallbacks.forEach((cb) => cb(message.data, sender));
        break;
      }
    }
  }

  /**
   * Remove peers that haven't sent a heartbeat within the stale timeout.
   */
  private cleanupStalePeers(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const now = Date.now();

    for (const [userId, lastSeen] of room.lastSeen) {
      if (now - lastSeen > STALE_TIMEOUT_MS) {
        const member = room.members.get(userId);
        room.members.delete(userId);
        room.lastSeen.delete(userId);
        if (member) {
          room.leaveCallbacks.forEach((cb) => cb(member));
        }
      }
    }
  }
}

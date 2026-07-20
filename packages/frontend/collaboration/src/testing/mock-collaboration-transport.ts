/**
 * @file mock-collaboration-transport.ts
 * @module @stackra/collaboration/testing
 * @description In-memory `CollaborationTransport` implementation for tests.
 *
 *   Tracks connected rooms, members, broadcasts, and shared state
 *   entirely in-process. Tests can drive presence and state changes
 *   with the `simulate*` hooks to exercise consumer code paths.
 */

import type { CollaborationTransport, RoomMember } from "@/interfaces";

/** Recorded broadcast entry — event + data + originating room. */
export interface RecordedBroadcast {
  roomId: string;
  event: string;
  data: unknown;
  broadcastAt: number;
}

type MemberListener = (member: RoomMember) => void;
type BroadcastListener = (data: unknown, sender: RoomMember) => void;
type StateListener<T = unknown> = (state: T, updatedBy: RoomMember) => void;

/**
 * Per-room bookkeeping — kept private inside the transport. Public API
 * is the `CollaborationTransport` contract plus a few test hooks.
 */
interface RoomState {
  members: Map<string, RoomMember>;
  memberJoinListeners: Set<MemberListener>;
  memberLeaveListeners: Set<MemberListener>;
  broadcastListeners: Map<string, Set<BroadcastListener>>;
  stateListeners: Set<StateListener>;
  currentUserId: string | null;
  state: unknown;
}

/**
 * In-memory collaboration transport for testing.
 *
 * Implements the full `CollaborationTransport` contract without any
 * real transport (no BroadcastChannel, no Reverb). Every operation is
 * synchronous inside the process, so tests are deterministic.
 */
export class MockCollaborationTransport implements CollaborationTransport {
  /** Every broadcast ever sent — flattened across all rooms. */
  public readonly broadcasts: RecordedBroadcast[] = [];

  /** Per-room state. */
  private readonly rooms = new Map<string, RoomState>();

  public async connect(
    roomId: string,
    userId: string,
    userInfo: Record<string, unknown>,
  ): Promise<void> {
    const room = this.getOrCreateRoom(roomId);
    room.currentUserId = userId;
    const member: RoomMember = {
      userId,
      name: (userInfo.name as string) ?? userId,
      color: (userInfo.color as string) ?? "#000000",
      joinedAt: Date.now(),
      presence: userInfo,
    };
    room.members.set(userId, member);
    for (const listener of room.memberJoinListeners) listener(member);
  }

  public disconnect(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentUserId) return;
    const member = room.members.get(room.currentUserId);
    room.members.delete(room.currentUserId);
    if (member) {
      for (const listener of room.memberLeaveListeners) listener(member);
    }
    room.currentUserId = null;
  }

  // ── Presence ────────────────────────────────────────────────────────

  public onMemberJoin(roomId: string, callback: MemberListener): () => void {
    const room = this.getOrCreateRoom(roomId);
    room.memberJoinListeners.add(callback);
    return () => {
      room.memberJoinListeners.delete(callback);
    };
  }

  public onMemberLeave(roomId: string, callback: MemberListener): () => void {
    const room = this.getOrCreateRoom(roomId);
    room.memberLeaveListeners.add(callback);
    return () => {
      room.memberLeaveListeners.delete(callback);
    };
  }

  public getMembers(roomId: string): RoomMember[] {
    return Array.from(this.rooms.get(roomId)?.members.values() ?? []);
  }

  public updatePresence(roomId: string, data: Record<string, unknown>): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentUserId) return;
    const member = room.members.get(room.currentUserId);
    if (!member) return;
    member.presence = { ...member.presence, ...data };
  }

  // ── Broadcast ───────────────────────────────────────────────────────

  public broadcast(roomId: string, event: string, data: unknown): void {
    this.broadcasts.push({ roomId, event, data, broadcastAt: Date.now() });
    const room = this.rooms.get(roomId);
    if (!room) return;
    const listeners = room.broadcastListeners.get(event);
    if (!listeners) return;
    const sender = room.currentUserId ? room.members.get(room.currentUserId) : undefined;
    if (!sender) return;
    for (const listener of listeners) listener(data, sender);
  }

  public onBroadcast(roomId: string, event: string, callback: BroadcastListener): () => void {
    const room = this.getOrCreateRoom(roomId);
    let bucket = room.broadcastListeners.get(event);
    if (!bucket) {
      bucket = new Set();
      room.broadcastListeners.set(event, bucket);
    }
    bucket.add(callback);
    return () => {
      bucket!.delete(callback);
      if (bucket!.size === 0) room.broadcastListeners.delete(event);
    };
  }

  // ── Storage ─────────────────────────────────────────────────────────

  public getState<T>(roomId: string): T | null {
    const room = this.rooms.get(roomId);
    return (room?.state as T | undefined) ?? null;
  }

  public setState<T>(roomId: string, updater: (prev: T) => T): void {
    const room = this.getOrCreateRoom(roomId);
    const previous = (room.state as T | undefined) ?? (undefined as unknown as T);
    const next = updater(previous);
    room.state = next;
    const updatedBy = room.currentUserId ? room.members.get(room.currentUserId) : undefined;
    if (!updatedBy) return;
    for (const listener of room.stateListeners) {
      (listener as StateListener<T>)(next, updatedBy);
    }
  }

  public onStateChange<T>(roomId: string, callback: StateListener<T>): () => void {
    const room = this.getOrCreateRoom(roomId);
    const listener = callback as StateListener;
    room.stateListeners.add(listener);
    return () => {
      room.stateListeners.delete(listener);
    };
  }

  // ── Test hooks ─────────────────────────────────────────────────────

  /** Simulate an external member joining the given room. */
  public simulateMemberJoin(roomId: string, member: RoomMember): void {
    const room = this.getOrCreateRoom(roomId);
    room.members.set(member.userId, member);
    for (const listener of room.memberJoinListeners) listener(member);
  }

  /** Simulate an external member leaving the given room. */
  public simulateMemberLeave(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const member = room.members.get(userId);
    if (!member) return;
    room.members.delete(userId);
    for (const listener of room.memberLeaveListeners) listener(member);
  }

  /** Simulate an inbound broadcast from another member. */
  public simulateBroadcast(roomId: string, event: string, data: unknown, sender: RoomMember): void {
    this.broadcasts.push({ roomId, event, data, broadcastAt: Date.now() });
    const room = this.rooms.get(roomId);
    const listeners = room?.broadcastListeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) listener(data, sender);
  }

  /**
   * Simulate an inbound shared-state change from another member.
   *
   * Mirrors the wire shape of a peer calling `setState(...)` on their
   * own transport — persists the new state, then fans out to every
   * `onStateChange` listener with the supplied `updatedBy` member.
   *
   * Skips the need to `connect(...)` the mock first (which the
   * `setState` internal path requires to know who's updating). Use
   * this hook when the spec only cares about the inbound listener
   * flow, not the connect handshake.
   *
   * @typeParam T - The shape of the shared state.
   * @param roomId - The room whose state changes.
   * @param newState - The state value to apply.
   * @param updatedBy - The member that produced the change.
   */
  public simulateStateChange<T>(roomId: string, newState: T, updatedBy: RoomMember): void {
    const room = this.getOrCreateRoom(roomId);
    room.state = newState;
    for (const listener of room.stateListeners) {
      (listener as StateListener<T>)(newState, updatedBy);
    }
  }

  /** Drop every room and every recorded broadcast. */
  public reset(): void {
    this.rooms.clear();
    this.broadcasts.length = 0;
  }

  // ── Private ─────────────────────────────────────────────────────────

  private getOrCreateRoom(roomId: string): RoomState {
    const cached = this.rooms.get(roomId);
    if (cached) return cached;
    const fresh: RoomState = {
      members: new Map(),
      memberJoinListeners: new Set(),
      memberLeaveListeners: new Set(),
      broadcastListeners: new Map(),
      stateListeners: new Set(),
      currentUserId: null,
      state: undefined,
    };
    this.rooms.set(roomId, fresh);
    return fresh;
  }
}

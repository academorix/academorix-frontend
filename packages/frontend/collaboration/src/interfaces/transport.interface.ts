/**
 * Transport abstraction layer for collaboration communication.
 *
 * @module @stackra/collaboration/interfaces
 * @category Interfaces
 */

import type { RoomMember } from './room-member.interface';

/**
 * Abstraction over the communication layer used by collaboration features.
 *
 * Implementations can use BroadcastChannel (local), Laravel Reverb (remote),
 * or any other real-time transport. All hooks interact exclusively through
 * this interface, making the transport swappable without changing hook logic.
 *
 * @example
 * ```typescript
 * class MyTransport implements CollaborationTransport {
 *   async connect(roomId, userId, userInfo) { ... }
 *   disconnect(roomId) { ... }
 *   // ...
 * }
 * ```
 */
export interface CollaborationTransport {
  /**
   * Connect to a collaboration room.
   *
   * @param roomId - Unique room identifier.
   * @param userId - Current user's unique ID.
   * @param userInfo - Arbitrary user metadata (name, color, etc.).
   * @returns A promise that resolves when the connection is established.
   */
  connect(roomId: string, userId: string, userInfo: Record<string, unknown>): Promise<void>;

  /**
   * Disconnect from a collaboration room.
   *
   * @param roomId - The room to disconnect from.
   */
  disconnect(roomId: string): void;

  // ── Presence ─────────────────────────────────────────────────────────────

  /**
   * Register a callback for when a member joins the room.
   *
   * @param roomId - The room to listen on.
   * @param callback - Invoked with the joining member.
   * @returns An unsubscribe function.
   */
  onMemberJoin(roomId: string, callback: (member: RoomMember) => void): () => void;

  /**
   * Register a callback for when a member leaves the room.
   *
   * @param roomId - The room to listen on.
   * @param callback - Invoked with the leaving member.
   * @returns An unsubscribe function.
   */
  onMemberLeave(roomId: string, callback: (member: RoomMember) => void): () => void;

  /**
   * Get all currently connected members in a room.
   *
   * @param roomId - The room to query.
   * @returns Array of current room members.
   */
  getMembers(roomId: string): RoomMember[];

  /**
   * Update the current user's presence data.
   *
   * @param roomId - The room to update presence in.
   * @param data - Arbitrary presence data to broadcast.
   */
  updatePresence(roomId: string, data: Record<string, unknown>): void;

  // ── Broadcast (ephemeral events) ─────────────────────────────────────────

  /**
   * Broadcast an ephemeral event to all room members.
   *
   * @param roomId - The room to broadcast in.
   * @param event - Event name.
   * @param data - Event payload.
   */
  broadcast(roomId: string, event: string, data: unknown): void;

  /**
   * Listen for a specific broadcast event in a room.
   *
   * @param roomId - The room to listen in.
   * @param event - Event name to listen for.
   * @param callback - Invoked with the event data and sender.
   * @returns An unsubscribe function.
   */
  onBroadcast(
    roomId: string,
    event: string,
    callback: (data: unknown, sender: RoomMember) => void
  ): () => void;

  // ── Storage (persistent shared state) ────────────────────────────────────

  /**
   * Get the current shared state for a room.
   *
   * @typeParam T - The shape of the shared state.
   * @param roomId - The room to query.
   * @returns The current state or null if none exists.
   */
  getState<T>(roomId: string): T | null;

  /**
   * Update the shared state for a room using an updater function.
   *
   * @typeParam T - The shape of the shared state.
   * @param roomId - The room to update.
   * @param updater - Function that receives the previous state and returns the new state.
   */
  setState<T>(roomId: string, updater: (prev: T) => T): void;

  /**
   * Listen for shared state changes in a room.
   *
   * @typeParam T - The shape of the shared state.
   * @param roomId - The room to listen in.
   * @param callback - Invoked with the new state and the member who made the change.
   * @returns An unsubscribe function.
   */
  onStateChange<T>(roomId: string, callback: (state: T, updatedBy: RoomMember) => void): () => void;
}

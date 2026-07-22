/**
 * @file mock.transport.ts
 * Mock transport for unit testing collaboration hooks.
 *
 * Provides a fully in-memory implementation of the CollaborationTransport
 * interface with spyable methods for assertions in tests.
 *
 * @module @stackra/collaboration/transports
 * @category Transports
 */

import type { CollaborationTransport } from "@/interfaces/transport.interface";
import type { RoomMember } from "@/interfaces/room-member.interface";

/**
 * In-memory mock transport for unit testing.
 *
 * All methods are no-ops by default. Override or spy on them in tests
 * to verify hook behavior without real BroadcastChannel or WebSocket.
 *
 * @example
 * ```typescript
 * const transport = new MockTransport();
 * // Use in tests to verify hook interactions
 * await transport.connect('room-1', 'user-abc', { name: 'Test' });
 * expect(transport.getMembers('room-1')).toHaveLength(0);
 * ```
 */
export class MockTransport implements CollaborationTransport {
  /** Track connected rooms for assertions. */
  public readonly connectedRooms = new Set<string>();

  /** Track broadcast calls for assertions. */
  public readonly broadcasts: Array<{ roomId: string; event: string; data: unknown }> = [];

  /** Internal state storage. */
  private readonly states = new Map<string, unknown>();

  /**
   * Connect to a mock room.
   *
   * @param roomId - Unique room identifier.
   * @param _userId - Current user's unique ID (unused in mock).
   * @param _userInfo - User metadata (unused in mock).
   * @returns Resolves immediately.
   */
  public async connect(
    roomId: string,
    _userId: string,
    _userInfo: Record<string, unknown>,
  ): Promise<void> {
    this.connectedRooms.add(roomId);
  }

  /**
   * Disconnect from a mock room.
   *
   * @param roomId - The room to disconnect from.
   */
  public disconnect(roomId: string): void {
    this.connectedRooms.delete(roomId);
  }

  /**
   * Register a callback for when a member joins (no-op in mock).
   *
   * @param _roomId - The room to listen on.
   * @param _callback - Invoked with the joining member.
   * @returns An unsubscribe function.
   */
  public onMemberJoin(_roomId: string, _callback: (member: RoomMember) => void): () => void {
    return () => {};
  }

  /**
   * Register a callback for when a member leaves (no-op in mock).
   *
   * @param _roomId - The room to listen on.
   * @param _callback - Invoked with the leaving member.
   * @returns An unsubscribe function.
   */
  public onMemberLeave(_roomId: string, _callback: (member: RoomMember) => void): () => void {
    return () => {};
  }

  /**
   * Get all currently connected members (always empty in mock).
   *
   * @param _roomId - The room to query.
   * @returns Empty array.
   */
  public getMembers(_roomId: string): RoomMember[] {
    return [];
  }

  /**
   * Update presence (no-op in mock).
   *
   * @param _roomId - The room to update presence in.
   * @param _data - Arbitrary presence data.
   */
  public updatePresence(_roomId: string, _data: Record<string, unknown>): void {}

  /**
   * Broadcast an event (recorded for assertions).
   *
   * @param roomId - The room to broadcast in.
   * @param event - Event name.
   * @param data - Event payload.
   */
  public broadcast(roomId: string, event: string, data: unknown): void {
    this.broadcasts.push({ roomId, event, data });
  }

  /**
   * Listen for a broadcast event (no-op in mock).
   *
   * @param _roomId - The room to listen in.
   * @param _event - Event name to listen for.
   * @param _callback - Invoked with the event data and sender.
   * @returns An unsubscribe function.
   */
  public onBroadcast(
    _roomId: string,
    _event: string,
    _callback: (data: unknown, sender: RoomMember) => void,
  ): () => void {
    return () => {};
  }

  /**
   * Get the current shared state.
   *
   * @typeParam T - The shape of the shared state.
   * @param roomId - The room to query.
   * @returns The current state or null.
   */
  public getState<T>(roomId: string): T | null {
    return (this.states.get(roomId) as T) ?? null;
  }

  /**
   * Update the shared state.
   *
   * @typeParam T - The shape of the shared state.
   * @param roomId - The room to update.
   * @param updater - Function that receives the previous state and returns the new state.
   */
  public setState<T>(roomId: string, updater: (prev: T) => T): void {
    const prev = (this.states.get(roomId) ?? null) as T;
    this.states.set(roomId, updater(prev));
  }

  /**
   * Listen for state changes (no-op in mock).
   *
   * @typeParam T - The shape of the shared state.
   * @param _roomId - The room to listen in.
   * @param _callback - Invoked with the new state and updater.
   * @returns An unsubscribe function.
   */
  public onStateChange<T>(
    _roomId: string,
    _callback: (state: T, updatedBy: RoomMember) => void,
  ): () => void {
    return () => {};
  }
}

/**
 * Reverb transport using @stackra/realtime for remote collaboration.
 *
 * Uses the existing RealtimeManager to connect to Laravel Reverb/Pusher
 * presence channels. Falls back to BroadcastChannelTransport if the
 * RealtimeManager is not available in the DI container.
 *
 * @module @stackra/collaboration/transports
 * @category Transports
 */

import { Logger } from "@stackra/logger";

import type { CollaborationTransport } from "@/interfaces/transport.interface";
import type { RoomMember } from "@/interfaces/room-member.interface";
import { BroadcastChannelTransport } from "./broadcast-channel.transport";

/**
 * Reverb-based transport for remote collaboration via WebSockets.
 *
 * Wraps the `@stackra/realtime` RealtimeManager to provide presence
 * channels, whispers, and state synchronization over Laravel Reverb.
 *
 * Falls back to BroadcastChannelTransport when the RealtimeManager is
 * not available (e.g., no WebSocket credentials configured).
 *
 * @example
 * ```typescript
 * const transport = new ReverbTransport(realtimeManager);
 * await transport.connect('room-1', 'user-abc', { name: 'Alice' });
 * ```
 */
export class ReverbTransport implements CollaborationTransport {
  private readonly logger = new Logger(ReverbTransport.name);

  /** Fallback transport used when Reverb is unavailable. */
  private readonly fallback: BroadcastChannelTransport;

  /** Whether we're using the fallback transport. */
  private usingFallback = false;

  /**
   * Create a new ReverbTransport instance.
   *
   * @param realtimeManager - The RealtimeManager instance from DI (or null).
   */
  public constructor(realtimeManager: unknown) {
    this.fallback = new BroadcastChannelTransport();

    if (!realtimeManager) {
      this.logger.warn(
        "RealtimeManager not available. Falling back to BroadcastChannel transport.",
      );
      this.usingFallback = true;
    }
  }

  /**
   * Connect to a collaboration room.
   *
   * Attempts to use Reverb presence channels. Falls back to
   * BroadcastChannel if the RealtimeManager is not configured.
   *
   * @param roomId - Unique room identifier.
   * @param userId - Current user's unique ID.
   * @param userInfo - User metadata (name, color, etc.).
   * @returns A promise that resolves when connected.
   */
  public async connect(
    roomId: string,
    userId: string,
    userInfo: Record<string, unknown>,
  ): Promise<void> {
    if (this.usingFallback) {
      return this.fallback.connect(roomId, userId, userInfo);
    }

    // TODO: Implement Reverb presence channel join via RealtimeManager
    // For now, fall back to BroadcastChannel
    this.logger.info(
      `Connecting to room "${roomId}" via Reverb (falling back to BroadcastChannel)`,
    );
    this.usingFallback = true;
    return this.fallback.connect(roomId, userId, userInfo);
  }

  /**
   * Disconnect from a collaboration room.
   *
   * @param roomId - The room to disconnect from.
   */
  public disconnect(roomId: string): void {
    if (this.usingFallback) {
      return this.fallback.disconnect(roomId);
    }

    // TODO: Implement Reverb channel leave
    this.fallback.disconnect(roomId);
  }

  /**
   * Register a callback for when a member joins the room.
   *
   * @param roomId - The room to listen on.
   * @param callback - Invoked with the joining member.
   * @returns An unsubscribe function.
   */
  public onMemberJoin(roomId: string, callback: (member: RoomMember) => void): () => void {
    return this.fallback.onMemberJoin(roomId, callback);
  }

  /**
   * Register a callback for when a member leaves the room.
   *
   * @param roomId - The room to listen on.
   * @param callback - Invoked with the leaving member.
   * @returns An unsubscribe function.
   */
  public onMemberLeave(roomId: string, callback: (member: RoomMember) => void): () => void {
    return this.fallback.onMemberLeave(roomId, callback);
  }

  /**
   * Get all currently connected members in a room.
   *
   * @param roomId - The room to query.
   * @returns Array of current room members.
   */
  public getMembers(roomId: string): RoomMember[] {
    return this.fallback.getMembers(roomId);
  }

  /**
   * Update the current user's presence data.
   *
   * @param roomId - The room to update presence in.
   * @param data - Arbitrary presence data to broadcast.
   */
  public updatePresence(roomId: string, data: Record<string, unknown>): void {
    this.fallback.updatePresence(roomId, data);
  }

  /**
   * Broadcast an ephemeral event to all room members.
   *
   * @param roomId - The room to broadcast in.
   * @param event - Event name.
   * @param data - Event payload.
   */
  public broadcast(roomId: string, event: string, data: unknown): void {
    this.fallback.broadcast(roomId, event, data);
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
    return this.fallback.onBroadcast(roomId, event, callback);
  }

  /**
   * Get the current shared state for a room.
   *
   * @typeParam T - The shape of the shared state.
   * @param roomId - The room to query.
   * @returns The current state or null if none exists.
   */
  public getState<T>(roomId: string): T | null {
    return this.fallback.getState<T>(roomId);
  }

  /**
   * Update the shared state for a room using an updater function.
   *
   * @typeParam T - The shape of the shared state.
   * @param roomId - The room to update.
   * @param updater - Function that receives the previous state and returns the new state.
   */
  public setState<T>(roomId: string, updater: (prev: T) => T): void {
    this.fallback.setState<T>(roomId, updater);
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
    return this.fallback.onStateChange<T>(roomId, callback);
  }
}

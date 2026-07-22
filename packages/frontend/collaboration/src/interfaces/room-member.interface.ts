/**
 * @file room-member.interface.ts
 * Represents a member currently present in a collaboration room.
 *
 * @module @stackra/collaboration/interfaces
 * @category Interfaces
 */

/**
 * A member in a collaboration room with their identity and presence data.
 *
 * @example
 * ```typescript
 * const member: RoomMember = {
 *   userId: 'abc123',
 *   name: 'Alice',
 *   color: '#e74c3c',
 *   joinedAt: Date.now(),
 *   presence: { cursor: { x: 100, y: 200 } },
 * };
 * ```
 */
export interface RoomMember {
  /** Unique identifier for the user. */
  userId: string;

  /** Display name of the member. */
  name: string;

  /** Assigned color for visual identification (hex). */
  color: string;

  /** Timestamp when the member joined the room. */
  joinedAt: number;

  /** Arbitrary presence data attached to this member. */
  presence: Record<string, unknown>;
}

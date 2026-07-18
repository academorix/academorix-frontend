/**
 * Configuration options for joining a collaboration room.
 *
 * @module @stackra/collaboration/interfaces
 * @category Interfaces
 */

/**
 * Options passed when connecting to a collaboration room.
 *
 * @example
 * ```typescript
 * const options: RoomOptions = {
 *   userId: 'user-abc',
 *   userName: 'Alice',
 *   userColor: '#3498db',
 *   initialPresence: { status: 'active' },
 * };
 * ```
 */
export interface RoomOptions {
  /** Override the auto-generated user ID. */
  userId?: string;

  /** Display name for the current user. */
  userName?: string;

  /** Override the auto-assigned color (hex). */
  userColor?: string;

  /** Initial presence data to broadcast on join. */
  initialPresence?: Record<string, unknown>;
}

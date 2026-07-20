/**
 * Activity feed entry type for collaboration room events.
 *
 * @module @stackra/collaboration/types
 * @category Types
 */

/**
 * A single entry in the room activity feed.
 *
 * Represents events like joins, leaves, state changes, and messages
 * that occurred in a collaboration room.
 *
 * @example
 * ```typescript
 * const entry: ActivityEntry = {
 *   id: 'act-001',
 *   type: 'join',
 *   userId: 'user-abc',
 *   userName: 'Alice',
 *   message: 'Alice joined the room',
 *   timestamp: Date.now(),
 * };
 * ```
 */
export type ActivityEntry = {
  /** Unique activity entry identifier. */
  id: string;

  /** Type of activity event. */
  type: "join" | "leave" | "state_change" | "message" | "thread_create" | "thread_resolve";

  /** User ID of the actor. */
  userId: string;

  /** Display name of the actor. */
  userName: string;

  /** Human-readable description of the activity. */
  message: string;

  /** Timestamp when the activity occurred. */
  timestamp: number;

  /** Optional additional metadata. */
  metadata?: Record<string, unknown>;
};

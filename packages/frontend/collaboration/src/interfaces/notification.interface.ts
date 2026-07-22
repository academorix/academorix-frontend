/**
 * @file notification.interface.ts
 * Notification interface for collaboration events.
 *
 * @module @stackra/collaboration/interfaces
 * @category Interfaces
 */

/**
 * A collaboration notification triggered by room activity.
 *
 * @example
 * ```typescript
 * const notification: CollaborationNotification = {
 *   id: 'notif-001',
 *   type: 'mention',
 *   roomId: 'room-abc',
 *   message: 'Alice mentioned you in a thread',
 *   fromUserId: 'user-abc',
 *   fromUserName: 'Alice',
 *   read: false,
 *   createdAt: Date.now(),
 * };
 * ```
 */
export interface CollaborationNotification {
  /** Unique notification identifier. */
  id: string;

  /** Type of notification event. */
  type: "mention" | "reply" | "state_change" | "thread_resolved";

  /** Room where the event occurred. */
  roomId: string;

  /** Human-readable notification message. */
  message: string;

  /** User ID of the actor who triggered this notification. */
  fromUserId: string;

  /** Display name of the actor. */
  fromUserName: string;

  /** Whether this notification has been read. */
  read: boolean;

  /** Timestamp when the notification was created. */
  createdAt: number;
}

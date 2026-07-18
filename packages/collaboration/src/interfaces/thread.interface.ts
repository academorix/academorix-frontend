/**
 * Thread and message interfaces for collaboration comments.
 *
 * @module @stackra/collaboration/interfaces
 * @category Interfaces
 */

/**
 * A single message within a thread.
 *
 * @example
 * ```typescript
 * const message: ThreadMessage = {
 *   id: 'msg-001',
 *   body: 'Looks good to me!',
 *   createdBy: 'user-abc',
 *   createdByName: 'Alice',
 *   createdAt: Date.now(),
 * };
 * ```
 */
export interface ThreadMessage {
  /** Unique message identifier. */
  id: string;

  /** Message body text. */
  body: string;

  /** User ID of the message author. */
  createdBy: string;

  /** Display name of the message author. */
  createdByName: string;

  /** Timestamp when the message was created. */
  createdAt: number;
}

/**
 * A discussion thread attached to a room or element.
 *
 * @example
 * ```typescript
 * const thread: Thread = {
 *   id: 'thread-001',
 *   roomId: 'room-abc',
 *   elementId: 'btn-submit',
 *   messages: [],
 *   resolved: false,
 *   createdBy: 'user-abc',
 *   createdByName: 'Alice',
 *   createdAt: Date.now(),
 * };
 * ```
 */
export interface Thread {
  /** Unique thread identifier. */
  id: string;

  /** Room this thread belongs to. */
  roomId: string;

  /** Optional element ID this thread is anchored to. */
  elementId?: string;

  /** Messages in this thread, ordered chronologically. */
  messages: ThreadMessage[];

  /** Whether this thread has been resolved. */
  resolved: boolean;

  /** User ID of the thread creator. */
  createdBy: string;

  /** Display name of the thread creator. */
  createdByName: string;

  /** Timestamp when the thread was created. */
  createdAt: number;
}

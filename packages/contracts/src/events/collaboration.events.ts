/**
 * @file collaboration.events.ts
 * @module @stackra/contracts/events
 * @description Wire-message event names for `@stackra/collaboration`.
 *
 *   These names are used both on the shared `EVENT_EMITTER` bus and
 *   on each room-scoped transport (BroadcastChannel, Reverb, etc.) as
 *   the message `type` field, so they're kept in imperative form
 *   ("cursor-move", "thread-create") to match Liveblocks/Yjs-style
 *   command-message conventions.
 *
 *   Constants live in contracts so cross-package consumers (audit
 *   loggers, presence dashboards, analytics collectors) can subscribe
 *   without depending on the collaboration package directly.
 *
 *   Payload shapes (documented on the collaboration package):
 *     - `CURSOR_MOVE`    — `{ roomId, member, position }`
 *     - `CURSOR_REMOVE`  — `{ roomId, memberId }`
 *     - `TYPING_START`   — `{ roomId, member, threadId? }`
 *     - `TYPING_STOP`    — `{ roomId, member, threadId? }`
 *     - `THREAD_CREATE`  — `{ roomId, thread }`
 *     - `THREAD_REPLY`   — `{ roomId, threadId, message }`
 *     - `THREAD_RESOLVE` — `{ roomId, threadId, resolvedBy }`
 *     - `THREAD_DELETE`  — `{ roomId, threadId }`
 */

/**
 * Collaboration wire-message event names.
 */
export const COLLABORATION_EVENTS = {
  /** A remote cursor position updated. */
  CURSOR_MOVE: "collaboration.cursor-move",
  /** A remote cursor left the room / went idle. */
  CURSOR_REMOVE: "collaboration.cursor-remove",
  /** A member began typing (optionally scoped to a thread). */
  TYPING_START: "collaboration.typing-start",
  /** A member stopped typing. */
  TYPING_STOP: "collaboration.typing-stop",
  /** A new thread was opened. */
  THREAD_CREATE: "collaboration.thread-create",
  /** A reply was posted to an existing thread. */
  THREAD_REPLY: "collaboration.thread-reply",
  /** A thread was marked resolved. */
  THREAD_RESOLVE: "collaboration.thread-resolve",
  /** A thread was removed. */
  THREAD_DELETE: "collaboration.thread-delete",
} as const;

/**
 * Union type of every emitted collaboration event name.
 */
export type CollaborationEventName =
  (typeof COLLABORATION_EVENTS)[keyof typeof COLLABORATION_EVENTS];

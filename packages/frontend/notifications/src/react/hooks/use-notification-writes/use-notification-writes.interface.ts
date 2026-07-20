/**
 * @file use-notification-writes.interface.ts
 * @module @stackra/notifications/react/hooks
 * @description Types for the {@link useNotificationWrites} hook —
 *   the write-endpoints wrapper.
 */

import type { INotificationPreferences } from "@/core/interfaces";

/**
 * Writer contract callers pass into {@link useNotificationWrites}.
 *
 * Every method resolves to `void` and is expected to swallow
 * transient backend gaps (404 / 501) so the caller's optimistic
 * local mutation stays in place. Reject on real errors so the
 * caller can render a toast + retry.
 */
export interface NotificationWriter {
  /** Persist "seen" state for a single entry. */
  readonly markSeen: (id: string) => Promise<void>;
  /** Persist "seen" state for every unread entry. */
  readonly markAllSeen: () => Promise<void>;
  /** Persist "dismissed" state — removes the entry from the queue. */
  readonly remove: (id: string) => Promise<void>;
  /** Persist a new preferences shape. */
  readonly updatePreferences: (preferences: INotificationPreferences) => Promise<void>;
}

/**
 * Value returned by {@link useNotificationWrites}.
 *
 * Every method is a stable callback the caller wires into onClick
 * handlers. Each optimistically flips local state through the
 * in-app centre / preferences service, then fires the network
 * mutation through the caller-supplied {@link NotificationWriter}.
 */
export interface IUseNotificationWritesResult {
  /** Mark a single in-app entry as seen. */
  readonly markSeen: (id: string) => Promise<void>;
  /** Mark every in-app entry as seen. */
  readonly markAllSeen: () => Promise<void>;
  /** Remove (dismiss) a single in-app entry. */
  readonly remove: (id: string) => Promise<void>;
  /** Persist a preferences update. */
  readonly updatePreferences: (preferences: INotificationPreferences) => Promise<void>;
  /** Whether any write is currently in flight. */
  readonly isPending: boolean;
  /** Last error surfaced by a write (or `null`). */
  readonly error: Error | null;
}

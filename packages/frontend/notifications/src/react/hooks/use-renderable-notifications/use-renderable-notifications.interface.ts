/**
 * @file use-renderable-notifications.interface.ts
 * @module @stackra/notifications/react/hooks
 * @description Return shape for the {@link useRenderableNotifications} hook.
 */

import type { IRenderableNotification } from "@/core/interfaces";

/**
 * Value returned by {@link useRenderableNotifications}.
 */
export interface IUseRenderableNotificationsResult {
  /** Renderable entries, newest first. */
  readonly entries: readonly IRenderableNotification[];
  /** Number of unread + non-snoozed entries. */
  readonly unreadCount: number;
}

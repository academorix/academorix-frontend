/**
 * @file use-renderable-notifications.hook.ts
 * @module @stackra/notifications/native/hooks
 * @description Native mirror of the web
 *   {@link useRenderableNotifications} hook.
 *
 *   Same implementation shape as the web version — pure DI +
 *   `useMemo`, no DOM primitives — so the file is a straight
 *   port. Kept under the native subpath so `native/index.ts`
 *   doesn't reach into `../react/`.
 */

import { useMemo } from "react";

import type { IRenderableNotification } from "@/core/interfaces";
import { deriveNotificationPriority } from "@/core/utils";

import { useInAppNotifications } from "../use-in-app-notifications";
import { useSnoozeStore } from "../use-snooze-store";

/**
 * Return shape for the native
 * {@link useRenderableNotifications} hook.
 */
export interface IUseRenderableNotificationsResult {
  /** Renderable entries, newest first. */
  readonly entries: readonly IRenderableNotification[];
  /** Number of unread + non-snoozed entries. */
  readonly unreadCount: number;
}

/**
 * Project the in-app centre's snapshot into
 * {@link IRenderableNotification} view models.
 *
 * @example
 * ```tsx
 * import { useRenderableNotifications } from '@stackra/notifications/native';
 *
 * function InboxBell() {
 *   const { unreadCount } = useRenderableNotifications();
 *   return <Text>{unreadCount}</Text>;
 * }
 * ```
 */
export function useRenderableNotifications(): IUseRenderableNotificationsResult {
  const { items } = useInAppNotifications();
  const { isSnoozed } = useSnoozeStore();

  return useMemo<IUseRenderableNotificationsResult>(() => {
    const entries: IRenderableNotification[] = items.map((notification) => ({
      notification,
      isRead: notification.seenAt !== null,
      isSnoozed: isSnoozed(notification.id),
      priority: deriveNotificationPriority(notification.payload),
    }));
    // "Unread" = not read AND not snoozed — mirrors the web
    // definition so the two badges agree.
    const unreadCount = entries.reduce((n, e) => (!e.isRead && !e.isSnoozed ? n + 1 : n), 0);
    return { entries, unreadCount };
  }, [items, isSnoozed]);
}

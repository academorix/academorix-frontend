/**
 * @file use-renderable-notifications.hook.ts
 * @module @stackra/notifications/react/hooks
 * @description Project raw in-app centre entries into
 *   {@link IRenderableNotification} view models — attaching
 *   the derived priority and snooze flag.
 *
 *   The drawer + inbox page consume this hook (instead of
 *   {@link useInAppNotifications} directly) so the filter pipeline
 *   works against a normalised shape.
 */

import { useMemo } from 'react';

import type { IRenderableNotification } from '@/core/interfaces';
import { deriveNotificationPriority } from '@/core/utils';
import { useInAppNotifications } from '../use-in-app-notifications';
import { useSnoozeStore } from '../use-snooze-store';
import type { IUseRenderableNotificationsResult } from './use-renderable-notifications.interface';

/**
 * Renderable notifications projection.
 *
 * @example
 * ```tsx
 * import { useRenderableNotifications } from '@stackra/notifications/react';
 *
 * function Inbox() {
 *   const { entries, unreadCount } = useRenderableNotifications();
 *   return <span>{unreadCount} unread</span>;
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
    // "Unread" = not read AND not snoozed. Snoozed rows drop out
    // of the badge count so the user isn't nagged by items they
    // deferred themselves.
    const unreadCount = entries.reduce((n, e) => (!e.isRead && !e.isSnoozed ? n + 1 : n), 0);
    return { entries, unreadCount };
  }, [items, isSnoozed]);
}

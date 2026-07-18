/**
 * @file use-in-app-notifications.interface.ts
 * @module @stackra/notifications/react/hooks
 * @description Return shape for the {@link useInAppNotifications} hook.
 */

import type { IInAppNotification } from '@/core/interfaces';

/**
 * Value returned by {@link useInAppNotifications}.
 */
export interface IUseInAppNotificationsResult {
  /** Every non-dismissed item in the in-app centre, newest first. */
  readonly items: readonly IInAppNotification[];
  /** Number of items with `seenAt === null`. */
  readonly unreadCount: number;
}

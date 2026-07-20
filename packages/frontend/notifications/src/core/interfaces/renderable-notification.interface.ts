/**
 * @file renderable-notification.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Row-level view model for an in-app notification.
 *
 *   Wraps the canonical {@link IInAppNotification} with the
 *   read / snoozed flags + the derived priority the drawer's
 *   filter pipeline uses.
 */

import type { IInAppNotification } from './in-app-notification.interface';
import type { NotificationPriority } from './notification-priority.type';

/**
 * A single renderable row.
 */
export interface IRenderableNotification {
  /** The canonical in-app notification entry. */
  readonly notification: IInAppNotification;
  /** `notification.seenAt !== null`. */
  readonly isRead: boolean;
  /** Whether the notification is currently snoozed. */
  readonly isSnoozed: boolean;
  /** Derived priority tier. */
  readonly priority: NotificationPriority;
}

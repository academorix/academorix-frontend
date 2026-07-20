/**
 * @file use-notification-toast.interface.ts
 * @module @stackra/notifications/react/hooks
 * @description Options + result for {@link useNotificationToast}.
 */

import type { NotificationPriority } from "@/core/interfaces";

/**
 * Options accepted by {@link useNotificationToast}.
 */
export interface IUseNotificationToastOptions {
  /**
   * Minimum priority tier that triggers a toast. Items below this
   * tier land in the drawer silently.
   *
   * @default 'normal'
   */
  readonly minimumPriority?: NotificationPriority;
  /**
   * Whether to fire toasts for items that were already in the centre
   * at mount. Rarely useful — the default is `false` because
   * replaying every previously-received notification as a fresh
   * toast on every navigation is objectively user-hostile.
   *
   * @default false
   */
  readonly toastExistingOnMount?: boolean;
}

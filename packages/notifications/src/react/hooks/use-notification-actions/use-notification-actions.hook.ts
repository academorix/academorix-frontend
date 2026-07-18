/**
 * @file use-notification-actions.hook.ts
 * @module @stackra/notifications/react/hooks
 * @description Expose the mutation surface of the notification
 *   manager and the in-app centre as a stable callback bundle.
 *
 *   Distinct from {@link useInAppNotifications} — that one reads
 *   the in-app snapshot; this one returns callbacks
 *   (`dispatch` / `markSeen` / `dismiss` / `clear`) the caller
 *   invokes from onClick handlers.
 */

import { useCallback } from 'react';
import { useInject } from '@stackra/container/react';

import { IN_APP_NOTIFICATION_CENTRE, NOTIFICATION_MANAGER } from '@/core/constants';
import type {
  IDeliveryReport,
  INotificationManager,
  INotificationPayload,
} from '@/core/interfaces';
import type { InAppNotificationCentre } from '@/core/services';
import type { IUseNotificationActionsResult } from './use-notification-actions.interface';

/**
 * The notification action bundle — `dispatch`, `markSeen`,
 * `dismiss`, and `clear`.
 *
 * @example
 * ```tsx
 * import { useNotificationActions } from '@stackra/notifications/react';
 *
 * function CommentThread() {
 *   const { dispatch } = useNotificationActions();
 *   const onNewComment = async () =>
 *     dispatch({ title: 'New comment', body: 'Someone replied to you.' });
 *   // …
 * }
 * ```
 */
export function useNotificationActions(): IUseNotificationActionsResult {
  const manager = useInject<INotificationManager>(NOTIFICATION_MANAGER);
  const centre = useInject<InAppNotificationCentre>(IN_APP_NOTIFICATION_CENTRE);

  const dispatch = useCallback(
    (
      payload: INotificationPayload,
      options?: { readonly channels?: readonly string[] }
    ): Promise<readonly IDeliveryReport[]> => manager.dispatch(payload, options),
    [manager]
  );
  const markSeen = useCallback((id: string): Promise<boolean> => centre.markSeen(id), [centre]);
  const dismiss = useCallback((id: string): Promise<boolean> => centre.dismiss(id), [centre]);
  const clear = useCallback((): Promise<void> => centre.clear(), [centre]);

  return { dispatch, markSeen, dismiss, clear };
}

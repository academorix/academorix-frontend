/**
 * @file use-in-app-notifications.hook.ts
 * @module @stackra/notifications/native/hooks
 * @description Native mirror of the web
 *   {@link useInAppNotifications} hook.
 *
 *   Identical to the web implementation — the hook uses only
 *   `useInject` + `useSyncExternalStore`, both cross-platform React
 *   primitives. Kept as a distinct file under the native subpath
 *   so the RN entry point doesn't need to reach into `../react/`.
 */

import { useCallback, useSyncExternalStore } from "react";
import { useInject } from "@stackra/container/react";

import { IN_APP_NOTIFICATION_CENTRE } from "@/core/constants";
import type { InAppNotificationCentre } from "@/core/services";
import type { IInAppNotificationCentreSnapshot } from "@/core/interfaces";

/**
 * Value returned by the native `useInAppNotifications`.
 *
 * Same shape as the web version so consumer code paths that only
 * read `items` + `unreadCount` are cross-platform.
 */
export type IUseInAppNotificationsResult = IInAppNotificationCentreSnapshot;

/**
 * Subscribe to the in-app centre's snapshot on native.
 *
 * @example
 * ```tsx
 * import { useInAppNotifications } from '@stackra/notifications/native';
 *
 * function InboxBell() {
 *   const { unreadCount } = useInAppNotifications();
 *   return <Text>{unreadCount > 0 ? unreadCount : null}</Text>;
 * }
 * ```
 */
export function useInAppNotifications(): IUseInAppNotificationsResult {
  const centre = useInject<InAppNotificationCentre>(IN_APP_NOTIFICATION_CENTRE);
  const subscribe = useCallback((cb: () => void) => centre.subscribe(cb), [centre]);
  const getSnapshot = useCallback(() => centre.getSnapshot(), [centre]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

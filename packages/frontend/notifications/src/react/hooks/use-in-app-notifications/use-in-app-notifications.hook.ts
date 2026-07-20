/**
 * @file use-in-app-notifications.hook.ts
 * @module @stackra/notifications/react/hooks
 * @description Read the in-app notification centre reactively.
 *
 *   Backed by `useSyncExternalStore` for tearing-free reads under
 *   concurrent React — matches the scope package's pattern.
 */

import { useCallback, useSyncExternalStore } from "react";
import { useInject } from "@stackra/container/react";

import { IN_APP_NOTIFICATION_CENTRE } from "@/core/constants";
import type { InAppNotificationCentre } from "@/core/services";
import type { IUseInAppNotificationsResult } from "./use-in-app-notifications.interface";

/**
 * Subscribe to the in-app centre's snapshot.
 *
 * The centre's snapshot is referentially stable — the identity only
 * changes when items are dispatched / marked seen / dismissed —
 * making it safe to consume through `useSyncExternalStore`.
 *
 * @example
 * ```tsx
 * import { useInAppNotifications } from '@stackra/notifications/react';
 *
 * function InboxBell() {
 *   const { items, unreadCount } = useInAppNotifications();
 *   return <span>{unreadCount > 0 ? unreadCount : null}</span>;
 * }
 * ```
 */
export function useInAppNotifications(): IUseInAppNotificationsResult {
  const centre = useInject<InAppNotificationCentre>(IN_APP_NOTIFICATION_CENTRE);
  // Subscribe + snapshot pair for `useSyncExternalStore`. The
  // centre rebuilds its cached snapshot only inside `emit()`, so
  // identity stays stable across renders when nothing changed.
  const subscribe = useCallback((cb: () => void) => centre.subscribe(cb), [centre]);
  const getSnapshot = useCallback(() => centre.getSnapshot(), [centre]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

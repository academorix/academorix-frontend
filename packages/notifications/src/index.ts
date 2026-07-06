/**
 * @file index.ts
 * @module @academorix/notifications
 *
 * @description
 * Public root barrel. Prefer subpath imports for tree-shaking.
 *
 * ## Public API
 *
 *  - {@link "@academorix/notifications/types"} — `Notification<TCategory>` DTO,
 *    `NotificationChannel`, `NotificationPriority`.
 *  - {@link "@academorix/notifications/config"} — `defineNotificationCategories`,
 *    `NotificationCategoryConfig<TId>`.
 *  - {@link "@academorix/notifications/preferences"} — `NotificationPreferences`,
 *    `isDeliveryAllowed`, `isWithinQuietHours`.
 *  - {@link "@academorix/notifications/context"} — `createNotificationsContext<TCategory>()`
 *    → `{ NotificationsProvider, useNotifications }`.
 *  - {@link "@academorix/notifications/push"} — Web Push helpers.
 *  - {@link "@academorix/notifications/hooks"} — `usePushSubscription`.
 *  - {@link "@academorix/notifications/service-worker"} — SW-side
 *    `handlePushEvent`, `handleNotificationClickEvent`.
 */

export type { Notification, NotificationChannel, NotificationPriority } from "./types";

export { defineNotificationCategories } from "./config";
export type { NotificationCategoryConfig } from "./config";

export { isDeliveryAllowed, isWithinQuietHours } from "./preferences";
export type {
  CategoryChannelPreferences,
  IsDeliveryAllowedArgs,
  NotificationPreferences,
  QuietHoursWindow,
} from "./preferences";

export { createNotificationsContext } from "./context";
export type {
  NotificationsContextBundle,
  NotificationsContextValue,
  NotificationsProviderProps,
} from "./context";

export {
  getExistingPushSubscription,
  isPushSupported,
  serializePushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  urlBase64ToUint8Array,
} from "./push";
export type { SerializedPushSubscription, SubscribeToPushOptions } from "./push";

export { usePushSubscription } from "./hooks";
export type { UsePushSubscriptionOptions, UsePushSubscriptionResult } from "./hooks";

export { handleNotificationClickEvent, handlePushEvent } from "./service-worker";

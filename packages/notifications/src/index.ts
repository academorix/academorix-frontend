/**
 * @file index.ts
 * @module @academorix/notifications
 *
 * @description
 * Public root barrel. Prefer subpath imports for tree-shaking.
 *
 * ## Public API
 *
 *  - {@link "@academorix/notifications/types"} — {@link Notification}
 *    DTO, {@link NotificationChannel}, {@link NotificationStatus},
 *    {@link NotificationDataRef}. Field shape matches the Laravel
 *    backend one-for-one (snake_case included).
 *  - {@link "@academorix/notifications/preferences"} —
 *    {@link NotificationPreferences}, {@link QuietHoursWindow},
 *    {@link isDeliveryAllowed}, {@link isWithinQuietHours},
 *    {@link MANDATORY_PUSH_TYPES}.
 *  - {@link "@academorix/notifications/context"} —
 *    {@link createNotificationsContext} →
 *    `{ NotificationsProvider, useNotifications }`.
 *  - {@link "@academorix/notifications/push"} — Web Push helpers.
 *  - {@link "@academorix/notifications/hooks"} —
 *    {@link usePushSubscription}.
 *  - {@link "@academorix/notifications/service-worker"} — SW-side
 *    {@link handlePushEvent}, {@link handleNotificationClickEvent}.
 *
 * ## Backend contract
 *
 * The types in `types/` + `preferences/preferences.type.ts` mirror
 * the Laravel DTOs at:
 *
 *  - `backend/modules/Communication/src/Data/Notifications/NotificationData.php`
 *  - `backend/modules/Communication/src/Data/NotificationPreferences/NotificationPreferenceData.php`
 *
 * ## TODO — backend endpoints
 *
 * Read endpoints exist:
 *
 *  - `GET /notifications`, `GET /notifications/{id}`
 *  - `GET /notification-preferences`, `GET /notification-preferences/{id}`
 *
 * Write endpoints DO NOT exist yet. Consumers wire the calls with
 * TODO markers until the backend catches up:
 *
 *  - `POST /notifications/{id}/read` — mark one as read.
 *  - `POST /notifications/read-all` — mark all as read.
 *  - `POST /notifications/subscriptions` — register push endpoint.
 *  - `DELETE /notifications/subscriptions/{id}` — tear down push.
 *  - `PUT /notification-preferences` — update preferences.
 */

export type {
  Notification,
  NotificationChannel,
  NotificationDataRef,
  NotificationStatus,
} from "./types";

export { isDeliveryAllowed, isWithinQuietHours, MANDATORY_PUSH_TYPES } from "./preferences";
export type {
  IsDeliveryAllowedArgs,
  NotificationPreferences,
  PerChildPreferences,
  PreferenceDefaults,
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

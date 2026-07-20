/**
 * @file index.ts
 * @module @stackra/notifications/react/hooks
 * @description Barrel export for every web-side notifications hook.
 */

export {
  useNotificationPermission,
  type IUseNotificationPermissionResult,
} from "./use-notification-permission";
export {
  usePushSubscription,
  type IUsePushSubscriptionOptions,
  type IUsePushSubscriptionResult,
} from "./use-push-subscription";
export {
  useInAppNotifications,
  type IUseInAppNotificationsResult,
} from "./use-in-app-notifications";
export {
  useNotificationCentre,
  type IUseNotificationCentreResult,
} from "./use-notification-centre";
export {
  useNotificationActions,
  type IUseNotificationActionsResult,
} from "./use-notification-actions";
export {
  useNotificationPreferences,
  type IUseNotificationPreferencesResult,
} from "./use-notification-preferences";
export { useNotificationToast, type IUseNotificationToastOptions } from "./use-notification-toast";
export {
  useNotificationWrites,
  type IUseNotificationWritesResult,
  type NotificationWriter,
} from "./use-notification-writes";
export {
  useRenderableNotifications,
  type IUseRenderableNotificationsResult,
} from "./use-renderable-notifications";
export { useSnoozeStore, type IUseSnoozeStoreResult } from "./use-snooze-store";

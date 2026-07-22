/**
 * @file index.ts
 * @module @stackra/notifications/native/hooks
 * @description Barrel export for every native-side notifications
 *   hook.
 *
 *   Each hook mirrors the shape of its `@stackra/notifications/react`
 *   twin so cross-platform consumers can rely on a stable return
 *   type. The DI-only hooks (`useInAppNotifications`,
 *   `useNotificationPreferences`, `useNotificationWrites`,
 *   `useRenderableNotifications`) are byte-for-byte ports of the
 *   web version; `useSnoozeStore` and `useNotificationPermission`
 *   differ where a platform primitive (storage / permission API)
 *   demands it.
 */

export {
  useInAppNotifications,
  type IUseInAppNotificationsResult,
} from "./use-in-app-notifications";
export {
  useNotificationPermission,
  type IUseNotificationPermissionResult,
} from "./use-notification-permission";
export {
  useNotificationPreferences,
  type IUseNotificationPreferencesResult,
} from "./use-notification-preferences";
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

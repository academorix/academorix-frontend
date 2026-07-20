/**
 * @file index.ts
 * @module @stackra/notifications/native
 * @description React Native subpath — Expo push token handling +
 *   the received-notification listener wired via
 *   {@link NativeNotificationModule}, plus a full HeroUI Native
 *   UI parity set: bell + drawer + list + row + preferences
 *   pages.
 *
 *   Cross-platform primitives (tokens, interfaces, hooks that don't
 *   depend on `window`) are re-exported so consumers can import
 *   everything they need from a single `@stackra/notifications/native`
 *   path.
 */

import "reflect-metadata";

// ════════════════════════════════════════════════════════════════════
// Native module
// ════════════════════════════════════════════════════════════════════
export { NativeNotificationModule } from "./native-notification.module";

// ════════════════════════════════════════════════════════════════════
// Components (native UI surface)
// ════════════════════════════════════════════════════════════════════
export {
  NotificationBadge,
  NotificationBell,
  NotificationDrawer,
  NotificationEmptyState,
  NotificationList,
  NotificationRow,
  PushPermissionBanner,
  ChannelToggle,
  QuietHoursPicker,
  CategoryPreferencesPanel,
  type NotificationBadgeProps,
  type NotificationBellProps,
  type NotificationDrawerCategoryFilter,
  type NotificationDrawerProps,
  type NotificationDrawerSection,
  type NotificationEmptyStateProps,
  type NotificationListProps,
  type NotificationRowProps,
  type PushPermissionBannerProps,
  type ChannelToggleProps,
  type QuietHoursPickerProps,
  type CategoryPreferencesPanelProps,
  type ChannelDescriptor,
} from "./components";

// ════════════════════════════════════════════════════════════════════
// Pages (full-screen native routes)
// ════════════════════════════════════════════════════════════════════
export {
  InboxPage,
  NotificationPreferencesPage,
  type InboxPageProps,
  type NotificationPreferencesPageProps,
} from "./pages";

// ════════════════════════════════════════════════════════════════════
// Hooks (native mirrors of the react/hooks surface)
// ════════════════════════════════════════════════════════════════════
export {
  useInAppNotifications,
  useNotificationPermission,
  useNotificationPreferences,
  useNotificationWrites,
  useRenderableNotifications,
  useSnoozeStore,
  type IUseInAppNotificationsResult,
  type IUseNotificationPermissionResult,
  type IUseNotificationPreferencesResult,
  type IUseNotificationWritesResult,
  type IUseRenderableNotificationsResult,
  type IUseSnoozeStoreResult,
  type NotificationWriter,
} from "./hooks";

// ════════════════════════════════════════════════════════════════════
// Adapters + services + channels
// ════════════════════════════════════════════════════════════════════
export { ExpoPushTokenAdapter, ExpoNotificationListenerAdapter } from "./adapters";
export { NativeNotificationManager } from "./services";
export { ExpoNotificationChannelDriver } from "./channels";

// ════════════════════════════════════════════════════════════════════
// Tokens + interfaces owned by the native subpath
// ════════════════════════════════════════════════════════════════════
export {
  NATIVE_NOTIFICATION_MANAGER,
  EXPO_PUSH_CONFIG,
  EXPO_PUSH_TOKEN_ADAPTER,
  EXPO_NOTIFICATION_LISTENER_ADAPTER,
} from "./constants";
export type {
  IExpoPushConfig,
  INativePushToken,
  INativeNotificationModuleOptions,
  INativeNotificationPushOptions,
} from "./interfaces";

// ════════════════════════════════════════════════════════════════════
// Cross-platform re-exports (safe on RN — pure interfaces + tokens)
// ════════════════════════════════════════════════════════════════════
export {
  NOTIFICATION_CONFIG,
  NOTIFICATION_MANAGER,
  IN_APP_NOTIFICATION_CENTRE,
  PUSH_SUBSCRIPTION_MANAGER,
  PUSH_SUBSCRIPTION_ADAPTER,
  NOTIFICATION_PREFERENCES_SERVICE,
  NOTIFICATION_EVENTS,
  DEFAULT_NOTIFICATION_CHANNELS,
  DEFAULT_NOTIFICATIONS_CONFIG,
  type NotificationEventName,
  type DefaultNotificationChannel,
} from "@/core/constants";
export type {
  INotificationModuleOptions,
  IInAppNotificationCentreConfig,
  IWebPushConfigOptions,
  INotificationPayload,
  INotificationAction,
  INotificationPermissionState,
  INotificationChannel,
  INotificationChannelDriver,
  INotificationManager,
  INotificationManagerSnapshot,
  IInAppNotification,
  IInAppNotificationCentreSnapshot,
  IDeliveryReport,
  IPushSubscriptionAdapter,
  IPushSubscriptionResult,
  NotificationManagerListener,
} from "@/core/interfaces";
export {
  NotificationError,
  NotificationPermissionDeniedError,
  InvalidVapidKeyError,
  PushNotSupportedError,
} from "@/core/errors";

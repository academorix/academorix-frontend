/**
 * @file index.ts
 * @module @stackra/notifications
 * @description Public API for the `@stackra/notifications` core
 *   subpath — the multi-channel `NotificationModule`, the
 *   `NotificationManager` orchestrator, the durable
 *   `InAppNotificationCentre`, the shared `PushSubscriptionManager`
 *   (whose platform adapter is wired by the appropriate platform
 *   module), the `NotificationPreferencesService`, the in-app
 *   channel driver, event constants, DI tokens, errors, pure
 *   utilities, and every interface consumers implement to plug in
 *   a custom channel driver.
 *
 *   Web Push adapters live in `@stackra/notifications/push`; native
 *   (Expo) push token adapters in `@stackra/notifications/native`;
 *   React bindings in `@stackra/notifications/react`; testing mocks
 *   in `@stackra/notifications/testing`.
 */

import "reflect-metadata";

// ════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════
export { NotificationModule } from "./notification.module";

// ════════════════════════════════════════════════════════════════════
// Channel drivers
// ════════════════════════════════════════════════════════════════════
export { InAppChannelDriver } from "./channels";

// ════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════
export {
  AnalyticsBridgeService,
  InAppNotificationCentre,
  NotificationManager,
  NotificationPreferencesService,
  PushSubscriptionManager,
  type InAppNotificationCentreListener,
} from "./services";

// ════════════════════════════════════════════════════════════════════
// Constants / Tokens
// ════════════════════════════════════════════════════════════════════
export {
  DEFAULT_NOTIFICATIONS_CONFIG,
  DEFAULT_NOTIFICATION_CHANNELS,
  DEFAULT_TIMEZONES,
  MANDATORY_ON_MATRIX,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CONFIG,
  NOTIFICATION_EVENTS,
  NOTIFICATION_MANAGER,
  NOTIFICATION_PREFERENCES_SERVICE,
  IN_APP_NOTIFICATION_CENTRE,
  PUSH_SUBSCRIPTION_ADAPTER,
  PUSH_SUBSCRIPTION_MANAGER,
  SNOOZE_PRESETS_MS,
  type DefaultNotificationChannel,
  type INotificationCategoryDescriptor,
  type NotificationEventName,
} from "./constants";

// ════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════
export {
  InvalidVapidKeyError,
  NotificationError,
  NotificationPermissionDeniedError,
  PushNotSupportedError,
} from "./errors";

// ════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════
export {
  defineConfig,
  deriveNotificationPriority,
  detectNotificationSupport,
  isQuietHoursWindow,
  mapPriorityToToastVariant,
  mergeConfig,
  normalizeNotificationPayload,
  type NotificationToastVariant,
} from "./utils";

// ════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════
export type {
  IDeliveryReport,
  IInAppNotification,
  IInAppNotificationCentreConfig,
  IInAppNotificationCentreSnapshot,
  INotificationAction,
  INotificationChannel,
  INotificationChannelDriver,
  INotificationManager,
  INotificationManagerSnapshot,
  INotificationModuleOptions,
  INotificationPayload,
  INotificationPermissionState,
  INotificationPreferences,
  IPushSubscriptionAdapter,
  IPushSubscriptionResult,
  IQuietHoursWindow,
  IRenderableNotification,
  ISnoozeEntry,
  IWebPushConfigOptions,
  NotificationCategory,
  NotificationManagerListener,
  NotificationPriority,
  SnoozePreset,
} from "./interfaces";

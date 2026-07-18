/**
 * @file index.ts
 * @module @stackra/notifications/core/interfaces
 * @description Barrel export for notifications core interfaces.
 */

export type {
  INotificationModuleOptions,
  IInAppNotificationCentreConfig,
  IWebPushConfigOptions,
} from './notification-module-options.interface';
export type { INotificationPayload } from './notification-payload.interface';
export type { INotificationAction } from './notification-action.interface';
export type { INotificationPermissionState } from './notification-permission-state.interface';
export type { INotificationChannel } from './notification-channel.interface';
export type { INotificationChannelDriver } from './notification-channel-driver.interface';
export type {
  INotificationManager,
  NotificationManagerListener,
} from './notification-manager.interface';
export type { INotificationManagerSnapshot } from './notification-manager-snapshot.interface';
export type { IInAppNotification } from './in-app-notification.interface';
export type { IInAppNotificationCentreSnapshot } from './in-app-notification-centre-snapshot.interface';
export type { IDeliveryReport } from './delivery-report.interface';
export type {
  IPushSubscriptionAdapter,
  IPushSubscriptionResult,
} from './push-subscription-adapter.interface';
export type { NotificationCategory } from './notification-category.type';
export type { NotificationPriority } from './notification-priority.type';
export type { SnoozePreset } from './snooze-preset.type';
export type { IQuietHoursWindow } from './quiet-hours-window.interface';
export type { ISnoozeEntry } from './snooze-entry.interface';
export type { INotificationPreferences } from './notification-preferences.interface';
export type { IRenderableNotification } from './renderable-notification.interface';

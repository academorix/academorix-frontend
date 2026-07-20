/**
 * @file index.ts
 * @module @stackra/notifications/core/constants
 * @description Barrel export for notifications core constants — DI
 *   tokens, event names, channel identifiers, and defaults.
 */

export {
  NOTIFICATION_CONFIG,
  NOTIFICATION_MANAGER,
  IN_APP_NOTIFICATION_CENTRE,
  PUSH_SUBSCRIPTION_ADAPTER,
  PUSH_SUBSCRIPTION_MANAGER,
  NOTIFICATION_PREFERENCES_SERVICE,
} from "./tokens.constant";
export { NOTIFICATION_EVENTS, type NotificationEventName } from "./events.constant";
export {
  DEFAULT_NOTIFICATION_CHANNELS,
  type DefaultNotificationChannel,
} from "./channels.constant";
export { DEFAULT_NOTIFICATIONS_CONFIG } from "./defaults.constant";
export {
  NOTIFICATION_CATEGORIES,
  MANDATORY_ON_MATRIX,
  type INotificationCategoryDescriptor,
} from "./categories.constant";
export { DEFAULT_TIMEZONES } from "./timezones.constant";
export { SNOOZE_PRESETS_MS } from "./snooze-presets.constant";

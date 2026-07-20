/**
 * @file index.ts
 * @module @stackra/notifications/core/services
 * @description Barrel export for notifications core services.
 */

export { AnalyticsBridgeService } from './analytics-bridge.service';
export {
  InAppNotificationCentre,
  type InAppNotificationCentreListener,
} from './in-app-notification-centre.service';
export { NotificationManager } from './notification-manager.service';
export { NotificationPreferencesService } from './notification-preferences.service';
export { PushSubscriptionManager } from './push-subscription-manager.service';

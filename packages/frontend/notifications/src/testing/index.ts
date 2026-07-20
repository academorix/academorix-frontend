/**
 * @file index.ts
 * @module @stackra/notifications/testing
 * @description Public API for `@stackra/notifications/testing`.
 *
 *   In-memory service mocks + event fakes for consumers who want to
 *   exercise the notification flow without a real browser or
 *   `expo-notifications` peer.
 */

export {
  MockNotificationManager,
  type IRecordedNotificationDispatch,
} from './mock-notification-manager';
export { MockInAppNotificationCentre } from './mock-in-app-notification-centre';
export { MockPushSubscriptionManager } from './mock-push-subscription-manager';
export {
  MockPushSubscriptionAdapter,
  type IMockPushSubscriptionAdapterOptions,
} from './mock-push-subscription-adapter';
export { MockNotificationPreferences } from './mock-notification-preferences';
export { MockSnoozeStore } from './mock-snooze-store';
export { MockPushSubscription, type IMockPushSubscriptionOptions } from './mock-push-subscription';
export { MockServiceWorkerRegistration } from './mock-service-worker-registration';
export { MockPermissionStatus } from './mock-permission-status';
export { mockNotificationPayload } from './mock-notification-payload';
export {
  createMockNotificationManager,
  createMockInAppNotificationCentre,
  createMockPushSubscriptionManager,
  createMockPushSubscriptionAdapter,
  createMockNotificationPreferences,
  createMockSnoozeStore,
  type ICreateMockNotificationManagerOptions,
  type ICreateMockInAppNotificationCentreOptions,
  type ICreateMockPushSubscriptionManagerOptions,
  type ICreateMockPushSubscriptionAdapterOptions,
  type ICreateMockNotificationPreferencesOptions,
} from './create-mock-notification';

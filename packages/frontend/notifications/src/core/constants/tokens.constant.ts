/**
 * @file tokens.constant.ts
 * @module @stackra/notifications/core/constants
 * @description DI tokens for the notifications runtime.
 *
 *   Every token below is owned by this package — none are re-exported
 *   from `@stackra/contracts`, per the workspace's contract-reexports
 *   rule. Consumers inject these tokens directly from
 *   `@stackra/notifications`.
 */

/** DI token for the merged {@link INotificationModuleOptions}. */
export const NOTIFICATION_CONFIG = Symbol.for("NOTIFICATION_CONFIG");

/**
 * DI token for the {@link NotificationManager} — the multi-channel
 * orchestrator that dispatches every notification to its registered
 * drivers.
 */
export const NOTIFICATION_MANAGER = Symbol.for("NOTIFICATION_MANAGER");

/**
 * DI token for the {@link InAppNotificationCentre} — the durable queue
 * of received in-app notifications backed by `@stackra/storage`.
 */
export const IN_APP_NOTIFICATION_CENTRE = Symbol.for("IN_APP_NOTIFICATION_CENTRE");

/**
 * DI token for the platform-specific
 * {@link IPushSubscriptionAdapter} — bound by the platform module
 * (`PushModule` on web, `NativeNotificationModule` on native). The
 * shared {@link PushSubscriptionManager} injects this token so both
 * platforms share one manager code path.
 */
export const PUSH_SUBSCRIPTION_ADAPTER = Symbol.for("NOTIFICATIONS_PUSH_SUBSCRIPTION_ADAPTER");

/**
 * DI token for the shared, platform-agnostic
 * {@link PushSubscriptionManager} — resolved to the same class
 * regardless of which platform module wired the adapter.
 */
export const PUSH_SUBSCRIPTION_MANAGER = Symbol.for("NOTIFICATIONS_PUSH_SUBSCRIPTION_MANAGER");

/**
 * DI token for the {@link NotificationPreferencesService} — the
 * per-user preferences store (defaults + per-category enablement +
 * quiet-hours window). Bound in `NotificationModule.forRoot`.
 */
export const NOTIFICATION_PREFERENCES_SERVICE = Symbol.for("NOTIFICATIONS_PREFERENCES_SERVICE");

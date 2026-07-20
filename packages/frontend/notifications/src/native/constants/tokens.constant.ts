/**
 * @file tokens.constant.ts
 * @module @stackra/notifications/native/constants
 * @description DI tokens for the React Native notifications subpath.
 *
 *   Only the RN-specific tokens live here — the shared push-manager
 *   token (`PUSH_SUBSCRIPTION_MANAGER`) and platform-adapter token
 *   (`PUSH_SUBSCRIPTION_ADAPTER`) live in the core subpath so both
 *   platforms bind against the same identity.
 */

/**
 * DI token for the resolved Expo push configuration (project id
 * + experience id + application id). Bound by
 * `NativeNotificationModule.forRoot`.
 */
export const EXPO_PUSH_CONFIG = Symbol.for("NOTIFICATIONS_EXPO_PUSH_CONFIG");

/**
 * DI token for {@link NativeNotificationManager} — attaches the
 * received-notification listener at
 * `onApplicationBootstrap`.
 */
export const NATIVE_NOTIFICATION_MANAGER = Symbol.for("NOTIFICATIONS_NATIVE_NOTIFICATION_MANAGER");

/** DI token for {@link ExpoPushTokenAdapter}. */
export const EXPO_PUSH_TOKEN_ADAPTER = Symbol.for("NOTIFICATIONS_EXPO_PUSH_TOKEN_ADAPTER");

/** DI token for {@link ExpoNotificationListenerAdapter}. */
export const EXPO_NOTIFICATION_LISTENER_ADAPTER = Symbol.for(
  "NOTIFICATIONS_EXPO_NOTIFICATION_LISTENER_ADAPTER",
);

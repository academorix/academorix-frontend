/**
 * @file expo-push-config.interface.ts
 * @module @stackra/notifications/native/interfaces
 * @description Configuration shape for the native Expo push token
 *   adapter.
 */

/**
 * Options accepted by
 * {@link NativeNotificationModule.forRoot} → `push`.
 *
 * `projectId` is Expo's per-project identifier that
 * `getExpoPushTokenAsync({ projectId })` reads. `experienceId` is
 * the legacy Expo Go slug; keep it in the shape for backwards
 * compatibility with older Expo SDKs.
 */
export interface IExpoPushConfig {
  /** Expo project id — from `app.json`. */
  readonly projectId?: string;
  /** Legacy Expo experience id. */
  readonly experienceId?: string;
  /**
   * Optional Firebase / APNS application id override — Expo picks
   * this up when the app is built with FCM / APNS credentials.
   */
  readonly applicationId?: string;
}

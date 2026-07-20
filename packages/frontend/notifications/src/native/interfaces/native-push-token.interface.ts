/**
 * @file native-push-token.interface.ts
 * @module @stackra/notifications/native/interfaces
 * @description The native push token shape carried inside an
 *   `IPushSubscriptionResult.value` when the source adapter is
 *   {@link ExpoPushTokenAdapter}.
 *
 *   Keyed by `platform` so a single wire shape covers both Expo /
 *   FCM (Android) and APNS (iOS) tokens — the consumer's backend
 *   picks the right delivery pipeline off the platform.
 */

/**
 * A native push token.
 */
export interface INativePushToken {
  /** Platform identifier — matches `Platform.OS`. */
  readonly platform: "ios" | "android" | "web" | (string & {});
  /** The push token itself — `ExponentPushToken[...]` on Expo. */
  readonly token: string;
  /** Optional stable device identifier. */
  readonly deviceId?: string;
}

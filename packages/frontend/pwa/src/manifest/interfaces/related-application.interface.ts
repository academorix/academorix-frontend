/**
 * @file related-application.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description A single entry in the `related_applications` array —
 *   another platform-native app the user could install instead of
 *   (or alongside) this PWA.
 */

/**
 * Related-app declaration used with `prefer_related_applications` to
 * point Chromium at native alternatives on Android, Windows, iOS, etc.
 *
 * Chromium hides the browser install prompt when a matching related
 * app is available and the store link resolves.
 */
export interface IRelatedApplication {
  /**
   * Platform identifier. Common values: `'play'` (Google Play),
   * `'itunes'` (App Store), `'windows'` (Microsoft Store),
   * `'webapp'` (generic).
   */
  readonly platform: string;
  /** URL of the native app's store page. */
  readonly url: string;
  /** Optional platform-specific application id. */
  readonly id?: string;
}

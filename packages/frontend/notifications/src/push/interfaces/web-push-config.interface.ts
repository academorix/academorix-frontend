/**
 * @file web-push-config.interface.ts
 * @module @stackra/notifications/push/interfaces
 * @description Resolved Web Push configuration — the shape bound
 *   under `WEB_PUSH_CONFIG` after `PushModule.forRoot` applies
 *   defaults.
 */

/**
 * Resolved Web Push module configuration — every default filled in.
 */
export interface IWebPushConfig {
  /** VAPID public key (URL-safe base64). */
  readonly vapidPublicKey: string;
  /** Service-worker scope. */
  readonly serviceWorkerScope: string;
  /**
   * `userVisibleOnly` hint passed to `PushManager.subscribe`.
   */
  readonly userVisibleOnly: boolean;
}

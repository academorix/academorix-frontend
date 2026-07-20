/**
 * @file notification-permission-denied.error.ts
 * @module @stackra/notifications/core/errors
 * @description Thrown when the user has denied notification permission.
 */

import { NotificationError } from './notification.error';

/**
 * Thrown by services that require `Notification.permission === 'granted'`
 * before they can operate.
 *
 * The manager catches this internally and emits
 * `NOTIFICATION_PERMISSION_DENIED` — consumers rarely see it unless
 * they call the manager directly instead of using the React hooks.
 */
export class NotificationPermissionDeniedError extends NotificationError {
  public readonly code = 'NOTIFICATION_PERMISSION_DENIED' as const;
}

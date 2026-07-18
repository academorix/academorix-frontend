/**
 * @file use-notification-permission.interface.ts
 * @module @stackra/notifications/react/hooks
 * @description Return shape for the {@link useNotificationPermission}
 *   hook.
 */

/**
 * Value returned by {@link useNotificationPermission}.
 */
export interface IUseNotificationPermissionResult {
  /** Current permission state. `'denied'` on unsupported environments. */
  readonly permission: NotificationPermission;
  /** Whether the API is available. */
  readonly isSupported: boolean;
  /**
   * Ask the user for permission. Returns the resulting state.
   * No-op that resolves to `'denied'` when the API is unavailable.
   */
  readonly request: () => Promise<NotificationPermission>;
}

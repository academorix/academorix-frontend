/**
 * @file notification-bell.interface.ts
 * @module @stackra/notifications/native/components
 * @description Props for the native {@link NotificationBell}
 *   component.
 */

/**
 * Props accepted by the native `NotificationBell`.
 */
export interface NotificationBellProps {
  /** Called when the user taps the bell. */
  readonly onPress: () => void;
  /**
   * Optional `accessibilityLabel` override. Defaults to a live
   * count ("Notifications, 3 unread").
   */
  readonly accessibilityLabel?: string;
  /** Additional Tailwind classes appended to the pressable. */
  readonly className?: string;
}

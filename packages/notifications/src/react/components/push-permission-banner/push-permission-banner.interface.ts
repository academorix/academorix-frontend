/**
 * @file push-permission-banner.interface.ts
 * @module @stackra/notifications/react/components
 * @description Props for the {@link PushPermissionBanner} component.
 */

/**
 * Props accepted by {@link PushPermissionBanner}.
 */
export interface PushPermissionBannerProps {
  /** Banner title. @default 'Get instant updates' */
  readonly title?: string;
  /** Banner body. */
  readonly description?: string;
  /**
   * Label of the primary action. @default 'Enable'
   */
  readonly enableLabel?: string;
  /**
   * Optional VAPID key override — forwarded to
   * {@link usePushSubscription} when the user opts in from the
   * banner.
   */
  readonly vapidPublicKey?: string;
  /** Fired after the user grants permission. */
  readonly onSubscribed?: () => void;
  /** Fired after the user dismisses the banner. */
  readonly onDismissed?: () => void;
  /** Additional CSS classes appended to the alert root. */
  readonly className?: string;
}

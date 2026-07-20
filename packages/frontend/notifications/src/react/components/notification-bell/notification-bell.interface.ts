/**
 * @file notification-bell.interface.ts
 * @module @stackra/notifications/react/components
 * @description Props for the {@link NotificationBell} component.
 */

import type { ReactNode } from "react";

/**
 * Props accepted by {@link NotificationBell}.
 */
export interface NotificationBellProps {
  /**
   * Optional trigger icon override. When omitted the default
   * gravity-ui bell icon renders inside a HeroUI ghost `Button`.
   */
  readonly icon?: ReactNode;
  /** Additional CSS classes appended to the button. */
  readonly className?: string;
  /**
   * Optional `aria-label` override. Defaults to a live count
   * (`"Notifications, 3 unread"`) so screen-reader users hear the
   * count on every focus.
   */
  readonly ariaLabel?: string;
}

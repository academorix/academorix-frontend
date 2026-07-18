/**
 * @file notification-badge.interface.ts
 * @module @stackra/notifications/native/components
 * @description Props for the native {@link NotificationBadge}
 *   component.
 */

import type { ReactNode } from 'react';

/**
 * Props accepted by the native {@link NotificationBadge}.
 */
export interface NotificationBadgeProps {
  /** The trigger child the badge is anchored to. */
  readonly children: ReactNode;
  /**
   * When `true`, the badge is hidden when the count is 0.
   *
   * @default true
   */
  readonly hideWhenZero?: boolean;
  /**
   * Ceiling on the numeric badge label. Values above this render as
   * `"${max}+"`. Pass `Infinity` to disable capping.
   *
   * @default 99
   */
  readonly max?: number;
  /** Additional Uniwind classes appended to the badge anchor. */
  readonly className?: string;
}

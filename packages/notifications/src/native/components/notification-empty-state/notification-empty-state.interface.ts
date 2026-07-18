/**
 * @file notification-empty-state.interface.ts
 * @module @stackra/notifications/native/components
 * @description Props for the native
 *   {@link NotificationEmptyState} component.
 */

import type { ReactNode } from 'react';

/**
 * Props accepted by the native {@link NotificationEmptyState}.
 */
export interface NotificationEmptyStateProps {
  /** Title copy. @default "You're all caught up" */
  readonly title?: string;
  /**
   * Description copy under the title.
   *
   * @default "New notifications will appear here."
   */
  readonly description?: string;
  /**
   * Whether the empty state renders at page size or drawer size.
   * Drives the HeroUI Native Pro `EmptyState` size prop.
   *
   * @default 'drawer'
   */
  readonly variant?: 'drawer' | 'page';
  /** Optional action element rendered inside `EmptyState.Content`. */
  readonly action?: ReactNode;
  /** Additional Uniwind classes appended to the root. */
  readonly className?: string;
}

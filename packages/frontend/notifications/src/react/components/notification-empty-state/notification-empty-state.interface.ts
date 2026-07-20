/**
 * @file notification-empty-state.interface.ts
 * @module @stackra/notifications/react/components
 * @description Props for the {@link NotificationEmptyState} component.
 */

import type { ReactNode } from 'react';

/**
 * Props accepted by {@link NotificationEmptyState}.
 */
export interface NotificationEmptyStateProps {
  /** Title copy. @default "You're all caught up" */
  readonly title?: string;
  /**
   * Description copy under the title.
   * @default "New notifications will appear here."
   */
  readonly description?: string;
  /**
   * Whether the empty state renders at page size (`'lg'`) or
   * drawer size (`'md'`). Drives the internal HeroUI Pro
   * `EmptyState` size prop.
   *
   * @default 'drawer'
   */
  readonly variant?: 'drawer' | 'page';
  /** Optional action element rendered inside `EmptyState.Content`. */
  readonly action?: ReactNode;
  /** Additional CSS classes appended to the root. */
  readonly className?: string;
}

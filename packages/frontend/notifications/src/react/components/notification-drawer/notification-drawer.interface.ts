/**
 * @file notification-drawer.interface.ts
 * @module @stackra/notifications/react/components
 * @description Props + shared filter types for the
 *   {@link NotificationDrawer} component.
 */

import type { NotificationCategory } from '@/core/interfaces';
import type { NotificationWriter } from '../../hooks/use-notification-writes';

/**
 * The section tabs the drawer exposes.
 *
 * `'unread'` is the default view; `'all'` shows every entry.
 */
export type NotificationDrawerSection = 'unread' | 'all';

/**
 * The category filter chips the drawer exposes.
 *
 * Superset of {@link NotificationCategory} — adds an `'all'` value
 * for the "no filter" chip. Reserved as its own type so consumers
 * can bind against the same filter surface.
 */
export type NotificationDrawerCategoryFilter = NotificationCategory | 'all';

/**
 * Props accepted by {@link NotificationDrawer}.
 */
export interface NotificationDrawerProps {
  /** Controlled open state. */
  readonly isOpen: boolean;
  /** Called by the drawer to close itself. */
  readonly onOpenChange: (isOpen: boolean) => void;
  /**
   * Optional caller-supplied writer. Every row action + the header's
   * mark-all / clear actions fire through it. When omitted the
   * drawer still updates local state optimistically.
   */
  readonly writer?: Partial<NotificationWriter>;
  /**
   * Optional callback fired when the user activates the
   * "Preferences" affordance in the footer. When omitted the button
   * is hidden — apps that don't ship a preferences route don't need
   * the affordance.
   */
  readonly onOpenPreferences?: () => void;
}

/**
 * @file notification-drawer.interface.ts
 * @module @stackra/notifications/native/components
 * @description Props + shared filter types for the native
 *   {@link NotificationDrawer} component.
 */

import type { NotificationCategory } from "@/core/interfaces";
import type { NotificationWriter } from "../../hooks";

/**
 * The section tabs the drawer exposes.
 *
 * `'unread'` is the default view; `'all'` shows every entry.
 */
export type NotificationDrawerSection = "unread" | "all";

/**
 * The category filter chips the drawer exposes.
 *
 * Superset of {@link NotificationCategory} — adds an `'all'` value
 * for the "no filter" chip.
 */
export type NotificationDrawerCategoryFilter = NotificationCategory | "all";

/**
 * Props accepted by the native {@link NotificationDrawer}.
 */
export interface NotificationDrawerProps {
  /** Controlled open state. */
  readonly isOpen: boolean;
  /** Called by the drawer to close itself. */
  readonly onOpenChange: (isOpen: boolean) => void;
  /**
   * Optional caller-supplied writer. Every row action + the header's
   * mark-all action fires through it. When omitted the drawer still
   * updates local state optimistically.
   */
  readonly writer?: Partial<NotificationWriter>;
  /**
   * Optional callback fired when the user activates the
   * "Preferences" affordance in the footer. When omitted the button
   * is hidden.
   */
  readonly onOpenPreferences?: () => void;
}

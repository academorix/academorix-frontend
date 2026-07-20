/**
 * @file notification-preferences.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Per-user notification preferences shape.
 *
 *   `defaults` holds the flat category × channel preference matrix
 *   as `${category}.${channel}: boolean`. `per_child` is a
 *   reserved shape for tenant-specific overrides. `quiet_hours` is
 *   either the {@link IQuietHoursWindow} object or an empty record
 *   when the user hasn't set a window yet.
 */

import type { IQuietHoursWindow } from "./quiet-hours-window.interface";

/**
 * Per-user notification preferences.
 */
export interface INotificationPreferences {
  /**
   * Category × channel enable matrix — keyed
   * `${category}.${channel}` → boolean. Also holds scalar toggles
   * (`do_not_disturb`).
   */
  readonly defaults: Record<string, unknown>;

  /**
   * Optional per-child preferences bag. Kept as an opaque record
   * for now — the exact shape is caller-defined and the UI
   * surfaces it in a future revision.
   */
  readonly per_child?: Record<string, unknown>;

  /**
   * Quiet-hours window. Empty object (`{}`) means no window set;
   * the discriminated union is enforced by the
   * `isQuietHoursWindow` type guard.
   */
  readonly quiet_hours: IQuietHoursWindow | Record<string, never>;
}

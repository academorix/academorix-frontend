/**
 * @file categories.type.ts
 * @module @academorix/notifications/config/categories.type
 *
 * @description
 * Shape of the notification-category registry. Each app declares its
 * own categories (dashboard has "operational" / "billing" / "safety"
 * / "marketing" / "system"; landing page might only need "marketing"
 * / "system"). Preferences and delivery decisions key off `id`.
 */

import type { NotificationChannel, NotificationPriority } from "../types/notification.type";

/**
 * One category declaration. `id` is the wire-level value backing the
 * `Notification.category` field. `label` / `description` render on
 * the preferences screen.
 */
export interface NotificationCategoryConfig<TId extends string = string> {
  /** Wire-level id — matches `Notification.category`. */
  readonly id: TId;

  /** Localised label shown on the preferences screen. */
  readonly label: string;

  /** Localised one-liner explaining what falls into this category. */
  readonly description: string;

  /**
   * Default priority for events in this category. Individual
   * notifications may override on the wire, but this drives the
   * default toast timeout + web-push urgency.
   */
  readonly defaultPriority: NotificationPriority;

  /**
   * Channels enabled by default for this category. Users can toggle
   * per-channel in preferences.
   */
  readonly defaultChannels: readonly NotificationChannel[];

  /**
   * When `true`, the user CANNOT disable push for this category.
   * Reserved for safety-critical categories (child protection,
   * emergency alerts) — the compliance UX contract in
   * NOTIFICATIONS_PLAN.md § "Category × channels".
   */
  readonly mandatoryPush?: boolean;
}

/**
 * @file define-categories.util.ts
 * @module @academorix/notifications/config/define-categories.util
 *
 * @description
 * Typed passthrough for the app-level category registry. Freezes
 * the input so accidental mutation throws at runtime, and preserves
 * the literal ids so `Notification<Category>` can narrow at every
 * call site.
 */

import type { NotificationCategoryConfig } from "./categories.type";

/**
 * Ties an app's category literal to `NotificationCategoryConfig[]`
 * and freezes the result. Returns the exact input array shape so
 * `(typeof CATEGORIES)[number]["id"]` gives back the union of ids.
 *
 * @example
 * ```ts
 * // apps/dashboard/src/config/notifications.config.ts
 * import { defineNotificationCategories } from "@academorix/notifications/config";
 *
 * export const NOTIFICATION_CATEGORIES = defineNotificationCategories([
 *   {
 *     id: "operational",
 *     label: "Operational",
 *     description: "Attendance, sessions, day-to-day tenant activity",
 *     defaultPriority: "normal",
 *     defaultChannels: ["in-app"],
 *   },
 *   {
 *     id: "safety",
 *     label: "Child safety",
 *     description: "Safeguarding + emergency alerts",
 *     defaultPriority: "critical",
 *     defaultChannels: ["in-app", "push", "email"],
 *     mandatoryPush: true,
 *   },
 * ] as const);
 *
 * export type NotificationCategory =
 *   (typeof NOTIFICATION_CATEGORIES)[number]["id"];
 * ```
 */
export function defineNotificationCategories<
  TCategories extends readonly NotificationCategoryConfig<string>[],
>(categories: TCategories): Readonly<TCategories> {
  return Object.freeze(categories);
}

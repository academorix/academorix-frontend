/**
 * @file map-priority-to-toast-variant.util.ts
 * @module @stackra/notifications/core/utils
 * @description Map a {@link NotificationPriority} to a HeroUI toast
 *   variant.
 *
 *   The variant strings match `toast()`, `toast.info(...)`,
 *   `toast.success(...)`, `toast.warning(...)`, and
 *   `toast.danger(...)` on the HeroUI React toast queue.
 */

import type { NotificationPriority } from "../interfaces";

/**
 * The HeroUI toast variant tags the mapper emits.
 *
 * Matches the queue methods HeroUI exposes on `toast` — consumers
 * take the returned string and route to `toast[variant](...)`.
 */
export type NotificationToastVariant = "default" | "info" | "success" | "warning" | "danger";

/**
 * Map a priority to a toast variant.
 *
 * - `urgent` → `'danger'` (loud, red).
 * - `high` → `'warning'` (attention-grabbing but not alarming).
 * - `normal` → `'info'` (accent-coloured neutral toast).
 * - `low` → `'success'` (calm — low-signal announcements).
 *
 * @param priority - The derived priority tier.
 * @returns The matching HeroUI toast variant string.
 */
export function mapPriorityToToastVariant(
  priority: NotificationPriority,
): NotificationToastVariant {
  switch (priority) {
    case "urgent":
      return "danger";
    case "high":
      return "warning";
    case "normal":
      return "info";
    case "low":
    default:
      return "success";
  }
}

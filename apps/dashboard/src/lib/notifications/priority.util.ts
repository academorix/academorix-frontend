/**
 * @file priority.util.ts
 * @module notifications/priority.util
 *
 * @description
 * Pure helpers for deriving a UI priority tier from a canonical
 * {@link Notification} and mapping that tier to a HeroUI toast
 * variant.
 *
 * ## Why the derivation lives here, not in the DTO
 *
 * The Laravel `NotificationData` DTO does NOT carry a `priority`
 * field — the wire contract is intentionally minimal (see
 * `@academorix/notifications/types/notification.type`). The UI still
 * needs to render a toast with the right variant + timeout, so we
 * infer the priority from `channel + type + data_ref`:
 *
 *   - Types listed in {@link MANDATORY_PUSH_TYPES} are always `urgent`.
 *   - Types matching well-known patterns (see {@link deriveNotificationPriority})
 *     are `high` (payment failures, safeguarding follow-ups).
 *   - Everything else defaults to `normal`.
 *
 * The mapping is DELIBERATELY forgiving — an unknown type always
 * renders (just at the default tier) rather than dropping the toast.
 */

import { MANDATORY_PUSH_TYPES } from "@academorix/notifications";

import type { NotificationRenderPriority, NotificationToastVariant } from "./types";
import type { Notification } from "@academorix/notifications";

/**
 * Domain event types that always render at `high` priority. Kept as
 * a Set for O(1) lookup — the array literal reads naturally.
 *
 * @remarks
 * These match the "high" tier for user-visible priority: payment/billing
 * failures, safeguarding-related follow-ups, and
 * account-security anomalies. Add sparingly — every entry here is
 * one more surface that persists longer + demands more attention.
 */
export const HIGH_PRIORITY_TYPES: ReadonlySet<string> = new Set<string>([
  "payment_due",
  "payment_failed",
  "payment_retry",
  "attendance_missing",
  "session_cancelled",
  "invoice_overdue",
  "safeguarding_follow_up",
  "security_alert",
]);

/**
 * Derives a display priority tier for `notification`.
 *
 * @remarks
 * Order of precedence:
 *   1. Types in {@link MANDATORY_PUSH_TYPES} → `urgent`.
 *   2. Types in {@link HIGH_PRIORITY_TYPES} → `high`.
 *   3. Types beginning with `announcement_` or `system_maintenance`
 *      → `low` (passive info, no toast).
 *   4. Everything else → `normal`.
 */
export function deriveNotificationPriority(notification: Notification): NotificationRenderPriority {
  if (MANDATORY_PUSH_TYPES.has(notification.type)) {
    return "urgent";
  }

  if (HIGH_PRIORITY_TYPES.has(notification.type)) {
    return "high";
  }

  if (
    notification.type.startsWith("announcement_") ||
    notification.type === "system_maintenance_notice"
  ) {
    return "low";
  }

  return "normal";
}

/**
 * Maps a {@link NotificationRenderPriority} to the HeroUI toast
 * variant.
 *
 *  - `low` / `normal` → `"accent"` (info-styled toast)
 *  - `high`           → `"warning"`
 *  - `urgent`         → `"danger"`
 */
export function mapPriorityToToastVariant(
  priority: NotificationRenderPriority,
): NotificationToastVariant {
  switch (priority) {
    case "urgent":
      return "danger";
    case "high":
      return "warning";
    case "low":
    case "normal":
    default:
      return "accent";
  }
}

/**
 * Toast timeout (ms) per priority. `0` = persist until user dismisses.
 * Low / normal = 6s, high = 12s, urgent = persist.
 */
export function toastTimeoutForPriority(priority: NotificationRenderPriority): number {
  switch (priority) {
    case "urgent":
      return 0;
    case "high":
      return 12_000;
    case "normal":
      return 6_000;
    case "low":
    default:
      // `low` is not shown as a toast — this value is defensive for
      // callers that force a low-priority toast.
      return 4_000;
  }
}

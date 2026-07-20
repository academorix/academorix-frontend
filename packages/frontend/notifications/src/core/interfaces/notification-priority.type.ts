/**
 * @file notification-priority.type.ts
 * @module @stackra/notifications/core/interfaces
 * @description Priority tier for a rendered notification.
 *
 *   Derived from `payload.priority` when present, otherwise from
 *   the `category` heuristic in
 *   {@link deriveNotificationPriority}. Consumers key visual accents
 *   and toast timeouts off this tier.
 */

/**
 * Notification importance tier — closed union.
 *
 * - `urgent` — safety-critical; persistent toasts, colour-coded
 *   accent.
 * - `high` — payment, security anomalies; long-lived toast.
 * - `normal` — routine app activity; short-lived toast.
 * - `low` — passive info; inbox-only, no toast by default.
 */
export type NotificationPriority = "urgent" | "high" | "normal" | "low";

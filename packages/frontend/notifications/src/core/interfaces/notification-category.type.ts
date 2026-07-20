/**
 * @file notification-category.type.ts
 * @module @stackra/notifications/core/interfaces
 * @description Taxonomy of notification categories.
 *
 *   The category is caller-supplied (via `payload.data.category`) or
 *   derived from the payload's `type` prefix. The preferences UI
 *   exposes one row per category × channel pair.
 */

/**
 * Notification category — closed union.
 *
 * - `operational` — attendance, sessions, teams, training.
 * - `billing` — payments, invoices, subscriptions.
 * - `safety` — child-safety, safeguarding, emergency.
 * - `marketing` — announcements, tenant campaigns.
 * - `system` — auth, security, maintenance windows.
 */
export type NotificationCategory = "operational" | "billing" | "safety" | "marketing" | "system";

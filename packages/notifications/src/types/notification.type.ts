/**
 * @file notification.type.ts
 * @module @academorix/notifications/types/notification.type
 *
 * @description
 * The canonical Notification DTO shared by every delivery surface:
 * in-app React toasts, Web Push, and native OS (Tauri). Matches the
 * backend `NotificationData` shape (see NOTIFICATIONS_PLAN.md).
 *
 * ## Cross-surface invariants
 *
 *  - `id` is a UUID minted by the backend so every surface can
 *    dedupe (a push arriving before the WebSocket broadcast, etc.).
 *  - `category` is one of the app-declared categories. Preferences
 *    key off this — muting "marketing" mutes every notification with
 *    `category: "marketing"` across every channel.
 *  - `priority` determines toast timeout + web-push urgency +
 *    native-OS interruption level. Never rendered in the UI.
 *  - `actionUrl` is where clicking the notification lands. Same-app
 *    URLs get client-router-navigated; cross-app URLs open in a new
 *    tab (the consumer decides).
 *  - Timestamps are ISO-8601 strings on the wire. Downstream
 *    formatters (`@academorix/i18n/format`) turn them into locale-
 *    aware relative-time strings.
 */

/**
 * Priority buckets. Drive toast timeout, web-push urgency, and
 * native-OS interruption level.
 */
export type NotificationPriority = "low" | "normal" | "high" | "critical";

/**
 * The channels a notification can arrive on. The BACKEND decides
 * which channel(s) to send per (recipient, notification, preferences)
 * tuple — the client only observes.
 */
export type NotificationChannel = "in-app" | "push" | "email" | "sms";

/**
 * The canonical notification payload.
 *
 * @typeParam TCategory - App-specific category union. Consumers
 *   declare their own (e.g. `"operational" | "billing" | "safety" |
 *   "marketing" | "system"`) and instantiate the type with it.
 */
export interface Notification<TCategory extends string = string> {
  /** UUID minted by the backend — every surface uses this for dedupe. */
  readonly id: string;

  /** Tenant the notification belongs to. */
  readonly tenantId: string;

  /** Recipient user id (may be omitted for tenant-wide broadcasts). */
  readonly recipientId?: string;

  /** Event type — e.g. `"invoice.due"`, `"attendance.missing"`. */
  readonly type: string;

  /** Localised title shown on every surface. */
  readonly title: string;

  /** Localised body shown on every surface. */
  readonly body: string;

  /** Optional action URL — clicking navigates here. */
  readonly actionUrl?: string;

  /** Optional icon URL — shown by web-push + native-OS surfaces. */
  readonly iconUrl?: string;

  /**
   * App-declared category. Preferences key off this — muting a
   * category mutes every notification with the same value.
   */
  readonly category: TCategory;

  /** Priority — drives toast timeout + web-push urgency. */
  readonly priority: NotificationPriority;

  /** ISO-8601 timestamp — when the backend emitted it. */
  readonly createdAt: string;

  /** ISO-8601 timestamp — when the recipient marked it read. */
  readonly readAt?: string | null;

  /**
   * Free-form structured data — the shape varies by `type`. The
   * consumer knows how to interpret it based on `type`.
   */
  readonly data?: Record<string, unknown>;
}

/**
 * @file notification-render.type.ts
 * @module notifications/types/notification-render.type
 *
 * @description
 * Local UI-layer types used by the notifications module. These wrap or
 * project fields from the canonical
 * {@link "@academorix/notifications/types".Notification} DTO — never
 * redeclare them here.
 *
 * ## Why not redeclare?
 *
 * The wire contract is owned by the workspace package (which mirrors
 * the Laravel `NotificationData` DTO one-for-one). A duplicate here
 * would drift as soon as the backend adds a field.
 */

import type { Notification } from "@academorix/notifications";

/**
 * The four toast variants HeroUI exposes today (see
 * `@heroui/react` → `toast()`). Notifications map to these via
 * {@link mapPriorityToToastVariant}.
 */
export type NotificationToastVariant = "default" | "accent" | "success" | "warning" | "danger";

/**
 * Client-inferred "importance" tier for a notification. The backend
 * does NOT emit a `priority` field on the DTO today — we derive it
 * from `channel + type + data_ref` when we need a toast variant.
 *
 * The tiers map to notifications module:
 *  - `low`      — passive info; suppressed as a toast.
 *  - `normal`   — routine notifications; short-lived toast.
 *  - `high`     — payment failures, safeguarding follow-ups.
 *  - `urgent`   — child-safety alerts; persist until dismissed.
 */
export type NotificationRenderPriority = "low" | "normal" | "high" | "urgent";

/**
 * The category filter chips the drawer exposes. Matches the values
 * declared in {@link "@/config/notifications.config".NotificationCategory},
 * kept as a separate alias so the module's UI can evolve independently
 * from the backend's category list.
 */
export type NotificationDrawerCategoryFilter =
  "all" | "operational" | "billing" | "safety" | "marketing" | "system";

/**
 * Section tabs the drawer renders — either the unread view (default)
 * or the full list. Kept as a string union to plug straight into
 * HeroUI's `Tabs.List` selection.
 */
export type NotificationDrawerSection = "unread" | "all";

/**
 * Row-level view model derived from a {@link Notification}. Adds the
 * fields the UI needs (`isSnoozed`, `variant`) without mutating the
 * canonical shape.
 *
 * The bare `notification` field is kept alongside so click handlers
 * can inspect the raw DTO (e.g. read `data_ref.action_url`).
 */
export interface RenderableNotification {
  /** The canonical DTO — treated as immutable by every consumer. */
  readonly notification: Notification;
  /** `read_at !== null`. Cached to keep the JSX tidy. */
  readonly isRead: boolean;
  /**
   * `true` when the user snoozed this row and the snooze deadline has
   * not yet elapsed. See {@link "@/lib/notifications/hooks/use-snooze-store"}.
   */
  readonly isSnoozed: boolean;
  /** Toast variant driven by the derived priority. */
  readonly toastVariant: NotificationToastVariant;
  /** Derived priority tier — never `null`. */
  readonly priority: NotificationRenderPriority;
}

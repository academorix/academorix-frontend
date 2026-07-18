/**
 * @file index.ts
 * @module @academorix/contracts
 *
 * @description
 * Shared contract types for the Academorix workspace. Home for
 * interfaces the app depends on but don't fit in any single feature
 * package. Feature packages that own concrete implementations
 * re-export narrower types from their own barrel; this package holds
 * the cross-cutting shapes.
 *
 * ## Notifications
 *
 * `INotificationRecord`, `INotificationAction`, and
 * `INotificationPreferenceMatrix` describe the wire shape the
 * dashboard reads from `/api/notifications/*`. The concrete
 * implementation lives in `@academorix/notifications`; the shapes
 * are hoisted here so consumers (list pages, inbox drawers, badge
 * counters) can import types without pulling the whole notification
 * module.
 */

/**
 * The set of channels a notification can be delivered on. Kept as a
 * union of literal strings so switch statements narrow cleanly.
 */
export type NotificationChannel = "email" | "sms" | "push" | "in-app";

/**
 * The lifecycle kind of a notification — drives the pill color, icon,
 * and default action set on the list page.
 */
export type NotificationKind = "info" | "success" | "warning" | "danger" | "reminder" | "system";

/**
 * A single action pinned to a notification (e.g. "Retry", "Escalate",
 * "Mark done"). Actions are dispatched through the action registry
 * declared by the dashboard (`useNotificationActions()`) — the wire
 * shape carries only the identifier and label.
 */
export interface INotificationAction {
  readonly id: string;
  readonly label: string;
  readonly kind?: NotificationKind;
  readonly icon?: string;
  readonly requiresConfirm?: boolean;
}

/**
 * A single notification record. Mirrors the JSON shape the backend
 * returns from `GET /api/notifications`. The dashboard list page
 * reads these into a Refine table; the inbox drawer reads a smaller
 * subset via `useNotificationInboxState()`.
 */
export interface INotificationRecord {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly channel: NotificationChannel;
  readonly title: string;
  readonly body?: string;
  readonly createdAt: string;
  readonly readAt?: string | null;
  readonly archivedAt?: string | null;
  readonly actions?: readonly INotificationAction[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * A single row in the notification preferences matrix. Represents
 * one (kind × channel) preference. When persistence hasn't seen the
 * cell yet, `isEnabled` reflects the tenant default.
 */
export interface INotificationPreferenceCell {
  readonly kind: NotificationKind;
  readonly channel: NotificationChannel;
  readonly isEnabled: boolean;
  readonly isEditable: boolean;
}

/**
 * The full preferences matrix — flat list of cells the settings
 * screen renders as a checkbox grid. Backend returns a fully-hydrated
 * matrix so the frontend doesn't have to reconcile "row exists" vs
 * "row is default".
 */
export interface INotificationPreferenceMatrix {
  readonly cells: readonly INotificationPreferenceCell[];
  readonly defaults: Readonly<Record<NotificationKind, INotificationChannelDefault>>;
}

/**
 * Default channel enablement per notification kind. Merged with the
 * user's cells to compute the effective enable state.
 */
export interface INotificationChannelDefault {
  readonly [channel: string]: boolean;
}

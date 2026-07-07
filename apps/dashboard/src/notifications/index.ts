/**
 * @file index.ts
 * @module notifications
 *
 * @description
 * Public barrel for the dashboard's notifications module. External
 * consumers (module manifest, layout shell, tests) import from here
 * so internal file splits stay contained.
 *
 * ## Layer map
 *
 *   - `./provider` — {@link NotificationsRoot}, {@link useNotifications},
 *     the shared context bundle.
 *   - `./hooks` — inbox-sync, toast bridge, snooze store.
 *   - `./components` — bell, drawer, list, row, empty state, banner.
 *   - `./preferences` — settings-page + atomic controls.
 *   - `./push` — Web Push registration scaffolding.
 *   - `./telemetry` — the `emitNotificationTelemetry` helper.
 *
 * The canonical wire types (`Notification`, `NotificationChannel`,
 * etc.) live in `@academorix/notifications` — never re-declare them
 * here.
 */

export * from "./components";
export * from "./hooks";
export * from "./preferences";
export * from "./provider";
export * from "./push";
export * from "./telemetry";
export type {
  NotificationDrawerCategoryFilter,
  NotificationDrawerSection,
  NotificationRenderPriority,
  NotificationToastVariant,
  RenderableNotification,
} from "./types";
export {
  deriveNotificationPriority,
  HIGH_PRIORITY_TYPES,
  mapPriorityToToastVariant,
  toastTimeoutForPriority,
} from "./priority.util";

/**
 * @file index.ts
 * @module notifications/types
 *
 * @description
 * Public barrel for the local (UI-layer) notification types. The
 * canonical wire types (`Notification`, `NotificationChannel`, etc.)
 * come from `@academorix/notifications` — do not re-export them here.
 */

export type {
  NotificationDrawerCategoryFilter,
  NotificationDrawerSection,
  NotificationRenderPriority,
  NotificationToastVariant,
  RenderableNotification,
} from "./notification-render.type";

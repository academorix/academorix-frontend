/**
 * @file index.ts
 * @module notifications/components
 *
 * @description
 * Public barrel for the notifications UI components. Every consumer
 * (layout shell, module manifest, tests) imports through this file so
 * splitting a component across multiple files later is a one-line
 * change here.
 */

export { NotificationBell } from "./notification-bell";
export { NotificationDrawer } from "./notification-drawer";
export type { NotificationDrawerProps } from "./notification-drawer";
export { NotificationEmptyState } from "./notification-empty-state";
export type { NotificationEmptyStateProps } from "./notification-empty-state";
export { NotificationList } from "./notification-list";
export type { NotificationListProps } from "./notification-list";
export { NotificationRow, formatRelative } from "./notification-row";
export type { NotificationRowProps } from "./notification-row";
export { PushPermissionBanner } from "./push-permission-banner";
export type { PushPermissionBannerProps } from "./push-permission-banner";

/**
 * @file index.ts
 * @module @stackra/notifications/react/components
 * @description Barrel export for every web-side notifications
 *   component.
 */

export { NotificationBell, type NotificationBellProps } from "./notification-bell";
export {
  NotificationDrawer,
  type NotificationDrawerProps,
  type NotificationDrawerSection,
  type NotificationDrawerCategoryFilter,
} from "./notification-drawer";
export { NotificationList, type NotificationListProps } from "./notification-list";
export { NotificationRow, type NotificationRowProps } from "./notification-row";
export {
  NotificationEmptyState,
  type NotificationEmptyStateProps,
} from "./notification-empty-state";
export { NotificationBadge, type NotificationBadgeProps } from "./notification-badge";
export { PushPermissionBanner, type PushPermissionBannerProps } from "./push-permission-banner";
export { ChannelToggle, type ChannelToggleProps } from "./preferences/channel-toggle";
export { QuietHoursPicker, type QuietHoursPickerProps } from "./preferences/quiet-hours-picker";
export {
  CategoryPreferencesPanel,
  type CategoryPreferencesPanelProps,
} from "./preferences/category-preferences-panel";

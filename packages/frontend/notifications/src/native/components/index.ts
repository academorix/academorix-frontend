/**
 * @file index.ts
 * @module @stackra/notifications/native/components
 * @description Barrel export for native-side notifications
 *   components.
 *
 *   Every component below has a `@stackra/notifications/react`
 *   twin — the native surface reaches parity with the web one for
 *   the drawer + list + row + empty state + preferences editing
 *   experience.
 */

export { NotificationBadge, type NotificationBadgeProps } from "./notification-badge";
export { NotificationBell, type NotificationBellProps } from "./notification-bell";
export {
  NotificationDrawer,
  type NotificationDrawerCategoryFilter,
  type NotificationDrawerProps,
  type NotificationDrawerSection,
} from "./notification-drawer";
export {
  NotificationEmptyState,
  type NotificationEmptyStateProps,
} from "./notification-empty-state";
export { NotificationList, type NotificationListProps } from "./notification-list";
export { NotificationRow, type NotificationRowProps } from "./notification-row";
export { PushPermissionBanner, type PushPermissionBannerProps } from "./push-permission-banner";
export { ChannelToggle, type ChannelToggleProps } from "./preferences/channel-toggle";
export { QuietHoursPicker, type QuietHoursPickerProps } from "./preferences/quiet-hours-picker";
export {
  CategoryPreferencesPanel,
  type CategoryPreferencesPanelProps,
  type ChannelDescriptor,
} from "./preferences/category-preferences-panel";

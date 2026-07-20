/**
 * @file index.ts
 * @module @stackra/notifications/react
 * @description React (web) bindings for `@stackra/notifications` —
 *   hooks that subscribe to the DI-registered manager / centre via
 *   `useSyncExternalStore` for tearing-free reads under concurrent
 *   React, plus HeroUI Pro-based components for the notification
 *   bell, drawer, list, row, preferences panels, and permission
 *   banner.
 */

// ════════════════════════════════════════════════════════════════════
// Hooks
// ════════════════════════════════════════════════════════════════════
export {
  useNotificationPermission,
  usePushSubscription,
  useInAppNotifications,
  useNotificationCentre,
  useNotificationActions,
  useNotificationPreferences,
  useNotificationToast,
  useNotificationWrites,
  useRenderableNotifications,
  useSnoozeStore,
  type IUseNotificationPermissionResult,
  type IUsePushSubscriptionOptions,
  type IUsePushSubscriptionResult,
  type IUseInAppNotificationsResult,
  type IUseNotificationCentreResult,
  type IUseNotificationActionsResult,
  type IUseNotificationPreferencesResult,
  type IUseNotificationWritesResult,
  type IUseRenderableNotificationsResult,
  type IUseSnoozeStoreResult,
  type NotificationWriter,
} from './hooks';

// ════════════════════════════════════════════════════════════════════
// Components
// ════════════════════════════════════════════════════════════════════
export {
  NotificationBell,
  NotificationDrawer,
  NotificationList,
  NotificationRow,
  NotificationEmptyState,
  NotificationBadge,
  PushPermissionBanner,
  ChannelToggle,
  QuietHoursPicker,
  CategoryPreferencesPanel,
  type NotificationBellProps,
  type NotificationDrawerProps,
  type NotificationDrawerSection,
  type NotificationDrawerCategoryFilter,
  type NotificationListProps,
  type NotificationRowProps,
  type NotificationEmptyStateProps,
  type NotificationBadgeProps,
  type PushPermissionBannerProps,
  type ChannelToggleProps,
  type QuietHoursPickerProps,
  type CategoryPreferencesPanelProps,
} from './components';

// ════════════════════════════════════════════════════════════════════
// Pages
// ════════════════════════════════════════════════════════════════════
export {
  InboxPage,
  NotificationPreferencesPage,
  type InboxPageProps,
  type NotificationPreferencesPageProps,
} from './pages';

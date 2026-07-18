/**
 * @file index.ts
 * @module @academorix/notifications/context
 *
 * @description
 * Public barrel for the NotificationsProvider + useNotifications
 * factory.
 */

export { createNotificationsContext } from "./create-notifications-context";
export type {
  NotificationsContextBundle,
  NotificationsContextValue,
  NotificationsProviderProps,
} from "./create-notifications-context";

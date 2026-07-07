/**
 * @file index.ts
 * @module notifications/provider
 *
 * @description
 * Public barrel for the app-wide notifications provider layer.
 * Exports the root component + the bundle so downstream consumers
 * can pick either.
 */

export { NotificationsRoot } from "./notifications-root";
export type { NotificationsRootProps } from "./notifications-root";
export {
  NotificationsProvider,
  notificationsBundle,
  useNotifications,
} from "./notifications-bundle";

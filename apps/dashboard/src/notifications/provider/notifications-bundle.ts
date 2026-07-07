/**
 * @file notifications-bundle.ts
 * @module notifications/provider/notifications-bundle
 *
 * @description
 * Single, app-wide `{ NotificationsProvider, useNotifications }` pair
 * created via {@link createNotificationsContext} from
 * `@academorix/notifications`. Exported once from here so every consumer
 * (`NotificationBell`, `NotificationDrawer`, `NotificationsInboxSyncer`,
 * etc.) refers to the same context instance.
 *
 * ## Why a factory
 *
 * The package's context factory returns a fresh pair on every call. If a
 * component tree had two providers from two different factory calls, the
 * inner `useNotifications()` would resolve the wrong one. Centralising
 * the factory call here guarantees one authoritative context per app.
 *
 * ## Why not export directly from `@academorix/notifications`?
 *
 * The package intentionally does NOT ship a pre-baked singleton — it
 * would force every app on the workspace to share a global context,
 * which breaks the "one app per import" isolation rule the rest of the
 * platform relies on. The app owns its own bundle.
 *
 * @see `@academorix/notifications/context/create-notifications-context.tsx`
 */

import { createNotificationsContext } from "@academorix/notifications";

/**
 * The dashboard's notifications context bundle. Import the pieces from
 * here (or through the module barrel) rather than calling
 * {@link createNotificationsContext} again.
 */
export const notificationsBundle = createNotificationsContext();

/**
 * Provider component that hosts the notification queue for the whole
 * app. Mounted from {@link "@/notifications/provider/notifications-root"}.
 */
export const NotificationsProvider = notificationsBundle.NotificationsProvider;

/**
 * `useNotifications()` — reactive access to the in-memory inbox. Throws
 * when called outside {@link NotificationsProvider}, which surfaces
 * mount-order bugs at dev time instead of manifesting as silent no-op
 * badges in production.
 */
export const useNotifications = notificationsBundle.useNotifications;

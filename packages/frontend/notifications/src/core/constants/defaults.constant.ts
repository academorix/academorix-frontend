/**
 * @file defaults.constant.ts
 * @module @stackra/notifications/core/constants
 * @description Default configuration values for the notifications
 *   module.
 *
 *   Every field below has a matching optional in
 *   {@link INotificationModuleOptions}; `mergeConfig(options)` spreads
 *   the user's options over these defaults so
 *   `NotificationModule.forRoot()` with no arguments yields a
 *   fully-typed working configuration.
 */

import type { INotificationModuleOptions } from "../interfaces";

/**
 * The single source of default options for
 * `NotificationModule.forRoot`.
 *
 * Fields:
 * - `centre.storage` — `@stackra/storage` instance name backing the
 *   in-app notification centre. When omitted (default), the centre
 *   runs in memory-only mode.
 * - `centre.storageKey` — key inside the resolved `IStorage`.
 * - `centre.maxItems` — hard ceiling on the queue depth; oldest
 *   entries are evicted when new dispatches would exceed the limit.
 * - `defaultStack` — channel ids the manager dispatches to when no
 *   channels are supplied to `dispatch(payload)`.
 */
export const DEFAULT_NOTIFICATIONS_CONFIG: INotificationModuleOptions = {
  centre: {
    storage: undefined,
    storageKey: "stackra:notifications:centre",
    maxItems: 100,
  },
  defaultStack: ["in-app"],
};

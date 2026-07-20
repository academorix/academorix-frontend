/**
 * @file in-app-notification-centre-snapshot.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Referentially stable snapshot of the in-app
 *   notification centre.
 *
 *   Returned by {@link InAppNotificationCentre.getSnapshot} — the
 *   centre replaces this object identity only when at least one
 *   field changes, giving `useSyncExternalStore` the tearing-free
 *   contract it needs.
 */

import type { IInAppNotification } from './in-app-notification.interface';

/**
 * Immutable snapshot of the in-app centre's observable state.
 */
export interface IInAppNotificationCentreSnapshot {
  /** Every non-dismissed item, newest first. */
  readonly items: readonly IInAppNotification[];
  /** Number of items with `seenAt === null`. */
  readonly unreadCount: number;
}

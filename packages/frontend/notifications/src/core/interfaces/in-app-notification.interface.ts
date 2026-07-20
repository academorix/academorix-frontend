/**
 * @file in-app-notification.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description The persistent shape of a single in-app notification
 *   queued inside {@link InAppNotificationCentre}.
 */

import type { INotificationPayload } from "./notification-payload.interface";

/**
 * One entry in the in-app notification centre.
 *
 * The `payload` field is a caller-provided
 * {@link INotificationPayload}. The centre also tracks
 * `createdAt` / `seenAt` / `dismissedAt` so consumers can render
 * "unread" badges and remove dismissed items without dropping them
 * from history.
 */
export interface IInAppNotification {
  /** Stable id — generated when the entry is dispatched. */
  readonly id: string;
  /** Unix millis when the entry was dispatched. */
  readonly createdAt: number;
  /**
   * Unix millis when the user marked it seen; `null` while the item
   * remains unread.
   */
  readonly seenAt: number | null;
  /**
   * Unix millis when the user dismissed the item. Dismissed items
   * are dropped from the centre's snapshot but callers can keep
   * their own copy if they want an audit trail.
   */
  readonly dismissedAt: number | null;
  /** The caller-provided payload. */
  readonly payload: INotificationPayload;
}

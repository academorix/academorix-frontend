/**
 * @file notification-row.interface.ts
 * @module @stackra/notifications/native/components
 * @description Props for the native {@link NotificationRow}
 *   component.
 */

import type { IRenderableNotification } from '@/core/interfaces';
import type { NotificationWriter } from '../../hooks';

/**
 * Props accepted by the native {@link NotificationRow}.
 */
export interface NotificationRowProps {
  /** The row's projected view model. */
  readonly entry: IRenderableNotification;
  /**
   * Called after the row's own action (tap, snooze, delete). Used
   * by the drawer to close itself after a navigation tap.
   */
  readonly onAction?: () => void;
  /**
   * Optional writer bundle for persistence — passed to
   * {@link useNotificationWrites} so `markSeen` / `remove` fire
   * against the network too.
   */
  readonly writer?: Partial<NotificationWriter>;
  /**
   * Test hook: override the "now" reference so relative-time
   * formatting is stable across snapshots.
   */
  readonly now?: Date;
}

/**
 * @file notification-row.interface.ts
 * @module @stackra/notifications/react/components
 * @description Props for the {@link NotificationRow} component.
 */

import type { IRenderableNotification } from "@/core/interfaces";
import type { NotificationWriter } from "../../hooks/use-notification-writes";

/**
 * Props accepted by {@link NotificationRow}.
 */
export interface NotificationRowProps {
  /** The row's projected view model. */
  readonly entry: IRenderableNotification;
  /**
   * Called after the row's own action (click, snooze, delete).
   * Used by the drawer to close itself after a navigation click.
   */
  readonly onAction?: () => void;
  /**
   * Optional writer bundle for persistence — passed to
   * {@link useNotificationWrites} inside the row so `markSeen` /
   * `remove` fire against the network too. When omitted, the row
   * still updates local state optimistically.
   */
  readonly writer?: Partial<NotificationWriter>;
  /**
   * Test hook: override the "now" reference so relative-time
   * formatting is stable across snapshots.
   */
  readonly now?: Date;
}

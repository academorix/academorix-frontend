/**
 * @file notification-list.interface.ts
 * @module @stackra/notifications/native/components
 * @description Props for the native
 *   {@link NotificationList} component.
 */

import type { IRenderableNotification } from '@/core/interfaces';
import type { NotificationWriter } from '../../hooks';

/**
 * Props accepted by the native {@link NotificationList}.
 */
export interface NotificationListProps {
  /** Already filtered + sorted (newest-first) rows. */
  readonly entries: readonly IRenderableNotification[];
  /**
   * Called by each row after its own action — the drawer passes a
   * `close()` here so a tap that navigates also closes the sheet.
   */
  readonly onRowAction?: () => void;
  /** Renders the empty state at page or drawer size. */
  readonly emptyVariant?: 'drawer' | 'page';
  /**
   * Optional writer bundle passed down to every row for network
   * persistence. When omitted, rows still update local state
   * optimistically.
   */
  readonly writer?: Partial<NotificationWriter>;
  /** Test hook: pinned "now" for stable relative-time output. */
  readonly now?: Date;
  /** Additional Uniwind classes appended to the root container. */
  readonly className?: string;
}

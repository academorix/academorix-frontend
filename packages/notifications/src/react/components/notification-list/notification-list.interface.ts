/**
 * @file notification-list.interface.ts
 * @module @stackra/notifications/react/components
 * @description Props for the {@link NotificationList} component.
 */

import type { IRenderableNotification } from '@/core/interfaces';
import type { NotificationWriter } from '../../hooks/use-notification-writes';

/**
 * Props accepted by {@link NotificationList}.
 */
export interface NotificationListProps {
  /** Already filtered + sorted (newest-first) rows. */
  readonly entries: readonly IRenderableNotification[];
  /**
   * Called by each row after its own action — the drawer passes a
   * `close()` here so a click that navigates also closes the
   * drawer.
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
  /** Additional CSS classes appended to the root `<ul>`. */
  readonly className?: string;
}

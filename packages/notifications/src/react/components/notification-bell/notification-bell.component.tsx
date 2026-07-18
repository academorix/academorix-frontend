/**
 * @file notification-bell.component.tsx
 * @module @stackra/notifications/react/components
 * @description Navbar-mounted bell button that opens the
 *   {@link NotificationDrawer}.
 *
 *   Owns local drawer open state — no other surface needs to know
 *   when it's open. `aria-label` includes the current unread count
 *   so screen readers hear "Notifications, 3 unread" on every
 *   focus.
 */

import { useState, type ReactElement } from 'react';
import { Button } from '@stackra/ui/react';
import { BellIcon } from '@stackra/ui/icons/heroicon/outline';

import { useRenderableNotifications } from '../../hooks/use-renderable-notifications';
import { NotificationBadge } from '../notification-badge';
import { NotificationDrawer } from '../notification-drawer';
import type { NotificationBellProps } from './notification-bell.interface';

/**
 * Notification bell.
 *
 * @example
 * ```tsx
 * import { NotificationBell } from '@stackra/notifications/react';
 *
 * function Header() {
 *   return <NotificationBell />;
 * }
 * ```
 */
export function NotificationBell({
  icon,
  className,
  ariaLabel,
}: NotificationBellProps = {}): ReactElement {
  const { unreadCount } = useRenderableNotifications();
  const [isOpen, setOpen] = useState(false);

  const label =
    ariaLabel ??
    (unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications, no unread');

  return (
    <>
      <NotificationBadge>
        <Button
          isIconOnly
          variant="ghost"
          aria-label={label}
          className={className}
          onPress={() => setOpen(true)}
          data-notifications-bell=""
        >
          {icon ?? <BellIcon aria-hidden="true" className="size-5" />}
        </Button>
      </NotificationBadge>
      <NotificationDrawer isOpen={isOpen} onOpenChange={setOpen} />
    </>
  );
}

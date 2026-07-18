/**
 * @file notification-badge.component.tsx
 * @module @stackra/notifications/react/components
 * @description Draw an unread-count badge over a trigger child.
 *
 *   Uses HeroUI's `Badge.Anchor` — the badge is a sibling of the
 *   trigger inside the anchor. When `hideWhenZero` is `true` and
 *   the count is zero, the badge is simply not rendered — HeroUI
 *   OSS Badge has no `isInvisible` prop, and conditional rendering
 *   is the canonical pattern.
 */

import type { ReactElement } from 'react';
import { Badge } from '@stackra/ui/react';

import { useInAppNotifications } from '../../hooks/use-in-app-notifications';
import type { NotificationBadgeProps } from './notification-badge.interface';

/**
 * Cap the numeric badge label to the given ceiling.
 *
 * `max = 99` renders `100` as `'99+'`; `max = Infinity` disables
 * capping entirely.
 */
function formatCount(count: number, max: number): string {
  if (!Number.isFinite(max)) return String(count);
  return count > max ? `${max}+` : String(count);
}

/**
 * Notification badge.
 *
 * @example
 * ```tsx
 * import { NotificationBadge } from '@stackra/notifications/react';
 * import { Button } from '@stackra/ui/react';
 *
 * function BellButton({ onOpen }: { onOpen: () => void }) {
 *   return (
 *     <NotificationBadge>
 *       <Button isIconOnly variant="ghost" onPress={onOpen} aria-label="Notifications">
 *         <BellIcon />
 *       </Button>
 *     </NotificationBadge>
 *   );
 * }
 * ```
 */
export function NotificationBadge({
  children,
  hideWhenZero = true,
  max = 99,
  className,
}: NotificationBadgeProps): ReactElement {
  const { unreadCount } = useInAppNotifications();
  const showBadge = hideWhenZero ? unreadCount > 0 : true;

  return (
    <Badge.Anchor
      className={className}
      data-notifications-badge=""
      data-notifications-unread-count={unreadCount}
    >
      {children}
      {showBadge ? (
        <Badge aria-hidden="true" color="danger" size="sm" className="pointer-events-none">
          {formatCount(unreadCount, max)}
        </Badge>
      ) : null}
    </Badge.Anchor>
  );
}

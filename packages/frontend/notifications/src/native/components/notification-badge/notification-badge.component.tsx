/**
 * @file notification-badge.component.tsx
 * @module @stackra/notifications/native/components
 * @description Native `Badge` anchor around any trigger child.
 *
 *   Uses HeroUI Native Pro's `Badge` compound (`Badge.Anchor` +
 *   root `Badge` + `Badge.Label`) — visual parity with the web
 *   `NotificationBadge` while staying on the Native Pro Badge
 *   primitive.
 */

import type { ReactElement } from "react";
import { Badge } from "@stackra/ui/native";

import { useInAppNotifications } from "../../hooks";
import type { NotificationBadgeProps } from "./notification-badge.interface";

/**
 * Cap the numeric badge label to the given ceiling. `max = 99`
 * renders `100` as `'99+'`; `max = Infinity` disables capping.
 */
function formatCount(count: number, max: number): string {
  if (!Number.isFinite(max)) return String(count);
  return count > max ? `${max}+` : String(count);
}

/**
 * Native notification badge.
 *
 * @example
 * ```tsx
 * import { NotificationBadge } from '@stackra/notifications/native';
 * import { Button } from '@stackra/ui/native';
 *
 * function BellButton({ onPress }: { onPress: () => void }) {
 *   return (
 *     <NotificationBadge>
 *       <Button variant="ghost" onPress={onPress}>
 *         <Button.Label>Notifications</Button.Label>
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
    <Badge.Anchor className={className}>
      {children}
      {showBadge ? (
        <Badge color="danger" size="sm">
          <Badge.Label>{formatCount(unreadCount, max)}</Badge.Label>
        </Badge>
      ) : null}
    </Badge.Anchor>
  );
}

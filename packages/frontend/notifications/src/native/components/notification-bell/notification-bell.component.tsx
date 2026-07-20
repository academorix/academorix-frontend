/**
 * @file notification-bell.component.tsx
 * @module @stackra/notifications/native/components
 * @description Native notification bell — wraps a `PressableFeedback`
 *   trigger with the shared {@link NotificationBadge} so unread
 *   counts overlay every mount site consistently.
 *
 *   The bell owns nothing but its own accessibility label — the
 *   overlay comes from the badge; the trigger surface is the
 *   caller-friendly `PressableFeedback`. Consumers that need a
 *   custom trigger (e.g. a HeroUI Native `Button`) can wrap it
 *   themselves.
 */

import { Text } from "react-native";
import type { ReactElement } from "react";
import { PressableFeedback } from "@stackra/ui/native";

import { NotificationBadge } from "../notification-badge";
import { useInAppNotifications } from "../../hooks";
import type { NotificationBellProps } from "./notification-bell.interface";

/**
 * Native notification bell.
 *
 * @example
 * ```tsx
 * import { NotificationBell } from '@stackra/notifications/native';
 *
 * function Header() {
 *   return <NotificationBell onPress={() => setDrawerOpen(true)} />;
 * }
 * ```
 */
export function NotificationBell({
  onPress,
  accessibilityLabel,
  className,
}: NotificationBellProps): ReactElement {
  const { unreadCount } = useInAppNotifications();
  const hasUnread = unreadCount > 0;
  const label =
    accessibilityLabel ??
    (hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications, no unread");

  return (
    <NotificationBadge className={className}>
      <PressableFeedback
        accessibilityLabel={label}
        accessibilityRole="button"
        className="p-2"
        onPress={onPress}
      >
        <Text className="text-foreground">🔔</Text>
      </PressableFeedback>
    </NotificationBadge>
  );
}

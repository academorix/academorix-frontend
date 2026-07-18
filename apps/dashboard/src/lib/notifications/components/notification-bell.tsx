/**
 * @file notification-bell.tsx
 * @module notifications/components/notification-bell
 *
 * @description
 * Navbar-mounted bell button that opens the {@link NotificationDrawer}
 * and shows the unread count as a HeroUI `Badge`.
 *
 * ## Placement + a11y
 *
 * Placed between the workspace switcher and the profile avatar in
 * `AuthenticatedLayout` per menus module The `aria-label` includes
 * the current unread count so screen-reader users hear "Notifications,
 * 3 unread" every focus.
 *
 * ## Why controlled from here
 *
 * The bell owns the drawer's open state so no other surface needs to
 * know when it's open — the drawer is fully local to this component.
 * If a future surface (Cmd-K action, deep-link) needs to open the
 * drawer, we lift the state via a small `useNotificationDrawer` hook
 * — cheap when we need it, unnecessary today.
 */

import { BellIcon } from "@stackra/ui/icons/heroicon/outline";
import { Badge, Button } from "@stackra/ui/react";
import { useState } from "react";

import type { ReactNode } from "react";

import { NotificationDrawer } from "@/lib/notifications/components/notification-drawer";
import { useNotifications } from "@/lib/notifications/provider/notifications-bundle";

/**
 * The unread-count string shown on the badge. Cap at "99+" so a user
 * with hundreds of unread rows doesn't blow out the badge width.
 */
function formatUnreadCount(count: number): string {
  if (count <= 0) {
    return "";
  }

  return count > 99 ? "99+" : String(count);
}

/**
 * The navbar bell button. Renders a `Badge.Anchor` wrapping the
 * button so the badge stays visually pinned even when the sidebar
 * collapses.
 */
export function NotificationBell(): ReactNode {
  const { unreadCount } = useNotifications();
  const [isOpen, setOpen] = useState(false);

  const badgeText = formatUnreadCount(unreadCount);
  const hasUnread = unreadCount > 0;

  return (
    <>
      <Badge.Anchor>
        <Button
          isIconOnly
          aria-label={
            hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications, no unread"
          }
          data-testid="notification-bell"
          variant="ghost"
          onPress={() => setOpen(true)}
        >
          <BellIcon aria-hidden="true" className="size-5" />
        </Button>
        {hasUnread ? (
          <Badge
            aria-hidden="true"
            className="pointer-events-none"
            color="danger"
            data-testid="notification-bell-badge"
            size="sm"
          >
            {badgeText}
          </Badge>
        ) : null}
      </Badge.Anchor>
      <NotificationDrawer isOpen={isOpen} onOpenChange={setOpen} />
    </>
  );
}

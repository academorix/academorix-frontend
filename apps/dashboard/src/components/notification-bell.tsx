/**
 * @file notification-bell.tsx
 * @module components/notification-bell
 *
 * @description
 * Navbar notifications trigger — icon-only button that jumps to
 * `/notifications`. This is a TEMPORARY placeholder.
 *
 * The original design pulled a `<NotificationBell>` compound (drawer,
 * tabs, footer slot, live-event bus, action registry) from
 * `@academorix/notifications/inbox`, but neither that submodule nor
 * the supporting hooks (`useNotificationBus`, `useNotificationActions`,
 * `useNotificationInboxState`, `NotificationActionHandlerMap`) nor the
 * `@academorix/contracts` package that supplied `INotificationRecord`
 * have been authored. Consuming any of them makes the SPA fail at
 * module resolution.
 *
 * Keeping the same export signature (`export function NotificationBell()`,
 * no props) so `app-navbar.tsx` doesn't have to change when the real
 * compound lands.
 *
 * TODO: swap back to the full compound once
 *   - `@academorix/notifications` ships the inbox surface, AND
 *   - a package exists that exports the `INotificationRecord` DTO
 *     the dashboard consumes.
 */

import { Button, Tooltip } from "@heroui/react";
import { useNavigate } from "@stackra/routing/react";

import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { useTranslate } from "@/hooks/use-translate";

/**
 * Icon-only trigger that navigates to the notifications inbox page.
 */
export function NotificationBell(): ReactNode {
  const navigate = useNavigate();
  const t = useTranslate();
  const label = t("app.notifications", undefined, "Notifications");

  return (
    <Tooltip>
      <Button
        aria-label={label}
        isIconOnly
        onPress={() => navigate("/notifications")}
        size="sm"
        variant="ghost"
      >
        <Iconify className="size-5" icon="bell" />
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}

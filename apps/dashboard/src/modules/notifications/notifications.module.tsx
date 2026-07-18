/**
 * @file notifications.module.tsx
 * @module modules/notifications
 *
 * @description
 * The Notifications module manifest. Registers:
 *
 *   - `/notifications`             — the full-page inbox.
 *   - `/notifications/preferences` — the per-user preferences page.
 *
 * Both routes are gated by the `notification.view` permission on the
 * primary resource. The layout shell reads the resource's icon +
 * label to render the sidebar entry; the actual unread badge lives on
 * the navbar bell (see `app-navbar.tsx`).
 *
 * ## Coordination
 *
 * The module's user-facing pages live in `src/notifications/`, not
 * under `src/modules/notifications/pages/`, because the notifications
 * module owns a **cross-cutting** UI layer (bell, drawer, toast
 * bridge, permission banner) that the rest of the app consumes
 * directly. Keeping the pages next to the layer they compose keeps
 * the boundary tidy.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.11 "Notification Delivery & Templates"
 * @see notifications module — end-to-end architecture.
 */

import { BellIcon } from "@stackra/ui/icons/heroicon/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const NotificationInboxPage = lazy(() => import("@/lib/notifications/pages/inbox-page"));
const NotificationPreferencesPage = lazy(
  () => import("@/lib/notifications/preferences/preferences-page"),
);

/** The Notifications feature module (Phase 1 — in-app inbox). */
const notificationsModule: AppModule = {
  name: "notifications",
  resources: [
    {
      name: "notifications",
      list: "/notifications",
      meta: {
        label: "Notifications",
        icon: BellIcon,
        featureKey: "notifications",
        requiredPermission: "notification.view",
        order: 12,
        groupKey: "overview",
        shortcuts: {
          navigate: "G I",
        },
      },
    },
  ],
  routes: [
    {
      tier: "protected",
      path: "/notifications",
      element: createElement(NotificationInboxPage),
    },
    {
      tier: "protected",
      path: "/notifications/preferences",
      element: createElement(NotificationPreferencesPage),
    },
  ],
};

export default notificationsModule;

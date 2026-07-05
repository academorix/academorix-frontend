/**
 * @file announcements.module.tsx
 * @module modules/announcements
 *
 * @description
 * The Announcements module — broadcast messages to a tenant audience. Full CRUD,
 * scoped by branch.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.2 "Announcements & Notifications"
 */

import { MegaphoneIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const AnnouncementListPage = lazy(() => import("@/modules/announcements/pages/list"));
const AnnouncementCreatePage = lazy(() => import("@/modules/announcements/pages/create"));
const AnnouncementEditPage = lazy(() => import("@/modules/announcements/pages/edit"));
const AnnouncementShowPage = lazy(() => import("@/modules/announcements/pages/show"));

/** The Announcements feature module. */
const announcementsModule: AppModule = {
  name: "announcements",
  resources: [
    {
      name: "announcements",
      list: "/announcements",
      create: "/announcements/create",
      edit: "/announcements/:id/edit",
      show: "/announcements/:id",
      meta: {
        label: "Announcements",
        icon: MegaphoneIcon,
        featureKey: "announcements",
        requiredPermission: "announcements.viewAny",
        order: 33,
        scopedBy: ["branch"],
        groupKey: "growth",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/announcements", element: createElement(AnnouncementListPage) },
    {
      tier: "protected",
      path: "/announcements/create",
      element: createElement(AnnouncementCreatePage),
    },
    {
      tier: "protected",
      path: "/announcements/:id/edit",
      element: createElement(AnnouncementEditPage),
    },
    { tier: "protected", path: "/announcements/:id", element: createElement(AnnouncementShowPage) },
  ],
};

export default announcementsModule;

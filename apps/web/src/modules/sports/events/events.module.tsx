/**
 * @file events.module.tsx
 * @module modules/sports/events
 *
 * @description
 * The Events module — scheduled activities (training/match/session/meeting) with
 * RSVP invitations. Full CRUD, scoped by the active branch + season; the detail
 * view shows the RSVP list.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.1 "Events, Invitations & RSVP"
 */

import { CalendarIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const EventListPage = lazy(() => import("@/modules/sports/events/pages/list"));
const EventCreatePage = lazy(() => import("@/modules/sports/events/pages/create"));
const EventEditPage = lazy(() => import("@/modules/sports/events/pages/edit"));
const EventShowPage = lazy(() => import("@/modules/sports/events/pages/show"));

/** The Events feature module. */
const eventsModule: AppModule = {
  name: "events",
  resources: [
    {
      name: "events",
      list: "/events",
      create: "/events/create",
      edit: "/events/:id/edit",
      show: "/events/:id",
      meta: {
        label: "Events",
        icon: CalendarIcon,
        featureKey: "events",
        requiredPermission: "events.viewAny",
        order: 14,
        scopedBy: ["branch", "season"],
        groupKey: "operations",
        shortcuts: {
          navigate: "G E",
          create: "N E",
        },
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/events", element: createElement(EventListPage) },
    { tier: "protected", path: "/events/create", element: createElement(EventCreatePage) },
    { tier: "protected", path: "/events/:id/edit", element: createElement(EventEditPage) },
    { tier: "protected", path: "/events/:id", element: createElement(EventShowPage) },
  ],
};

export default eventsModule;

/**
 * @file sessions.module.tsx
 * @module modules/sports/sessions
 *
 * @description
 * The Private Sessions module — 1:1 (or small-group) coaching bookings between a
 * coach and an athlete, scoped by the active branch + season. Full CRUD.
 *
 * The Refine resource is named `private-sessions` (so the mock provider fetches
 * `public/data/private-sessions.json`), while the module folder stays `sessions`.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.4 "Private Sessions"
 */

import { ClockIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const SessionListPage = lazy(() => import("@/modules/sports/sessions/pages/list"));
const SessionCreatePage = lazy(() => import("@/modules/sports/sessions/pages/create"));
const SessionEditPage = lazy(() => import("@/modules/sports/sessions/pages/edit"));
const SessionShowPage = lazy(() => import("@/modules/sports/sessions/pages/show"));

/** The Private Sessions feature module. */
const sessionsModule: AppModule = {
  name: "sessions",
  resources: [
    {
      name: "private-sessions",
      list: "/private-sessions",
      create: "/private-sessions/create",
      edit: "/private-sessions/:id/edit",
      show: "/private-sessions/:id",
      meta: {
        label: "Private Sessions",
        icon: ClockIcon,
        featureKey: "private-sessions",
        requiredPermission: "private-sessions.viewAny",
        order: 23,
        scopedBy: ["branch", "season"],
        shortcuts: {
          navigate: "G S",
          create: "N S",
        },
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/private-sessions", element: createElement(SessionListPage) },
    {
      tier: "protected",
      path: "/private-sessions/create",
      element: createElement(SessionCreatePage),
    },
    {
      tier: "protected",
      path: "/private-sessions/:id/edit",
      element: createElement(SessionEditPage),
    },
    { tier: "protected", path: "/private-sessions/:id", element: createElement(SessionShowPage) },
  ],
};

export default sessionsModule;

/**
 * @file safeguarding.module.tsx
 * @module modules/safeguarding
 *
 * @description
 * The Safeguarding module — welfare/child-protection case tracking. Sensitive
 * data: gated behind the `safeguarding` permission (designated leads/admins
 * only). List + detail, plus a Kanban view keyed by case status.
 *
 * The feature-flag gate lives in `pages/kanban-route.tsx` (a small runtime
 * wrapper) rather than in this manifest, so the manifest stays a plain data
 * structure and the module registry never has to touch the features registry
 * at import time.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.21 "Safeguarding & Welfare"
 * @see DASHBOARD_UX_PLAN.md §5.7 (safeguarding → Kanban as primary view)
 */

import { ShieldCheckIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const SafeguardingListPage = lazy(() => import("@/modules/safeguarding/pages/list"));
const SafeguardingCreatePage = lazy(() => import("@/modules/safeguarding/pages/create"));
const SafeguardingEditPage = lazy(() => import("@/modules/safeguarding/pages/edit"));
const SafeguardingShowPage = lazy(() => import("@/modules/safeguarding/pages/show"));
// Feature-flag-gated wrapper (see file docblock).
const SafeguardingKanbanRoute = lazy(() => import("@/modules/safeguarding/pages/kanban-route"));

/** The Safeguarding feature module. */
const safeguardingModule: AppModule = {
  name: "safeguarding",
  resources: [
    {
      name: "safeguarding",
      list: "/safeguarding",
      create: "/safeguarding/create",
      edit: "/safeguarding/:id/edit",
      show: "/safeguarding/:id",
      meta: {
        label: "Safeguarding",
        icon: ShieldCheckIcon,
        featureKey: "safeguarding",
        requiredPermission: "safeguarding.viewAny",
        order: 34,
        groupKey: "administration",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/safeguarding", element: createElement(SafeguardingListPage) },
    {
      tier: "protected",
      path: "/safeguarding/kanban",
      element: createElement(SafeguardingKanbanRoute),
    },
    {
      tier: "protected",
      path: "/safeguarding/create",
      element: createElement(SafeguardingCreatePage),
    },
    {
      tier: "protected",
      path: "/safeguarding/:id/edit",
      element: createElement(SafeguardingEditPage),
    },
    { tier: "protected", path: "/safeguarding/:id", element: createElement(SafeguardingShowPage) },
  ],
};

export default safeguardingModule;

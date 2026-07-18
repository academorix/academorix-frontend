/**
 * @file leads.module.tsx
 * @module modules/leads
 *
 * @description
 * The Leads CRM module — the acquisition pipeline of prospective members before
 * they convert to registrations. Full CRUD, scoped by organization/branch.
 *
 * The module now also ships a Kanban view keyed by pipeline stage — see
 * {@link "@/modules/leads/pages/kanban" LeadsKanban}. The feature-flag gate
 * lives in `pages/kanban-route.tsx` (a small runtime wrapper) rather than
 * this manifest, so the manifest stays a plain data structure and the
 * module registry never has to touch the features registry at import time.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.3 "Leads & CRM"
 * @see DASHBOARD_UX_PLAN.md §5.7 (leads → Kanban as primary view)
 */

import { UserPlusIcon } from "@stackra/ui/icons/heroicon/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const LeadsListPage = lazy(() => import("@/modules/leads/pages/list"));
const LeadsCreatePage = lazy(() => import("@/modules/leads/pages/create"));
const LeadsEditPage = lazy(() => import("@/modules/leads/pages/edit"));
const LeadsShowPage = lazy(() => import("@/modules/leads/pages/show"));
// The kanban route wraps the page in a feature-flag gate + redirect. Keeping
// the wrapper out here — instead of inlined here — avoids a top-level import
// from `@/config/features.config` in the manifest, which the module registry
// preloads eagerly for every app boot.
const LeadsKanbanRoute = lazy(() => import("@/modules/leads/pages/kanban-route"));

/** The Leads feature module. */
const leadsModule: AppModule = {
  name: "leads",
  resources: [
    {
      name: "leads",
      list: "/leads",
      create: "/leads/create",
      edit: "/leads/:id/edit",
      show: "/leads/:id",
      meta: {
        label: "Leads",
        icon: UserPlusIcon,
        featureKey: "leads",
        requiredPermission: "leads.viewAny",
        order: 44,
        groupKey: "growth",
        shortcuts: {
          navigate: "G L",
          create: "N L",
        },
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/leads", element: createElement(LeadsListPage) },
    { tier: "protected", path: "/leads/kanban", element: createElement(LeadsKanbanRoute) },
    { tier: "protected", path: "/leads/create", element: createElement(LeadsCreatePage) },
    { tier: "protected", path: "/leads/:id/edit", element: createElement(LeadsEditPage) },
    { tier: "protected", path: "/leads/:id", element: createElement(LeadsShowPage) },
  ],
};

export default leadsModule;

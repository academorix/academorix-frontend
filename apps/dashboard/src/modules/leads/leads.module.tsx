/**
 * @file leads.module.tsx
 * @module modules/leads
 *
 * @description
 * The Leads CRM module — the acquisition pipeline of prospective members before
 * they convert to registrations. Full CRUD, scoped by organization/branch.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.3 "Leads & CRM"
 */

import { UserPlusIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const LeadsListPage = lazy(() => import("@/modules/leads/pages/list"));
const LeadsCreatePage = lazy(() => import("@/modules/leads/pages/create"));
const LeadsEditPage = lazy(() => import("@/modules/leads/pages/edit"));
const LeadsShowPage = lazy(() => import("@/modules/leads/pages/show"));

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
    { tier: "protected", path: "/leads/create", element: createElement(LeadsCreatePage) },
    { tier: "protected", path: "/leads/:id/edit", element: createElement(LeadsEditPage) },
    { tier: "protected", path: "/leads/:id", element: createElement(LeadsShowPage) },
  ],
};

export default leadsModule;

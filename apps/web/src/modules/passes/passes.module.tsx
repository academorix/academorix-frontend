/**
 * @file passes.module.tsx
 * @module modules/passes
 *
 * @description
 * The Passes module — digital check-in passes (membership/event/day/trial) with
 * a scannable code. Full CRUD, scoped by organization/branch.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.7 "Digital Passes & Check-in"
 */

import { TicketIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const PassesListPage = lazy(() => import("@/modules/passes/pages/list"));
const PassesCreatePage = lazy(() => import("@/modules/passes/pages/create"));
const PassesEditPage = lazy(() => import("@/modules/passes/pages/edit"));
const PassesShowPage = lazy(() => import("@/modules/passes/pages/show"));

/** The Passes feature module. */
const passesModule: AppModule = {
  name: "passes",
  resources: [
    {
      name: "passes",
      list: "/passes",
      create: "/passes/create",
      edit: "/passes/:id/edit",
      show: "/passes/:id",
      meta: {
        label: "Passes",
        icon: TicketIcon,
        featureKey: "passes",
        requiredPermission: "passes.viewAny",
        order: 45,
        groupKey: "growth",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/passes", element: createElement(PassesListPage) },
    { tier: "protected", path: "/passes/create", element: createElement(PassesCreatePage) },
    { tier: "protected", path: "/passes/:id/edit", element: createElement(PassesEditPage) },
    { tier: "protected", path: "/passes/:id", element: createElement(PassesShowPage) },
  ],
};

export default passesModule;

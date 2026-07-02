/**
 * @file branches.module.tsx
 * @module modules/branches
 *
 * @description
 * The Branches module — physical venues within an organization. Full CRUD,
 * scoped by the active organization (the list reflects the org switcher). A
 * branch is also a **scope dimension** for other resources (athletes, teams, …).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.4 "Organization"
 */

import { BuildingStorefrontIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const BranchListPage = lazy(() => import("@/modules/branches/pages/list"));
const BranchCreatePage = lazy(() => import("@/modules/branches/pages/create"));
const BranchEditPage = lazy(() => import("@/modules/branches/pages/edit"));
const BranchShowPage = lazy(() => import("@/modules/branches/pages/show"));

/** The Branches feature module. */
const branchesModule: AppModule = {
  name: "branches",
  resources: [
    {
      name: "branches",
      list: "/branches",
      create: "/branches/create",
      edit: "/branches/:id/edit",
      show: "/branches/:id",
      meta: {
        label: "Branches",
        icon: BuildingStorefrontIcon,
        featureKey: "branches",
        requiredPermission: "branches.viewAny",
        order: 91,
        scopedBy: ["organization"],
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/branches", element: createElement(BranchListPage) },
    { tier: "protected", path: "/branches/create", element: createElement(BranchCreatePage) },
    { tier: "protected", path: "/branches/:id/edit", element: createElement(BranchEditPage) },
    { tier: "protected", path: "/branches/:id", element: createElement(BranchShowPage) },
  ],
};

export default branchesModule;

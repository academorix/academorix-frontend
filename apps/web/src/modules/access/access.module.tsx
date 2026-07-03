/**
 * @file access.module.tsx
 * @module modules/access
 *
 * @description
 * The Access (RBAC) module — browse the tenant's roles and the permissions each
 * grants. List + detail; enforcement itself is data-driven from the identity's
 * permissions.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.7 "Access (RBAC)"
 */

import { ShieldCheckIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const RoleListPage = lazy(() => import("@/modules/access/pages/list"));
const RoleShowPage = lazy(() => import("@/modules/access/pages/show"));

/** The Access (roles) feature module. */
const accessModule: AppModule = {
  name: "access",
  resources: [
    {
      name: "roles",
      list: "/roles",
      show: "/roles/:id",
      meta: {
        label: "Roles",
        icon: ShieldCheckIcon,
        featureKey: "roles",
        requiredPermission: "roles.viewAny",
        order: 42,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/roles", element: createElement(RoleListPage) },
    { tier: "protected", path: "/roles/:id", element: createElement(RoleShowPage) },
  ],
};

export default accessModule;

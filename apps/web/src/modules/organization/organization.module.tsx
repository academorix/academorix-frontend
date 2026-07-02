/**
 * @file organization.module.tsx
 * @module modules/organization
 *
 * @description
 * The Organization module — sub-brands/divisions within a tenant. Organizations
 * are a **scope dimension** (the org switcher reads them from `/auth/me`), so
 * this module provides list + detail management screens rather than being scoped
 * by a parent. Read-only in early waves (create/edit handled by platform admins).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.4 "Organization"
 */

import { BuildingOffice2Icon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const OrganizationListPage = lazy(() => import("@/modules/organization/pages/list"));
const OrganizationShowPage = lazy(() => import("@/modules/organization/pages/show"));

/** The Organization feature module. */
const organizationModule: AppModule = {
  name: "organization",
  resources: [
    {
      name: "organizations",
      list: "/organizations",
      show: "/organizations/:id",
      meta: {
        label: "Organizations",
        icon: BuildingOffice2Icon,
        featureKey: "organizations",
        requiredPermission: "organizations.viewAny",
        order: 90,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/organizations", element: createElement(OrganizationListPage) },
    { tier: "protected", path: "/organizations/:id", element: createElement(OrganizationShowPage) },
  ],
};

export default organizationModule;

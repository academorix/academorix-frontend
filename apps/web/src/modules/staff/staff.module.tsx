/**
 * @file staff.module.tsx
 * @module modules/staff
 *
 * @description
 * The Staff module — internal people (coaches, admins, reception, medical) with
 * employment, pay, and status. Full CRUD, scoped by branch. The Coaching
 * sub-domain is a thin view over these records.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.18 "Staff & HR"
 */

import { BriefcaseIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const StaffListPage = lazy(() => import("@/modules/staff/pages/list"));
const StaffCreatePage = lazy(() => import("@/modules/staff/pages/create"));
const StaffEditPage = lazy(() => import("@/modules/staff/pages/edit"));
const StaffShowPage = lazy(() => import("@/modules/staff/pages/show"));

/** The Staff feature module. */
const staffModule: AppModule = {
  name: "staff",
  resources: [
    {
      name: "staff",
      list: "/staff",
      create: "/staff/create",
      edit: "/staff/:id/edit",
      show: "/staff/:id",
      meta: {
        label: "Staff",
        icon: BriefcaseIcon,
        featureKey: "staff",
        requiredPermission: "staff.viewAny",
        order: 40,
        scopedBy: ["branch"],
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/staff", element: createElement(StaffListPage) },
    { tier: "protected", path: "/staff/create", element: createElement(StaffCreatePage) },
    { tier: "protected", path: "/staff/:id/edit", element: createElement(StaffEditPage) },
    { tier: "protected", path: "/staff/:id", element: createElement(StaffShowPage) },
  ],
};

export default staffModule;

import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { staffFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const staffModule: AppModule = {
  name: "staff",
  resources: [
    {
      name: "staff",
      list: "/staff",
      show: "/staff/:id",
      meta: {
        label: "Staff",
        singularLabel: "Staff member",
        icon: "briefcase",
        groupKey: "people",
        order: 40,
        featureKey: "staff",
        requiredPermission: "staff.viewAny",
        scopes: ["branch"],
        crud: "full",
        formFields: staffFields,
        emptyState: {
          title: "No staff yet",
          description: "Register everyone on your payroll — coaches, receptionists, and admins.",
          actionLabel: "New staff",
        },
        // -------------------------------------------------------------
        // Saved views: split the roster by employment status. Ops
        // routinely toggle between "who's on the payroll now" and
        // "who used to be" — an inline segmented control saves a
        // trip through the filter dropdown.
        // -------------------------------------------------------------
        savedViews: [
          {
            id: "active",
            label: "Active",
            filters: [{ field: "isActive", operator: "eq", value: true }],
            isDefault: true,
          },
          {
            id: "inactive",
            label: "Inactive",
            filters: [{ field: "isActive", operator: "eq", value: false }],
          },
        ],
        // Filter chips = the four `role` buckets on the schema. Kept
        // as top-level roles (not department) because the fixture
        // ships role-not-department; the departmental split lands
        // organically once tenants populate a `department` field.
        filterChips: [
          {
            id: "coach",
            label: "Coaching",
            filter: { field: "role", operator: "contains", value: "Coach" },
            color: "accent",
          },
          {
            id: "reception",
            label: "Reception",
            filter: { field: "role", operator: "contains", value: "Reception" },
            color: "accent",
          },
          {
            id: "finance",
            label: "Finance",
            filter: { field: "role", operator: "contains", value: "Finance" },
            color: "accent",
          },
          {
            id: "ops",
            label: "Operations",
            filter: { field: "role", operator: "contains", value: "Operations" },
            color: "accent",
          },
        ],
        // WHY: staff records are queried by name + email during payroll
        // reconciliation and by role when the schedule is in flight.
        searchFields: ["fullName", "email", "role"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/staff", tier: "protected" },
    { element: createElement(ShowPage), path: "/staff/:id", tier: "protected" },
  ],
};

export default staffModule;

import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { membershipFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const membershipsModule: AppModule = {
  name: "memberships",
  resources: [
    {
      name: "memberships",
      list: "/memberships",
      show: "/memberships/:id",
      meta: {
        label: "Memberships",
        singularLabel: "Membership",
        icon: "credit-card",
        groupKey: "growth",
        order: 31,
        featureKey: "memberships",
        requiredPermission: "memberships.viewAny",
        scopes: ["branch"],
        crud: "full",
        formFields: membershipFields,
        emptyState: {
          title: "No membership plans yet",
          description: "Configure recurring plans to charge athletes for ongoing programming.",
          actionLabel: "New plan",
        },
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
        // Filter chips = cadence buckets from the schema. Helps ops
        // see monthly vs annual mix at a glance during renewals season.
        filterChips: [
          {
            id: "monthly",
            label: "Monthly",
            filter: { field: "cadence", operator: "eq", value: "monthly" },
            color: "accent",
          },
          {
            id: "quarterly",
            label: "Quarterly",
            filter: { field: "cadence", operator: "eq", value: "quarterly" },
            color: "accent",
          },
          {
            id: "annual",
            label: "Annual",
            filter: { field: "cadence", operator: "eq", value: "annual" },
            color: "success",
          },
        ],
        // Plans are recalled by name — that's the only meaningful
        // free-text axis on the schema.
        searchFields: ["name"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/memberships", tier: "protected" },
    { element: createElement(ShowPage), path: "/memberships/:id", tier: "protected" },
  ],
};

export default membershipsModule;

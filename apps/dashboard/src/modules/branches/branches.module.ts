import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { branchFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const branchesModule: AppModule = {
  name: "branches",
  resources: [
    {
      name: "branches",
      list: "/branches",
      show: "/branches/:id",
      meta: {
        label: "Branches",
        singularLabel: "Branch",
        // `map-pin` — branches are physical locations; `location`
        // is not a Gravity UI token.
        icon: "map-pin",
        groupKey: "administration",
        order: 91,
        featureKey: "branches",
        requiredPermission: "branches.viewAny",
        scopes: ["organization"],
        shortcuts: { navigate: "G B", create: "N B" },
        crud: "full",
        formFields: branchFields,
        emptyState: {
          title: "No branches yet",
          description: "Register the physical locations you operate from.",
          actionLabel: "New branch",
        },
        // Saved views: active vs. inactive lifecycle — matches the
        // pattern every other physical-location resource uses.
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
        // Filter chips = geo regions from the fixture (`region`
        // column). Central ops routinely split multi-country
        // rollups by region for board reporting.
        filterChips: [
          {
            id: "us-west",
            label: "US · West",
            filter: { field: "region", operator: "eq", value: "US · West" },
            color: "accent",
          },
          {
            id: "us-east",
            label: "US · East",
            filter: { field: "region", operator: "eq", value: "US · East" },
            color: "accent",
          },
          {
            id: "emea",
            label: "EMEA",
            filter: { field: "region", operator: "eq", value: "EMEA" },
            color: "success",
          },
          {
            id: "apac",
            label: "APAC",
            filter: { field: "region", operator: "eq", value: "APAC" },
            color: "warning",
          },
        ],
        // Branch lookup by name / city / manager is the common
        // support-desk workflow — one query hits all three.
        searchFields: ["name", "city", "region", "manager"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/branches", tier: "protected" },
    { element: createElement(ShowPage), path: "/branches/:id", tier: "protected" },
  ],
};

export default branchesModule;

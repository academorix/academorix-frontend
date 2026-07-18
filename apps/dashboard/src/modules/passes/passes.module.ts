import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { passFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const passesModule: AppModule = {
  name: "passes",
  resources: [
    {
      name: "passes",
      list: "/passes",
      show: "/passes/:id",
      meta: {
        label: "Passes",
        singularLabel: "Pass",
        icon: "ticket",
        groupKey: "growth",
        order: 45,
        featureKey: "passes",
        requiredPermission: "passes.viewAny",
        crud: "full",
        formFields: passFields,
        emptyState: {
          title: "No passes yet",
          description: "Sell prepaid credit bundles for drop-in sessions.",
          actionLabel: "New pass",
        },
        // Saved views: active (available to purchase) vs. expired
        // (kept for reporting but no longer sold). `isActive` is
        // the canonical lifecycle flag across the fixture.
        savedViews: [
          {
            id: "active",
            label: "Active",
            filters: [{ field: "isActive", operator: "eq", value: true }],
            isDefault: true,
          },
          {
            id: "expired",
            label: "Expired",
            filters: [{ field: "isActive", operator: "eq", value: false }],
          },
        ],
        // Filter chips = pass duration. The fixture stores the
        // duration as a human string ("1 day", "4 weeks"), so we
        // `contains`-match those buckets. Chips stay useful once
        // the schema carries a discrete `duration` axis.
        filterChips: [
          {
            id: "day",
            label: "Day",
            filter: { field: "duration", operator: "contains", value: "day" },
            color: "accent",
          },
          {
            id: "week",
            label: "Week",
            filter: { field: "duration", operator: "contains", value: "week" },
            color: "accent",
          },
          {
            id: "month",
            label: "Month",
            filter: { field: "duration", operator: "contains", value: "month" },
            color: "success",
          },
          {
            id: "season",
            label: "Season",
            filter: { field: "duration", operator: "contains", value: "season" },
            color: "warning",
          },
        ],
        // Passes are picked up by name at the till; `includes`
        // gives receptionists a second axis when a family knows
        // what the pass covers but not what it's called.
        searchFields: ["name", "includes", "duration"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/passes", tier: "protected" },
    { element: createElement(ShowPage), path: "/passes/:id", tier: "protected" },
  ],
};

export default passesModule;

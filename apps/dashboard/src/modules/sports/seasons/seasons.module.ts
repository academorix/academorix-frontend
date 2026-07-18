import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { seasonFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const seasonsModule: AppModule = {
  name: "seasons",
  resources: [
    {
      name: "seasons",
      list: "/seasons",
      show: "/seasons/:id",
      meta: {
        label: "Seasons",
        singularLabel: "Season",
        icon: "calendar",
        groupKey: "programs",
        order: 12,
        featureKey: "seasons",
        requiredPermission: "seasons.viewAny",
        crud: "full",
        formFields: seasonFields,
        emptyState: {
          title: "No seasons yet",
          description: "Create a season to bucket your sports programming into a scheduled window.",
          actionLabel: "New season",
        },
        // Saved views: the currently-running season is what
        // 99% of the app scopes to; past seasons are the report /
        // archive surface.
        savedViews: [
          {
            id: "current",
            label: "Current",
            filters: [{ field: "isActive", operator: "eq", value: true }],
            isDefault: true,
          },
          {
            id: "past",
            label: "Past",
            filters: [{ field: "isActive", operator: "eq", value: false }],
          },
        ],
        // Filter chips = lifecycle stage from `status.text`. `Active`
        // is the running season, `Upcoming` is the next one being
        // planned, `Closed` is archived history.
        filterChips: [
          {
            id: "upcoming",
            label: "Upcoming",
            filter: { field: "status.text", operator: "eq", value: "Upcoming" },
            color: "accent",
          },
          {
            id: "active",
            label: "Active",
            filter: { field: "status.text", operator: "eq", value: "Active" },
            color: "success",
          },
          {
            id: "closed",
            label: "Closed",
            filter: { field: "status.text", operator: "eq", value: "Closed" },
            color: "default",
          },
        ],
        // Seasons are found by name ("2024/25 season") or by
        // sport when the tenant runs sport-specific windows.
        searchFields: ["name", "sport"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/seasons", tier: "protected" },
    { element: createElement(ShowPage), path: "/seasons/:id", tier: "protected" },
  ],
};

export default seasonsModule;

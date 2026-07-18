import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { safeguardingFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));
const ExtraPage0 = lazy(() => import("./pages/extra-0"));

const safeguardingModule: AppModule = {
  name: "safeguarding",
  resources: [
    {
      name: "safeguarding",
      list: "/safeguarding",
      show: "/safeguarding/:id",
      meta: {
        label: "Safeguarding",
        singularLabel: "Case",
        icon: "shield-check",
        groupKey: "records",
        order: 34,
        featureKey: "safeguarding",
        requiredPermission: "safeguarding.viewAny",
        crud: "full",
        formFields: safeguardingFields,
        emptyState: {
          title: "No safeguarding cases",
          description: "Log incidents and concerns so they're investigated and closed.",
          actionLabel: "New case",
        },
        savedViews: [
          {
            id: "open",
            label: "Open",
            filters: [{ field: "status.text", operator: "ne", value: "resolved" }],
            isDefault: true,
          },
          {
            id: "resolved",
            label: "Resolved",
            filters: [{ field: "status.text", operator: "eq", value: "resolved" }],
          },
        ],
        filterChips: [
          {
            id: "critical",
            label: "Critical",
            filter: { field: "severity", operator: "eq", value: "critical" },
            color: "danger",
          },
          {
            id: "high",
            label: "High",
            filter: { field: "severity", operator: "eq", value: "high" },
            color: "warning",
          },
        ],
        // Cases are found by title or by reporter — a designated
        // safeguarding officer typically remembers one of the two
        // when picking up a live investigation.
        searchFields: ["name", "reporter"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/safeguarding", tier: "protected" },
    { element: createElement(ShowPage), path: "/safeguarding/:id", tier: "protected" },
    { element: createElement(ExtraPage0), path: "/safeguarding/kanban", tier: "protected" },
  ],
};

export default safeguardingModule;

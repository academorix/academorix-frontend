import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { performanceFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const performanceModule: AppModule = {
  name: "performance",
  resources: [
    {
      name: "performance",
      list: "/performance",
      show: "/performance/:id",
      meta: {
        label: "Performance",
        singularLabel: "Performance record",
        icon: "chart-line",
        groupKey: "records",
        order: 28,
        featureKey: "performance",
        requiredPermission: "performance.viewAny",
        crud: "full",
        formFields: performanceFields,
        emptyState: {
          title: "No performance records yet",
          description: "Log per-athlete metrics to build the SDUI performance history.",
          actionLabel: "New record",
        },
        // Saved views: split the ledger by activity window. "Last
        // 30 days" is the athlete-review cadence coaches ship
        // reports on; the historical view unblocks trend charting.
        //
        // WHY `Date.now() - N * ms` inside the filter value: Refine
        // reads the manifest once at boot; we compute the pivot
        // date lazily each render so the "last 30 days" window
        // stays live across long-lived sessions.
        savedViews: [
          {
            id: "recent",
            label: "Last 30 days",
            filters: [
              {
                field: "recordedAt",
                operator: "gte",
                value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            isDefault: true,
          },
          { id: "all", label: "All time" },
        ],
        // Filter chips = metric kind buckets. The fixture keeps the
        // metric in a free-text `metric` column; we `contains`-match
        // the discipline vocabulary tenants organically settle on
        // (speed / strength / endurance / skill work).
        filterChips: [
          {
            id: "speed",
            label: "Speed",
            filter: { field: "metric", operator: "contains", value: "sprint" },
            color: "accent",
          },
          {
            id: "endurance",
            label: "Endurance",
            filter: { field: "metric", operator: "contains", value: "freestyle" },
            color: "success",
          },
          {
            id: "strength",
            label: "Strength",
            filter: { field: "metric", operator: "contains", value: "strength" },
            color: "warning",
          },
          {
            id: "skill",
            label: "Skill work",
            filter: { field: "metric", operator: "contains", value: "routine" },
            color: "accent",
          },
        ],
        // Performance rows are usually pulled up by athlete first,
        // metric second — that's how a coach frames the question
        // ("what's Lina's freestyle look like?").
        searchFields: ["athlete", "metric", "sport"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/performance", tier: "protected" },
    { element: createElement(ShowPage), path: "/performance/:id", tier: "protected" },
  ],
};

export default performanceModule;

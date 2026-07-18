import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const progressModule: AppModule = {
  name: "progress",
  resources: [
    {
      name: "progress",
      list: "/progress",
      show: "/progress/:id",
      meta: {
        label: "Progress",
        singularLabel: "Progress record",
        icon: "chart-line",
        groupKey: "records",
        order: 26,
        featureKey: "progress",
        requiredPermission: "progress.viewAny",
        crud: "read-only",
        emptyState: {
          title: "No progress tracked yet",
          description: "Progress rolls up from attendance, performance, and coach assessments.",
        },
        // Saved views: rolling "this month" pane matches the way
        // athletes and guardians expect to browse progress
        // reports; the all-time view unblocks year-over-year
        // deltas for board reporting.
        savedViews: [
          {
            id: "this-month",
            label: "This month",
            filters: [
              {
                field: "assessedAt",
                operator: "gte",
                value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            isDefault: true,
          },
          { id: "all-time", label: "All time" },
        ],
        // Filter chips = metric family. `Skills` is the coach's
        // formative assessment loop; `Attendance` is presence
        // rate; `Goals` is IDP-tied targets. `contains`-matched
        // on the `skill` column since the fixture doesn't carry
        // a `metric` axis yet.
        filterChips: [
          {
            id: "skills",
            label: "Skills",
            filter: { field: "skill", operator: "contains", value: "stroke" },
            color: "accent",
          },
          {
            id: "attendance",
            label: "Attendance",
            filter: { field: "skill", operator: "contains", value: "attendance" },
            color: "success",
          },
          {
            id: "goals",
            label: "Goals",
            filter: { field: "skill", operator: "contains", value: "goal" },
            color: "warning",
          },
        ],
        // Progress rows are recalled by athlete first, skill or
        // coach second.
        searchFields: ["athlete", "skill", "coach"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/progress", tier: "protected" },
    { element: createElement(ShowPage), path: "/progress/:id", tier: "protected" },
  ],
};

export default progressModule;

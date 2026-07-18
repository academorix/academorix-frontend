import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { drillFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const drillsModule: AppModule = {
  name: "drills",
  resources: [
    {
      name: "drills",
      list: "/drills",
      show: "/drills/:id",
      meta: {
        label: "Drills",
        singularLabel: "Drill",
        icon: "list-check",
        groupKey: "programs",
        order: 31,
        featureKey: "drills",
        requiredPermission: "drills.viewAny",
        crud: "full",
        formFields: drillFields,
        emptyState: {
          title: "No drills yet",
          description: "Build a library of drills coaches can plug into training sessions.",
          actionLabel: "New drill",
        },
        // Filter chips = the three `level` buckets. Head coaches
        // planning a mixed session filter for drills within a
        // target skill range.
        filterChips: [
          {
            id: "beginner",
            label: "Beginner",
            filter: { field: "level", operator: "eq", value: "beginner" },
            color: "success",
          },
          {
            id: "intermediate",
            label: "Intermediate",
            filter: { field: "level", operator: "eq", value: "intermediate" },
            color: "warning",
          },
          {
            id: "advanced",
            label: "Advanced",
            filter: { field: "level", operator: "eq", value: "advanced" },
            color: "danger",
          },
        ],
        // Drills are recalled by title or sport when coaches
        // browse the library planning a session.
        searchFields: ["name", "sport"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/drills", tier: "protected" },
    { element: createElement(ShowPage), path: "/drills/:id", tier: "protected" },
  ],
};

export default drillsModule;

import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { trainingSessionFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const trainingModule: AppModule = {
  name: "training",
  resources: [
    {
      name: "training-sessions",
      list: "/training-sessions",
      show: "/training-sessions/:id",
      meta: {
        label: "Training",
        singularLabel: "Training session",
        // `target-dart` reads as "focused practice" — the closest
        // Gravity UI icon for a training/drill session. `dumbbell`
        // is not in the bundled Gravity UI icon set.
        icon: "target-dart",
        groupKey: "programs",
        order: 21,
        featureKey: "training",
        requiredPermission: "training-sessions.viewAny",
        scopes: ["branch", "season"],
        crud: "full",
        formFields: trainingSessionFields,
        emptyState: {
          title: "No training sessions yet",
          description: "Schedule team practices to track attendance and drill assignments.",
          actionLabel: "New session",
        },
        // Saved views: rolling "this week" window (coach's daily
        // driver) vs. all-time (the reporting archive). The
        // rolling filter is computed at render so the window
        // slides with the calendar week.
        savedViews: [
          {
            id: "this-week",
            label: "This week",
            filters: [
              {
                field: "date",
                operator: "gte",
                value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            isDefault: true,
          },
          { id: "all", label: "All" },
        ],
        // Filter chips = intensity buckets. The fixture doesn't
        // carry an explicit `intensity` column so we `contains`-match
        // vocabulary the session titles converge on — chips still
        // work once tenants populate a real `intensity` field.
        filterChips: [
          {
            id: "light",
            label: "Light",
            filter: { field: "name", operator: "contains", value: "recovery" },
            color: "accent",
          },
          {
            id: "moderate",
            label: "Moderate",
            filter: { field: "name", operator: "contains", value: "skills" },
            color: "warning",
          },
          {
            id: "heavy",
            label: "Heavy",
            filter: { field: "name", operator: "contains", value: "match play" },
            color: "danger",
          },
        ],
        // Sessions are usually recalled by team / coach / venue.
        // Coaches type the squad name first ("Swim Squad A"), then
        // the venue when the calendar is dense.
        searchFields: ["name", "team", "coach", "venue", "sport"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/training-sessions", tier: "protected" },
    { element: createElement(ShowPage), path: "/training-sessions/:id", tier: "protected" },
  ],
};

export default trainingModule;

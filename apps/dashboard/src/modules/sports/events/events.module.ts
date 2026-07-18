import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { eventFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const eventsModule: AppModule = {
  name: "events",
  resources: [
    {
      name: "events",
      list: "/events",
      show: "/events/:id",
      meta: {
        label: "Events",
        singularLabel: "Event",
        // `flag` — events are milestone / marquee dates; the
        // `calendar-check` token isn't in the Gravity UI set.
        icon: "flag",
        groupKey: "schedule",
        order: 14,
        featureKey: "events",
        requiredPermission: "events.viewAny",
        scopes: ["branch", "season"],
        shortcuts: { navigate: "G E", create: "N E" },
        crud: "full",
        formFields: eventFields,
        emptyState: {
          title: "No events yet",
          description: "Schedule tournaments, friendlies, and showcases here.",
          actionLabel: "New event",
        },
        // Chips = event `type` options from the schema, letting coaches
        // narrow the calendar to just the surfaces they run.
        filterChips: [
          {
            id: "tournament",
            label: "Tournament",
            filter: { field: "type", operator: "eq", value: "tournament" },
            color: "accent",
          },
          {
            id: "training",
            label: "Training",
            filter: { field: "type", operator: "eq", value: "training" },
            color: "accent",
          },
          {
            id: "friendly",
            label: "Friendly",
            filter: { field: "type", operator: "eq", value: "friendly" },
            color: "success",
          },
          {
            id: "showcase",
            label: "Showcase",
            filter: { field: "type", operator: "eq", value: "showcase" },
            color: "warning",
          },
        ],
        // Events are usually recalled by name or location — both
        // hit one search.
        searchFields: ["name", "location", "team"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/events", tier: "protected" },
    { element: createElement(ShowPage), path: "/events/:id", tier: "protected" },
  ],
};

export default eventsModule;

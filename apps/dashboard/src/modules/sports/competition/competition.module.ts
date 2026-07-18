import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { competitionFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const competitionModule: AppModule = {
  name: "competition",
  resources: [
    {
      name: "competitions",
      list: "/competitions",
      show: "/competitions/:id",
      meta: {
        label: "Competitions",
        singularLabel: "Competition",
        // `medal` — championships / competitive rankings; `trophy`
        // is not in the Gravity UI icon set.
        icon: "medal",
        groupKey: "programs",
        order: 32,
        featureKey: "competitions",
        requiredPermission: "competitions.viewAny",
        crud: "full",
        formFields: competitionFields,
        emptyState: {
          title: "No competitions yet",
          description: "Plan tournaments, leagues, and multi-fixture events.",
          actionLabel: "New competition",
        },
        // Filter chips = the four `format` buckets.
        filterChips: [
          {
            id: "knockout",
            label: "Knockout",
            filter: { field: "format", operator: "eq", value: "knockout" },
            color: "accent",
          },
          {
            id: "league",
            label: "League",
            filter: { field: "format", operator: "eq", value: "league" },
            color: "accent",
          },
          {
            id: "round-robin",
            label: "Round-robin",
            filter: { field: "format", operator: "eq", value: "round-robin" },
            color: "accent",
          },
          {
            id: "showcase",
            label: "Showcase",
            filter: { field: "format", operator: "eq", value: "showcase" },
            color: "warning",
          },
        ],
        // Competitions are recalled by their name — the fixture
        // doesn't carry a second free-text axis worth searching.
        searchFields: ["name"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/competitions", tier: "protected" },
    { element: createElement(ShowPage), path: "/competitions/:id", tier: "protected" },
  ],
};

export default competitionModule;

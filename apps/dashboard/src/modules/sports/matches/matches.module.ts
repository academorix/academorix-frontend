import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { matchFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const matchesModule: AppModule = {
  name: "matches",
  resources: [
    {
      name: "matches",
      list: "/matches",
      show: "/matches/:id",
      meta: {
        label: "Matches",
        singularLabel: "Match",
        // `medal` — matches are competitive events; `trophy` is not
        // in the Gravity UI icon set.
        icon: "medal",
        groupKey: "schedule",
        order: 22,
        featureKey: "matches",
        requiredPermission: "matches.viewAny",
        scopes: ["branch", "season"],
        shortcuts: { navigate: "G M", create: "N M" },
        crud: "full",
        formFields: matchFields,
        emptyState: {
          title: "No matches yet",
          description: "Log fixtures against other clubs or internal squads.",
          actionLabel: "New match",
        },
        // Saved views: scheduled (upcoming fixtures on the wallboard)
        // vs. played (historical results feeding league tables).
        savedViews: [
          {
            id: "upcoming",
            label: "Upcoming",
            filters: [{ field: "status.text", operator: "eq", value: "Scheduled" }],
            isDefault: true,
          },
          {
            id: "past",
            label: "Past",
            filters: [{ field: "status.text", operator: "ne", value: "Scheduled" }],
          },
        ],
        // Filter chips = match result buckets. Coaches use these
        // when reviewing form; `Scheduled` is future fixtures,
        // Win/Loss/Draw is post-match.
        filterChips: [
          {
            id: "win",
            label: "Win",
            filter: { field: "status.text", operator: "eq", value: "Win" },
            color: "success",
          },
          {
            id: "loss",
            label: "Loss",
            filter: { field: "status.text", operator: "eq", value: "Loss" },
            color: "danger",
          },
          {
            id: "draw",
            label: "Draw",
            filter: { field: "status.text", operator: "eq", value: "Draw" },
            color: "warning",
          },
        ],
        // Match lookup by name / opponent team / venue — the three
        // axes a director recalls between a phone call and the
        // fixture card.
        searchFields: ["name", "homeTeam", "awayTeam", "venue", "sport"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/matches", tier: "protected" },
    { element: createElement(ShowPage), path: "/matches/:id", tier: "protected" },
  ],
};

export default matchesModule;

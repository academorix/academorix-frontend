import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { privateSessionFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const sessionsModule: AppModule = {
  name: "sessions",
  resources: [
    {
      name: "private-sessions",
      list: "/private-sessions",
      show: "/private-sessions/:id",
      meta: {
        label: "Private sessions",
        singularLabel: "Private session",
        // `lock` — private sessions are 1:1 / restricted; no
        // `person-lock` in the Gravity UI set.
        icon: "lock",
        groupKey: "schedule",
        order: 23,
        featureKey: "private-sessions",
        requiredPermission: "private-sessions.viewAny",
        scopes: ["branch", "season"],
        shortcuts: { navigate: "G S", create: "N S" },
        crud: "full",
        formFields: privateSessionFields,
        emptyState: {
          title: "No private sessions yet",
          description: "Book 1-1 coaching for individual athletes.",
          actionLabel: "New session",
        },
        // Saved views: upcoming bookings (what coaches want on the
        // schedule) vs. completed history (what accounting reports on).
        savedViews: [
          {
            id: "upcoming",
            label: "Upcoming",
            filters: [{ field: "status.text", operator: "eq", value: "Confirmed" }],
            isDefault: true,
          },
          {
            id: "completed",
            label: "Completed",
            filters: [{ field: "status.text", operator: "eq", value: "Completed" }],
          },
        ],
        // Filter chips = format buckets. `1:1` is the classic
        // private session; `Pair` covers partner training; `Group`
        // is small-group work. `contains`-matched on the session
        // title until the schema carries an explicit `format`
        // column.
        filterChips: [
          {
            id: "one-to-one",
            label: "1:1",
            filter: { field: "name", operator: "contains", value: "1:1" },
            color: "accent",
          },
          {
            id: "pair",
            label: "Pair",
            filter: { field: "name", operator: "contains", value: "Pair" },
            color: "accent",
          },
          {
            id: "group",
            label: "Group",
            filter: { field: "name", operator: "contains", value: "Group" },
            color: "success",
          },
        ],
        // Private sessions are recalled by athlete or coach — often
        // by neither on their own. Add the session title so a
        // matches-my-vibe search still lands.
        searchFields: ["name", "coach", "athlete", "venue", "sport"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/private-sessions", tier: "protected" },
    { element: createElement(ShowPage), path: "/private-sessions/:id", tier: "protected" },
  ],
};

export default sessionsModule;

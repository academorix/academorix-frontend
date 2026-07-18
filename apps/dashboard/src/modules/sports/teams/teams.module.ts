import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { teamFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const teamsModule: AppModule = {
  name: "teams",
  resources: [
    {
      name: "teams",
      list: "/teams",
      show: "/teams/:id",
      meta: {
        label: "Teams",
        singularLabel: "Team",
        // `persons` — the Gravity UI plural-people token. `people`
        // doesn't exist as a token.
        icon: "persons",
        groupKey: "people",
        order: 11,
        featureKey: "teams",
        requiredPermission: "teams.viewAny",
        scopes: ["branch", "season"],
        shortcuts: { navigate: "G T", create: "N T" },
        description: "Manage teams, coaching staff, and roster composition.",
        crud: "full",
        formFields: teamFields,
        emptyState: {
          title: "No teams yet",
          description:
            "Create your first team to start rostering athletes and scheduling sessions.",
          actionLabel: "New team",
        },
        // Saved views: teams currently rostered vs. archived
        // squads. Directors typically stay on Active during a
        // season and flip to Inactive for the year-end review.
        savedViews: [
          {
            id: "active",
            label: "Active",
            filters: [{ field: "isActive", operator: "eq", value: true }],
            isDefault: true,
          },
          {
            id: "inactive",
            label: "Inactive",
            filters: [{ field: "isActive", operator: "eq", value: false }],
          },
        ],
        // Filter chips = age group + sport. Two axes matches the
        // real-world way coaches think about rosters ("U12 Soccer",
        // "Senior Swimming"); leaving them independent means a
        // coach can pick one, the other, or both.
        filterChips: [
          {
            id: "u10",
            label: "U10",
            filter: { field: "ageGroup", operator: "eq", value: "U10" },
            color: "accent",
          },
          {
            id: "u12",
            label: "U12",
            filter: { field: "ageGroup", operator: "eq", value: "U12" },
            color: "accent",
          },
          {
            id: "u14",
            label: "U14",
            filter: { field: "ageGroup", operator: "eq", value: "U14" },
            color: "accent",
          },
          {
            id: "u16",
            label: "U16",
            filter: { field: "ageGroup", operator: "eq", value: "U16" },
            color: "accent",
          },
          {
            id: "swimming",
            label: "Swimming",
            filter: { field: "sport", operator: "eq", value: "Swimming" },
            color: "success",
          },
          {
            id: "soccer",
            label: "Soccer",
            filter: { field: "sport", operator: "eq", value: "Soccer" },
            color: "success",
          },
          {
            id: "gymnastics",
            label: "Gymnastics",
            filter: { field: "sport", operator: "eq", value: "Gymnastics" },
            color: "success",
          },
          {
            id: "tennis",
            label: "Tennis",
            filter: { field: "sport", operator: "eq", value: "Tennis" },
            color: "success",
          },
        ],
        // Teams are almost always looked up by their name (`Swim
        // Squad A`); sport + coach + branch fall in for fuzzy
        // recall.
        searchFields: ["name", "sport", "coach", "branch"],
        relatedRecords: [
          {
            id: "sessions",
            label: "Recent sessions",
            resource: "training-sessions",
            foreignKey: "team",
            limit: 5,
          },
          {
            id: "matches",
            label: "Recent matches",
            resource: "matches",
            foreignKey: "homeTeam",
            limit: 5,
          },
        ],
        bulkActions: [
          { id: "assign-coach", intent: "custom", label: "Assign coach", icon: "person" },
          { id: "move-season", intent: "custom", label: "Move to season", icon: "calendar" },
        ],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/teams", tier: "protected" },
    { element: createElement(ShowPage), path: "/teams/:id", tier: "protected" },
  ],
};

export default teamsModule;

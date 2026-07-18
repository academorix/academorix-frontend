import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { personFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const usersModule: AppModule = {
  name: "users",
  resources: [
    {
      name: "users",
      list: "/users",
      show: "/users/:id",
      meta: {
        label: "Users",
        singularLabel: "User",
        icon: "person",
        groupKey: "administration",
        order: 41,
        featureKey: "users",
        requiredPermission: "users.viewAny",
        crud: "full",
        formFields: personFields,
        emptyState: {
          title: "No users yet",
          description: "Invite everyone who logs into the dashboard.",
          actionLabel: "New user",
        },
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
        // Filter chips = gender + activity, matching the two select
        // dimensions on the schema. Same shape as the athletes list
        // so ops staff feel at home switching between people surfaces.
        filterChips: [
          {
            id: "female",
            label: "Female",
            filter: { field: "gender", operator: "eq", value: "female" },
            color: "accent",
          },
          {
            id: "male",
            label: "Male",
            filter: { field: "gender", operator: "eq", value: "male" },
            color: "accent",
          },
        ],
        // Users are looked up by name or email — matches the
        // athletes / staff / coaches pattern so ops recall is
        // portable across every person-shaped resource.
        searchFields: ["fullName", "email"],
        // Virtualised because tenant admins routinely maintain 1 k+
        // user rosters and the DataGrid is otherwise DOM-heavy.
        virtualized: true,
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/users", tier: "protected" },
    { element: createElement(ShowPage), path: "/users/:id", tier: "protected" },
  ],
};

export default usersModule;

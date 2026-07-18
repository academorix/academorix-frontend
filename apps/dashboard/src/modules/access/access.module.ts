import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const accessModule: AppModule = {
  name: "access",
  resources: [
    {
      name: "roles",
      list: "/roles",
      show: "/roles/:id",
      meta: {
        label: "Roles",
        singularLabel: "Role",
        icon: "lock",
        groupKey: "administration",
        order: 42,
        featureKey: "access",
        requiredPermission: "roles.viewAny",
        crud: "read-only",
        emptyState: {
          title: "No roles defined",
          description: "Roles are managed by the platform team; contact support for changes.",
        },
        // no filterChips: single-purpose resource — roles are the
        // permission axis. Look-up is by role name.
        searchFields: ["name"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/roles", tier: "protected" },
    { element: createElement(ShowPage), path: "/roles/:id", tier: "protected" },
  ],
};

export default accessModule;

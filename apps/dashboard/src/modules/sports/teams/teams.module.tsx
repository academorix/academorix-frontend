/**
 * @file teams.module.tsx
 * @module modules/sports/teams
 *
 * @description
 * The Teams module — squads/classes at a branch for a season. Full CRUD, scoped
 * by the active branch + season (the list reflects the switchers). The detail
 * view shows the team roster.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.2 "Teams (roster & staffing)"
 */

import { UserGroupIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const TeamListPage = lazy(() => import("@/modules/sports/teams/pages/list"));
const TeamCreatePage = lazy(() => import("@/modules/sports/teams/pages/create"));
const TeamEditPage = lazy(() => import("@/modules/sports/teams/pages/edit"));
const TeamShowPage = lazy(() => import("@/modules/sports/teams/pages/show"));

/** The Teams feature module. */
const teamsModule: AppModule = {
  name: "teams",
  resources: [
    {
      name: "teams",
      list: "/teams",
      create: "/teams/create",
      edit: "/teams/:id/edit",
      show: "/teams/:id",
      meta: {
        label: "Teams",
        icon: UserGroupIcon,
        featureKey: "teams",
        requiredPermission: "teams.viewAny",
        order: 11,
        scopedBy: ["branch", "season"],
        groupKey: "operations",
        shortcuts: {
          navigate: "G T",
          create: "N T",
        },
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/teams", element: createElement(TeamListPage) },
    { tier: "protected", path: "/teams/create", element: createElement(TeamCreatePage) },
    { tier: "protected", path: "/teams/:id/edit", element: createElement(TeamEditPage) },
    { tier: "protected", path: "/teams/:id", element: createElement(TeamShowPage) },
  ],
};

export default teamsModule;

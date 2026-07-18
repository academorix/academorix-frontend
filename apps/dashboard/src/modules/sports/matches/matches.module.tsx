/**
 * @file matches.module.tsx
 * @module modules/sports/matches
 *
 * @description
 * The Matches module — competitive fixtures for a team, scoped by the active
 * branch + season. Full CRUD; the list surfaces kick-off, status, and result,
 * and the detail view shows the fixture card.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.3 "Matches"
 */

import { TrophyIcon } from "@stackra/ui/icons/heroicon/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const MatchListPage = lazy(() => import("@/modules/sports/matches/pages/list"));
const MatchCreatePage = lazy(() => import("@/modules/sports/matches/pages/create"));
const MatchEditPage = lazy(() => import("@/modules/sports/matches/pages/edit"));
const MatchShowPage = lazy(() => import("@/modules/sports/matches/pages/show"));

/** The Matches feature module. */
const matchesModule: AppModule = {
  name: "matches",
  resources: [
    {
      name: "matches",
      list: "/matches",
      create: "/matches/create",
      edit: "/matches/:id/edit",
      show: "/matches/:id",
      meta: {
        label: "Matches",
        icon: TrophyIcon,
        featureKey: "matches",
        requiredPermission: "matches.viewAny",
        order: 22,
        scopedBy: ["branch", "season"],
        groupKey: "operations",
        shortcuts: {
          navigate: "G M",
          create: "N M",
        },
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/matches", element: createElement(MatchListPage) },
    { tier: "protected", path: "/matches/create", element: createElement(MatchCreatePage) },
    { tier: "protected", path: "/matches/:id/edit", element: createElement(MatchEditPage) },
    { tier: "protected", path: "/matches/:id", element: createElement(MatchShowPage) },
  ],
};

export default matchesModule;

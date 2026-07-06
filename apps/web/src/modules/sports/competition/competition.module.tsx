/**
 * @file competition.module.tsx
 * @module modules/sports/competition
 *
 * @description
 * The Competition module — leagues, cups, and friendly series a tenant's teams
 * compete in, with a standings table on the detail screen. Full CRUD.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.6 "Competitions & Standings"
 */

import { TrophyIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const CompetitionListPage = lazy(() => import("@/modules/sports/competition/pages/list"));
const CompetitionCreatePage = lazy(() => import("@/modules/sports/competition/pages/create"));
const CompetitionEditPage = lazy(() => import("@/modules/sports/competition/pages/edit"));
const CompetitionShowPage = lazy(() => import("@/modules/sports/competition/pages/show"));

/** The Competition feature module. */
const competitionModule: AppModule = {
  name: "competitions",
  resources: [
    {
      name: "competitions",
      list: "/competitions",
      create: "/competitions/create",
      edit: "/competitions/:id/edit",
      show: "/competitions/:id",
      meta: {
        label: "Competitions",
        icon: TrophyIcon,
        featureKey: "competitions",
        requiredPermission: "competitions.viewAny",
        order: 32,
        groupKey: "operations",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/competitions", element: createElement(CompetitionListPage) },
    {
      tier: "protected",
      path: "/competitions/create",
      element: createElement(CompetitionCreatePage),
    },
    {
      tier: "protected",
      path: "/competitions/:id/edit",
      element: createElement(CompetitionEditPage),
    },
    { tier: "protected", path: "/competitions/:id", element: createElement(CompetitionShowPage) },
  ],
};

export default competitionModule;

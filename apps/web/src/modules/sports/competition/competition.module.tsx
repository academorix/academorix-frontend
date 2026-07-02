/**
 * @file competition.module.tsx
 * @module modules/sports/competition
 *
 * @description
 * The Competition module — leagues, cups, and friendly series a tenant's teams
 * compete in, with a standings table on the detail screen. List + detail.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.6 "Competitions & Standings"
 */

import { TrophyIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const CompetitionListPage = lazy(() => import("@/modules/sports/competition/pages/list"));
const CompetitionShowPage = lazy(() => import("@/modules/sports/competition/pages/show"));

/** The Competition feature module. */
const competitionModule: AppModule = {
  name: "competitions",
  resources: [
    {
      name: "competitions",
      list: "/competitions",
      show: "/competitions/:id",
      meta: {
        label: "Competitions",
        icon: TrophyIcon,
        featureKey: "competitions",
        requiredPermission: "competitions.viewAny",
        order: 32,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/competitions", element: createElement(CompetitionListPage) },
    { tier: "protected", path: "/competitions/:id", element: createElement(CompetitionShowPage) },
  ],
};

export default competitionModule;

/**
 * @file seasons.module.tsx
 * @module modules/sports/seasons
 *
 * @description
 * The Seasons module — the tenant's registration/competition periods. Full CRUD.
 * Seasons are a **scope dimension** (the season switcher reads them from
 * `/auth/me`); the management list here is tenant-wide (not scope-filtered) so
 * every season is visible regardless of the active season.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §11.3 "Seasons & Registration"
 */

import { CalendarDaysIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const SeasonListPage = lazy(() => import("@/modules/sports/seasons/pages/list"));
const SeasonCreatePage = lazy(() => import("@/modules/sports/seasons/pages/create"));
const SeasonEditPage = lazy(() => import("@/modules/sports/seasons/pages/edit"));
const SeasonShowPage = lazy(() => import("@/modules/sports/seasons/pages/show"));

/** The Seasons feature module. */
const seasonsModule: AppModule = {
  name: "seasons",
  resources: [
    {
      name: "seasons",
      list: "/seasons",
      create: "/seasons/create",
      edit: "/seasons/:id/edit",
      show: "/seasons/:id",
      meta: {
        label: "Seasons",
        icon: CalendarDaysIcon,
        featureKey: "seasons",
        requiredPermission: "seasons.viewAny",
        order: 12,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/seasons", element: createElement(SeasonListPage) },
    { tier: "protected", path: "/seasons/create", element: createElement(SeasonCreatePage) },
    { tier: "protected", path: "/seasons/:id/edit", element: createElement(SeasonEditPage) },
    { tier: "protected", path: "/seasons/:id", element: createElement(SeasonShowPage) },
  ],
};

export default seasonsModule;

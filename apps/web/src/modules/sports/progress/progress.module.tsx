/**
 * @file progress.module.tsx
 * @module modules/sports/progress
 *
 * @description
 * The Progress module — athlete skill cards and grading assessments. List +
 * detail; the card's sport-variable ratings are rendered via SDUI (attribute set
 * selected by `sport_key`).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.1 "Progress & Skill Cards"
 */

import { ChartBarIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ProgressListPage = lazy(() => import("@/modules/sports/progress/pages/list"));
const ProgressShowPage = lazy(() => import("@/modules/sports/progress/pages/show"));

/** The Progress feature module. */
const progressModule: AppModule = {
  name: "progress",
  resources: [
    {
      name: "progress",
      list: "/progress",
      show: "/progress/:id",
      meta: {
        label: "Progress",
        icon: ChartBarIcon,
        featureKey: "progress",
        requiredPermission: "progress.viewAny",
        order: 26,
        groupKey: "operations",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/progress", element: createElement(ProgressListPage) },
    { tier: "protected", path: "/progress/:id", element: createElement(ProgressShowPage) },
  ],
};

export default progressModule;

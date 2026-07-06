/**
 * @file drills.module.tsx
 * @module modules/sports/drills
 *
 * @description
 * The Drill Library module — the reusable curriculum of drills tagged by sport,
 * skill level, and target skills. Full CRUD.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.5 "Drill Library & Curriculum"
 */

import { RectangleStackIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const DrillsListPage = lazy(() => import("@/modules/sports/drills/pages/list"));
const DrillsCreatePage = lazy(() => import("@/modules/sports/drills/pages/create"));
const DrillsEditPage = lazy(() => import("@/modules/sports/drills/pages/edit"));
const DrillsShowPage = lazy(() => import("@/modules/sports/drills/pages/show"));

/** The Drill Library feature module. */
const drillsModule: AppModule = {
  name: "drills",
  resources: [
    {
      name: "drills",
      list: "/drills",
      create: "/drills/create",
      edit: "/drills/:id/edit",
      show: "/drills/:id",
      meta: {
        label: "Drill Library",
        icon: RectangleStackIcon,
        featureKey: "drills",
        requiredPermission: "drills.viewAny",
        order: 31,
        groupKey: "operations",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/drills", element: createElement(DrillsListPage) },
    { tier: "protected", path: "/drills/create", element: createElement(DrillsCreatePage) },
    { tier: "protected", path: "/drills/:id/edit", element: createElement(DrillsEditPage) },
    { tier: "protected", path: "/drills/:id", element: createElement(DrillsShowPage) },
  ],
};

export default drillsModule;

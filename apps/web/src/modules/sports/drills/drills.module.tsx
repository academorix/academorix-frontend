/**
 * @file drills.module.tsx
 * @module modules/sports/drills
 *
 * @description
 * The Drill Library module — the reusable curriculum of drills tagged by sport,
 * skill level, and target skills. List + detail (read surfaces for the demo;
 * authoring lands with the write API).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.5 "Drill Library & Curriculum"
 */

import { RectangleStackIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const DrillsListPage = lazy(() => import("@/modules/sports/drills/pages/list"));
const DrillsShowPage = lazy(() => import("@/modules/sports/drills/pages/show"));

/** The Drill Library feature module. */
const drillsModule: AppModule = {
  name: "drills",
  resources: [
    {
      name: "drills",
      list: "/drills",
      show: "/drills/:id",
      meta: {
        label: "Drill Library",
        icon: RectangleStackIcon,
        featureKey: "drills",
        requiredPermission: "drills.viewAny",
        order: 31,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/drills", element: createElement(DrillsListPage) },
    { tier: "protected", path: "/drills/:id", element: createElement(DrillsShowPage) },
  ],
};

export default drillsModule;

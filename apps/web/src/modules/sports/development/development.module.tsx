/**
 * @file development.module.tsx
 * @module modules/sports/development
 *
 * @description
 * The Development module — individual development plans (IDPs) that track
 * coach-set athlete goals toward target dates. List + detail (read surfaces for
 * the demo; authoring lands with the write API).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.4 "Development Plans (IDPs)"
 */

import { MapIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const DevelopmentListPage = lazy(() => import("@/modules/sports/development/pages/list"));
const DevelopmentShowPage = lazy(() => import("@/modules/sports/development/pages/show"));

/** The Development feature module. */
const developmentModule: AppModule = {
  name: "development",
  resources: [
    {
      name: "development",
      list: "/development",
      show: "/development/:id",
      meta: {
        label: "Development",
        icon: MapIcon,
        featureKey: "development",
        requiredPermission: "development.viewAny",
        order: 30,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/development", element: createElement(DevelopmentListPage) },
    { tier: "protected", path: "/development/:id", element: createElement(DevelopmentShowPage) },
  ],
};

export default developmentModule;

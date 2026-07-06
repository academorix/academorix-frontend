/**
 * @file performance.module.tsx
 * @module modules/sports/performance
 *
 * @description
 * The Performance module — fitness/testing batteries for athletes. List + detail;
 * measured values are rendered via SDUI (attribute set selected by `sport_key`).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.2 "Performance & Fitness Testing"
 */

import { ArrowTrendingUpIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const PerformanceListPage = lazy(() => import("@/modules/sports/performance/pages/list"));
const PerformanceCreatePage = lazy(() => import("@/modules/sports/performance/pages/create"));
const PerformanceEditPage = lazy(() => import("@/modules/sports/performance/pages/edit"));
const PerformanceShowPage = lazy(() => import("@/modules/sports/performance/pages/show"));

/** The Performance feature module. */
const performanceModule: AppModule = {
  name: "performance",
  resources: [
    {
      name: "performance",
      list: "/performance",
      create: "/performance/create",
      edit: "/performance/:id/edit",
      show: "/performance/:id",
      meta: {
        label: "Performance",
        icon: ArrowTrendingUpIcon,
        featureKey: "performance",
        requiredPermission: "performance.viewAny",
        order: 28,
        groupKey: "operations",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/performance", element: createElement(PerformanceListPage) },
    {
      tier: "protected",
      path: "/performance/create",
      element: createElement(PerformanceCreatePage),
    },
    {
      tier: "protected",
      path: "/performance/:id/edit",
      element: createElement(PerformanceEditPage),
    },
    { tier: "protected", path: "/performance/:id", element: createElement(PerformanceShowPage) },
  ],
};

export default performanceModule;

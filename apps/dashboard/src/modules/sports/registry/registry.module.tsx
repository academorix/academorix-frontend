/**
 * @file registry.module.tsx
 * @module modules/sports/registry
 *
 * @description
 * The Sport Registry module — the agnostic core. Lists the platform sports and
 * whether the tenant has enabled each (the `tenant-sports` overlay), with a
 * detail view of a sport's scoring strategy, roster rules, and terminology.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §11.1 "Sport Registry"
 */

import { TrophyIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const SportListPage = lazy(() => import("@/modules/sports/registry/pages/list"));
const SportShowPage = lazy(() => import("@/modules/sports/registry/pages/show"));

/** The Sport Registry feature module. */
const registryModule: AppModule = {
  name: "sports",
  resources: [
    {
      name: "sports",
      list: "/sports",
      show: "/sports/:id",
      meta: {
        label: "Sports",
        icon: TrophyIcon,
        featureKey: "sports",
        requiredPermission: "sports.viewAny",
        order: 80,
        groupKey: "operations",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/sports", element: createElement(SportListPage) },
    { tier: "protected", path: "/sports/:id", element: createElement(SportShowPage) },
  ],
};

export default registryModule;

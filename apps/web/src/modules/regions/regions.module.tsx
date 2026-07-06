/**
 * @file regions.module.tsx
 * @module modules/regions
 *
 * @description
 * The Region module — the commercial/tax/locale contexts a branch bills under
 * (currency, countries, timezone, tax). Read-only management (list + detail);
 * regions are configured by platform admins.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.3 "Geo & Region"
 */

import { GlobeAltIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const RegionListPage = lazy(() => import("@/modules/regions/pages/list"));
const RegionShowPage = lazy(() => import("@/modules/regions/pages/show"));

/** The Region feature module. */
const regionsModule: AppModule = {
  name: "regions",
  resources: [
    {
      name: "regions",
      list: "/regions",
      show: "/regions/:id",
      meta: {
        label: "Regions",
        icon: GlobeAltIcon,
        featureKey: "regions",
        requiredPermission: "regions.viewAny",
        order: 92,
        groupKey: "administration",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/regions", element: createElement(RegionListPage) },
    { tier: "protected", path: "/regions/:id", element: createElement(RegionShowPage) },
  ],
};

export default regionsModule;

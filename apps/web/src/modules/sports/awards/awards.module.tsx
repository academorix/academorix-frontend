/**
 * @file awards.module.tsx
 * @module modules/sports/awards
 *
 * @description
 * The Awards module — certificates and recognitions granted to athletes. List +
 * detail (read surfaces for the demo; granting lands with the write API).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.7 "Awards & Certificates"
 */

import { StarIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const AwardsListPage = lazy(() => import("@/modules/sports/awards/pages/list"));
const AwardsShowPage = lazy(() => import("@/modules/sports/awards/pages/show"));

/** The Awards feature module. */
const awardsModule: AppModule = {
  name: "awards",
  resources: [
    {
      name: "awards",
      list: "/awards",
      show: "/awards/:id",
      meta: {
        label: "Awards",
        icon: StarIcon,
        featureKey: "awards",
        requiredPermission: "awards.viewAny",
        order: 35,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/awards", element: createElement(AwardsListPage) },
    { tier: "protected", path: "/awards/:id", element: createElement(AwardsShowPage) },
  ],
};

export default awardsModule;

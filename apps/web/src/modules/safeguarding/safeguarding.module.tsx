/**
 * @file safeguarding.module.tsx
 * @module modules/safeguarding
 *
 * @description
 * The Safeguarding module — welfare/child-protection case tracking. Sensitive
 * data: gated behind the `safeguarding` permission (designated leads/admins
 * only). List + detail.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.21 "Safeguarding & Welfare"
 */

import { ShieldCheckIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const SafeguardingListPage = lazy(() => import("@/modules/safeguarding/pages/list"));
const SafeguardingShowPage = lazy(() => import("@/modules/safeguarding/pages/show"));

/** The Safeguarding feature module. */
const safeguardingModule: AppModule = {
  name: "safeguarding",
  resources: [
    {
      name: "safeguarding",
      list: "/safeguarding",
      show: "/safeguarding/:id",
      meta: {
        label: "Safeguarding",
        icon: ShieldCheckIcon,
        featureKey: "safeguarding",
        requiredPermission: "safeguarding.viewAny",
        order: 34,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/safeguarding", element: createElement(SafeguardingListPage) },
    { tier: "protected", path: "/safeguarding/:id", element: createElement(SafeguardingShowPage) },
  ],
};

export default safeguardingModule;

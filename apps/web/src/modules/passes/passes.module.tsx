/**
 * @file passes.module.tsx
 * @module modules/passes
 *
 * @description
 * The Passes module — digital check-in passes (membership/event/day/trial) with
 * a scannable code. List + detail (read surfaces for the demo; issuing lands
 * with the write API).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.7 "Digital Passes & Check-in"
 */

import { TicketIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const PassesListPage = lazy(() => import("@/modules/passes/pages/list"));
const PassesShowPage = lazy(() => import("@/modules/passes/pages/show"));

/** The Passes feature module. */
const passesModule: AppModule = {
  name: "passes",
  resources: [
    {
      name: "passes",
      list: "/passes",
      show: "/passes/:id",
      meta: {
        label: "Passes",
        icon: TicketIcon,
        featureKey: "passes",
        requiredPermission: "passes.viewAny",
        order: 45,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/passes", element: createElement(PassesListPage) },
    { tier: "protected", path: "/passes/:id", element: createElement(PassesShowPage) },
  ],
};

export default passesModule;

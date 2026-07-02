/**
 * @file formations.module.tsx
 * @module modules/sports/formations
 *
 * @description
 * The Formations module — reusable tactical shapes plotted on a pitch. List +
 * detail (read-only tactics board for the demo; drag-to-edit authoring lands
 * with the write API).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.7 "Formations & Tactics"
 */

import { Squares2X2Icon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const FormationsListPage = lazy(() => import("@/modules/sports/formations/pages/list"));
const FormationsShowPage = lazy(() => import("@/modules/sports/formations/pages/show"));

/** The Formations feature module. */
const formationsModule: AppModule = {
  name: "formations",
  resources: [
    {
      name: "formations",
      list: "/formations",
      show: "/formations/:id",
      meta: {
        label: "Formations",
        icon: Squares2X2Icon,
        featureKey: "formations",
        requiredPermission: "formations.viewAny",
        order: 33,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/formations", element: createElement(FormationsListPage) },
    { tier: "protected", path: "/formations/:id", element: createElement(FormationsShowPage) },
  ],
};

export default formationsModule;

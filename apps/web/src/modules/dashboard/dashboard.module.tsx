/**
 * @file dashboard.module.tsx
 * @module modules/dashboard
 *
 * @description
 * Dashboard module manifest. Modelled as a resource (so it appears in the
 * sidebar uniformly) even though it's an overview surface, not a CRUD entity.
 */

import { Squares2X2Icon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { appRoutes } from "@/lib/module/routes";

const DashboardPage = lazy(() => import("@/modules/dashboard/pages/dashboard-page"));

const dashboardModule: AppModule = {
  name: "dashboard",
  resources: [
    {
      name: "dashboard",
      list: appRoutes.dashboard,
      meta: {
        label: "Dashboard",
        icon: Squares2X2Icon,
        featureKey: "dashboard",
        order: 0,
        shortcuts: {
          navigate: "G D",
        },
      },
    },
  ],
  routes: [{ tier: "protected", path: appRoutes.dashboard, element: createElement(DashboardPage) }],
};

export default dashboardModule;

/**
 * @file reports.module.tsx
 * @module modules/reports
 *
 * @description
 * The Reports module — a KPI dashboard aggregating headline metrics across the
 * tenant. Single dashboard surface (no per-record detail); numbers are computed
 * from existing resources today and will move to server-side aggregates later.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §17 "Reporting & Analytics"
 */

import { ChartBarIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ReportsDashboardPage = lazy(() => import("@/modules/reports/pages/list"));

/** The Reports feature module. */
const reportsModule: AppModule = {
  name: "reports",
  resources: [
    {
      name: "reports",
      list: "/reports",
      meta: {
        label: "Reports",
        icon: ChartBarIcon,
        featureKey: "reports",
        requiredPermission: "reports.viewAny",
        order: 50,
        shortcuts: {
          navigate: "G R",
        },
      },
    },
  ],
  routes: [{ tier: "protected", path: "/reports", element: createElement(ReportsDashboardPage) }],
};

export default reportsModule;

import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const reportsModule: AppModule = {
  name: "reports",
  resources: [
    {
      name: "reports",
      list: "/reports",
      show: "/reports/:id",
      meta: {
        label: "Reports",
        singularLabel: "Report",
        icon: "chart-bar",
        groupKey: "overview",
        order: 50,
        featureKey: "reports",
        requiredPermission: "reports.viewAny",
        shortcuts: { navigate: "G R" },
        crud: "read-only",
        emptyState: {
          title: "No reports yet",
          description:
            "Saved reports and scheduled exports show up here once someone builds one from a template or a saved view.",
        },
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/reports", tier: "protected" },
    { element: createElement(ShowPage), path: "/reports/:id", tier: "protected" },
  ],
};

export default reportsModule;

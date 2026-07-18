import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));

const entitlementsModule: AppModule = {
  name: "entitlements",
  resources: [
    {
      name: "entitlements",
      list: "/usage",
      meta: {
        label: "Usage & Entitlements",
        icon: "square-chart-bar",
        groupKey: "administration",
        order: 99,
        featureKey: "entitlements",
        requiredPermission: "view_billing",
        crud: "list-only",
      },
    },
  ],
  routes: [{ element: createElement(ListPage), path: "/usage", tier: "protected" }],
};

export default entitlementsModule;

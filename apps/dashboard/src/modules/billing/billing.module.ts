import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ExtraPage0 = lazy(() => import("./pages/extra-0"));

const billingModule: AppModule = {
  name: "billing",
  resources: [
    {
      name: "subscription",
      list: "/subscription",
      meta: {
        label: "Subscription",
        icon: "credit-card",
        groupKey: "finance",
        order: 98,
        featureKey: "billing",
        requiredPermission: "view_billing",
        crud: "list-only",
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/subscription", tier: "protected" },
    { element: createElement(ExtraPage0), path: "/plans", tier: "protected" },
  ],
};

export default billingModule;

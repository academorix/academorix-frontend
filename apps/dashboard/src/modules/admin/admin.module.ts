import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));

const adminModule: AppModule = {
  name: "admin",
  resources: [
    {
      name: "admin",
      list: "/admin",
      meta: {
        label: "Admin",
        icon: "nut-hex",
        groupKey: "administration",
        order: 99,
        featureKey: "admin",
        requiredPermission: "admin.view",
        crud: "list-only",
      },
    },
  ],
  routes: [{ element: createElement(ListPage), path: "/admin", tier: "protected" }],
};

export default adminModule;

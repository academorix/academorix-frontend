import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const organizationModule: AppModule = {
  name: "organization",
  resources: [
    {
      name: "organizations",
      list: "/organizations",
      show: "/organizations/:id",
      meta: {
        label: "Organizations",
        singularLabel: "Organization",
        icon: "geo",
        groupKey: "administration",
        order: 90,
        featureKey: "organization",
        requiredPermission: "organizations.viewAny",
        crud: "read-only",
        emptyState: {
          title: "No organizations",
          description: "Tenant organizations. Managed by platform admins.",
        },
        // no filterChips: single-purpose resource — organizations
        // decompose the tenant hierarchy itself; there's no
        // orthogonal axis to bucket them on.
        //
        // Search hits the organization name.
        searchFields: ["name"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/organizations", tier: "protected" },
    { element: createElement(ShowPage), path: "/organizations/:id", tier: "protected" },
  ],
};

export default organizationModule;

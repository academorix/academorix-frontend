import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const regionsModule: AppModule = {
  name: "regions",
  resources: [
    {
      name: "regions",
      list: "/regions",
      show: "/regions/:id",
      meta: {
        label: "Regions",
        singularLabel: "Region",
        icon: "diamond",
        groupKey: "administration",
        order: 92,
        featureKey: "regions",
        requiredPermission: "regions.viewAny",
        crud: "read-only",
        emptyState: {
          title: "No regions defined",
          description: "Geographic regions used for reporting and tenant segmentation.",
        },
        // no filterChips: single-purpose resource — regions are
        // themselves the axis every other filter chip decomposes
        // against, so a chip on regions would be a tautology.
        // Look-up is by name.
        searchFields: ["name"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/regions", tier: "protected" },
    { element: createElement(ShowPage), path: "/regions/:id", tier: "protected" },
  ],
};

export default regionsModule;

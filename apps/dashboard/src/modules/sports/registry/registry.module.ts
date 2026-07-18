import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const registryModule: AppModule = {
  name: "registry",
  resources: [
    {
      name: "sports",
      list: "/sports",
      show: "/sports/:id",
      meta: {
        label: "Sports",
        singularLabel: "Sport",
        icon: "circles-4-square",
        groupKey: "programs",
        order: 80,
        featureKey: "registry",
        requiredPermission: "sports.viewAny",
        crud: "read-only",
        emptyState: {
          title: "No sports configured",
          description: "The sport registry is seeded from platform defaults.",
        },
        // no filterChips: single-purpose resource — the sports
        // registry is the vocabulary every other resource
        // decomposes against. Look-up by sport name.
        searchFields: ["name"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/sports", tier: "protected" },
    { element: createElement(ShowPage), path: "/sports/:id", tier: "protected" },
  ],
};

export default registryModule;

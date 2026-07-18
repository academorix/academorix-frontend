import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const attributesModule: AppModule = {
  name: "attributes",
  resources: [
    {
      name: "attribute-sets",
      list: "/attribute-sets",
      show: "/attribute-sets/:id",
      meta: {
        label: "Attribute Sets",
        singularLabel: "Attribute set",
        icon: "sliders",
        groupKey: "administration",
        order: 94,
        featureKey: "attributes",
        requiredPermission: "attributes.viewAny",
        crud: "read-only",
        emptyState: {
          title: "No attribute sets",
          description: "Attribute sets drive SDUI fields. Configured by platform admins.",
        },
        // no filterChips: single-purpose resource — attribute
        // sets are the SDUI schema itself, no orthogonal axis
        // to bucket them on. Look-up by name.
        searchFields: ["name"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/attribute-sets", tier: "protected" },
    { element: createElement(ShowPage), path: "/attribute-sets/:id", tier: "protected" },
  ],
};

export default attributesModule;

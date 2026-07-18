import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { developmentFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const developmentModule: AppModule = {
  name: "development",
  resources: [
    {
      name: "development",
      list: "/development",
      show: "/development/:id",
      meta: {
        label: "Development",
        singularLabel: "IDP",
        icon: "target",
        groupKey: "records",
        order: 30,
        featureKey: "development",
        requiredPermission: "development.viewAny",
        crud: "full",
        formFields: developmentFields,
        emptyState: {
          title: "No IDPs yet",
          description: "Build Individual Development Plans for high-potential athletes.",
          actionLabel: "New plan",
        },
        // no filterChips: single-purpose resource — IDPs decompose
        // by athlete and by target date, both of which live better
        // as a report axis than a chip.
        //
        // IDPs are always looked up by athlete first, goal second.
        searchFields: ["athlete", "goal"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/development", tier: "protected" },
    { element: createElement(ShowPage), path: "/development/:id", tier: "protected" },
  ],
};

export default developmentModule;

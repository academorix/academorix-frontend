import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { formationFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const formationsModule: AppModule = {
  name: "formations",
  resources: [
    {
      name: "formations",
      list: "/formations",
      show: "/formations/:id",
      meta: {
        label: "Formations",
        singularLabel: "Formation",
        icon: "layout-list",
        groupKey: "programs",
        order: 33,
        featureKey: "formations",
        requiredPermission: "formations.viewAny",
        crud: "full",
        formFields: formationFields,
        emptyState: {
          title: "No formations yet",
          description: "Draft team formations for matches and set pieces.",
          actionLabel: "New formation",
        },
        // no filterChips: single-purpose resource — the formation
        // schema is name/sport/shape/notes and none of those
        // decompose into meaningful discrete buckets. Team-based
        // saved views could live here once formations are scoped
        // per team in a future revision.
        //
        // Formation names ("4-3-3 pressing") + shape ("4-3-3") +
        // sport are the recall axes coaches use.
        searchFields: ["name", "sport", "shape", "team"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/formations", tier: "protected" },
    { element: createElement(ShowPage), path: "/formations/:id", tier: "protected" },
  ],
};

export default formationsModule;

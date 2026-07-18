import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));

const receptionModule: AppModule = {
  name: "reception",
  resources: [
    {
      name: "approval-tasks",
      list: "/reception",
      meta: {
        label: "Reception",
        singularLabel: "Approval",
        icon: "square-check",
        groupKey: "people",
        order: 43,
        featureKey: "reception",
        requiredPermission: "reception.viewAny",
        scopes: ["branch"],
        crud: "list-only",
        emptyState: {
          title: "Reception queue empty",
          description: "Approvals awaiting reception staff show up here.",
        },
        // no filterChips: single-purpose resource — the reception
        // queue is a working list of pending approvals; every row
        // is already the same "needs action" state.
        searchFields: ["name"],
      },
    },
  ],
  routes: [{ element: createElement(ListPage), path: "/reception", tier: "protected" }],
};

export default receptionModule;

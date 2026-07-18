import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));

const offlineSyncModule: AppModule = {
  name: "offline-sync",
  resources: [
    {
      name: "offline-sync",
      list: "/offline",
      meta: {
        label: "Offline Sync",
        singularLabel: "Sync event",
        icon: "cloud",
        groupKey: "administration",
        order: 86,
        featureKey: "offline-sync",
        requiredPermission: "offline.view",
        crud: "list-only",
        emptyState: {
          title: "All caught up",
          description: "Devices in sync. Failed uploads and pending events appear here.",
        },
        // no filterChips: single-purpose resource — this queue is
        // itself a triage screen; every row is already an anomaly.
        searchFields: ["name"],
      },
    },
  ],
  routes: [{ element: createElement(ListPage), path: "/offline", tier: "protected" }],
};

export default offlineSyncModule;

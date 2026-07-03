/**
 * @file offline-sync.module.tsx
 * @module modules/offline-sync
 *
 * @description
 * The Offline & Sync module — surfaces the app's offline affordances and the
 * pending-sync queue. Single status surface (no per-record detail).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.5 "Attendance" (offline capture)
 */

import { ArrowPathIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const OfflineSyncPage = lazy(() => import("@/modules/offline-sync/pages/list"));

/** The Offline & Sync feature module. */
const offlineSyncModule: AppModule = {
  name: "offline-sync",
  resources: [
    {
      name: "offline-sync",
      list: "/offline",
      meta: {
        label: "Offline & Sync",
        icon: ArrowPathIcon,
        featureKey: "offline-sync",
        requiredPermission: "offline.view",
        order: 86,
      },
    },
  ],
  routes: [{ tier: "protected", path: "/offline", element: createElement(OfflineSyncPage) }],
};

export default offlineSyncModule;

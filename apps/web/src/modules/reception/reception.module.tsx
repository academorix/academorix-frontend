/**
 * @file reception.module.tsx
 * @module modules/reception
 *
 * @description
 * The Reception module — the front-desk approvals queue (registrations,
 * documents, refunds). A single queue surface, scoped by branch.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.20 "Reception & Front Desk"
 */

import { InboxStackIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ReceptionQueuePage = lazy(() => import("@/modules/reception/pages/list"));

/** The Reception feature module. */
const receptionModule: AppModule = {
  name: "reception",
  resources: [
    {
      name: "approval-tasks",
      list: "/reception",
      meta: {
        label: "Reception",
        icon: InboxStackIcon,
        featureKey: "reception",
        requiredPermission: "reception.viewAny",
        order: 43,
        scopedBy: ["branch"],
      },
    },
  ],
  routes: [{ tier: "protected", path: "/reception", element: createElement(ReceptionQueuePage) }],
};

export default receptionModule;

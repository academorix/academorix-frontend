/**
 * @file branches.module.tsx
 * @module modules/branches
 *
 * @description
 * Branches module manifest. Uses the shared coming-soon page until a bespoke
 * screen is built; the resource, permission gate, and mock fixture already exist.
 */

import { BuildingOffice2Icon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ComingSoonPage = lazy(() => import("@/components/coming-soon"));

const branchesModule: AppModule = {
  name: "branches",
  resources: [
    {
      name: "branches",
      list: "/branches",
      meta: {
        label: "Branches",
        icon: BuildingOffice2Icon,
        featureKey: "branches",
        requiredPermission: "branches.viewAny",
        order: 50,
      },
    },
  ],
  routes: [{ tier: "protected", path: "/branches", element: createElement(ComingSoonPage) }],
};

export default branchesModule;

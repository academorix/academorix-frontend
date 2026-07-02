/**
 * @file teams.module.tsx
 * @module modules/teams
 *
 * @description
 * Teams module manifest. Uses the shared coming-soon page until a bespoke
 * screen is built; the resource, permission gate, and mock fixture already exist.
 */

import { UserGroupIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ComingSoonPage = lazy(() => import("@/components/coming-soon"));

const teamsModule: AppModule = {
  name: "teams",
  resources: [
    {
      name: "teams",
      list: "/teams",
      meta: {
        label: "Teams",
        icon: UserGroupIcon,
        featureKey: "teams",
        requiredPermission: "teams.viewAny",
        order: 40,
      },
    },
  ],
  routes: [{ tier: "protected", path: "/teams", element: createElement(ComingSoonPage) }],
};

export default teamsModule;

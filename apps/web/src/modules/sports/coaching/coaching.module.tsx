/**
 * @file coaches.module.tsx
 * @module modules/coaches
 *
 * @description
 * Coaches module manifest. Uses the shared coming-soon page until a bespoke
 * screen is built; the resource, permission gate, and mock fixture already exist.
 */

import { UsersIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ComingSoonPage = lazy(() => import("@/components/coming-soon"));

const coachesModule: AppModule = {
  name: "coaches",
  resources: [
    {
      name: "coaches",
      list: "/coaches",
      meta: {
        label: "Coaches",
        icon: UsersIcon,
        featureKey: "coaches",
        requiredPermission: "coaches.viewAny",
        order: 20,
      },
    },
  ],
  routes: [{ tier: "protected", path: "/coaches", element: createElement(ComingSoonPage) }],
};

export default coachesModule;

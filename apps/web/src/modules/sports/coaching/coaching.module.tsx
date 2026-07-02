/**
 * @file coaching.module.tsx
 * @module modules/sports/coaching
 *
 * @description
 * The Coaching module — a view over Staff surfacing coach→team assignments per
 * season. List + detail, scoped by branch + season. The `coaches` resource is
 * backed by coaching-assignment records.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.3 "Coaching"
 */

import { UserIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const CoachingListPage = lazy(() => import("@/modules/sports/coaching/pages/list"));
const CoachingShowPage = lazy(() => import("@/modules/sports/coaching/pages/show"));

/** The Coaching feature module. */
const coachingModule: AppModule = {
  name: "coaching",
  resources: [
    {
      name: "coaches",
      list: "/coaches",
      show: "/coaches/:id",
      meta: {
        label: "Coaching",
        icon: UserIcon,
        featureKey: "coaches",
        requiredPermission: "coaches.viewAny",
        order: 16,
        scopedBy: ["branch", "season"],
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/coaches", element: createElement(CoachingListPage) },
    { tier: "protected", path: "/coaches/:id", element: createElement(CoachingShowPage) },
  ],
};

export default coachingModule;

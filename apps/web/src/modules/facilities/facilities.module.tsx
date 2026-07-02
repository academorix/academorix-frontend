/**
 * @file facilities.module.tsx
 * @module modules/facilities
 *
 * @description
 * The Facilities module manifest — bookable venues/resources (pitches, pools,
 * courts). Feature-flagged; registered as a placeholder (nav entry + coming-soon)
 * until its wave, scoped by branch.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.6 "Facility & Resource Booking"
 */

import { Squares2X2Icon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ComingSoonPage = lazy(() => import("@/components/coming-soon"));

/** The Facilities feature module (placeholder, feature-flagged). */
const facilitiesModule: AppModule = {
  name: "facilities",
  resources: [
    {
      name: "facilities",
      list: "/facilities",
      meta: {
        label: "Facilities",
        icon: Squares2X2Icon,
        featureKey: "facilities",
        requiredPermission: "facilities.viewAny",
        order: 15,
        scopedBy: ["branch"],
      },
    },
  ],
  routes: [{ tier: "protected", path: "/facilities", element: createElement(ComingSoonPage) }],
};

export default facilitiesModule;

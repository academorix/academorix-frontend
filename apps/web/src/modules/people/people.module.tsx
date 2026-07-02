/**
 * @file people.module.tsx
 * @module modules/people
 *
 * @description
 * The People module manifest — the cross-tenant global identity (the Academorix
 * ID) linking a person's profiles across academies. Registered as a placeholder
 * (nav entry + coming-soon) until its wave.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.17 "People & Global Identity"
 */

import { IdentificationIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ComingSoonPage = lazy(() => import("@/components/coming-soon"));

/** The People feature module (placeholder). */
const peopleModule: AppModule = {
  name: "people",
  resources: [
    {
      name: "people",
      list: "/people",
      meta: {
        label: "People",
        icon: IdentificationIcon,
        featureKey: "people",
        requiredPermission: "people.viewAny",
        order: 45,
      },
    },
  ],
  routes: [{ tier: "protected", path: "/people", element: createElement(ComingSoonPage) }],
};

export default peopleModule;

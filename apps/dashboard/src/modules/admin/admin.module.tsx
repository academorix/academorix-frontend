/**
 * @file admin.module.tsx
 * @module modules/admin
 *
 * @description
 * The Admin Console module manifest — tenant-wide administration and platform
 * settings. Registered as a placeholder (nav entry + coming-soon) until its wave.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.4 "Admin & Platform Console"
 */

import { Cog6ToothIcon } from "@stackra/ui/icons/heroicon/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ComingSoonPage = lazy(() => import("@/components/coming-soon"));

/** The Admin Console feature module (placeholder). */
const adminModule: AppModule = {
  name: "admin",
  resources: [
    {
      name: "admin",
      list: "/admin",
      meta: {
        label: "Admin Console",
        icon: Cog6ToothIcon,
        featureKey: "admin",
        requiredPermission: "admin.view",
        order: 99,
        groupKey: "administration",
      },
    },
  ],
  routes: [{ tier: "protected", path: "/admin", element: createElement(ComingSoonPage) }],
};

export default adminModule;

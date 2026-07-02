/**
 * @file medical.module.tsx
 * @module modules/sports/medical
 *
 * @description
 * The Medical module — clearance and injury records for athletes. Sensitive
 * data: gated behind the `medical` permission (only medical/admin roles see it).
 * List + detail.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.3 "Medical & Clearance"
 */

import { HeartIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const MedicalListPage = lazy(() => import("@/modules/sports/medical/pages/list"));
const MedicalShowPage = lazy(() => import("@/modules/sports/medical/pages/show"));

/** The Medical feature module. */
const medicalModule: AppModule = {
  name: "medical",
  resources: [
    {
      name: "medical",
      list: "/medical",
      show: "/medical/:id",
      meta: {
        label: "Medical",
        icon: HeartIcon,
        featureKey: "medical",
        requiredPermission: "medical.viewAny",
        order: 29,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/medical", element: createElement(MedicalListPage) },
    { tier: "protected", path: "/medical/:id", element: createElement(MedicalShowPage) },
  ],
};

export default medicalModule;

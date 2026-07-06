/**
 * @file registrations.module.tsx
 * @module modules/sports/registrations
 *
 * @description
 * The Registrations module — the self-service acquisition funnel (lead → trial →
 * offer → enrolled/waitlisted). List + detail, scoped by the active branch +
 * season. Conversion actions land in a later wave.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.4 "Enrollment & Waitlist"
 */

import { ClipboardDocumentListIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const RegistrationListPage = lazy(() => import("@/modules/sports/registrations/pages/list"));
const RegistrationShowPage = lazy(() => import("@/modules/sports/registrations/pages/show"));

/** The Registrations feature module. */
const registrationsModule: AppModule = {
  name: "registrations",
  resources: [
    {
      name: "registrations",
      list: "/registrations",
      show: "/registrations/:id",
      meta: {
        label: "Registrations",
        icon: ClipboardDocumentListIcon,
        featureKey: "registrations",
        requiredPermission: "registrations.viewAny",
        order: 13,
        scopedBy: ["branch", "season"],
        groupKey: "operations",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/registrations", element: createElement(RegistrationListPage) },
    { tier: "protected", path: "/registrations/:id", element: createElement(RegistrationShowPage) },
  ],
};

export default registrationsModule;

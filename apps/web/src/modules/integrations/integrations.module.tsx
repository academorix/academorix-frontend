/**
 * @file integrations.module.tsx
 * @module modules/integrations
 *
 * @description
 * The Integrations module — connect and monitor third-party providers
 * (payments, messaging, calendar, realtime). List + detail (read surfaces for
 * the demo; connect/disconnect flows land with the write API).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.9 "Integrations"
 */

import { PuzzlePieceIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const IntegrationsListPage = lazy(() => import("@/modules/integrations/pages/list"));
const IntegrationsShowPage = lazy(() => import("@/modules/integrations/pages/show"));

/** The Integrations feature module. */
const integrationsModule: AppModule = {
  name: "integrations",
  resources: [
    {
      name: "integrations",
      list: "/integrations",
      show: "/integrations/:id",
      meta: {
        label: "Integrations",
        icon: PuzzlePieceIcon,
        featureKey: "integrations",
        requiredPermission: "integrations.viewAny",
        order: 85,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/integrations", element: createElement(IntegrationsListPage) },
    { tier: "protected", path: "/integrations/:id", element: createElement(IntegrationsShowPage) },
  ],
};

export default integrationsModule;

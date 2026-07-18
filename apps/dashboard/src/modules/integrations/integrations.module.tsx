/**
 * @file integrations.module.tsx
 * @module modules/integrations
 *
 * @description
 * The Integrations module — connect and monitor third-party providers
 * (payments, messaging, calendar, realtime). Full CRUD at the tenant level.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.9 "Integrations"
 */

import { PuzzlePieceIcon } from "@stackra/ui/icons/heroicon/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const IntegrationsListPage = lazy(() => import("@/modules/integrations/pages/list"));
const IntegrationsCreatePage = lazy(() => import("@/modules/integrations/pages/create"));
const IntegrationsEditPage = lazy(() => import("@/modules/integrations/pages/edit"));
const IntegrationsShowPage = lazy(() => import("@/modules/integrations/pages/show"));

/** The Integrations feature module. */
const integrationsModule: AppModule = {
  name: "integrations",
  resources: [
    {
      name: "integrations",
      list: "/integrations",
      create: "/integrations/create",
      edit: "/integrations/:id/edit",
      show: "/integrations/:id",
      meta: {
        label: "Integrations",
        icon: PuzzlePieceIcon,
        featureKey: "integrations",
        requiredPermission: "integrations.viewAny",
        order: 85,
        groupKey: "administration",
        shortcuts: {
          navigate: "G I",
          create: "N I",
        },
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/integrations", element: createElement(IntegrationsListPage) },
    {
      tier: "protected",
      path: "/integrations/create",
      element: createElement(IntegrationsCreatePage),
    },
    {
      tier: "protected",
      path: "/integrations/:id/edit",
      element: createElement(IntegrationsEditPage),
    },
    { tier: "protected", path: "/integrations/:id", element: createElement(IntegrationsShowPage) },
  ],
};

export default integrationsModule;

/**
 * @file attributes.module.tsx
 * @module modules/attributes
 *
 * @description
 * The Attributes admin module — browse the tenant's attribute sets (the SDUI
 * definitions that make records sport-agnostic). The detail view renders a live,
 * read-only preview of the set using the same renderer the real forms use.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.9 "Attributes"
 */

import { AdjustmentsHorizontalIcon } from "@stackra/ui/icons/heroicon/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const AttributeSetListPage = lazy(() => import("@/modules/attributes/pages/list"));
const AttributeSetShowPage = lazy(() => import("@/modules/attributes/pages/show"));

/** The Attributes admin feature module. */
const attributesModule: AppModule = {
  name: "attributes",
  resources: [
    {
      name: "attribute-sets",
      list: "/attribute-sets",
      show: "/attribute-sets/:id",
      meta: {
        label: "Attribute Sets",
        icon: AdjustmentsHorizontalIcon,
        featureKey: "attributes",
        requiredPermission: "attributes.viewAny",
        order: 94,
        groupKey: "administration",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/attribute-sets", element: createElement(AttributeSetListPage) },
    {
      tier: "protected",
      path: "/attribute-sets/:id",
      element: createElement(AttributeSetShowPage),
    },
  ],
};

export default attributesModule;

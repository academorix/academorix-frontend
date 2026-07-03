/**
 * @file billing.module.tsx
 * @module modules/billing
 *
 * @description
 * The Billing module — the tenant's platform subscription and entitlement
 * quotas (academy → Academorix). A single read-only overview surface.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.8 "Billing"
 */

import { ReceiptPercentIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const BillingOverviewPage = lazy(() => import("@/modules/billing/pages/overview"));

/** The Billing feature module. */
const billingModule: AppModule = {
  name: "billing",
  resources: [
    {
      name: "subscription",
      list: "/billing",
      meta: {
        label: "Billing",
        icon: ReceiptPercentIcon,
        featureKey: "subscription",
        requiredPermission: "subscription.view",
        order: 98,
      },
    },
  ],
  routes: [{ tier: "protected", path: "/billing", element: createElement(BillingOverviewPage) }],
};

export default billingModule;

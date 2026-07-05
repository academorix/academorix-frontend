/**
 * @file billing.module.tsx
 * @module modules/billing
 *
 * @description
 * The **Billing** module — the tenant's platform subscription (academy →
 * Academorix). Contributes:
 *
 * 1. A **public** `/pricing` page — the plan catalog, served from the
 *    unauthenticated `GET /api/billing/catalog` endpoint. Reachable from any
 *    host (tenant subdomain, central marketing).
 * 2. A **protected** `/settings/billing` page — the subscription status,
 *    change-plan / pause / resume / cancel actions, provider-portal link,
 *    and invoice history. Gated on `view_billing`; mutation buttons on the
 *    page are gated on `manage_billing` at the button level.
 * 3. A sidebar Refine resource named `subscription` that binds the nav entry
 *    "Billing" to the settings page. The resource is nav-only — the page
 *    talks to the backend via {@link "@/lib/http" httpClient} rather than
 *    Refine's data provider, since the billing surface is a set of RPC
 *    endpoints, not a CRUD collection.
 *
 * @see BACKEND_HANDOFF.md §4 (route table)
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.8 "Billing"
 */

import { ReceiptPercentIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const BillingSettingsPage = lazy(() => import("@/modules/billing/pages/settings-page"));

/** The Billing feature module. */
const billingModule: AppModule = {
  name: "billing",
  resources: [
    {
      name: "subscription",
      list: "/settings/billing",
      meta: {
        label: "Billing",
        icon: ReceiptPercentIcon,
        featureKey: "subscription",
        // Sidebar/entry visibility: `view_billing` is sufficient. Mutations
        // on the settings page are individually gated on `manage_billing`.
        requiredPermission: "view_billing",
        order: 98,
        // Nav-only — no Refine CRUD is used against this resource. Setting
        // `dataProviderName: "mock"` short-circuits any accidental `useList`
        // to the fixture provider so a stale hook doesn't 404 in production.
        dataProviderName: "mock",
      },
    },
  ],
  routes: [
    {
      tier: "protected",
      path: "/settings/billing",
      element: createElement(BillingSettingsPage),
    },
  ],
};

export default billingModule;

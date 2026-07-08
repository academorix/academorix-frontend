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
 * 2. A **protected** `/settings/billing` page — the omnibus billing
 *    dashboard (plan status, mutations, quotas, invoices). Gated on
 *    `view_billing`; mutation buttons on the page are gated on
 *    `manage_billing` at the button level.
 * 3. Three **focused** protected routes underneath it — `/plans`
 *    (change-plan grid), `/subscription` (contract-only view of the current
 *    subscription), and `/invoices` (statement history). Each renders
 *    standalone with graceful degradation when the backend endpoint isn't
 *    deployed yet.
 * 4. A sidebar Refine resource named `subscription` that binds the nav entry
 *    "Billing" to the omnibus settings page. The resource is nav-only — the
 *    page talks to the backend via {@link "@/lib/http" httpClient} rather
 *    than Refine's data provider, since the billing surface is a set of
 *    RPC endpoints, not a CRUD collection.
 *
 * @see BACKEND_HANDOFF.md §4 (route table)
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.8 "Billing"
 */

import { ReceiptPercentIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const BillingSettingsPage = lazy(() => import("@/modules/billing/pages/settings-page"));
const BillingPlansPage = lazy(() => import("@/modules/billing/pages/plans-page"));
const BillingSubscriptionPage = lazy(
  () => import("@/modules/billing/pages/subscription-page"),
);
const BillingInvoicesPage = lazy(() => import("@/modules/billing/pages/invoices-page"));

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
        // `dataProviderName: "noop"` short-circuits any accidental `useList`
        // to a stub provider that returns empty results so a stale hook
        // doesn't 404 in production. See `providers/data/noop-data-provider`.
        //
        // NOTE: `use-plans` intentionally uses the default provider (the
        // `plans` resource is a real CRUD-style read against
        // `GET /api/v1/plans`); only the `subscription` resource is
        // pinned to noop.
        dataProviderName: "noop",
        groupKey: "finance",
      },
    },
  ],
  routes: [
    {
      tier: "protected",
      path: "/settings/billing",
      element: createElement(BillingSettingsPage),
    },
    {
      tier: "protected",
      path: "/settings/billing/plans",
      element: createElement(BillingPlansPage),
    },
    {
      tier: "protected",
      path: "/settings/billing/subscription",
      element: createElement(BillingSubscriptionPage),
    },
    {
      tier: "protected",
      path: "/settings/billing/invoices",
      element: createElement(BillingInvoicesPage),
    },
  ],
};

export default billingModule;

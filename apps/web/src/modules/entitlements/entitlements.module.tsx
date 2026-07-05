/**
 * @file entitlements.module.tsx
 * @module modules/entitlements
 *
 * @description
 * The **Entitlements** module — the full "Usage & limits" surface behind the
 * shell's 3-5 headline meters. Contributes:
 *
 * 1. A **protected** `/usage` page — the complete entitlement matrix (slots,
 *    pools, features) driven by `GET /api/entitlements/usage`.
 * 2. A sidebar Refine resource named `entitlements` that binds the nav entry
 *    "Usage & limits" to the page. Nav-only — the page reads via
 *    {@link "@/lib/http" httpClient} directly, not Refine's data provider.
 *
 * Complements the Billing module: the billing settings page shows the
 * headline meters + status + invoices, this page renders every entitlement
 * the plan includes.
 *
 * @see BACKEND_HANDOFF.md §5.5 (`GET /api/entitlements/usage`)
 */

import { ChartPieIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const EntitlementsUsagePage = lazy(() => import("@/modules/entitlements/pages/list"));

/** The Entitlements feature module. */
const entitlementsModule: AppModule = {
  name: "entitlements",
  resources: [
    {
      name: "entitlements",
      list: "/usage",
      meta: {
        label: "Usage & limits",
        icon: ChartPieIcon,
        featureKey: "subscription",
        // Same permission tier as billing view — anyone who can see the plan
        // should be able to see the quotas the plan grants.
        requiredPermission: "view_billing",
        order: 99,
        // Nav-only — no Refine CRUD is used. Pin to the mock provider so an
        // accidental `useList("entitlements")` doesn't hit the real REST
        // endpoint (which is an RPC, not a paged collection).
        dataProviderName: "mock",
      },
    },
  ],
  routes: [
    {
      tier: "protected",
      path: "/usage",
      element: createElement(EntitlementsUsagePage),
    },
  ],
};

export default entitlementsModule;

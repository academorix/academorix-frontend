/**
 * @file payments.module.tsx
 * @module modules/payments
 *
 * @description
 * The Payments module (money-in / AR) — customer invoices with their line items,
 * recorded payments, and a refund action. List + detail, scoped by branch.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.3 "Billing & Payments"
 */

import { BanknotesIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const InvoiceListPage = lazy(() => import("@/modules/payments/pages/list"));
const InvoiceShowPage = lazy(() => import("@/modules/payments/pages/show"));

/** The Payments (invoices) feature module. */
const paymentsModule: AppModule = {
  name: "payments",
  resources: [
    {
      name: "invoices",
      list: "/invoices",
      show: "/invoices/:id",
      meta: {
        label: "Invoices",
        icon: BanknotesIcon,
        featureKey: "payments",
        requiredPermission: "invoices.viewAny",
        order: 30,
        scopedBy: ["branch"],
        shortcuts: {
          navigate: "G P",
        },
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/invoices", element: createElement(InvoiceListPage) },
    { tier: "protected", path: "/invoices/:id", element: createElement(InvoiceShowPage) },
  ],
};

export default paymentsModule;

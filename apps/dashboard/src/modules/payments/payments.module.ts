import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const paymentsModule: AppModule = {
  name: "payments",
  resources: [
    {
      name: "invoices",
      list: "/invoices",
      show: "/invoices/:id",
      meta: {
        label: "Invoices",
        singularLabel: "Invoice",
        icon: "file-dollar",
        groupKey: "finance",
        order: 30,
        featureKey: "payments",
        requiredPermission: "invoices.viewAny",
        scopes: ["branch"],
        shortcuts: { navigate: "G P" },
        crud: "read-only",
        emptyState: {
          title: "No invoices yet",
          description: "Invoices are generated automatically from memberships and passes.",
        },
        savedViews: [
          {
            id: "unpaid",
            label: "Unpaid",
            filters: [{ field: "status.text", operator: "ne", value: "Paid" }],
            isDefault: true,
          },
          {
            id: "paid",
            label: "Paid",
            filters: [{ field: "status.text", operator: "eq", value: "Paid" }],
          },
          {
            id: "overdue",
            label: "Overdue",
            filters: [{ field: "status.text", operator: "eq", value: "Overdue" }],
          },
        ],
        // Invoices are pulled up by athlete name most of the time
        // (a family calls asking about their bill). The invoice
        // number and reference are the fallback axes.
        searchFields: ["name", "athlete", "reference"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/invoices", tier: "protected" },
    { element: createElement(ShowPage), path: "/invoices/:id", tier: "protected" },
  ],
};

export default paymentsModule;

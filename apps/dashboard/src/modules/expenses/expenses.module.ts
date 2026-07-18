import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { expenseFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const expensesModule: AppModule = {
  name: "expenses",
  resources: [
    {
      name: "expenses",
      list: "/expenses",
      show: "/expenses/:id",
      meta: {
        label: "Expenses",
        singularLabel: "Expense",
        icon: "receipt",
        groupKey: "finance",
        order: 32,
        featureKey: "expenses",
        requiredPermission: "expenses.viewAny",
        scopes: ["branch"],
        shortcuts: { navigate: "G X", create: "N X" },
        crud: "full",
        formFields: expenseFields,
        emptyState: {
          title: "No expenses yet",
          description: "Log operating costs so P&L reflects true margin.",
          actionLabel: "New expense",
        },
        filterChips: [
          {
            id: "facility",
            label: "Facility",
            filter: { field: "category", operator: "eq", value: "facility" },
          },
          {
            id: "equipment",
            label: "Equipment",
            filter: { field: "category", operator: "eq", value: "equipment" },
          },
          {
            id: "travel",
            label: "Travel",
            filter: { field: "category", operator: "eq", value: "travel" },
          },
        ],
        // Saved views: rolling "this month" window (matches the
        // period expense reports close on) vs. the historical
        // archive. Filter recomputed at render so the pivot date
        // slides with the calendar month.
        savedViews: [
          {
            id: "this-month",
            label: "This month",
            filters: [
              {
                field: "incurredAt",
                operator: "gte",
                value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            isDefault: true,
          },
          { id: "all", label: "All" },
        ],
        // Expenses are found by their line item ("Pitch A repaint")
        // or by the notes field where receipts land.
        searchFields: ["name", "notes", "branch"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/expenses", tier: "protected" },
    { element: createElement(ShowPage), path: "/expenses/:id", tier: "protected" },
  ],
};

export default expensesModule;

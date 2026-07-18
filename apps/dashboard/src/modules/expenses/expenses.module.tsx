/**
 * @file expenses.module.tsx
 * @module modules/expenses
 *
 * @description
 * The Expenses module — money-out (AP): rent, utilities, equipment, salaries,
 * and other costs, optionally recurring. Full CRUD, scoped by branch.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.19 "Finance — Expenses"
 */

import { ArrowTrendingDownIcon } from "@stackra/ui/icons/heroicon/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ExpenseListPage = lazy(() => import("@/modules/expenses/pages/list"));
const ExpenseCreatePage = lazy(() => import("@/modules/expenses/pages/create"));
const ExpenseEditPage = lazy(() => import("@/modules/expenses/pages/edit"));
const ExpenseShowPage = lazy(() => import("@/modules/expenses/pages/show"));

/** The Expenses feature module. */
const expensesModule: AppModule = {
  name: "expenses",
  resources: [
    {
      name: "expenses",
      list: "/expenses",
      create: "/expenses/create",
      edit: "/expenses/:id/edit",
      show: "/expenses/:id",
      meta: {
        label: "Expenses",
        icon: ArrowTrendingDownIcon,
        featureKey: "expenses",
        requiredPermission: "expenses.viewAny",
        order: 32,
        scopedBy: ["branch"],
        groupKey: "finance",
        shortcuts: {
          navigate: "G X",
          create: "N X",
        },
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/expenses", element: createElement(ExpenseListPage) },
    { tier: "protected", path: "/expenses/create", element: createElement(ExpenseCreatePage) },
    { tier: "protected", path: "/expenses/:id/edit", element: createElement(ExpenseEditPage) },
    { tier: "protected", path: "/expenses/:id", element: createElement(ExpenseShowPage) },
  ],
};

export default expensesModule;

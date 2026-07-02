/**
 * @file create.tsx
 * @module modules/expenses/pages/create
 *
 * @description
 * Expense create screen. `useForm` drives the mutation and redirects to list.
 */

import { useForm } from "@refinedev/core";

import type { Expense } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { ExpenseForm, toExpensePayload } from "@/modules/expenses/components/expense-form";

/** The expense create page. */
export default function ExpenseCreate(): ReactNode {
  const { scope } = useScope();
  const { onFinish, formLoading } = useForm<Expense>({
    resource: "expenses",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="expenses">
      <ExpenseForm
        isSubmitting={formLoading}
        submitLabel="Create expense"
        onSubmit={(values) => {
          void onFinish(toExpensePayload(values, scope.branchId));
        }}
      />
    </CreateView>
  );
}

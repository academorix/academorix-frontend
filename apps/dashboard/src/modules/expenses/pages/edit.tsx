/**
 * @file edit.tsx
 * @module modules/expenses/pages/edit
 *
 * @description
 * Expense edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { Expense } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { ExpenseForm, toExpensePayload } from "@/modules/expenses/components/expense-form";

/** The expense edit page. */
export default function ExpenseEdit(): ReactNode {
  const { scope } = useScope();
  const { query, onFinish, formLoading } = useForm<Expense>({
    resource: "expenses",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="expenses">
      {record ? (
        <ExpenseForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toExpensePayload(values, scope.branchId));
          }}
        />
      ) : (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      )}
    </EditView>
  );
}

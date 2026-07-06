/**
 * @file show.tsx
 * @module modules/expenses/pages/show
 *
 * @description
 * Expense detail — category, amount, status, recurrence, and incurred date.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Expense } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate, formatMoney } from "@/lib/format";
import { ExpenseStatusChip } from "@/modules/expenses/components/expense-status-chip";
import { EXPENSE_CATEGORY_LABELS } from "@/types";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The expense detail page. */
export default function ExpenseShow(): ReactNode {
  const { result: expense, query } = useShow<Expense>({ resource: "expenses" });

  return (
    <ShowView resource="expenses">
      {query.isLoading || !expense ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{expense.description}</Card.Title>
            <Card.Description>Expense</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <ExpenseStatusChip status={expense.status} />
              </Field>
              <Field label="Category">{EXPENSE_CATEGORY_LABELS[expense.category]}</Field>
              <Field label="Amount">{formatMoney(expense.amount, expense.currency)}</Field>
              <Field label="Recurring">{expense.is_recurring ? "Yes" : "No"}</Field>
              <Field label="Recurrence">{expense.recurrence ?? "—"}</Field>
              <Field label="Incurred">{formatDate(expense.incurred_at)}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}

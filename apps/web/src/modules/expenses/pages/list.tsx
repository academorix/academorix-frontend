/**
 * @file list.tsx
 * @module modules/expenses/pages/list
 *
 * @description
 * Expenses list (money-out / AP), scoped by branch, with description, category,
 * amount, status, and incurred date. Per-row show/edit/delete actions.
 */

import type { Expense } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { formatDate, formatMoney } from "@/lib/format";
import { ExpenseStatusChip } from "@/modules/expenses/components/expense-status-chip";
import { EXPENSE_CATEGORY_LABELS } from "@/types";

/** DataGrid columns for the expenses list. */
const COLUMNS: DataGridColumn<Expense>[] = [
  {
    id: "description",
    header: "Description",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 220,
    cell: (expense) => <span className="font-medium">{expense.description}</span>,
  },
  {
    id: "category",
    header: "Category",
    allowsSorting: true,
    cell: (expense) => EXPENSE_CATEGORY_LABELS[expense.category],
  },
  {
    id: "amount",
    header: "Amount",
    allowsSorting: true,
    cell: (expense) => formatMoney(expense.amount, expense.currency),
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (expense) => <ExpenseStatusChip status={expense.status} />,
  },
  {
    id: "incurred_at",
    header: "Incurred",
    allowsSorting: true,
    cell: (expense) => formatDate(expense.incurred_at),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (expense) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View expense"
          recordItemId={expense.id}
          resource="expenses"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit expense"
          recordItemId={expense.id}
          resource="expenses"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete expense"
          recordItemId={expense.id}
          resource="expenses"
          size="sm"
        />
      </div>
    ),
  },
];

/** The expenses list page. */
export default function ExpenseList(): ReactNode {
  return (
    <ListView resource="expenses">
      <ResourceDataGrid<Expense>
        ariaLabel="Expenses"
        columns={COLUMNS}
        contentClassName="min-w-[820px]"
        initialSorters={[{ field: "incurred_at", order: "desc" }]}
        resource="expenses"
      />
    </ListView>
  );
}

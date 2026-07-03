/**
 * @file expense-status-chip.tsx
 * @module modules/expenses/components/expense-status-chip
 *
 * @description
 * Color-coded chip for an {@link ExpenseStatus}, reused by the expenses list and
 * detail screens.
 */

import { Chip } from "@academorix/ui/react";

import type { ExpenseStatus } from "@/types";
import type { ReactNode } from "react";

import { EXPENSE_STATUS_LABELS } from "@/types";

/** Maps each expense status to a semantic HeroUI Chip color. */
const COLOR: Record<ExpenseStatus, "success" | "warning" | "danger" | "default"> = {
  draft: "default",
  approved: "warning",
  paid: "success",
};

/** A soft, color-coded chip for an expense's status. */
export function ExpenseStatusChip({ status }: { status: ExpenseStatus }): ReactNode {
  return (
    <Chip color={COLOR[status]} size="sm" variant="soft">
      {EXPENSE_STATUS_LABELS[status]}
    </Chip>
  );
}

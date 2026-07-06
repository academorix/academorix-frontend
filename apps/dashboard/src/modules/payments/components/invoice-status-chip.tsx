/**
 * @file invoice-status-chip.tsx
 * @module modules/payments/components/invoice-status-chip
 *
 * @description
 * Color-coded chip for an {@link InvoiceStatus}, reused by the invoices list and
 * detail screens.
 */

import { Chip } from "@academorix/ui/react";

import type { InvoiceStatus } from "@/types";
import type { ReactNode } from "react";

import { INVOICE_STATUS_LABELS } from "@/types";

/** Maps each invoice status to a semantic HeroUI Chip color. */
const COLOR: Record<InvoiceStatus, "success" | "warning" | "danger" | "default"> = {
  draft: "default",
  open: "warning",
  paid: "success",
  partially_paid: "warning",
  overdue: "danger",
  void: "default",
  refunded: "default",
};

/** A soft, color-coded chip for an invoice's status. */
export function InvoiceStatusChip({ status }: { status: InvoiceStatus }): ReactNode {
  return (
    <Chip color={COLOR[status]} size="sm" variant="soft">
      {INVOICE_STATUS_LABELS[status]}
    </Chip>
  );
}

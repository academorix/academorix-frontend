/**
 * @file kpi-outstanding-invoices.tsx
 * @module modules/dashboard/widgets/renderers/kpi-outstanding-invoices
 *
 * @description
 * Overview widget: invoices that have been issued but not yet paid. Sums the
 * balance across every open or overdue invoice in the current branch. The
 * status filter uses `in` so both statuses aggregate into a single number.
 */

import { ExclamationCircleIcon } from "@stackra/ui/icons/heroicon/outline";
import { KPI, Skeleton } from "@stackra/ui/react";
import { useList } from "@refinedev/core";

import type { BaseRecord } from "@refinedev/core";
import type { ReactNode } from "react";

/** Invoice-shaped fields we consume for the outstanding roll-up. */
interface InvoiceLike extends BaseRecord {
  amount?: number;
  amount_paid?: number;
  currency?: string;
  status?: string;
}

/** Overview widget: outstanding invoice balance. */
export default function KpiOutstandingInvoicesWidget(): ReactNode {
  const { result, query } = useList<InvoiceLike>({
    resource: "invoices",
    pagination: { mode: "off" },
    filters: [{ field: "status", operator: "in", value: ["open", "overdue", "partial"] }],
  });

  const invoices = result.data ?? [];
  const total = invoices.reduce((sum, invoice) => {
    const amount = invoice.amount ?? 0;
    const paid = invoice.amount_paid ?? 0;

    return sum + Math.max(0, amount - paid);
  }, 0);

  const currency = invoices[0]?.currency ?? "USD";

  return (
    <KPI>
      <KPI.Header>
        <KPI.Icon status="warning">
          <ExclamationCircleIcon />
        </KPI.Icon>
        <KPI.Title>Outstanding invoices</KPI.Title>
      </KPI.Header>
      <KPI.Content>
        {query.isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <KPI.Value currency={currency} maximumFractionDigits={0} style="currency" value={total} />
        )}
      </KPI.Content>
    </KPI>
  );
}

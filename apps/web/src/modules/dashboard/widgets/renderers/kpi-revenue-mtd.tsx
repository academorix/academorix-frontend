/**
 * @file kpi-revenue-mtd.tsx
 * @module modules/dashboard/widgets/renderers/kpi-revenue-mtd
 *
 * @description
 * Overview widget: total revenue received since the first of the current
 * month. Sums `amount_paid` across paid invoices client-side. The plan will
 * eventually move this to a dedicated aggregate endpoint (Section 20.3); for
 * Phase 1 we compute it in-browser off the mock fixtures.
 */

import { BanknotesIcon } from "@academorix/ui/icons/outline";
import { KPI, Skeleton } from "@academorix/ui/react";
import { useList } from "@refinedev/core";

import type { BaseRecord } from "@refinedev/core";
import type { ReactNode } from "react";

/** Invoice-shaped record fields we read from the fixture. */
interface InvoiceLike extends BaseRecord {
  amount_paid?: number;
  amount?: number;
  currency?: string;
  paid_at?: string | null;
  status?: string;
}

/**
 * Returns an ISO timestamp for the first millisecond of the current month.
 * Used as a filter cutoff so the widget only sums recent payments.
 */
function firstOfMonthIso(): string {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/** Overview widget: revenue this month. */
export default function KpiRevenueMtdWidget(): ReactNode {
  const { result, query } = useList<InvoiceLike>({
    resource: "invoices",
    pagination: { mode: "off" },
    filters: [
      { field: "status", operator: "eq", value: "paid" },
      { field: "paid_at", operator: "gte", value: firstOfMonthIso() },
    ],
  });

  const invoices = result.data ?? [];
  const total = invoices.reduce((sum, invoice) => {
    const value = invoice.amount_paid ?? invoice.amount ?? 0;

    return sum + (typeof value === "number" ? value : 0);
  }, 0);

  // Use the first invoice's currency as a display default. Multi-currency
  // networks should point this widget at a per-region aggregate endpoint once
  // the plan's Section 20.18 currency-conversion selector ships.
  const currency = invoices[0]?.currency ?? "USD";

  return (
    <KPI>
      <KPI.Header>
        <KPI.Icon status="success">
          <BanknotesIcon />
        </KPI.Icon>
        <KPI.Title>Revenue this month</KPI.Title>
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

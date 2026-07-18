/**
 * @file list.tsx
 * @module modules/payments/pages/list
 *
 * @description
 * Invoices list (money-in / AR), scoped by branch, with amount, paid-to-date, and
 * status. Per-row detail action; invoices are issued by billing flows, not edited
 * inline.
 */

import type { Invoice } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDate, formatMoney } from "@/lib/format";
import { InvoiceStatusChip } from "@/modules/payments/components/invoice-status-chip";

/** DataGrid columns for the invoices list. */
const COLUMNS: DataGridColumn<Invoice>[] = [
  {
    id: "number",
    header: "Invoice",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 140,
    cell: (invoice) => <span className="font-mono text-xs">{invoice.number}</span>,
  },
  {
    id: "total",
    header: "Total",
    allowsSorting: true,
    cell: (invoice) => formatMoney(invoice.total, invoice.currency),
  },
  {
    id: "amount_paid",
    header: "Paid",
    cell: (invoice) => formatMoney(invoice.amount_paid, invoice.currency),
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (invoice) => <InvoiceStatusChip status={invoice.status} />,
  },
  {
    id: "due_at",
    header: "Due",
    allowsSorting: true,
    cell: (invoice) => formatDate(invoice.due_at),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 80,
    cell: (invoice) => (
      <div className="flex justify-end">
        <ShowButton
          isIconOnly
          aria-label="View invoice"
          recordItemId={invoice.id}
          resource="invoices"
          size="sm"
          variant="ghost"
        />
      </div>
    ),
  },
];

/** The invoices list page. */
export default function InvoiceList(): ReactNode {
  return (
    <ListView resource="invoices" title="Invoices">
      <ResourceDataGrid<Invoice>
        ariaLabel="Invoices"
        columns={COLUMNS}
        contentClassName="min-w-[760px]"
        initialSorters={[{ field: "issued_at", order: "desc" }]}
        resource="invoices"
      />
    </ListView>
  );
}

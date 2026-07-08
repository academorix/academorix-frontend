/**
 * @file invoices-page.tsx
 * @module modules/billing/pages/invoices-page
 *
 * @description
 * The dedicated **invoices** page at `/settings/billing/invoices`. Lists
 * every SaaS invoice the tenant has, with per-row status chip + PDF
 * download link. Where the omnibus settings page also shows invoices, this
 * standalone route is useful for deep-linking (e.g. from a "You have a
 * new invoice" notification) and for full-height rendering when a tenant
 * has hundreds of statements.
 *
 * Data source: {@link "@/modules/billing/hooks/use-billing" useBillingInvoices}
 * — fetches `GET /api/v1/invoices`. A 404 renders the "Coming soon" empty
 * state so the route degrades gracefully while the backend endpoint is
 * pending.
 *
 * `TODO(backend-endpoint): GET /api/v1/invoices` — until this endpoint ships,
 * `useBillingInvoices` surfaces an error banner and the page renders empty.
 */

import { ExclamationCircleIcon, ReceiptPercentIcon } from "@academorix/ui/icons/outline";
import { Card, Chip, Separator, Spinner } from "@academorix/ui/react";

import type { BillingInvoice } from "@/types";
import type { ReactNode } from "react";

import { ResourceAccessGuard } from "@/components/access";
import { Breadcrumbs } from "@/components/refine";
import { formatDate, formatMoney } from "@/lib/format";
import { useBillingInvoices } from "@/modules/billing/hooks/use-billing";

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────

/** Invoice status → Chip color. Kept per-page so the two billing views can
 *  drift on visual language independently as UX evolves. */
const INVOICE_STATUS_COLOR: Record<
  BillingInvoice["status"],
  "success" | "warning" | "danger" | "default"
> = {
  paid: "success",
  open: "warning",
  past_due: "danger",
  void: "default",
  refunded: "default",
};

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

/** Renders the standard "Coming soon" placeholder when there are no rows. */
function InvoicesEmpty(): ReactNode {
  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <ReceiptPercentIcon aria-hidden="true" className="size-5 text-accent" />
          <Card.Title>No invoices yet</Card.Title>
        </div>
        <Card.Description>
          Your invoices will appear here once your subscription is active and the first billing
          cycle completes.
        </Card.Description>
      </Card.Header>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

/**
 * Renders the invoices page. Registered by the billing module at
 * `/settings/billing/invoices`.
 */
export default function BillingInvoicesPage(): ReactNode {
  const { data: invoices, isLoading, error } = useBillingInvoices();
  const rows = invoices ?? [];

  return (
    <ResourceAccessGuard action="list" resource="subscription">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs />
          <Separator />
          <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
          <p className="text-sm text-muted">
            Every SaaS invoice Academorix has issued for your workspace.
          </p>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{error.message}</span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner aria-label="Loading invoices" />
          </div>
        ) : rows.length === 0 ? (
          <InvoicesEmpty />
        ) : (
          <Card>
            <Card.Content>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs font-medium tracking-wide text-muted uppercase">
                    <tr>
                      <th className="pr-4 pb-3">Number</th>
                      <th className="pr-4 pb-3">Issued</th>
                      <th className="pr-4 pb-3">Status</th>
                      <th className="pr-4 pb-3">Total</th>
                      <th className="pb-3">Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default/40">
                    {rows.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="py-3 pr-4 font-medium text-foreground">
                          {invoice.number}
                        </td>
                        <td className="py-3 pr-4 text-muted">{formatDate(invoice.issued_at)}</td>
                        <td className="py-3 pr-4">
                          <Chip
                            color={INVOICE_STATUS_COLOR[invoice.status]}
                            size="sm"
                            variant="soft"
                          >
                            {invoice.status}
                          </Chip>
                        </td>
                        <td className="py-3 pr-4 tabular-nums">
                          {formatMoney(invoice.total, invoice.currency)}
                        </td>
                        <td className="py-3">
                          {invoice.pdf_url ? (
                            <a
                              className="text-sm text-accent hover:underline"
                              href={invoice.pdf_url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Download PDF
                            </a>
                          ) : (
                            <span className="text-sm text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    </ResourceAccessGuard>
  );
}

/**
 * @file show.tsx
 * @module modules/payments/pages/show
 *
 * @description
 * Invoice detail — header totals, line items, recorded payments, and a **refund**
 * action (patches the invoice to `refunded`, guarded by a confirmation popover)
 * available only on paid/partially-paid invoices.
 */

import { Button, Card, Popover, Spinner } from "@stackra/ui/react";
import { useShow, useList, useUpdate } from "@refinedev/core";
import { useState } from "react";

import type { Invoice, Payment } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { InvoiceStatusChip } from "@/modules/payments/components/invoice-status-chip";
import { PAYMENT_STATUS_LABELS } from "@/types";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** Refund control: confirms then patches the invoice status to `refunded`. */
function RefundButton({ invoice }: { invoice: Invoice }): ReactNode {
  const { mutate: update } = useUpdate();
  const [isOpen, setIsOpen] = useState(false);

  const canRefund = invoice.status === "paid" || invoice.status === "partially_paid";

  if (!canRefund) {
    return null;
  }

  const handleRefund = (): void => {
    update({ resource: "invoices", id: invoice.id, values: { status: "refunded" } });
    setIsOpen(false);
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button size="sm" variant="danger">
        Refund
      </Button>
      <Popover.Content className="max-w-72" placement="bottom end">
        <Popover.Dialog>
          <Popover.Heading>Refund this invoice?</Popover.Heading>
          <p className="mt-2 text-sm text-muted">
            This marks the invoice as refunded. This cannot be undone from here.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="tertiary" onPress={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onPress={handleRefund}>
              Refund
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

/** The invoice detail page. */
export default function InvoiceShow(): ReactNode {
  const { result: invoice, query } = useShow<Invoice>({ resource: "invoices" });
  const { result: paymentsResult } = useList<Payment>({
    resource: "payments",
    pagination: { mode: "off" },
    filters: [{ field: "invoice_id", operator: "eq", value: invoice?.id ?? "" }],
    queryOptions: { enabled: Boolean(invoice?.id) },
  });
  const payments = paymentsResult?.data ?? [];

  if (query.isLoading || !invoice) {
    return (
      <ShowView resource="invoices">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView headerActions={<RefundButton invoice={invoice} />} resource="invoices">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{invoice.number}</Card.Title>
            <Card.Description>Invoice</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <InvoiceStatusChip status={invoice.status} />
              </Field>
              <Field label="Total">{formatMoney(invoice.total, invoice.currency)}</Field>
              <Field label="Paid">{formatMoney(invoice.amount_paid, invoice.currency)}</Field>
              <Field label="Issued">{formatDate(invoice.issued_at)}</Field>
              <Field label="Due">{formatDate(invoice.due_at)}</Field>
            </dl>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Line items</Card.Title>
          </Card.Header>
          <Card.Content>
            <ul className="divide-y divide-separator">
              {invoice.lines.map((line, index) => (
                <li key={index} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-foreground">
                    {line.description}
                    <span className="text-muted"> × {line.quantity}</span>
                  </span>
                  <span className="font-medium">{formatMoney(line.amount, invoice.currency)}</span>
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Payments</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-muted">No payments recorded.</p>
          ) : (
            <ul className="divide-y divide-separator rounded-lg border border-border">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="text-foreground">
                    {formatMoney(payment.amount, payment.currency)} · {payment.method}
                  </span>
                  <span className="text-muted">
                    {PAYMENT_STATUS_LABELS[payment.status]} · {formatDateTime(payment.paid_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ShowView>
  );
}

/**
 * @file list.tsx
 * @module modules/reports/pages/list
 *
 * @description
 * Reports dashboard — headline KPIs and simple breakdowns computed client-side
 * from the existing resources (athletes, memberships, invoices, events). In
 * production these numbers come from server-side aggregates; here they mirror
 * that shape so the surface is ready to swap.
 */

import { Card, Separator } from "@academorix/ui/react";
import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { Athlete, Event, Invoice, InvoiceStatus, Membership, MembershipStatus } from "@/types";
import type { ReactNode } from "react";

import { ResourceAccessGuard } from "@/components/access";
import { Breadcrumbs } from "@/components/refine";
import { formatMoney } from "@/lib/format";
import { INVOICE_STATUS_LABELS, MEMBERSHIP_STATUS_LABELS } from "@/types";

/** A single headline metric card. */
function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}): ReactNode {
  return (
    <Card>
      <Card.Content className="flex flex-col gap-1 py-5">
        <span className="text-xs font-medium tracking-wide text-muted uppercase">{label}</span>
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </Card.Content>
    </Card>
  );
}

/** A labelled count row with a proportional bar, used inside breakdown cards. */
function BreakdownRow({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}): ReactNode {
  const width = max > 0 ? Math.round((count / max) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-sm text-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-default/40">
        <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-sm text-muted tabular-nums">{count}</span>
    </div>
  );
}

/** Counts records by a status field into an ordered label→count list. */
function countByStatus<T, S extends string>(
  records: T[],
  getStatus: (record: T) => S,
  labels: Record<S, string>,
): { key: S; label: string; count: number }[] {
  const counts = new Map<S, number>();

  for (const record of records) {
    const status = getStatus(record);

    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  return (Object.keys(labels) as S[])
    .map((key) => ({ key, label: labels[key], count: counts.get(key) ?? 0 }))
    .filter((row) => row.count > 0);
}

/** The reports dashboard page. */
export default function ReportsDashboard(): ReactNode {
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });
  const { result: membershipsResult } = useList<Membership>({
    resource: "memberships",
    pagination: { mode: "off" },
  });
  const { result: invoicesResult } = useList<Invoice>({
    resource: "invoices",
    pagination: { mode: "off" },
  });
  const { result: eventsResult } = useList<Event>({
    resource: "events",
    pagination: { mode: "off" },
  });

  const athletes = useMemo(() => athletesResult?.data ?? [], [athletesResult?.data]);
  const memberships = useMemo(() => membershipsResult?.data ?? [], [membershipsResult?.data]);
  const invoices = useMemo(() => invoicesResult?.data ?? [], [invoicesResult?.data]);
  const events = useMemo(() => eventsResult?.data ?? [], [eventsResult?.data]);

  const activeMembers = useMemo(
    () => memberships.filter((membership) => membership.status === "active").length,
    [memberships],
  );

  const upcomingEvents = useMemo(
    () => events.filter((event) => event.status === "scheduled").length,
    [events],
  );

  const { outstanding, currency } = useMemo(() => {
    const total = invoices.reduce((sum, invoice) => {
      const due = Number.parseFloat(invoice.total) - Number.parseFloat(invoice.amount_paid);

      return sum + (Number.isFinite(due) ? Math.max(due, 0) : 0);
    }, 0);

    return { outstanding: total, currency: invoices[0]?.currency ?? "USD" };
  }, [invoices]);

  const invoiceBreakdown = useMemo(
    () => countByStatus<Invoice, InvoiceStatus>(invoices, (i) => i.status, INVOICE_STATUS_LABELS),
    [invoices],
  );

  const membershipBreakdown = useMemo(
    () =>
      countByStatus<Membership, MembershipStatus>(
        memberships,
        (m) => m.status,
        MEMBERSHIP_STATUS_LABELS,
      ),
    [memberships],
  );

  const invoiceMax = Math.max(1, ...invoiceBreakdown.map((row) => row.count));
  const membershipMax = Math.max(1, ...membershipBreakdown.map((row) => row.count));

  return (
    <ResourceAccessGuard action="list" resource="reports">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs />
          <Separator />
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Athletes" value={String(athletes.length)} />
          <StatCard label="Active members" value={String(activeMembers)} />
          <StatCard
            hint="Unpaid balance"
            label="Outstanding"
            value={formatMoney(outstanding, currency)}
          />
          <StatCard label="Upcoming events" value={String(upcomingEvents)} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <Card.Header>
              <Card.Title>Invoices by status</Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-col gap-3">
              {invoiceBreakdown.length === 0 ? (
                <p className="text-sm text-muted">No invoices yet.</p>
              ) : (
                invoiceBreakdown.map((row) => (
                  <BreakdownRow
                    key={row.key}
                    count={row.count}
                    label={row.label}
                    max={invoiceMax}
                  />
                ))
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Memberships by status</Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-col gap-3">
              {membershipBreakdown.length === 0 ? (
                <p className="text-sm text-muted">No memberships yet.</p>
              ) : (
                membershipBreakdown.map((row) => (
                  <BreakdownRow
                    key={row.key}
                    count={row.count}
                    label={row.label}
                    max={membershipMax}
                  />
                ))
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
    </ResourceAccessGuard>
  );
}

/**
 * @file show.tsx
 * @module modules/memberships/pages/show
 *
 * @description
 * Membership detail — plan, pricing, interval, billing period, and status.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Membership } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate, formatMoney } from "@/lib/format";
import { MembershipStatusChip } from "@/modules/memberships/components/membership-status-chip";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The membership detail page. */
export default function MembershipShow(): ReactNode {
  const { result: membership, query } = useShow<Membership>({ resource: "memberships" });

  return (
    <ShowView resource="memberships">
      {query.isLoading || !membership ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{membership.plan_name}</Card.Title>
            <Card.Description>Membership</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <MembershipStatusChip status={membership.status} />
              </Field>
              <Field label="Price">
                {formatMoney(membership.price, membership.currency)}/{membership.interval}
              </Field>
              <Field label="Customer">{membership.customer_id}</Field>
              <Field label="Athlete">{membership.athlete_id ?? "—"}</Field>
              <Field label="Period start">{formatDate(membership.current_period_start)}</Field>
              <Field label="Renews">{formatDate(membership.current_period_end)}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}

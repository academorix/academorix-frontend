/**
 * @file overview.tsx
 * @module modules/billing/pages/overview
 *
 * @description
 * Billing overview — the tenant's platform subscription (plan, price, renewal)
 * and its entitlement quotas. Read-only; plan changes happen in a later wave.
 */

import { Card, Chip, Spinner } from "@academorix/ui/react";
import { useList } from "@refinedev/core";

import type { Subscription } from "@/types";
import type { ReactNode } from "react";

import { ListView } from "@/components/refine";
import { formatDate, formatMoney } from "@/lib/format";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The billing overview page. */
export default function BillingOverview(): ReactNode {
  const { result, query } = useList<Subscription>({
    resource: "subscription",
    pagination: { mode: "off" },
  });
  const subscription = result?.data?.[0];

  return (
    <ListView resource="subscription" title="Billing">
      {query.isLoading || !subscription ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <Card.Header>
              <Card.Title className="capitalize">{subscription.plan} plan</Card.Title>
              <Card.Description>Platform subscription</Card.Description>
            </Card.Header>
            <Card.Content>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Price">
                  {formatMoney(subscription.price, subscription.currency)}/{subscription.interval}
                </Field>
                <Field label="Renews">{formatDate(subscription.current_period_end)}</Field>
                <Field label="Features">
                  <div className="flex flex-wrap gap-1">
                    {subscription.feature_flags.map((flag) => (
                      <Chip key={flag} size="sm" variant="soft">
                        {flag}
                      </Chip>
                    ))}
                  </div>
                </Field>
              </dl>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Quotas</Card.Title>
            </Card.Header>
            <Card.Content>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <Field label="Organizations">{subscription.quotas.max_organizations}</Field>
                <Field label="Branches">{subscription.quotas.max_branches}</Field>
                <Field label="Teams">{subscription.quotas.max_teams}</Field>
                <Field label="Athletes">{subscription.quotas.max_athletes}</Field>
                <Field label="Storage">{subscription.quotas.max_storage_gb} GB</Field>
              </dl>
            </Card.Content>
          </Card>
        </div>
      )}
    </ListView>
  );
}

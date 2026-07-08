/**
 * @file subscription-page.tsx
 * @module modules/billing/pages/subscription-page
 *
 * @description
 * The dedicated **subscription** page at `/settings/billing/subscription`.
 * Where {@link "./settings-page.tsx"} is the omnibus billing dashboard
 * (plan + quotas + invoices + mutations), this page is a focused view of
 * just the subscription contract itself: current plan, next-billing date,
 * headline quotas, and the "Manage in provider portal" jump-off.
 *
 * Data sources:
 *
 * - {@link "@/lib/billing" useLiveSubscription} — fresh `SubscriptionSummary`
 *   from `GET /api/v1/subscriptions/current`. Falls back to `subscription:
 *   null` on 404/501 so the page renders the "Coming soon" empty state
 *   rather than an error banner while the backend endpoint is pending.
 * - {@link "@/lib/billing" useQuotaSummary} — headline quotas from `/me`
 *   (no extra fetch).
 * - {@link "@/modules/billing/hooks/use-billing" useOpenBillingPortal} —
 *   on-demand redirect URL for the provider's portal.
 */

import {
  ArrowTopRightOnSquareIcon,
  ExclamationCircleIcon,
  ReceiptPercentIcon,
} from "@academorix/ui/icons/outline";
import { Button, Card, Chip, Separator, Spinner } from "@academorix/ui/react";
import { useCallback } from "react";

import type { SubscriptionStatus } from "@/types";
import type { ReactNode } from "react";

import { ResourceAccessGuard } from "@/components/access";
import { QuotaMeter } from "@/components/billing";
import { Breadcrumbs } from "@/components/refine";
import { siteConfig } from "@/config/site.config";
import {
  subscriptionStatusLabel,
  useLiveSubscription,
  useQuotaSummary,
} from "@/lib/billing";
import { formatDate } from "@/lib/format";
import { useOpenBillingPortal } from "@/modules/billing/hooks/use-billing";
import { PLAN_KEY_LABELS } from "@/types";

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────

/**
 * URL of the marketing pricing catalog. The "Choose a plan" CTA takes an
 * unsubscribed tenant out of the SPA into the marketing catalog so
 * anonymous plan discovery + first-time checkout stays a marketing
 * concern (see BACKEND_HANDOFF.md §4).
 */
const PRICING_URL = siteConfig.links.marketingPricing;

/** Chip color per subscription status — mirrors settings-page mapping. */
const STATUS_COLOR: Record<SubscriptionStatus, "success" | "warning" | "danger" | "default"> = {
  trialing: "warning",
  active: "success",
  past_due: "danger",
  grace: "danger",
  suspended: "danger",
  paused: "warning",
  canceled: "default",
};

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

/**
 * A small labelled row inside the summary card's `<dl>`. Kept local so the
 * settings-page version stays independent — the two pages share visual
 * language but never a component (they'll drift as UX evolves).
 */
function SummaryField({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Empty state for an unsubscribed tenant (or when the backend endpoint is
 * unavailable). Routes to the marketing pricing catalog.
 */
function ChooseAPlanEmpty({ onGoToPricing }: { onGoToPricing: () => void }): ReactNode {
  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <ReceiptPercentIcon aria-hidden="true" className="size-5 text-accent" />
          <Card.Title>No active subscription</Card.Title>
        </div>
        <Card.Description>
          Pick a plan to activate your workspace. Subscription details will appear here once
          you&apos;re signed up.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <Button onPress={onGoToPricing}>See plans</Button>
      </Card.Content>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

/**
 * The subscription page. Registered by the billing module at
 * `/settings/billing/subscription`.
 */
export default function BillingSubscriptionPage(): ReactNode {
  const {
    subscription,
    isLoading,
    error,
    refetch,
  } = useLiveSubscription();
  const quotas = useQuotaSummary();
  const portal = useOpenBillingPortal();

  const handleGoToPricing = useCallback((): void => {
    window.location.href = PRICING_URL;
  }, []);

  const handleOpenPortal = useCallback(async (): Promise<void> => {
    try {
      const { url } = await portal.mutate();

      window.location.href = url;
    } catch {
      // The error surfaces on `portal.error` — the banner below shows it.
    }
  }, [portal]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    // Non-blocking refresh so users can retry without navigating away.
    await refetch();
  }, [refetch]);

  return (
    <ResourceAccessGuard action="list" resource="subscription">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs />
          <Separator />
          <h1 className="text-2xl font-semibold text-foreground">Subscription</h1>
          <p className="text-sm text-muted">
            The details of your platform subscription with Academorix.
          </p>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{error.message}</span>
          </div>
        ) : null}

        {portal.error ? (
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{portal.error.message}</span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner aria-label="Loading subscription" />
          </div>
        ) : subscription ? (
          <>
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <Card.Title>
                      {subscription.plan_key
                        ? PLAN_KEY_LABELS[subscription.plan_key]
                        : "Custom plan"}
                    </Card.Title>
                    <Card.Description>Platform subscription</Card.Description>
                  </div>
                  <Chip
                    color={STATUS_COLOR[subscription.status]}
                    size="sm"
                    variant="soft"
                  >
                    {subscriptionStatusLabel(subscription.status)}
                  </Chip>
                </div>
              </Card.Header>
              <Card.Content>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SummaryField label="Billing period">
                    <span className="capitalize">{subscription.billing_period}</span>
                  </SummaryField>
                  <SummaryField label="Currency">{subscription.currency}</SummaryField>
                  <SummaryField label="Next billing date">
                    {formatDate(subscription.current_period_ends_at)}
                  </SummaryField>
                  {subscription.trial_ends_at ? (
                    <SummaryField label="Trial ends">
                      {formatDate(subscription.trial_ends_at)}
                    </SummaryField>
                  ) : null}
                  {subscription.grace_ends_at ? (
                    <SummaryField label="Grace ends">
                      {formatDate(subscription.grace_ends_at)}
                    </SummaryField>
                  ) : null}
                  {subscription.canceled_at ? (
                    <SummaryField label="Canceled">
                      {formatDate(subscription.canceled_at)}
                    </SummaryField>
                  ) : null}
                </dl>
              </Card.Content>
              <Separator />
              <div className="flex flex-wrap gap-2 px-6 py-4">
                <Button
                  isDisabled={portal.isPending}
                  onPress={handleOpenPortal}
                >
                  {portal.isPending ? (
                    "Opening…"
                  ) : (
                    <span className="flex items-center gap-2">
                      Manage in Stripe
                      <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-4" />
                    </span>
                  )}
                </Button>
                <Button variant="secondary" onPress={handleRefresh}>
                  Refresh
                </Button>
              </div>
            </Card>

            {quotas.length > 0 ? (
              <Card>
                <Card.Header>
                  <Card.Title>Included quotas</Card.Title>
                  <Card.Description>
                    Headline entitlements included with your subscription.
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quotas.map((quota) => (
                      <QuotaMeter key={quota.key} quotaKey={quota.key} variant="card" />
                    ))}
                  </div>
                </Card.Content>
              </Card>
            ) : null}
          </>
        ) : (
          <ChooseAPlanEmpty onGoToPricing={handleGoToPricing} />
        )}
      </div>
    </ResourceAccessGuard>
  );
}

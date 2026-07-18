/**
 * @file plans-page.tsx
 * @module modules/billing/pages/plans-page
 *
 * @description
 * The in-app **plans catalog** at `/settings/billing/plans`. Renders every
 * plan the backend catalog knows about as a card, highlights the tenant's
 * current plan, and exposes a "Change plan" action per non-current plan.
 *
 * Data sources:
 *
 * - {@link "@/lib/billing" usePlans} — live plans from
 *   `GET /api/v1/plans`, with a static-fixture fallback when the flag is
 *   off (or the endpoint isn't deployed yet).
 * - {@link "@/lib/billing" useSubscription} — the tenant's current
 *   subscription, read synchronously from the identity embed so we can
 *   highlight the current plan without an extra fetch.
 *
 * The "Change plan" action is currently a no-op stub — kicking the user to
 * the marketing checkout is a marketing concern (see
 * `TODO(backend-endpoint): POST /api/v1/subscriptions/change-plan`). Once
 * the backend endpoint lands, the button will POST to that route and
 * refresh the subscription via {@link "@/lib/billing" useLiveSubscription}.
 */

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ReceiptPercentIcon,
} from "@stackra/ui/icons/heroicon/outline";
import { Button, Card, Chip, Separator, Spinner } from "@stackra/ui/react";
import { useMemo } from "react";

import type { Plan, SubscriptionSummary } from "@/types";
import type { ReactNode } from "react";

import { ResourceAccessGuard } from "@/components/access";
import { Breadcrumbs } from "@/components/refine";
import { usePlans, useSubscription } from "@/lib/billing";
import { formatMoney } from "@/lib/format";
import { PLAN_KEY_LABELS } from "@/types";

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Decides whether a plan card represents the tenant's current plan. Matches
 * on `id` first (the strongest signal) and falls back to `tier` — Refine's
 * `useList` may return a plan whose `id` differs slightly from the one the
 * `SubscriptionSummary` remembers (e.g. `plan_growth` vs
 * `plan_growth_v2`), and the tier is the stable across-version identifier.
 */
function isCurrentPlan(plan: Plan, subscription: SubscriptionSummary | null): boolean {
  if (!subscription) {
    return false;
  }

  if (subscription.plan_id !== undefined && String(subscription.plan_id) === plan.id) {
    return true;
  }

  return plan.tier === subscription.plan_key;
}

/**
 * Humanises a feature key ("priority_support" → "Priority support") for
 * the inline highlight list. Keeps the wire shape flat and locale-agnostic
 * — the catalog decides the order, the FE only prettifies the display.
 */
function humanizeFeature(key: string): string {
  const [first, ...rest] = key.split("_");

  if (!first) {
    return key;
  }

  return [first[0]!.toUpperCase() + first.slice(1), ...rest].join(" ");
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

/**
 * A single plan card. Highlights via a "Current plan" chip + accent border
 * when this card matches the tenant's active subscription.
 */
function PlanCard({
  plan,
  isCurrent,
  onChangePlan,
}: {
  plan: Plan;
  isCurrent: boolean;
  onChangePlan: (plan: Plan) => void;
}): ReactNode {
  const label = PLAN_KEY_LABELS[plan.tier] ?? plan.name;

  return (
    <Card
      // Highlight the current plan with an accent-bordered card. We keep
      // the visual difference small so the grid still reads as a set of
      // options rather than "your plan vs the rest".
      className={
        isCurrent
          ? "border-2 border-accent/60 bg-accent/5 shadow-md transition-shadow"
          : "transition-shadow hover:shadow-md"
      }
    >
      <Card.Header>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Card.Title>{label}</Card.Title>
            <Card.Description>{plan.name}</Card.Description>
          </div>
          {isCurrent ? (
            <Chip color="success" size="sm" variant="soft">
              Current plan
            </Chip>
          ) : null}
        </div>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-col gap-4">
          {/*
            Price + cadence header. Enterprise-style plans commonly ship
            `price: "0.00"` on the fixture to signify "custom pricing"; we
            surface that as an explicit "Custom" label so users don't
            read the zero as "free".
          */}
          <div className="flex items-baseline gap-2">
            {plan.price === "0.00" && plan.tier === "enterprise" ? (
              <span className="text-2xl font-semibold text-foreground">Custom</span>
            ) : (
              <>
                <span className="text-2xl font-semibold text-foreground tabular-nums">
                  {formatMoney(plan.price, plan.currency)}
                </span>
                <span className="text-sm text-muted">/ {plan.cadence}</span>
              </>
            )}
          </div>

          {/* Feature highlight list — first 5 rows for consistent card height. */}
          <ul className="flex flex-col gap-2">
            {plan.features.slice(0, 5).map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircleIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-accent"
                />
                <span>{humanizeFeature(feature)}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card.Content>
      <Separator />
      <div className="flex justify-end px-6 py-4">
        {isCurrent ? (
          <Button isDisabled variant="secondary">
            Current plan
          </Button>
        ) : (
          <Button aria-label={`Change to ${label}`} onPress={() => onChangePlan(plan)}>
            Change plan
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * Full-width empty state shown when the backend catalog is unavailable
 * (fallback path returned no rows). We route the user to the marketing
 * pricing catalog rather than getting stuck.
 */
function EmptyCatalog(): ReactNode {
  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <ReceiptPercentIcon aria-hidden="true" className="size-5 text-accent" />
          <Card.Title>Plans coming soon</Card.Title>
        </div>
        <Card.Description>
          The plans catalog isn&apos;t available in this environment yet. Check the marketing site
          for the current pricing.
        </Card.Description>
      </Card.Header>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

/**
 * Renders the plans catalog page. Registered by the billing module at
 * `/settings/billing/plans`.
 */
export default function BillingPlansPage(): ReactNode {
  const { plans, isLoading, error } = usePlans();
  const subscription = useSubscription();

  /**
   * `TODO(backend-endpoint): POST /api/v1/subscriptions/change-plan` —
   * until the backend billing module wires the plan-change RPC, the
   * button is a click stub. Wire this up to a mutation hook that POSTs
   * to `/api/v1/subscriptions/change-plan` and refetches the subscription
   * via `useLiveSubscription().refetch()` on success.
   */
  const handleChangePlan = useMemo(
    () =>
      (_plan: Plan): void => {
        // Intentional no-op — the button is present so the flow reads
        // correctly; the actual mutation lands with the backend endpoint.
      },
    [],
  );

  // A brand-new tenant with no plans and no error still gets rendered as
  // "Coming soon" so the page never shows an infinite spinner.
  const isEmpty = !isLoading && plans.length === 0;

  return (
    <ResourceAccessGuard action="list" resource="subscription">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs />
          <Separator />
          <h1 className="text-2xl font-semibold text-foreground">Plans</h1>
          <p className="text-sm text-muted">
            Pick a plan that fits your operation. Changes take effect at the next billing cycle.
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
            <Spinner aria-label="Loading plans" />
          </div>
        ) : isEmpty ? (
          <EmptyCatalog />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                isCurrent={isCurrentPlan(plan, subscription)}
                plan={plan}
                onChangePlan={handleChangePlan}
              />
            ))}
          </div>
        )}
      </div>
    </ResourceAccessGuard>
  );
}

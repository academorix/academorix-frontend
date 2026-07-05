/**
 * @file pricing-page.tsx
 * @module modules/billing/pages/pricing-page
 *
 * @description
 * Public marketing surface at `/pricing`. Reads the plan catalog from the
 * unauthenticated `GET /api/billing/catalog` endpoint, lets visitors toggle
 * between monthly/yearly billing, and renders one card per plan tier.
 *
 * For an already-authenticated tenant, "Get started" invokes `startCheckout`
 * which returns a `{ url }` — the SPA then redirects the browser to the
 * payment provider. Anonymous visitors are pushed to the workspace creation
 * flow on the central host (they need a tenant before they can subscribe).
 *
 * @see BACKEND_HANDOFF.md §5.3 (`GET /api/billing/catalog` — public)
 */

import { CheckCircleIcon, ExclamationCircleIcon } from "@academorix/ui/icons/outline";
import {
  Button,
  Card,
  Chip,
  Separator,
  Spinner,
  ToggleButton,
  ToggleButtonGroup,
} from "@academorix/ui/react";
import { useGetIdentity } from "@refinedev/core";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";

import type { BillingPeriod, Identity, PlanTier } from "@/types";
import type { Key, ReactNode } from "react";

import { useBillingCatalog, useStartCheckout } from "@/modules/billing/hooks/use-billing";
import { BILLING_PERIOD_LABELS, PLAN_KEY_LABELS } from "@/types";

/** Location we send anonymous visitors when they click "Get started". */
const CREATE_WORKSPACE_PATH = "/create-workspace";

/**
 * Reads the plan's price for the active billing period. Falls back to the
 * first price if the plan didn't publish one for that period (defensive —
 * the catalog seeds always ship both).
 */
function priceFor(plan: PlanTier, period: BillingPeriod): PlanTier["prices"][number] | undefined {
  return plan.prices.find((price) => price.billing_period === period) ?? plan.prices[0];
}

/** Formats a decimal amount as a shortened price string (`$49 /mo`). */
function formatPrice(amount: string, currency: string, period: BillingPeriod): string {
  const numeric = Number.parseFloat(amount);
  const money = Number.isNaN(numeric)
    ? "—"
    : new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(numeric);
  const suffix = period === "monthly" ? "/mo" : "/yr";

  return `${money} ${suffix}`;
}

/** Renders the grant list for a single plan tier. */
function GrantList({ plan }: { plan: PlanTier }): ReactNode {
  return (
    <ul className="flex flex-col gap-2 text-sm text-foreground">
      {plan.grants.map((grant) => (
        <li key={grant.key} className="flex items-start gap-2">
          <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
          <span>
            {grant.label}
            {grant.is_unlimited ? (
              <span className="text-muted"> — unlimited</span>
            ) : grant.limit !== null ? (
              <span className="text-muted"> — {grant.limit}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A single plan card. */
function PlanCard({
  plan,
  period,
  isAuthenticated,
  onStart,
  isStarting,
}: {
  plan: PlanTier;
  period: BillingPeriod;
  isAuthenticated: boolean;
  onStart: (plan: PlanTier) => void;
  isStarting: boolean;
}): ReactNode {
  const price = priceFor(plan, period);
  const label = PLAN_KEY_LABELS[plan.key] ?? plan.label;

  return (
    <Card className={plan.is_popular ? "border-accent/40 shadow-md" : undefined}>
      <Card.Header>
        <div className="flex items-center justify-between gap-2">
          <Card.Title>{label}</Card.Title>
          {plan.is_popular ? (
            <Chip color="success" size="sm" variant="soft">
              Popular
            </Chip>
          ) : null}
        </div>
        <Card.Description>{plan.description}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-foreground">
            {price ? formatPrice(price.amount, price.currency, period) : "—"}
          </span>
        </div>
        <GrantList plan={plan} />
      </Card.Content>
      <Separator />
      <div className="px-6 py-4">
        <Button className="w-full" isDisabled={isStarting} onPress={() => onStart(plan)}>
          {isAuthenticated ? "Get started" : "Create a workspace"}
        </Button>
      </div>
    </Card>
  );
}

/** The pricing page. */
export default function PricingPage(): ReactNode {
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<Identity>();
  const isAuthenticated = identity !== undefined && identity !== null;

  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const { data: plans, isLoading, error } = useBillingCatalog();
  const checkout = useStartCheckout();

  const handleStart = useCallback(
    async (plan: PlanTier): Promise<void> => {
      if (!isAuthenticated) {
        navigate(CREATE_WORKSPACE_PATH);

        return;
      }

      try {
        const { url } = await checkout.mutate({
          plan_key: plan.key,
          billing_period: period,
          success_url: `${window.location.origin}/settings/billing`,
          cancel_url: `${window.location.origin}/pricing`,
        });

        window.location.href = url;
      } catch {
        /* Error surfaced via `checkout.error` below. */
      }
    },
    [checkout, isAuthenticated, navigate, period],
  );

  const handlePeriod = useCallback((key: Key): void => {
    if (key === "monthly" || key === "yearly") {
      setPeriod(key);
    }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Plans and pricing</h1>
        <p className="max-w-2xl text-base text-muted">
          Pick a plan that fits your academy. Change or cancel anytime.
        </p>
        <ToggleButtonGroup
          aria-label="Billing period"
          selectedKeys={new Set([period])}
          selectionMode="single"
          onSelectionChange={(keys) => {
            const first = Array.from(keys)[0];

            if (typeof first === "string") {
              handlePeriod(first);
            }
          }}
        >
          <ToggleButton id="monthly">{BILLING_PERIOD_LABELS.monthly}</ToggleButton>
          <ToggleButton id="yearly">{BILLING_PERIOD_LABELS.yearly}</ToggleButton>
        </ToggleButtonGroup>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error.message}</span>
        </div>
      ) : null}

      {checkout.error ? (
        <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{checkout.error.message}</span>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading plans" />
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              isAuthenticated={isAuthenticated}
              isStarting={checkout.isPending}
              period={period}
              plan={plan}
              onStart={handleStart}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No plans available right now.</p>
      )}
    </div>
  );
}

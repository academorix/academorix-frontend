/**
 * @file pricing-hero.tsx
 * @module components/pricing/pricing-hero
 *
 * @description
 * Vercel-parity pricing hero: heading, monthly/yearly toggle, and the 4 plan
 * cards. Client Component (toggle state), receives fully-hydrated
 * `PlanTierData[]` from the Server Component page.
 */

"use client";

import { CheckCircleIcon } from "@academorix/ui/icons/outline";
import { Button, Chip, ToggleButton, ToggleButtonGroup } from "@academorix/ui/react";
import { useCallback, useEffect, useState } from "react";

import type { BillingPeriod, PlanPrice, PlanTierData } from "@/lib/types";
import type { Key, ReactNode } from "react";

import { resolveCta } from "@/lib/marketing/cta";

const TOGGLE_STORAGE_KEY = "academorix.pricing.billing-period";

const PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
};

/** Locates the plan's price for the active billing period. */
function priceFor(plan: PlanTierData, period: BillingPeriod): PlanPrice | undefined {
  return plan.prices.find((price) => price.billing_period === period) ?? plan.prices[0];
}

/** Formats a price entry as the big number shown on the plan card. */
function formatPrice(
  price: PlanPrice | undefined,
  period: BillingPeriod,
): { amount: string; suffix: string | null } {
  if (!price || price.amount === "custom") {
    return { amount: "Custom", suffix: null };
  }

  const numeric = Number.parseFloat(price.amount);

  if (Number.isNaN(numeric)) {
    return { amount: "Custom", suffix: null };
  }

  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(numeric);

  return { amount: money, suffix: period === "monthly" ? "/mo" : "/yr" };
}

/** Renders one plan card. */
function PlanCard({ plan, period }: { plan: PlanTierData; period: BillingPeriod }): ReactNode {
  const price = priceFor(plan, period);
  const formatted = formatPrice(price, period);
  const href = resolveCta(plan.cta);

  const onCtaPress = useCallback((): void => {
    window.location.href = href;
  }, [href]);

  return (
    <article
      className={[
        "flex h-full flex-col rounded-xl border p-6 md:p-7",
        "bg-surface transition-colors",
        plan.is_popular ? "border-foreground/20" : "border-default",
      ].join(" ")}
    >
      <header className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-wider text-muted uppercase">
          {plan.eyebrow}
        </span>
        {plan.is_popular ? (
          <Chip color="accent" size="sm" variant="soft">
            <Chip.Label>Popular</Chip.Label>
          </Chip>
        ) : null}
      </header>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-5xl font-semibold tracking-tight text-foreground">
          {formatted.amount}
        </span>
        {formatted.suffix ? <span className="text-base text-muted">{formatted.suffix}</span> : null}
      </div>

      <p className="mt-4 text-sm text-muted">{plan.description}</p>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {plan.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-2.5 text-sm text-foreground">
            <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          className="w-full rounded-full"
          size="md"
          variant={plan.is_popular ? "primary" : "secondary"}
          onPress={onCtaPress}
        >
          {plan.cta.label}
        </Button>
      </div>
    </article>
  );
}

/** Reads the last-chosen billing period from sessionStorage. */
function readInitialPeriod(): BillingPeriod {
  if (typeof window === "undefined") {
    return "monthly";
  }

  try {
    const raw = window.sessionStorage.getItem(TOGGLE_STORAGE_KEY);

    if (raw === "yearly" || raw === "monthly") {
      return raw;
    }
  } catch {
    /* privacy-mode fallback */
  }

  return "monthly";
}

/** Props for {@link PricingHero}. */
interface PricingHeroProps {
  plans: readonly PlanTierData[];
}

/** Pricing hero + plan-cards grid. */
export function PricingHero({ plans }: PricingHeroProps): ReactNode {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  useEffect(() => {
    setPeriod(readInitialPeriod());
  }, []);

  const changePeriod = useCallback((next: BillingPeriod): void => {
    setPeriod(next);
    try {
      window.sessionStorage.setItem(TOGGLE_STORAGE_KEY, next);
    } catch {
      /* ignored */
    }
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-20 pb-16">
      <div className="flex flex-col items-start gap-6">
        <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
          Scale your academy,
          <br />
          control your costs
        </h1>
        <p className="max-w-2xl text-lg text-muted">
          Simple, scalable pricing that grows with your academy. Start free — no credit card
          required — and only pay when you outgrow the Starter tier.
        </p>
        <ToggleButtonGroup
          aria-label="Billing period"
          selectedKeys={new Set([period])}
          selectionMode="single"
          onSelectionChange={(keys) => {
            const first = Array.from(keys as Set<Key>)[0];

            if (first === "monthly" || first === "yearly") {
              changePeriod(first);
            }
          }}
        >
          <ToggleButton id="monthly">{PERIOD_LABELS.monthly}</ToggleButton>
          <ToggleButton id="yearly">
            {PERIOD_LABELS.yearly}
            <span className="ml-2 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
              Save 20%
            </span>
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard key={plan.key} period={period} plan={plan} />
        ))}
      </div>
    </section>
  );
}

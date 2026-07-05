/**
 * @file plan-card.tsx
 * @module modules/billing/components/plan-card
 *
 * @description
 * A single tier card on the pricing page. Vercel-style: big plan name, one
 * price, 4-6 derived highlights, a primary CTA. The recommended plan gets a
 * subtle accent ring + a "Most popular" chip.
 *
 * Kept as its own component (not inlined in `pricing-page.tsx`) so a plan
 * card can be reused inside settings ("upgrade to Growth") or on the
 * landing page without a rewrite.
 */

import { CheckIcon } from "@academorix/ui/icons/outline";
import { Button, Card, Chip } from "@academorix/ui/react";

import type { BillingPeriod, PlanTier } from "@/types";
import type { ReactNode } from "react";

import { ctaFor, highlightsFor } from "@/modules/billing/lib/pricing-config";
import { PLAN_KEY_LABELS } from "@/types";

/** Props for {@link PlanCard}. */
export interface PlanCardProps {
  /** The plan tier to render. */
  plan: PlanTier;
  /** Which billing period the card shows the price for. */
  period: BillingPeriod;
  /** Whether the caller is signed in (drives CTA copy). */
  isAuthenticated: boolean;
  /** True while a checkout is in flight; disables the CTA to prevent double-clicks. */
  isStarting: boolean;
  /** Invoked when the primary CTA is pressed. */
  onStart: (plan: PlanTier) => void;
}

/**
 * Formats a decimal amount as a short price + suffix (e.g. `$49 /mo`).
 * Drops fraction digits — pricing pages read cleaner without cents.
 */
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

/**
 * Renders one plan tier as a card. Silent (returns `null`) when the plan
 * has no price for the active period — a defensive guard; the seeded
 * catalog always ships both.
 */
export function PlanCard({
  plan,
  period,
  isAuthenticated,
  isStarting,
  onStart,
}: PlanCardProps): ReactNode {
  const price = plan.prices.find((entry) => entry.billing_period === period) ?? plan.prices[0];

  if (!price) {
    return null;
  }

  const label = PLAN_KEY_LABELS[plan.key] ?? plan.label;
  const cta = ctaFor(plan, isAuthenticated);
  const highlights = highlightsFor(plan);
  const isEnterprise = plan.key === "enterprise";

  return (
    <Card
      className={`flex h-full flex-col ${
        plan.is_popular ? "border-accent/50 shadow-lg ring-1 ring-accent/40" : ""
      }`}
    >
      <Card.Header>
        <div className="flex items-center justify-between gap-2">
          <Card.Title>{label}</Card.Title>
          {plan.is_popular ? (
            <Chip color="success" size="sm" variant="soft">
              Most popular
            </Chip>
          ) : null}
        </div>
        <Card.Description>{plan.description}</Card.Description>
      </Card.Header>

      <Card.Content className="flex-1">
        {/* Price block. Enterprise skips the number and shows "Custom" so the
            plan doesn't misrepresent its actual (contact-sales-driven) price. */}
        <div className="mb-6 flex items-baseline gap-2">
          {isEnterprise ? (
            <span className="text-3xl font-semibold text-foreground">Custom</span>
          ) : (
            <span className="text-3xl font-semibold text-foreground">
              {formatPrice(price.amount, price.currency, period)}
            </span>
          )}
        </div>

        {/* Highlights — bullet list of derived features. */}
        <ul className="flex flex-col gap-2 text-sm text-foreground">
          {highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2">
              <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </Card.Content>

      <div className="px-6 pb-6">
        <Button
          className="w-full"
          isDisabled={isStarting}
          variant={plan.is_popular ? "primary" : "secondary"}
          onPress={() => onStart(plan)}
        >
          {isStarting ? "Working…" : cta.label}
        </Button>
      </div>
    </Card>
  );
}

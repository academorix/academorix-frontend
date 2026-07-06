/**
 * @file pricing-section.tsx
 * @module components/landing/pricing-section
 *
 * @description
 * Compact pricing highlights on the landing page — renders the first three
 * plan tiers (Starter / Growth / Enterprise) as a teaser that links out to
 * the full `/pricing` comparison matrix. Server Component; consumes a
 * pre-loaded `PlanTierData[]` from the parent.
 */

import { CheckIcon } from "@academorix/ui/icons/outline";
import { Card, Chip } from "@academorix/ui/react";

import type { PlanTierData } from "@/lib/types";
import type { ReactNode } from "react";

import { SectionHeading } from "@/components/landing/section-heading";
import { Link } from "@/i18n/navigation";
import { resolveCta } from "@/lib/marketing/cta";

/** Props for {@link PricingSection}. */
interface PricingSectionProps {
  plans: readonly PlanTierData[];
}

/** Turns a `PlanTierData` into a short teaser price string ("$99 /mo" or "Custom"). */
function priceLabel(plan: PlanTierData): { amount: string; suffix: string | null } {
  const monthly = plan.prices.find((price) => price.billing_period === "monthly");

  if (!monthly || monthly.amount === "custom") {
    return { amount: "Custom", suffix: null };
  }

  const numeric = Number.parseFloat(monthly.amount);

  if (Number.isNaN(numeric)) {
    return { amount: "Custom", suffix: null };
  }

  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: monthly.currency,
    maximumFractionDigits: 0,
  }).format(numeric);

  return { amount: money, suffix: "/mo" };
}

/** The pricing highlights section (landing teaser). */
export function PricingSection({ plans }: PricingSectionProps): ReactNode {
  // Landing shows Starter / Growth / Enterprise (skip Pro for a cleaner 3-card layout).
  const teaser = plans.filter((plan) => plan.key !== "pro").slice(0, 3);

  return (
    <section
      aria-labelledby="pricing-heading"
      className="scroll-mt-24 bg-default/20 px-4 py-20 sm:px-6 lg:px-8"
      id="pricing"
    >
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading
          description="Straightforward plans that scale with your academy. No hidden fees."
          eyebrow="Pricing"
          headingId="pricing-heading"
          title="Simple, scalable pricing"
        />

        <ul className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {teaser.map((plan) => {
            const price = priceLabel(plan);
            const ctaHref = resolveCta(plan.cta);

            return (
              <li key={plan.key}>
                <Card
                  className={`flex h-full flex-col ${plan.is_popular ? "ring-2 ring-accent" : ""}`}
                  variant={plan.is_popular ? "secondary" : "default"}
                >
                  <Card.Header>
                    {plan.is_popular ? (
                      <Chip className="self-start" color="accent" size="sm" variant="primary">
                        <Chip.Label>Most popular</Chip.Label>
                      </Chip>
                    ) : null}
                    <Card.Title className={plan.is_popular ? "mt-2" : undefined}>
                      {plan.eyebrow.charAt(0) + plan.eyebrow.slice(1).toLowerCase()}
                    </Card.Title>
                    <Card.Description>{plan.description}</Card.Description>
                    <p className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight text-foreground">
                        {price.amount}
                      </span>
                      {price.suffix ? (
                        <span className="text-sm text-muted">{price.suffix}</span>
                      ) : null}
                    </p>
                  </Card.Header>

                  <Card.Content className="flex-1">
                    <ul className="flex flex-col gap-3">
                      {plan.highlights.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-foreground"
                        >
                          <CheckIcon
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-accent"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Card.Content>

                  <Card.Footer className="mt-6">
                    <a
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors ${
                        plan.is_popular
                          ? "bg-accent text-accent-foreground hover:opacity-90"
                          : "border border-default text-foreground hover:bg-default/40"
                      }`}
                      href={ctaHref}
                      rel="noreferrer"
                    >
                      {plan.cta.label}
                    </a>
                  </Card.Footer>
                </Card>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 text-center">
          <Link className="text-sm font-medium text-accent hover:underline" href="/pricing">
            Compare all features →
          </Link>
        </div>
      </div>
    </section>
  );
}
